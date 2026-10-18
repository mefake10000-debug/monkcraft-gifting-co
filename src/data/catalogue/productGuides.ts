import type { Product } from "./types";

export type ProductSizeGuide = {
  label: string;
  href: string;
};

const OFFICIAL_SIZE_GUIDES: Record<string, ProductSizeGuide> = {
  columbia: { label: "Columbia size guide", href: "https://www.columbia.com/t/size-fit/" },
  reebok: { label: "Reebok size guide", href: "https://www.reebok.com/pages/size-guides" },
  ucb: { label: "United Colors of Benetton size guide", href: "https://in.benetton.com/pages/size-guide" },
  "united colors of benetton": { label: "United Colors of Benetton size guide", href: "https://in.benetton.com/pages/size-guide" },
};

export function getProductSizeGuide(
  product: Pick<Product, "brandName" | "filterCategorySlug">,
): ProductSizeGuide | null {
  const brand = product.brandName?.trim().toLowerCase();
  if (product.filterCategorySlug !== "apparel-lifestyle" || !brand) return null;
  return OFFICIAL_SIZE_GUIDES[brand] ?? null;
}
