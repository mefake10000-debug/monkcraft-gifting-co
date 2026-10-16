import type { BoxProductSnapshot } from "@/data/catalogue/boxTypes";
import type { Product } from "@/data/catalogue/types";
import { formatPricing } from "@/lib/pricing";

export function productToSnapshot(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    imageSrc: product.images[0]?.src,
    priceLabel: formatPricing(product.pricing),
    amountInr: product.pricing.kind === "fixed" ? product.pricing.amountInr : undefined,
    minQuantity: product.minQuantity,
    categoryName: product.filterCategoryName || product.categoryName,
  };
}

export function productToBoxSnapshot(product: Product): BoxProductSnapshot {
  return { ...productToSnapshot(product) };
}
