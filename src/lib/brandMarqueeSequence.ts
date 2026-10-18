import type { BrandLogoItem } from "@/components/BrandLogoMarquee";

export type BrandMarqueeEntry = {
  brand: BrandLogoItem;
  decorative?: boolean;
};

/** Repeat Monkcraft after Swiss Military without creating a different loop seam. */
export function buildBrandMarqueeSequence(brands: BrandLogoItem[]): BrandMarqueeEntry[] {
  const monkcraft = brands.find((brand) => brand.name.trim().toLowerCase() === "monkcraft");

  return brands.flatMap((brand) => [
    { brand },
    ...(monkcraft && brand.href?.includes("brand=swiss-military")
      ? [{ brand: monkcraft, decorative: true }]
      : []),
  ]);
}
