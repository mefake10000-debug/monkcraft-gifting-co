/**
 * Server-side catalogue filtering and pagination.
 * Client components must import from queryParams.ts instead.
 *
 * Honesty rules for budget:
 * - Missing / quote / non-positive price ≠ within budget
 * - Budget filters only keep products with a verified fixed unit price
 *
 * Relevance ranking (featured sort):
 * - Deterministic scores from real fields only (occasions, categorySlug,
 *   keywords, search tokens). Weak / broad source matches sort later.
 * - Unfiltered catalogue: product-type display order first (drinkware → …
 *   → executive), then within-type hero rank (bottles → coasters, polos,
 *   speakers, …). Matches the filter-rail order.
 * - When a product-type filter is active, within-category hero rank
 *   breaks ties before name. Search / occasion relevance still wins when
 *   the user searches or picks occasions. Never invents products or prices.
 */

import {
  categoryDisplayRank,
  categoryHeroRank,
  subcategoryDisplayRank,
} from "./categoryOrder";
import { getOccasionFacets, getCategoryFacets, getBrandFacets, getColourFacets, getMaterialFacets } from "./facets";
import {
  getAllProducts,
  getCataloguePageSize,
  slugifyFacet,
  verifiedUnitPriceInr,
} from "./products";
import {
  parseCatalogueQuery,
  buildCatalogueHref,
  countActiveFilters,
  sortOptions,
  emptyCatalogueQuery,
} from "./queryParams";
import type { CatalogueQuery, CatalogueSort, Product } from "./types";
import colourFamilies from "./colourFamilies.json";
import { resolveColourFamily, type ColourFamily } from "./colourVariants";
import designFamilies from "./designFamilies.json";
import { resolveDesignFamily, type DesignFamily } from "./designVariants";

const APPROVED_COLOUR_FAMILIES = colourFamilies as ColourFamily[];
const APPROVED_DESIGN_FAMILIES = designFamilies as unknown as DesignFamily[];
let resolvedColourFamilyIndex: Map<string, { key: string; code: string; options: Product[] }> | null = null;
let resolvedDesignFamilyIndex: Map<string, { key: string; code: string; name: string; options: Product[] }> | null = null;

function getResolvedColourFamilyIndex() {
  if (resolvedColourFamilyIndex) return resolvedColourFamilyIndex;
  const allProducts = getAllProducts();
  const byId = new Map(allProducts.map((product) => [product.id, product]));
  const index = new Map<string, { key: string; code: string; options: Product[] }>();
  for (const family of APPROVED_COLOUR_FAMILIES) {
    if (!family.reviewed || !family.imageReviewed) continue;
    const representative = family.productIds
      .map((id) => byId.get(id))
      .find((product): product is Product => product !== undefined);
    if (!representative) continue;
    const resolved = resolveColourFamily(representative, allProducts, [family]);
    if (resolved.length !== family.productIds.length) continue;
    const options = resolved.map((member) => ({ ...member, colourFamilyCode: family.familyCode }));
    for (const member of resolved) index.set(member.id, { key: family.familyId, code: family.familyCode, options });
  }
  resolvedColourFamilyIndex = index;
  return index;
}

export {
  parseCatalogueQuery,
  buildCatalogueHref,
  countActiveFilters,
  sortOptions,
  emptyCatalogueQuery,
  verifiedUnitPriceInr,
};

function priceAmountForSort(product: Product): number {
  const verified = verifiedUnitPriceInr(product);
  return verified ?? Number.POSITIVE_INFINITY;
}

export function getColourVariants(product: Product): Product[] {
  return getResolvedColourFamilyIndex().get(product.id)?.options ?? [];
}

function getResolvedDesignFamilyIndex() {
  if (resolvedDesignFamilyIndex) return resolvedDesignFamilyIndex;
  const allProducts = getAllProducts();
  const byId = new Map(allProducts.map((product) => [product.id, product]));
  const index = new Map<string, { key: string; code: string; name: string; options: Product[] }>();
  for (const family of APPROVED_DESIGN_FAMILIES) {
    if (!family.reviewed || !family.imageReviewed) continue;
    const representative = family.productIds.map((id) => byId.get(id)).find((product): product is Product => product !== undefined);
    if (!representative) continue;
    const resolved = resolveDesignFamily(representative, allProducts, [family]);
    if (resolved.length !== family.productIds.length) continue;
    for (const member of resolved) index.set(member.id, { key: family.familyId, code: family.familyCode, name: family.familyName, options: resolved });
  }
  resolvedDesignFamilyIndex = index;
  return index;
}

export type ProductVariantFamily = {
  type: "colour" | "design";
  code: string;
  name?: string;
  optionLabel?: string;
  options: Product[];
};

export function getProductVariantFamily(product: Product): ProductVariantFamily | null {
  const colour = getResolvedColourFamilyIndex().get(product.id);
  if (colour) return { type: "colour", code: colour.code, options: colour.options };
  const design = getResolvedDesignFamilyIndex().get(product.id);
  return design ? { type: "design", code: design.code, name: design.name, optionLabel: design.options[0]?.designFamilyOptionLabel ?? "design", options: design.options } : null;
}

function collapseProductVariantFamilies(products: Product[]): Product[] {
  const familyByProduct = getResolvedColourFamilyIndex();
  const designFamilyByProduct = getResolvedDesignFamilyIndex();
  const visibleProductIds = new Set(products.map((product) => product.id));
  const seen = new Set<string>();
  return products.flatMap(product => {
    const family = familyByProduct.get(product.id);
    const designFamily = designFamilyByProduct.get(product.id);
    if (family) {
      const key = `colour:${family.key}`;
      if (seen.has(key)) return [];
      seen.add(key);
      const visibleOptions = family.options.filter((option) => visibleProductIds.has(option.id));
      return [{
        ...product,
        colourFamilyCode: family.code,
        colourVariantCount: visibleOptions.length,
        colourVariantOptions: visibleOptions,
      }];
    }
    if (!designFamily) return [product];
    const key = `design:${designFamily.key}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const visibleOptions = designFamily.options.filter((option) => visibleProductIds.has(option.id));
    return [{
      ...product,
      designFamilyCode: designFamily.code,
      designFamilyName: designFamily.name,
      designFamilyOptionLabel: designFamily.options[0]?.designFamilyOptionLabel ?? "design",
      designVariantCount: visibleOptions.length,
      designVariantOptions: visibleOptions,
    }];
  });
}

function productSearchHaystack(product: Product): string {
  return [
    product.name,
    product.summary,
    product.description,
    product.sku,
    product.catalogueSku,
    product.brandName,
    product.categoryName,
    product.subcategoryName,
    product.customization,
    ...product.colours,
    ...product.materials,
    ...product.keywords,
    ...product.attributes.map((a) => `${a.label} ${a.value}`),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function tokenizeRelevance(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
}

const STOP_RELEVANCE = new Set([
  "and",
  "the",
  "for",
  "with",
  "gift",
  "gifts",
  "gifting",
  "options",
  "option",
  "event",
  "events",
]);

function occasionAffinityTokens(
  occasionIds: string[],
  labelById: Map<string, string>,
): string[] {
  const tokens = new Set<string>();
  for (const id of occasionIds) {
    const label = labelById.get(id) ?? "";
    for (const part of [id.replace(/-/g, " "), label]) {
      for (const token of tokenizeRelevance(part)) {
        if (!STOP_RELEVANCE.has(token)) tokens.add(token);
      }
    }
  }
  return [...tokens];
}

/**
 * Higher = clearer fit for the active filters / search.
 * Weakly related source matches land toward the end of featured results.
 */
export function scoreCatalogueRelevance(
  product: Product,
  query: CatalogueQuery,
  occasionLabelById: Map<string, string>,
): number {
  let score = 0;

  if (product.availabilityStatus === "OUT") {
    score -= 1000;
  }

  if (query.occasions.length > 0) {
    const matched = query.occasions.filter((id) =>
      product.occasions.includes(id),
    );
    score += matched.length * 48;

    // Narrower occasion tagging = stronger, less "everything matches" noise
    const taggedCount = product.occasions.length;
    if (taggedCount <= 1) score += 28;
    else if (taggedCount <= 3) score += 16;
    else if (taggedCount <= 6) score += 6;
    else score -= Math.min(36, (taggedCount - 6) * 3);

    const affinity = occasionAffinityTokens(matched, occasionLabelById);
    const name = product.name.toLowerCase();
    const categoryBlob =
      `${product.categoryName} ${product.subcategoryName}`.toLowerCase();
    const keywordBlob = product.keywords.join(" ").toLowerCase();
    const summary = (product.summary || "").toLowerCase();

    for (const token of affinity) {
      if (name.includes(token)) score += 14;
      else if (categoryBlob.includes(token)) score += 10;
      else if (keywordBlob.includes(token)) score += 7;
      else if (summary.includes(token)) score += 4;
    }

    // Packaging SKUs are rarely the intent of occasion browse
    if (
      product.filterCategorySlug === "packaging" &&
      !query.categories.includes("packaging")
    ) {
      score -= 40;
    }

    // Demote weakly typed / Other merchandise in occasion browse
    if (product.filterCategorySlug === "other") {
      score -= 50;
    } else if (product.productTypeConfidence === "low") {
      score -= 12;
    }
  }

  if (query.categories.length > 0) {
    if (query.categories.includes(product.filterCategorySlug)) score += 24;
    // Export-only match without type agreement should not rank as primary
    else if (query.categories.includes(product.categorySlug)) score -= 30;
  }

  if (query.subcategories.length > 0) {
    if (query.subcategories.includes(product.subcategorySlug)) score += 36;
  }

  if (query.q) {
    const needle = query.q.toLowerCase().trim();
    const name = product.name.toLowerCase();
    const tokens = tokenizeRelevance(needle).filter(
      (t) => !STOP_RELEVANCE.has(t),
    );
    if (name.includes(needle)) {
      score += 60;
    } else {
      const hay = productSearchHaystack(product);
      for (const token of tokens) {
        if (name.includes(token)) score += 16;
        else if (product.keywords.some((k) => k.includes(token))) score += 9;
        else if (hay.includes(token)) score += 3;
      }
    }
  }

  if (product.images.length > 0) score += 2;

  return score;
}

function hasRelevanceContext(query: CatalogueQuery): boolean {
  return Boolean(
    query.q ||
      query.occasions.length ||
      query.categories.length ||
      query.subcategories.length,
  );
}

function occasionLabelMap(): Map<string, string> {
  return new Map(getOccasionFacets().map((facet) => [facet.id, facet.label]));
}

export function filterProducts(
  products: Product[],
  query: CatalogueQuery,
): Product[] {
  let result = products;

  if (query.shortlistedOnly) {
    if (query.shortlistIds.length === 0) return [];
    const ids = new Set(query.shortlistIds);
    result = result.filter((p) => ids.has(p.id));
  }

  if (query.q) {
    const needle = query.q.toLowerCase();
    result = result.filter((p) => productSearchHaystack(p).includes(needle));
  }

  if (query.occasions.length > 0) {
    result = result.filter((p) =>
      query.occasions.some((id) => p.occasions.includes(id)),
    );
  }

  if (query.categories.length > 0) {
    // Strict product-TYPE filter (classifier overlay) — not raw export labels
    result = result.filter((p) =>
      query.categories.includes(p.filterCategorySlug),
    );
  }

  if (query.subcategories.length > 0) {
    result = result.filter((p) =>
      query.subcategories.includes(p.subcategorySlug),
    );
  }

  if (query.brands.length > 0) {
    result = result.filter((p) =>
      p.brandName ? query.brands.includes(slugifyFacet(p.brandName)) : false,
    );
  }

  if (query.colours.length > 0) {
    result = result.filter((p) =>
      query.colours.some((id) => p.colourIds.includes(id)),
    );
  }

  if (query.materials.length > 0) {
    result = result.filter((p) =>
      query.materials.some((id) => p.materialIds.includes(id)),
    );
  }

  const hasBudget =
    query.budgetMinInr != null || query.budgetMaxInr != null;
  if (hasBudget) {
    result = result.filter((p) => {
      const price = verifiedUnitPriceInr(p);
      // Unknown / quote / non-positive → never matches a budget constraint
      if (price == null) return false;
      if (query.budgetMinInr != null && price < query.budgetMinInr) {
        return false;
      }
      if (query.budgetMaxInr != null && price > query.budgetMaxInr) {
        return false;
      }
      return true;
    });
  }

  return result;
}

export function sortProducts(
  products: Product[],
  sort: CatalogueSort,
  query: CatalogueQuery = emptyCatalogueQuery(),
): Product[] {
  const list = [...products];
  const labels = hasRelevanceContext(query) ? occasionLabelMap() : null;
  const relevanceOf = (product: Product) =>
    labels
      ? scoreCatalogueRelevance(product, query, labels)
      : 0;

  switch (sort) {
    case "name-asc":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return list.sort((a, b) => b.name.localeCompare(a.name));
    case "price-asc":
      return list.sort(
        (a, b) => priceAmountForSort(a) - priceAmountForSort(b),
      );
    case "price-desc":
      return list.sort(
        (a, b) => priceAmountForSort(b) - priceAmountForSort(a),
      );
    case "newest":
      return list.sort((a, b) =>
        (b.updatedAt ?? b.createdAt ?? "").localeCompare(
          a.updatedAt ?? a.createdAt ?? "",
        ),
      );
    case "featured":
    default: {
      // Search / occasion intent: relevance first. Unfiltered browse: type
      // order (filter rail) then within-type heroes. Typed browse: heroes.
      const preferRelevance =
        Boolean(query.q) || query.occasions.length > 0;
      const useTypeOrder = query.categories.length === 0;
      return list.sort((a, b) => {
        const aOut = a.availabilityStatus === "OUT" ? 1 : 0;
        const bOut = b.availabilityStatus === "OUT" ? 1 : 0;
        if (aOut !== bOut) return aOut - bOut;
        if (preferRelevance && labels) {
          const scoreDelta = relevanceOf(b) - relevanceOf(a);
          if (scoreDelta !== 0) return scoreDelta;
        }
        if (useTypeOrder) {
          const typeDelta =
            categoryDisplayRank(a.filterCategorySlug) -
            categoryDisplayRank(b.filterCategorySlug);
          if (typeDelta !== 0) return typeDelta;
        }
        // Keep records awaiting photography at the end of their category.
        const imageDelta = Number(b.images.length > 0) - Number(a.images.length > 0);
        if (imageDelta !== 0) return imageDelta;
        const heroDelta = categoryHeroRank(a) - categoryHeroRank(b);
        if (heroDelta !== 0) return heroDelta;
        if (!preferRelevance && labels) {
          const scoreDelta = relevanceOf(b) - relevanceOf(a);
          if (scoreDelta !== 0) return scoreDelta;
        }
        const subcategoryDelta =
          subcategoryDisplayRank(a.filterCategorySlug, a.subcategorySlug) -
          subcategoryDisplayRank(b.filterCategorySlug, b.subcategorySlug);
        if (subcategoryDelta !== 0) return subcategoryDelta;
        if (!preferRelevance) {
          const brandDelta = (a.brandName?.trim() || "\uffff").localeCompare(
            b.brandName?.trim() || "\uffff",
            undefined,
            { sensitivity: "base" },
          );
          if (brandDelta !== 0) return brandDelta;
        }
        return a.name.localeCompare(b.name);
      });
    }
  }
}

export type CatalogueResultPage = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: CatalogueQuery;
};

export function queryCatalogue(query: CatalogueQuery): CatalogueResultPage {
  const pageSize = getCataloguePageSize();
  const filtered = filterProducts(getAllProducts(), query);
  const sorted = collapseProductVariantFamilies(sortProducts(filtered, query.sort, query));
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * pageSize;
  const products = sorted.slice(start, start + pageSize);

  return {
    products,
    total,
    page,
    pageSize,
    totalPages,
    query: { ...query, page },
  };
}

/** Disjunctive counts: each group respects all constraints except itself. */
export function getContextualFacets(query: CatalogueQuery) {
  const products = getAllProducts();
  function group(key: 'categories' | 'occasions' | 'brands' | 'colours' | 'materials', definitions: import('./types').CatalogueFacet[], values: (p: Product) => string[]) {
    const candidates = filterProducts(products, {...query, [key]: [], ...(key === 'categories' ? {subcategories: []} : {})});
    const counts = new Map<string, number>();
    for (const p of candidates) for (const id of new Set(values(p))) counts.set(id, (counts.get(id) || 0) + 1);
    const ids = new Set(definitions.map(f => f.id));
    return [...definitions.map(f => ({...f, count: counts.get(f.id) || 0})), ...query[key].filter(id => !ids.has(id)).map(id => ({id, label: id, count: counts.get(id) || 0}))];
  }
  return {
    total: filterProducts(products, query).length,
    categories: group('categories', getCategoryFacets(), p => [p.filterCategorySlug]),
    brands: group('brands', getBrandFacets(), p => p.brandName ? [slugifyFacet(p.brandName)] : []),
    occasions: group('occasions', getOccasionFacets(), p => p.occasions),
    colours: group('colours', getColourFacets(), p => p.colourIds),
    materials: group('materials', getMaterialFacets(), p => p.materialIds),
  };
}
