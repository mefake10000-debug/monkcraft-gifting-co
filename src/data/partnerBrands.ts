import type { BrandLogoItem } from "@/components/BrandLogoMarquee";
import catalogueBrands from "@/data/catalogue/export/brands.json";

/**
 * Homepage partner / catalogue-brand strip candidates.
 *
 * Source: `src/data/catalogue/export/brands.json` ranked by productCount.
 * House brand `monkcraft` is excluded (platform, not a partner mark).
 * Unnamed / null brand rows are excluded.
 *
 * `logoSrc` is resolved only from verified files in `public/brands/` — never
 * invent logos. When a verified mark is unavailable, show the catalogue's
 * published brand name as plain text so buyers can still browse every brand.
 */

export type PartnerBrandCandidate = {
  slug: string;
  name: string;
  productCount: number;
  /** Empty until a verified file exists under public/brands/ */
  logoSrc?: string;
};

/** All named catalogue brands except Monkcraft, ordered by product volume. */
export const HOMEPAGE_PARTNER_BRAND_CANDIDATES: PartnerBrandCandidate[] =
  catalogueBrands.brands
    .filter(
      (brand): brand is { slug: string; name: string; productCount: number } =>
        Boolean(brand.slug && brand.name && brand.slug !== "monkcraft"),
    )
    .map(({ slug, name, productCount }) => ({ slug, name, productCount }))
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));

/** Brand logo paths are explicit so no filesystem code enters page bundles. */
export function resolveBrandLogoSrc(slug: string): string | undefined {
  const verifiedLogoFiles: Record<string, string> = {
    "urban-gear": "/brands/urban-gear-logo.png",
    "bioq": "/brands/bioq-logo.svg",
    "fuzo": "/brands/fuzo-logo.webp",
    "the-backbencher": "/brands/the-backbencher-logo.png",
    "fur-jaden": "/brands/fur-jaden-logo-black.png",
    "levis": "/brands/levis-logo.png",
    "offikraft": "/brands/offikraft-logo.png",
    "oblique": "/brands/oblique-logo.png",
    "power-plus": "/brands/power-plus-logo.png",
    "3s": "/brands/3s-logo.png",
    "ooge": "/brands/ooge-logo.jpg",
    "stolt": "/brands/stolt-logo.png",
    "stellers": "/brands/stellers-logo.png",
    "portronics": "/brands/portronics-logo-blacktext.png",
    "jack-jones": "/brands/jack-jones-logo.png",
    "swiss-military": "/brands/swiss-military-logo.png",
    "hummel": "/brands/hummel-logo.svg",
  };
  return verifiedLogoFiles[slug];
}

/** Wire every catalogue brand into the marquee without inventing missing marks. */
export function getHomepagePartnerBrands(): BrandLogoItem[] {
  return HOMEPAGE_PARTNER_BRAND_CANDIDATES.flatMap((brand) => {
    const src = brand.logoSrc ?? resolveBrandLogoSrc(brand.slug);
    if (!src) return [];
    return [{
      name: brand.name,
      ...(src ? { src } : {}),
      href: `/gifts?q=${encodeURIComponent(brand.name)}`,
    }];
  });
}
