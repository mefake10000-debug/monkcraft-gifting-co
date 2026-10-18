/**
 * Smart Gift Finder — Layer A types (rule-based recommendations).
 * Layer B (future model provider) must call the same recommend service;
 * model output is never authoritative for product identity or price.
 */

import type { Product, ProductPricing } from "@/data/catalogue/types";

export const GIFT_FINDER_SCHEMA_VERSION = 1 as const;

/** Guided requirements collected by Smart Gift Finder (client draft + API). */
export type GiftFinderRequirements = {
  schemaVersion: typeof GIFT_FINDER_SCHEMA_VERSION;
  /** Source-matched gifting segment ids (honest catalogue occasions). */
  occasionIds: string[];
  audience: string;
  recipientCount: string;
  /** Parsed INR per recipient; null when unknown / not set. */
  budgetPerRecipientInr: number | null;
  /** Optional programme total INR; informational when recipients known. */
  budgetTotalInr: number | null;
  /** Raw budget string as entered (for brief sync). */
  budgetPerRecipientLabel: string;
  categorySlugs: string[];
  /** Free-text preference tokens (keyword match against catalogue fields). */
  preferenceKeywords: string[];
  /** Branding intent id: none | logo | print | undecided */
  brandingPreference: string;
  brandingNotes: string;
  packagingNotes: string;
  deliveryDate: string;
  deliveryLocation: string;
  specialInstructions: string;
  /** Optional short description from the buyer. */
  freeText: string;
  updatedAt: string;
};

export type GiftFinderMatchReason = {
  code:
    | "occasion"
    | "category"
    | "budget"
    | "keyword"
    | "branding"
    | "preference"
    | "availability"
    | "near-budget"
    | "moq"
    | "partial";
  label: string;
};

export type GiftFinderMatchTier = "match" | "alternative";

/** Compact product payload for finder results (genuine export fields only). */
export type GiftFinderProductCard = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  summary: string;
  categorySlug: string;
  categoryName: string;
  subcategoryName: string;
  occasions: string[];
  customization?: string;
  brandingOptions: string[];
  minQuantity?: number;
  availabilityStatus?: string;
  pricing: ProductPricing;
  imageSrc?: string;
  imageAlt?: string;
};

export type GiftFinderMatch = {
  product: GiftFinderProductCard;
  score: number;
  tier: GiftFinderMatchTier;
  reasons: GiftFinderMatchReason[];
  /** Honest caveats (missing branding data, MOQ, etc.). */
  notes: string[];
};

export type GiftFinderRecommendMeta = {
  productUniverse: number;
  considered: number;
  matchCount: number;
  alternativeCount: number;
  budgetApplied: boolean;
  occasionApplied: boolean;
  categoryApplied: boolean;
  missingHints: string[];
  explanation: string;
};

export type GiftFinderRecommendResult = {
  requirements: GiftFinderRequirements;
  matches: GiftFinderMatch[];
  alternatives: GiftFinderMatch[];
  meta: GiftFinderRecommendMeta;
};

export type GiftFinderRecommendRequest = {
  requirements: Partial<GiftFinderRequirements> &
    Pick<
      GiftFinderRequirements,
      | "occasionIds"
      | "categorySlugs"
      | "preferenceKeywords"
      | "budgetPerRecipientInr"
      | "budgetPerRecipientLabel"
    >;
  limit?: number;
  alternativeLimit?: number;
};

/** Map a full Product into the finder card shape. */
export function toGiftFinderProductCard(product: Product): GiftFinderProductCard {
  const image = product.images[0];
  return {
    id: product.id,
    slug: product.slug,
    sku: product.catalogueSku,
    name: product.name,
    summary: product.summary,
    categorySlug: product.filterCategorySlug,
    categoryName: product.filterCategoryName,
    subcategoryName: product.subcategoryName,
    occasions: product.occasions,
    customization: product.customization,
    brandingOptions: product.brandingOptions,
    minQuantity: product.minQuantity,
    availabilityStatus: product.availabilityStatus,
    pricing: product.pricing,
    imageSrc: image?.src,
    imageAlt: image?.alt,
  };
}

export function emptyGiftFinderRequirements(): GiftFinderRequirements {
  return {
    schemaVersion: GIFT_FINDER_SCHEMA_VERSION,
    occasionIds: [],
    audience: "",
    recipientCount: "",
    budgetPerRecipientInr: null,
    budgetTotalInr: null,
    budgetPerRecipientLabel: "",
    categorySlugs: [],
    preferenceKeywords: [],
    brandingPreference: "",
    brandingNotes: "",
    packagingNotes: "",
    deliveryDate: "",
    deliveryLocation: "",
    specialInstructions: "",
    freeText: "",
    updatedAt: "",
  };
}
