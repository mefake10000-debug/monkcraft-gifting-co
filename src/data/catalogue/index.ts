/**
 * Shared catalogue product-data interface.
 *
 * All buyer tools (Catalogue, detail, shortlist, Box, Studio, Company Stores,
 * Gift Finder, quotation) should import from this module or its siblings —
 * never hard-code product arrays or invent prices.
 */

export type {
  Product,
  ProductImage,
  ProductImageRole,
  ProductPricing,
  ProductSourceMeta,
  CatalogueQuery,
  CatalogueSort,
  CatalogueFacet,
  ShortlistItem,
  GiftingBriefDraft,
} from "./types";

export {
  getAllProducts,
  getProductById,
  getProductBySlug,
  getRelatedProducts,
  getCataloguePageSize,
  getCatalogueStats,
  isCataloguePopulated,
  clearCatalogueCache,
  verifiedUnitPriceInr,
  slugifyFacet,
} from "./products";

export {
  getCategoryFacets,
  getBrandFacets,
  getSubcategoryFacets,
  getOccasionFacets,
  getBrandingFacets,
  getColourFacets,
  getMaterialFacets,
  HOMEPAGE_OCCASION_MAP,
} from "./facets";

export {
  filterProducts,
  sortProducts,
  scoreCatalogueRelevance,
  queryCatalogue,
  getProductVariantFamily,
  parseCatalogueQuery,
  buildCatalogueHref,
  countActiveFilters,
  sortOptions,
  emptyCatalogueQuery,
} from "./query";

export type { CatalogueResultPage } from "./query";

export {
  getExportDataDir,
  getExportMediaPublicPrefix,
  getExportSchemaVersion,
  isExportDataAvailable,
} from "./exportPath";

export {
  PRODUCT_TYPE_GROUPS,
  OCCASION_GROUPS,
  productTypeGroupForCategory,
  categorySlugsForProductType,
} from "./taxonomy";

export type { ProductTypeGroup, OccasionGroup } from "./taxonomy";

export {
  FILTER_CATEGORY_DISPLAY_ORDER,
  SUBCATEGORY_DISPLAY_ORDER,
  categoryDisplayRank,
  compareCategoryDisplayOrder,
  subcategoryDisplayRank,
  categoryHeroRank,
} from "./categoryOrder";

export {
  classifyProductType,
  productMatchesCategoryFilter,
  getProductTypeMeta,
} from "./productType";

export type {
  ProductTypeId,
  ProductTypeClassification,
  TypeConfidence,
} from "./productType";

export { clearFacetCaches } from "./facets";
