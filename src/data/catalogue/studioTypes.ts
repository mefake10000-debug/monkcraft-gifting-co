/**
 * Monkcraft Studio draft shapes — local browser only until storage ships.
 */

export type StudioMode = "customize" | "catalogue";

export type StudioLogoAsset = {
  fileName: string;
  fileType: string;
  fileSize: number;
  /** Present when the file fits local draft storage; may be absent after refresh. */
  dataUrl?: string;
};

/** Logo placement as fractions of the product preview box. */
export type BrandingTransform = {
  /** Logo centre X, 0–1 */
  x: number;
  /** Logo centre Y, 0–1 */
  y: number;
  /** Logo width as a fraction of preview width */
  scale: number;
  /** Degrees clockwise */
  rotation: number;
};

export type BrandingDraft = {
  productId: string | null;
  productSlug: string | null;
  logo: StudioLogoAsset | null;
  transform: BrandingTransform;
  text: string;
  textEnabled: boolean;
  /** Dirty since last explicit save / mode switch acknowledge */
  dirty: boolean;
  updatedAt: string;
};

export type CatalogueFieldKey =
  | "name"
  | "image"
  | "sku"
  | "category"
  | "summary"
  | "specs"
  | "price";

export type CataloguePricingMode =
  | "hide"
  | "base"
  | "markup-fixed"
  | "markup-percent";

export type WhiteLabelCatalogueDraft = {
  productIds: string[];
  title: string;
  companyName: string;
  coverText: string;
  accentColor: string;
  watermark: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  logo: StudioLogoAsset | null;
  fields: Record<CatalogueFieldKey, boolean>;
  pricingMode: CataloguePricingMode;
  /** INR amount or percent depending on pricingMode */
  markupValue: number;
  showPageNumbers: boolean;
  dirty: boolean;
  updatedAt: string;
};

/** Slim product payload for Studio pickers and previews (genuine catalogue only). */
export type StudioProductSummary = {
  id: string;
  slug: string;
  catalogueSku?: string;
  sku: string;
  name: string;
  summary: string;
  imageSrc?: string;
  imageAlt?: string;
  /** Source-verified colour options linked to their matching catalogue photos. */
  imageVariants?: { label: string; imageSrc: string; imageAlt?: string }[];
  categoryName: string;
  subcategoryName?: string;
  customization?: string;
  minQuantity?: number;
  priceLabel: string;
  amountInr?: number;
  attributes: { label: string; value: string }[];
};

export const DEFAULT_BRANDING_TRANSFORM: BrandingTransform = {
  x: 0.5,
  y: 0.42,
  scale: 0.28,
  rotation: 0,
};

export const CATALOGUE_FIELD_LABELS: Record<CatalogueFieldKey, string> = {
  name: "Product name",
  image: "Product image",
  sku: "SKU",
  category: "Category",
  summary: "Short description",
  specs: "Specifications",
  price: "Price",
};

export const DEFAULT_CATALOGUE_FIELDS: Record<CatalogueFieldKey, boolean> = {
  name: true,
  image: true,
  sku: true,
  category: true,
  summary: true,
  specs: false,
  price: true,
};
