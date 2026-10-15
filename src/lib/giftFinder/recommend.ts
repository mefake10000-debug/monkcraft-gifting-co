/**
 * Deterministic catalogue recommendation engine for Smart Gift Finder (Layer A).
 * Reusable by a future conversational layer — never invents products or prices.
 */

import { getAllProducts, verifiedUnitPriceInr } from "@/data/catalogue/products";
import { getOccasionFacets, getCategoryFacets } from "@/data/catalogue/facets";
import type { Product } from "@/data/catalogue/types";
import {
  emptyGiftFinderRequirements,
  toGiftFinderProductCard,
  type GiftFinderMatch,
  type GiftFinderMatchReason,
  type GiftFinderRecommendMeta,
  type GiftFinderRecommendRequest,
  type GiftFinderRecommendResult,
  type GiftFinderRequirements,
} from "./types";

export { parseBudgetInr } from "./budget";

const DEFAULT_LIMIT = 24;
const DEFAULT_ALT_LIMIT = 12;
/** Allow near-budget alternatives up to this factor above the cap. */
const NEAR_BUDGET_FACTOR = 1.25;
/** Soft floor: prefer gifts that use a meaningful share of budget. */
const BUDGET_SWEET_SPOT_MIN = 0.35;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeRequirements(
  partial: GiftFinderRecommendRequest["requirements"],
): GiftFinderRequirements {
  const base = emptyGiftFinderRequirements();
  const budgetRaw = partial.budgetPerRecipientInr;
  const budget =
    typeof budgetRaw === "number" && Number.isFinite(budgetRaw) && budgetRaw > 0
      ? Math.floor(budgetRaw)
      : null;
  const totalRaw = partial.budgetTotalInr;
  const total =
    typeof totalRaw === "number" && Number.isFinite(totalRaw) && totalRaw > 0
      ? Math.floor(totalRaw)
      : null;

  return {
    ...base,
    ...partial,
    schemaVersion: 1,
    occasionIds: asStringArray(partial.occasionIds),
    audience: String(partial.audience ?? ""),
    recipientCount: String(partial.recipientCount ?? ""),
    budgetPerRecipientInr: budget,
    budgetTotalInr: total,
    budgetPerRecipientLabel: String(partial.budgetPerRecipientLabel ?? ""),
    categorySlugs: asStringArray(partial.categorySlugs),
    preferenceKeywords: asStringArray(partial.preferenceKeywords).map((k) =>
      k.toLowerCase(),
    ),
    brandingPreference: String(partial.brandingPreference ?? ""),
    brandingNotes: String(partial.brandingNotes ?? ""),
    packagingNotes: String(partial.packagingNotes ?? ""),
    deliveryDate: String(partial.deliveryDate ?? ""),
    deliveryLocation: String(partial.deliveryLocation ?? ""),
    specialInstructions: String(partial.specialInstructions ?? ""),
    freeText: String(partial.freeText ?? ""),
    updatedAt: String(partial.updatedAt ?? ""),
  };
}

export { verifiedUnitPriceInr };

function productHaystack(product: Product): string {
  return [
    product.name,
    product.summary,
    product.description,
    product.sku,
    product.brandName,
    product.filterCategoryName,
    product.categoryName,
    product.subcategoryName,
    product.customization,
    ...product.attributes.map((a) => `${a.label} ${a.value}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function freeTextTokens(requirements: GiftFinderRequirements): string[] {
  const fromFree = requirements.freeText
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((t) => t.length >= 3);
  const stop = new Set([
    "the",
    "and",
    "for",
    "with",
    "gift",
    "gifts",
    "want",
    "need",
    "some",
    "our",
    "team",
    "company",
    "please",
    "looking",
  ]);
  return [...new Set([...requirements.preferenceKeywords, ...fromFree])].filter(
    (t) => !stop.has(t),
  );
}

function brandingWantsPrint(requirements: GiftFinderRequirements): boolean {
  const id = requirements.brandingPreference;
  if (id === "logo" || id === "print") return true;
  const blob = `${requirements.brandingNotes} ${requirements.freeText}`.toLowerCase();
  return /\b(logo|brand|print|embroidery|dtf|uv|engrav)/.test(blob);
}

type ScoredCandidate = {
  product: Product;
  score: number;
  tier: "match" | "alternative";
  reasons: GiftFinderMatchReason[];
  notes: string[];
};

function scoreProduct(
  product: Product,
  requirements: GiftFinderRequirements,
  tokens: string[],
): ScoredCandidate | null {
  const reasons: GiftFinderMatchReason[] = [];
  const notes: string[] = [];
  let score = 0;

  if (product.availabilityStatus === "OUT") {
    return null;
  }

  const price = verifiedUnitPriceInr(product);
  const budget = requirements.budgetPerRecipientInr;
  const hasOccasionFilter = requirements.occasionIds.length > 0;
  const hasCategoryFilter = requirements.categorySlugs.length > 0;

  const occasionHit =
    hasOccasionFilter &&
    requirements.occasionIds.some((id) => product.occasions.includes(id));
  const categoryHit =
    hasCategoryFilter &&
    requirements.categorySlugs.includes(product.filterCategorySlug);

  // Soft structural fit
  if (occasionHit) {
    score += 45;
    reasons.push({
      code: "occasion",
      label: "Matched your selected occasion",
    });
    // Prefer products tagged to fewer occasions (clearer relevance)
    const tagged = product.occasions.length;
    if (tagged <= 1) score += 18;
    else if (tagged <= 3) score += 10;
    else if (tagged <= 6) score += 4;
    else score -= Math.min(24, (tagged - 6) * 2);

    if (product.filterCategorySlug === "packaging") {
      score -= 20;
    }
    if (product.filterCategorySlug === "other") {
      score -= 28;
    }
  } else if (hasOccasionFilter) {
    score += 5;
    reasons.push({
      code: "partial",
      label: "Not tagged for your occasion — shown as a broader option",
    });
  }

  if (categoryHit) {
    score += 35;
    reasons.push({
      code: "category",
      label: `In ${product.filterCategoryName}`,
    });
  } else if (hasCategoryFilter) {
    // Keep as possible alternative only if other signals are strong
    score -= 8;
  }

  // Budget — never treat unknown price as in-budget
  let budgetTier: "in" | "near" | "over" | "unknown" = "unknown";
  if (budget != null) {
    if (price == null) {
      budgetTier = "unknown";
      notes.push("Catalogue price not verified for budget filtering");
      score -= 20;
    } else if (price <= budget) {
      budgetTier = "in";
      score += 30;
      reasons.push({
        code: "budget",
        label: `Within ₹${budget.toLocaleString("en-IN")} per recipient`,
      });
      const ratio = price / budget;
      if (ratio >= BUDGET_SWEET_SPOT_MIN && ratio <= 0.95) {
        score += 12;
      } else if (ratio < 0.15) {
        score -= 4; // very cheap relative to stated budget
      }
    } else if (price <= budget * NEAR_BUDGET_FACTOR) {
      budgetTier = "near";
      score += 8;
      reasons.push({
        code: "near-budget",
        label: `Slightly above budget (₹${price.toLocaleString("en-IN")})`,
      });
    } else {
      budgetTier = "over";
    }
  } else if (price != null) {
    score += 2;
  } else {
    notes.push("Price to confirm with Monkcraft");
  }

  const hay = productHaystack(product);
  let keywordHits = 0;
  for (const token of tokens) {
    if (hay.includes(token)) {
      keywordHits += 1;
      score += 8;
    }
  }
  if (keywordHits > 0) {
    reasons.push({
      code: "keyword",
      label:
        keywordHits === 1
          ? "Matches a stated preference"
          : `Matches ${keywordHits} preference keywords`,
    });
  }

  if (brandingWantsPrint(requirements)) {
    if (product.customization || product.brandingOptions.length > 0) {
      score += 14;
      reasons.push({
        code: "branding",
        label: product.customization
          ? `Branding option noted: ${product.customization}`
          : "Catalogue lists branding options",
      });
    } else {
      notes.push("Custom branding method not listed — confirm with Monkcraft");
      score -= 2;
    }
  }

  if (product.minQuantity && product.minQuantity > 1) {
    notes.push(`Minimum order quantity: ${product.minQuantity}`);
  }

  // Hard reject: clearly over budget with no other rescue path as match
  if (budget != null && budgetTier === "over") {
    return null;
  }

  // Require at least one meaningful signal when filters exist
  const hasSignal =
    occasionHit ||
    categoryHit ||
    keywordHits > 0 ||
    (budget != null && budgetTier === "in") ||
    (!hasOccasionFilter && !hasCategoryFilter && tokens.length === 0);

  if (!hasSignal && hasOccasionFilter) {
    // Alternatives: category-adjacent without occasion tag, in/near budget
    if (
      budget != null &&
      (budgetTier === "in" || budgetTier === "near") &&
      !hasCategoryFilter
    ) {
      // weak alternative
    } else if (!categoryHit && keywordHits === 0) {
      return null;
    }
  }

  let tier: "match" | "alternative" = "match";

  if (budget != null && budgetTier === "near") {
    tier = "alternative";
  }
  if (hasOccasionFilter && !occasionHit) {
    tier = "alternative";
  }
  if (hasCategoryFilter && !categoryHit && !occasionHit && keywordHits === 0) {
    return null;
  }
  if (budget != null && budgetTier === "unknown") {
    tier = "alternative";
  }
  if (
    hasOccasionFilter &&
    occasionHit &&
    budget != null &&
    budgetTier === "in"
  ) {
    tier = "match";
  }
  if (
    !hasOccasionFilter &&
    budget != null &&
    budgetTier === "in" &&
    (categoryHit || keywordHits > 0 || !hasCategoryFilter)
  ) {
    tier = budgetTier === "in" ? "match" : tier;
  }

  // Baseline name stability tie-breaker applied later
  if (reasons.length === 0 && tier === "match") {
    reasons.push({
      code: "partial",
      label: "Available in the verified catalogue under your filters",
    });
  }

  return { product, score, tier, reasons, notes };
}

function buildMissingHints(
  requirements: GiftFinderRequirements,
): string[] {
  const hints: string[] = [];
  if (requirements.occasionIds.length === 0) {
    hints.push("Add an occasion to prioritise source-matched gifts");
  }
  if (requirements.budgetPerRecipientInr == null) {
    hints.push("Add a per-recipient budget to filter verified prices");
  }
  if (
    requirements.categorySlugs.length === 0 &&
    requirements.preferenceKeywords.length === 0 &&
    !requirements.freeText.trim()
  ) {
    hints.push("Optional: pick categories or preferences to narrow results");
  }
  return hints;
}

function explain(
  requirements: GiftFinderRequirements,
  matchCount: number,
  alternativeCount: number,
): string {
  const parts: string[] = [];
  if (requirements.occasionIds.length > 0) {
    const labels = getOccasionFacets()
      .filter((f) => requirements.occasionIds.includes(f.id))
      .map((f) => f.label);
    if (labels.length) parts.push(`occasion: ${labels.join(", ")}`);
  }
  if (requirements.budgetPerRecipientInr != null) {
    parts.push(
      `budget ≤ ₹${requirements.budgetPerRecipientInr.toLocaleString("en-IN")} / recipient`,
    );
  }
  if (requirements.categorySlugs.length > 0) {
    const labels = getCategoryFacets()
      .filter((f) => requirements.categorySlugs.includes(f.id))
      .map((f) => f.label);
    if (labels.length) parts.push(`categories: ${labels.join(", ")}`);
  }
  const scope = parts.length ? parts.join(" · ") : "open catalogue browse";
  if (matchCount === 0 && alternativeCount === 0) {
    return `No verified products matched (${scope}). Try broadening filters or book a consultation.`;
  }
  if (matchCount === 0) {
    return `No exact matches for ${scope}. Showing near alternatives that partly fit — original requirements kept.`;
  }
  return `Ranked ${matchCount} match${matchCount === 1 ? "" : "es"} from the verified catalogue (${scope}). Scoring is deterministic — not generative AI.`;
}

export function recommendGifts(
  request: GiftFinderRecommendRequest,
): GiftFinderRecommendResult {
  const requirements = normalizeRequirements(request.requirements);
  const limit = Math.min(
    48,
    Math.max(1, Math.floor(request.limit ?? DEFAULT_LIMIT)),
  );
  const altLimit = Math.min(
    24,
    Math.max(0, Math.floor(request.alternativeLimit ?? DEFAULT_ALT_LIMIT)),
  );

  const products = getAllProducts();
  const tokens = freeTextTokens(requirements);
  const scored: ScoredCandidate[] = [];

  for (const product of products) {
    const result = scoreProduct(product, requirements, tokens);
    if (result) scored.push(result);
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.product.name.localeCompare(b.product.name);
  });

  const matches: GiftFinderMatch[] = [];
  const alternatives: GiftFinderMatch[] = [];
  const seen = new Set<string>();

  for (const row of scored) {
    if (seen.has(row.product.id)) continue;
    seen.add(row.product.id);
    const item: GiftFinderMatch = {
      product: toGiftFinderProductCard(row.product),
      score: row.score,
      tier: row.tier,
      reasons: row.reasons,
      notes: row.notes,
    };
    if (row.tier === "match" && matches.length < limit) {
      matches.push(item);
    } else if (row.tier === "alternative" && alternatives.length < altLimit) {
      alternatives.push(item);
    }
    if (matches.length >= limit && alternatives.length >= altLimit) break;
  }

  // When the alt bucket is empty but more scored rows exist, surface extras
  // as clearly labelled additional options (still genuine catalogue products).
  if (alternatives.length === 0 && altLimit > 0) {
    for (const row of scored) {
      if (matches.some((m) => m.product.id === row.product.id)) continue;
      alternatives.push({
        product: toGiftFinderProductCard(row.product),
        score: row.score,
        tier: "alternative",
        reasons: [
          ...row.reasons,
          {
            code: "partial",
            label: "Additional option under the same search",
          },
        ],
        notes: row.notes,
      });
      if (alternatives.length >= altLimit) break;
    }
  }

  const meta: GiftFinderRecommendMeta = {
    productUniverse: products.length,
    considered: scored.length,
    matchCount: matches.length,
    alternativeCount: alternatives.length,
    budgetApplied: requirements.budgetPerRecipientInr != null,
    occasionApplied: requirements.occasionIds.length > 0,
    categoryApplied: requirements.categorySlugs.length > 0,
    missingHints: buildMissingHints(requirements),
    explanation: explain(requirements, matches.length, alternatives.length),
  };

  return { requirements, matches, alternatives, meta };
}

export { PREFERENCE_PRESETS, BRANDING_OPTIONS } from "./presets";
