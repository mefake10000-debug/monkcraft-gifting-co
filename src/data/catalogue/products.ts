/**
 * Replaceable catalogue product source.
 * Loads Monkcraft website-export (schema 2.0.0) from the local export path.
 * Never invent SKUs, prices, or inventory beyond the export.
 *
 * Stable identity: product.id === SKU (unique in export). Slug is the URL key.
 */

import fs from "node:fs";
import path from "node:path";

import { getExportDataDir, getExportSchemaVersion } from "./exportPath";
import { classifyProductType } from "./productType";
import colourFamilies from "./colourFamilies.json";
import colourLabelOverrides from "./colourLabelOverrides.json";
import categoryOverrides from "./categoryOverrides.json";
import confettiProductIds from "./confettiProducts.json";
import productImageOverrides from "./productImageOverrides.json";
import { getReviewedProductDescription } from "./editorial/runtime";
import { resolveBuyerSubcategory } from "./subcategoryMapping";
import type {
  Product,
  ProductImage,
  ProductImageRole,
  ProductPricing,
} from "./types";

/** Optional hook so facets can invalidate without a circular import. */
let onCatalogueCacheCleared: (() => void) | null = null;

export function setCatalogueCacheClearedListener(
  listener: (() => void) | null,
): void {
  onCatalogueCacheCleared = listener;
}

const PAGE_SIZE = 24;
const EXPORT_SCHEMA = "2.0.0";
const CATEGORY_OVERRIDES = new Map(
  categoryOverrides.map((entry) => [entry.productId, entry]),
);
const COLOUR_LABEL_OVERRIDES = new Map(
  colourLabelOverrides.map((entry) => [entry.productId, entry.label]),
);
const CONFETTI_PRODUCT_IDS = new Set(confettiProductIds as string[]);
const CONFETTI_SUBCATEGORY_LABELS: Record<string, { slug: string; name: string }> = {
  "chocolate-confectionery": { slug: "chocolate-confectionery", name: "Chocolate & Confectionery" },
  gourmet: { slug: "gourmet-food", name: "Gourmet Food & Snacks" },
  "gift-sets": { slug: "edible-gift-sets", name: "Edible Gift Sets" },
  "festive-hampers": { slug: "edible-gift-sets", name: "Edible Gift Sets" },
  coffee: { slug: "coffee-tea", name: "Coffee & Tea" },
  bottles: { slug: "coffee-tea", name: "Coffee & Tea" },
  travel: { slug: "chocolate-confectionery", name: "Chocolate & Confectionery" },
};
const COLOUR_FAMILY_CODE_BY_PRODUCT = new Map(
  colourFamilies.flatMap((family) =>
    family.reviewed && family.imageReviewed
      ? family.productIds.map((id) => [id, family.familyCode] as const)
      : [],
  ),
);
const COLOUR_OPTION_LABEL_BY_PRODUCT = new Map(
  colourFamilies.flatMap((family) =>
    family.reviewed && family.imageReviewed
      ? Object.entries(family.optionLabels ?? {})
      : [],
  ),
);
type ExportImage = {
  path: string;
  variantKey?: string;
  role?: string;
  alt?: string | null;
  width?: number;
  height?: number;
  sortOrder?: number;
};

type ExportProduct = {
  id?: string;
  slug: string;
  title: string;
  sku: string;
  brand?: string | { name?: string | null; slug?: string | null } | null;
  shortDescription?: string | null;
  description?: string | null;
  category: { id?: string; slug: string; name: string };
  subcategory: { slug: string; name: string };
  pricing: {
    amount: number | null;
    currency: string;
    gstBasis?: string | null;
  };
  availability?: {
    status?: string;
    moq?: number | null;
    minimumOrderQuantity?: number | null;
    dispatch?: string | null;
  };
  specifications?: Record<string, string | null | undefined> | null;
  images?: ExportImage[];
  createdAt?: string;
  updatedAt?: string;
};

type ExportFile = {
  schemaVersion?: string;
  products: ExportProduct[];
};

type ProductImageOverride = {
  productId: string;
  path: string;
  alt: string;
  role?: string;
};

type SegmentFile = {
  segments: {
    id: string;
    sourceMatchedProductSlugs: string[];
  }[];
};

export function slugifyFacet(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function resolveBrandName(
  brand: ExportProduct["brand"],
): string | undefined {
  if (!brand) return undefined;
  if (typeof brand === "string") {
    const trimmed = brand.trim();
    return trimmed || undefined;
  }
  const name = brand.name?.trim();
  return name || undefined;
}

function normalizeCustomization(raw: string | null | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const cleaned = raw.trim().replace(/\s+/g, " ");
  const lower = cleaned.toLowerCase();
  if (lower === "dtf" || lower === "dtf printing") return "DTF Printing";
  if (lower === "u v printing" || lower === "uv printing") return "UV Printing";
  return cleaned;
}

function toPublicImagePath(exportPath: string): string | null {
  const pathValue = exportPath.trim();
  // Product photography must be served by Monkcraft. Ignore remote URLs and
  // protocol-relative paths even if a future export starts including them.
  if (!pathValue || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\\\\)/i.test(pathValue)) {
    return null;
  }
  if (pathValue.startsWith("media/")) {
    return `/catalogue-media/${pathValue.slice("media/".length)}`;
  }
  if (pathValue.startsWith("/")) {
    return pathValue.startsWith("/catalogue-media/") || pathValue.startsWith("/catalogue-import/")
      ? pathValue
      : null;
  }
  return `/catalogue-media/${pathValue.replace(/^\.\//, "")}`;
}

function mapImageRole(role?: string): ProductImageRole {
  const upper = (role || "").toUpperCase();
  if (upper === "MASTER") return "MASTER";
  if (upper === "ANGLE") return "ANGLE";
  if (upper === "LIFESTYLE") return "LIFESTYLE";
  if (upper === "SEQUENCE" || upper === "360") return "SEQUENCE";
  return "OTHER";
}

function mapImages(product: ExportProduct): ProductImage[] {
  const images = [...(product.images ?? [])];
  images.sort((a, b) => {
    const ao = a.sortOrder ?? 0;
    const bo = b.sortOrder ?? 0;
    if (ao !== bo) return ao - bo;
    // Prefer MASTER first when sortOrder ties
    const ar = mapImageRole(a.role);
    const br = mapImageRole(b.role);
    if (ar === "MASTER" && br !== "MASTER") return -1;
    if (br === "MASTER" && ar !== "MASTER") return 1;
    return 0;
  });

  const mappedImages = images.flatMap((img, index) => {
    const src = toPublicImagePath(img.path);
    if (!src) return [];
    return [{
    src,
    alt: img.alt?.trim() || `${product.title} — image ${index + 1}`,
    role: mapImageRole(img.role),
    variantKey: img.variantKey?.trim() || undefined,
    sortOrder: img.sortOrder ?? index,
    width: img.width,
    height: img.height,
  }];
  });

  // Add only source-verified recovery photos for products that have no source
  // images. Existing source photography always takes precedence unchanged.
  if (mappedImages.length > 0) return mappedImages;
  const productId = resolveProductId(product);
  return (productImageOverrides as ProductImageOverride[])
    .filter((override) => override.productId === productId)
    .flatMap((override) => {
      const src = toPublicImagePath(override.path);
      if (!src) return [];
      return [{
        src,
        alt: override.alt,
        role: mapImageRole(override.role),
        sortOrder: 0,
      }];
    });
}

/**
 * Fixed price only when amount is a verified positive number.
 * Missing / zero / non-finite amounts become quote — never treated as ₹0 in budget filters.
 */
function mapPricing(product: ExportProduct): ProductPricing {
  const amount = product.pricing?.amount;
  if (amount == null || !Number.isFinite(amount) || amount <= 0) {
    return { kind: "quote", label: "Quote on request" };
  }
  return {
    kind: "fixed",
    amountInr: amount,
    gstBasis: product.pricing.gstBasis ?? null,
  };
}

/** Spec labels that are export/metadata noise — not useful on the PDP. */
const HIDDEN_SPEC_LABELS = new Set(
  [
    "source product url",
    "source product url ",
    "product source url",
    "source url",
    "product url",
    "direct source link",
    "stock update date",
    "stock updated date",
    "last stock update",
    "export date",
    "synced at",
    "last synced",
  ].map((s) => s.toLowerCase()),
);

/**
 * Drop source/import metadata, supplier links and invalid / far-future date values
 * so PDPs do not show raw export hygiene issues (audit D08).
 */
function sanitizeSpecValue(label: string, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\$?undefined$/i.test(trimmed)) return null;
  const normalizedLabel = label
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[\s_-]+/g, " ")
    .trim();
  if (
    HIDDEN_SPEC_LABELS.has(normalizedLabel) ||
    /^(?:source|internal|(?:catalogue )?import)(?: |$)/.test(normalizedLabel) ||
    /(?:^| )(?:url|link)(?: |$)/.test(normalizedLabel) ||
    /(?:https?:\/\/|www\.|^\/\/)/i.test(trimmed)
  ) return null;

  const looksLikeDate =
    /date|updated|synced/i.test(label) ||
    /^\d{1,2}\s+\w+\s+\d{4}$/i.test(trimmed) ||
    /^\d{4}-\d{2}-\d{2}/.test(trimmed);

  if (!looksLikeDate) return trimmed;

  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    // Keep non-ISO human strings that aren't clearly dates; drop unparsable "dates"
    if (/date|updated|synced/i.test(label)) return null;
    return trimmed;
  }

  const ms = parsed;
  const now = Date.now();
  // Hide dates more than ~1 year in the future (common export/timezone glitch)
  if (ms > now + 366 * 24 * 60 * 60 * 1000) return null;
  // Hide absurdly old placeholders
  if (ms < Date.UTC(1990, 0, 1)) return null;

  return trimmed;
}

function mapAttributes(product: ExportProduct): { label: string; value: string }[] {
  const specs = product.specifications ?? {};
  const rows: { label: string; value: string }[] = [];
  for (const [label, value] of Object.entries(specs)) {
    if (value == null) continue;
    if (label.trim().toLocaleLowerCase() === "stock availability") continue;
    const cleaned = sanitizeSpecValue(label, String(value));
    if (!cleaned) continue;
    const identity = product.sku?.trim().toLocaleLowerCase();
    if (
      identity &&
      ["sku", "product code"].includes(label.trim().toLocaleLowerCase()) &&
      cleaned.toLocaleLowerCase() === identity
    ) continue;
    rows.push({ label, value: cleaned });
  }
  const dispatch = product.availability?.dispatch;
  if (dispatch && !rows.some(({ label }) => label.trim().toLowerCase() === "dispatch timeline")) {
    const cleaned = sanitizeSpecValue("Dispatch Timeline", dispatch);
    if (cleaned) rows.push({ label: "Dispatch Timeline", value: cleaned });
  }
  return rows;
}

function specValue(
  product: ExportProduct,
  key: string,
): string | undefined {
  const raw = product.specifications?.[key];
  if (raw == null) return undefined;
  const trimmed = String(raw).trim();
  return trimmed || undefined;
}

function resolveMoq(product: ExportProduct): number | undefined {
  return [
    product.availability?.moq,
    product.availability?.minimumOrderQuantity,
  ].find(
    (minimum) =>
      typeof minimum === "number" &&
      Number.isFinite(minimum) &&
      minimum > 0,
  ) ?? undefined;
}

function normalizeColourLabel(value: string): string {
  return value.trim().split(/\s*\/\s*/).at(-1)?.trim().toLocaleLowerCase() ?? "";
}

function mapColourOptions(
  product: ExportProduct,
  images: ProductImage[],
): { label: string; imageIndex: number }[] {
  const sourceLabels = specValue(product, "Variant Image Colors")
    ?.split(/\s*,\s*/)
    .filter(Boolean) ?? [];
  const options: { label: string; imageIndex: number }[] = [];
  const seen = new Set<string>();

  for (const sourceLabel of sourceLabels) {
    const cleanLabel = sourceLabel.split(/\s*\/\s*/).at(-1)?.trim() ?? sourceLabel;
    const normalized = normalizeColourLabel(cleanLabel);
    if (!normalized || seen.has(normalized)) continue;

    const imageIndex = images.findIndex((image) => {
      const key = image.variantKey?.trim();
      if (!key || key.toLocaleLowerCase() === "primary") return false;
      if (key.toLocaleLowerCase() === sourceLabel.trim().toLocaleLowerCase()) return true;
      return key.split(/\s*\/\s*/).some((part) => part.trim().toLocaleLowerCase() === normalized);
    });
    if (imageIndex < 0) continue;

    seen.add(normalized);
    options.push({ label: cleanLabel, imageIndex });
  }

  return options;
}

/**
 * Canonical product id = SKU when present (unique in export).
 * Falls back to explicit export id, then slug. Changing this breaks shortlist/box drafts.
 */
export function resolveProductId(product: ExportProduct): string {
  const sku = product.sku?.trim();
  if (sku) return sku;
  const id = product.id?.trim();
  if (id) return id;
  return product.slug;
}

function buildKeywords(parts: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    const token = part.trim().toLowerCase();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    out.push(token);
  }
  return out;
}

function loadExportProducts(): ExportProduct[] {
  const filePath = path.join(getExportDataDir(), "products.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw) as ExportFile;
  return data.products ?? [];
}

function loadSourceMatchIndex(): Map<string, string[]> {
  const filePath = path.join(getExportDataDir(), "gifting-segments.json");
  const index = new Map<string, string[]>();
  if (!fs.existsSync(filePath)) return index;

  const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as SegmentFile;
  for (const segment of data.segments ?? []) {
    for (const slug of segment.sourceMatchedProductSlugs ?? []) {
      const list = index.get(slug) ?? [];
      if (!list.includes(segment.id)) list.push(segment.id);
      index.set(slug, list);
    }
  }
  return index;
}

let cachedProducts: Product[] | null = null;
let cachedBySlug: Map<string, Product> | null = null;
let cachedById: Map<string, Product> | null = null;

function buildCatalogue(): Product[] {
  const exportProducts = loadExportProducts();
  const occasionBySlug = loadSourceMatchIndex();
  const schemaVersion = getExportSchemaVersion() || EXPORT_SCHEMA;

  const products: Product[] = exportProducts.map((ep) => {
    const productId = resolveProductId(ep);
    const categoryOverride = CATEGORY_OVERRIDES.get(productId);
    const categoryId = categoryOverride?.categoryId ?? ep.category.id ?? ep.category.slug;
    const categorySlug = categoryOverride?.categorySlug ?? ep.category.slug;
    const categoryName = categoryOverride?.categoryName ?? ep.category.name;
    const subcategorySlug = categoryOverride?.subcategorySlug ?? ep.subcategory.slug;
    const subcategoryName = categoryOverride?.subcategoryName ?? ep.subcategory.name;
    const customization = normalizeCustomization(
      specValue(ep, "Customization Type"),
    );
    const brandingOptions = customization
      ? [slugifyFacet(customization)]
      : [];

    const colour = specValue(ep, "Color") ?? specValue(ep, "Available Color") ?? COLOUR_LABEL_OVERRIDES.get(productId);
    const images = mapImages(ep);
    const colourOptions = mapColourOptions(ep, images);
    const material = specValue(ep, "Material");
    const colours = colour ? [colour] : [];
    const materials = material ? [material] : [];

    const typeInfo = classifyProductType({
      name: ep.title,
      categorySlug,
      categoryName,
      subcategorySlug,
      subcategoryName,
    });
    const isConfettiProduct = CONFETTI_PRODUCT_IDS.has(productId);
    const confettiSubcategory = isConfettiProduct
      ? CONFETTI_SUBCATEGORY_LABELS[subcategorySlug]
      : undefined;
    const buyerSubcategory = resolveBuyerSubcategory(
      typeInfo.filterCategorySlug,
      subcategorySlug,
      ep.title,
    );

    return {
      id: productId,
      slug: ep.slug,
      // Keep the published product identifier exactly as supplied by the source catalogue.
      catalogueSku: ep.sku,
      sku: ep.sku,
      colourFamilyCode: COLOUR_FAMILY_CODE_BY_PRODUCT.get(productId),
      colourOptionLabel: COLOUR_OPTION_LABEL_BY_PRODUCT.get(productId),
      name: ep.title,
      summary: getReviewedProductDescription(productId) || (ep.shortDescription || ep.description || "").trim() || ep.title,
      description: ep.description?.trim() || undefined,
      brandName: resolveBrandName(ep.brand),
      images,
      occasions: occasionBySlug.get(ep.slug) ?? [],
      categoryId,
      categorySlug,
      categoryName,
      subcategorySlug: confettiSubcategory?.slug ?? buyerSubcategory.slug,
      subcategoryName: confettiSubcategory?.name ?? buyerSubcategory.name,
      filterCategorySlug: isConfettiProduct
        ? "confetti-products"
        : typeInfo.filterCategorySlug,
      filterCategoryName: isConfettiProduct
        ? "Confetti Products"
        : typeInfo.filterCategoryName,
      productTypeId: typeInfo.typeId,
      productTypeLabel: typeInfo.typeLabel,
      productTypeConfidence: typeInfo.confidence,
      productTypeRuleId: typeInfo.ruleId,
      sourceCategoryLabel: ep.category.name,
      sourceSubcategoryLabel: ep.subcategory.name,
      customization,
      brandingOptions,
      colours,
      colourIds: colours.map(slugifyFacet),
      colourOptions: colourOptions.length ? colourOptions : undefined,
      materials,
      materialIds: materials.map(slugifyFacet),
      keywords: buildKeywords([
        ep.title,
        ep.sku,
        resolveBrandName(ep.brand),
        ep.category.name,
        ep.subcategory.name,
        customization,
        colour,
        material,
        specValue(ep, "Product Code"),
      ]),
      minQuantity: resolveMoq(ep),
      availabilityStatus: ep.availability?.status,
      pricing: mapPricing(ep),
      attributes: mapAttributes(ep),
      relatedIds: [],
      featured: false,
      createdAt: ep.createdAt,
      updatedAt: ep.updatedAt,
      source: {
        system: "website-export",
        schemaVersion,
        exportSlug: ep.slug,
      },
    };
  });

  // Related ids: ranked same-subcategory then same FILTER type (exclude self)
  const bySub = new Map<string, Product[]>();
  const byCat = new Map<string, Product[]>();
  for (const p of products) {
    const sk = `${p.filterCategorySlug}/${p.subcategorySlug}`;
    const subList = bySub.get(sk) ?? [];
    subList.push(p);
    bySub.set(sk, subList);
    const catList = byCat.get(p.filterCategorySlug) ?? [];
    catList.push(p);
    byCat.set(p.filterCategorySlug, catList);
  }

  for (const p of products) {
    p.relatedIds = rankRelatedCandidates(p, bySub, byCat, 4).map((x) => x.id);
  }

  return products;
}

function sharedOccasionCount(a: Product, b: Product): number {
  if (a.occasions.length === 0 || b.occasions.length === 0) return 0;
  const set = new Set(a.occasions);
  let count = 0;
  for (const id of b.occasions) {
    if (set.has(id)) count += 1;
  }
  return count;
}

function keywordOverlapScore(a: Product, b: Product): number {
  if (a.keywords.length === 0 || b.keywords.length === 0) return 0;
  const set = new Set(a.keywords);
  let hits = 0;
  for (const key of b.keywords) {
    if (set.has(key)) hits += 1;
  }
  return Math.min(hits, 6);
}

function rankRelatedCandidates(
  product: Product,
  bySub: Map<string, Product[]>,
  byCat: Map<string, Product[]>,
  limit: number,
): Product[] {
  const sk = `${product.filterCategorySlug}/${product.subcategorySlug}`;
  const seen = new Set<string>([product.id]);
  const pool: Product[] = [];

  for (const candidate of bySub.get(sk) ?? []) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    pool.push(candidate);
  }
  for (const candidate of byCat.get(product.filterCategorySlug) ?? []) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    pool.push(candidate);
  }

  return pool
    .map((candidate) => {
      let score = 0;
      if (candidate.subcategorySlug === product.subcategorySlug) score += 50;
      else score += 20;
      score += sharedOccasionCount(product, candidate) * 8;
      score += keywordOverlapScore(product, candidate) * 3;
      if (candidate.availabilityStatus === "OUT") score -= 80;
      if (candidate.images.length === 0) score -= 10;
      return { candidate, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.candidate.name.localeCompare(b.candidate.name);
    })
    .slice(0, limit)
    .map((row) => row.candidate);
}

/** Clear in-memory caches (used by import validation / tests). */
export function clearCatalogueCache(): void {
  cachedProducts = null;
  cachedBySlug = null;
  cachedById = null;
  onCatalogueCacheCleared?.();
}

export function getAllProducts(): Product[] {
  if (!cachedProducts) {
    cachedProducts = buildCatalogue();
  }
  return cachedProducts;
}

export function getProductBySlug(slug: string): Product | undefined {
  if (!cachedBySlug) {
    cachedBySlug = new Map(getAllProducts().map((p) => [p.slug, p]));
  }
  return cachedBySlug.get(slug);
}

export function getProductById(id: string): Product | undefined {
  if (!cachedById) {
    cachedById = new Map(getAllProducts().map((p) => [p.id, p]));
  }
  return cachedById.get(id);
}

/** Compact related set for PDP — max 4; UI may hide extras on small screens. */
export function getRelatedProducts(product: Product, limit = 4): Product[] {
  const capped = Math.min(Math.max(limit, 0), 4);
  const ids = product.relatedIds ?? [];
  const fromIds = ids
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p))
    .filter((p) => p.availabilityStatus !== "OUT")
    .slice(0, capped);
  if (fromIds.length >= capped) return fromIds;

  // Fallback if cache predates ranked relatedIds
  const need = capped - fromIds.length;
  const seen = new Set(fromIds.map((p) => p.id).concat(product.id));
  const extras = getAllProducts()
    .filter(
      (p) =>
        !seen.has(p.id) &&
        p.filterCategorySlug === product.filterCategorySlug &&
        p.availabilityStatus !== "OUT",
    )
    .sort((a, b) => {
      const aSub = a.subcategorySlug === product.subcategorySlug ? 1 : 0;
      const bSub = b.subcategorySlug === product.subcategorySlug ? 1 : 0;
      if (aSub !== bSub) return bSub - aSub;
      return a.name.localeCompare(b.name);
    })
    .slice(0, need);
  return [...fromIds, ...extras];
}

export function getCataloguePageSize(): number {
  return PAGE_SIZE;
}

export function isCataloguePopulated(): boolean {
  return getAllProducts().length > 0;
}

export function getCatalogueStats() {
  const products = getAllProducts();
  const withFixedPrice = products.filter((p) => p.pricing.kind === "fixed");
  const withMoq = products.filter((p) => typeof p.minQuantity === "number");
  return {
    productCount: products.length,
    withImages: products.filter((p) => p.images.length > 0).length,
    withFixedPrice: withFixedPrice.length,
    withMoq: withMoq.length,
    source: "website-export" as const,
    schemaVersion: getExportSchemaVersion() || EXPORT_SCHEMA,
    exportDataDir: getExportDataDir(),
  };
}

/** Verified unit price for budget math — never treat quote/unknown as in-budget. */
export function verifiedUnitPriceInr(product: Product): number | null {
  if (product.pricing.kind !== "fixed") return null;
  const amount = product.pricing.amountInr;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}
