/**
 * Catalogue domain types for Monkcraft gifts.
 * Canonical product model — backed by website-export schema v2.
 * Optional fields stay undefined when unknown; never invent values.
 */

/** Image roles from the export; OTHER covers future / unlabelled assets. */
export type ProductImageRole = "MASTER" | "ANGLE" | "LIFESTYLE" | "SEQUENCE" | "OTHER";

export type ProductImage = {
  src: string;
  alt: string;
  role?: ProductImageRole;
  /** Display order (0 = primary/master when present). */
  sortOrder?: number;
  width?: number;
  height?: number;
};

export type ProductPricing =
  | {
      kind: "quote";
      label?: string;
    }
  | {
      kind: "fixed";
      amountInr: number;
      label?: string;
      gstBasis?: string | null;
    };

/** Provenance for maintainers — not shown as buyer-facing marketing copy. */
export type ProductSourceMeta = {
  system: "website-export";
  schemaVersion?: string;
  /** Export path relative to media root when known */
  exportSlug?: string;
};

/**
 * Canonical product record used by Catalogue, detail, shortlist, Box,
 * Studio, Company Stores, Gift Finder, and quotation handoffs.
 *
 * Stable identity: `id` === export SKU (unique). `slug` is the deep-link key.
 * Do not renumber IDs without a migration plan — drafts/shortlists store `id`.
 */
export type Product = {
  id: string;
  slug: string;
  /** New buyer-facing SKU. `id` and `sku` stay bound to the original export identity. */
  catalogueSku: string;
  sku: string;
  name: string;
  summary: string;
  description?: string;
  brandName?: string;
  images: ProductImage[];
  /** Source-matched gifting segment ids only (never inferred review candidates). */
  occasions: string[];
  categoryId: string;
  /**
   * Export category slug (provenance). Prefer `filterCategorySlug` for
   * catalogue / Gift Finder type filters — export labels can be noisy.
   */
  categorySlug: string;
  categoryName: string;
  subcategorySlug: string;
  subcategoryName: string;
  /**
   * Deterministic merchandise TYPE used by `?category=` filters.
   * May differ from `categorySlug` when the export bucket is polluted
   * (e.g. candles parked under Drinkware → Coffee).
   */
  filterCategorySlug: string;
  filterCategoryName: string;
  /** Buyer-facing product-type id (apparel, drinkware, other, …). */
  productTypeId: string;
  productTypeLabel: string;
  /** high | medium | low — low/other excluded from strict type views when remapped */
  productTypeConfidence: "high" | "medium" | "low";
  /** Classifier rule id for audits */
  productTypeRuleId: string;
  /** Source category label preserved for traceability */
  sourceCategoryLabel?: string;
  sourceSubcategoryLabel?: string;
  /** Normalized customization label for branding filter */
  customization?: string;
  brandingOptions: string[];
  /** Verified colour labels from export specs (may be empty). */
  colours: string[];
  /** Slug ids paired with `colours` for URL filters. */
  colourIds: string[];
  /** Number of same-description colour options shown behind this catalogue card. */
  colourVariantCount?: number;
  /** Shared human-facing family code; each variant keeps its own canonical SKU/id. */
  colourFamilyCode?: string;
  /** Reviewed full colorway wording when the base color alone loses detail. */
  colourOptionLabel?: string;
  /** Complete verified catalogue records for a reviewed colour family, used by in-place selectors. */
  colourVariantOptions?: Product[];
  /** Reviewed catalogue records that share this model but carry distinct artwork. */
  designFamilyCode?: string;
  designFamilyName?: string;
  /** Kind of selectable variation (for example, artwork design or shape and size). */
  designFamilyOptionLabel?: string;
  designOptionLabel?: string;
  designVariantCount?: number;
  designVariantOptions?: Product[];
  /** Verified material labels from export specs (may be empty). */
  materials: string[];
  materialIds: string[];
  /** Free-text keywords for search (derived from verified fields only). */
  keywords: string[];
  minQuantity?: number;
  availabilityStatus?: string;
  pricing: ProductPricing;
  attributes: { label: string; value: string }[];
  relatedIds?: string[];
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  source?: ProductSourceMeta;
};

export type CatalogueSort =
  | "featured"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "newest";

/** URL-driven discovery query. Facet fields are multi-select arrays. */
export type CatalogueQuery = {
  q: string;
  occasions: string[];
  categories: string[];
  subcategories: string[];
  brands: string[];
  brandings: string[];
  colours: string[];
  materials: string[];
  /**
   * Inclusive budget floor in INR. Only products with verified fixed prices
   * participate; quote / unknown / non-positive prices are excluded when set.
   */
  budgetMinInr: number | null;
  /** Inclusive budget ceiling in INR — same honesty rules as budgetMinInr. */
  budgetMaxInr: number | null;
  sort: CatalogueSort;
  shortlistedOnly: boolean;
  /** Product ids from local shortlist when shortlistedOnly is on */
  shortlistIds: string[];
  page: number;
};

export type CatalogueFacet = {
  id: string;
  label: string;
  count?: number;
};

/** Snapshot stored with shortlist so selections survive refresh without a DB. */
export type ShortlistItem = {
  amountInr?: number;
  id: string;
  slug: string;
  name: string;
  imageSrc?: string;
  priceLabel: string;
  minQuantity?: number;
  quantity: number;
  categoryName?: string;
};

/** Logo metadata only — never store large binaries on the brief itself. */
export type BriefLogoMeta = {
  fileName: string;
  fileType: string;
  fileSize: number;
  /** True when a binary was present in the source draft at link time */
  hasBinary: boolean;
};

export type BriefContact = {
  name: string;
  company: string;
  email: string;
  phone: string;
};

/** Lightweight Build-a-Box snapshot for quotation (live box draft remains source of truth). */
export type BriefBoxSource = {
  linkedAt: string;
  packagingSummary: string;
  productCount: number;
  numberOfBoxes: number;
  productLines: {
    id: string;
    slug: string;
    name: string;
    quantityPerBox: number;
    priceLabel: string;
  }[];
  companyName: string;
  occasion: string;
  budgetPerBox: string;
  brandingRequirements: string;
  giftMessage: string;
  personalizationNotes: string;
  packagingInstructions: string;
  deliveryRequirements: string;
  logo: BriefLogoMeta | null;
};

export type BriefStudioBrandingSource = {
  linkedAt: string;
  productId: string | null;
  productSlug: string | null;
  productName: string | null;
  productSku: string | null;
  priceLabel: string | null;
  customizationNote: string | null;
  text: string;
  textEnabled: boolean;
  transform: { x: number; y: number; scale: number; rotation: number };
  logo: BriefLogoMeta | null;
};

export type BriefStudioCatalogueSource = {
  linkedAt: string;
  title: string;
  companyName: string;
  productIds: string[];
  productSummaries: string[];
  pricingMode: string;
  logo: BriefLogoMeta | null;
};

export type BriefCompanyStoreSource = {
  linkedAt: string;
  companyName: string;
  storeName: string;
  productCount: number;
  productIds: string[];
  rulesLabel: string;
};

export type BriefSources = {
  box: BriefBoxSource | null;
  studioBranding: BriefStudioBrandingSource | null;
  studioCatalogue: BriefStudioCatalogueSource | null;
  companyStore: BriefCompanyStoreSource | null;
};

/**
 * Unified gifting brief draft — local, refresh-safe, schemaVersion 2.
 * Shortlist / box / studio / company-store drafts remain separate stores;
 * this model links and merges them for one quotation workspace.
 */
export type GiftingBriefDraft = {
  schemaVersion: 2;
  occasion: string;
  /** Recipient group / audience */
  audience: string;
  /** Total recipients or overall programme quantity */
  recipientCount: string;
  /** Target budget per recipient or per box */
  budgetPerRecipient: string;
  branding: string;
  packagingPrefs: string;
  deliveryDate: string;
  dispatchType: "single-city" | "multi-point" | "international" | "unsure";
  /** City/region or multi-address notes */
  deliveryLocation: string;
  notes: string;
  contact: BriefContact;
  /** Product ids mirrored when brief was last saved — live shortlist is authoritative */
  productIds: string[];
  sources: BriefSources;
  updatedAt: string;
};

/** @deprecated v1 shape — migrated on read */
export type GiftingBriefDraftV1 = {
  occasion: string;
  budget: string;
  quantity: string;
  branding: string;
  delivery: string;
  notes: string;
  productIds: string[];
  updatedAt: string;
};
