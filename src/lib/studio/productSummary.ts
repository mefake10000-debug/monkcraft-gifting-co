import type { Product } from "@/data/catalogue/types";
import type { StudioProductSummary } from "@/data/catalogue/studioTypes";
import { formatPricing } from "@/lib/pricing";
import { buyerProductIntro } from "@/lib/productVoice";

export function toStudioProductSummary(product: Product): StudioProductSummary {
  const image = product.images[0];
  return {
    id: product.id,
    slug: product.slug,
    catalogueSku: product.catalogueSku,
    sku: product.sku,
    name: product.name,
    brandName: product.brandName,
    summary: buyerProductIntro(product.summary, product.name, product.filterCategorySlug || product.categorySlug),
    imageSrc: image?.src,
    imageAlt: image?.alt,
    imageVariants: product.colourOptions?.flatMap(({ label, imageIndex }) => {
      const variantImage = product.images[imageIndex];
      return variantImage
        ? [{ label, imageSrc: variantImage.src, imageAlt: variantImage.alt }]
        : [];
    }),
    categoryName: product.categoryName,
    subcategoryName: product.subcategoryName,
    customization: product.customization,
    minQuantity: product.minQuantity,
    priceLabel: formatPricing(product.pricing),
    amountInr:
      product.pricing.kind === "fixed" ? product.pricing.amountInr : undefined,
    attributes: product.attributes.slice(0, 8),
  };
}
