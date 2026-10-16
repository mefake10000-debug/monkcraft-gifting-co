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
 * invent logos. The homepage selection below includes the brands requested for
 * its scroller; brands without a verified image use their supplied name.
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

const REQUESTED_HOMEPAGE_BRANDS: { name: string; searchName?: string }[] = [
  { name: "Nooe", searchName: "ShopNooe" },
  { name: "Adidas" },
  { name: "Reebok" },
  { name: "United Colors of Benetton" },
  { name: "Jack in Jones", searchName: "Jack&Jones" },
  { name: "Assembly" },
  { name: "Columbia" },
  { name: "Jockey" },
  { name: "Mukubaara" },
  { name: "Napa Dori" },
  { name: "Tommy Hilfiger" },
  { name: "Yumi" },
  { name: "American Tourist", searchName: "American Tourister" },
  { name: "Alan Solly", searchName: "Allen Solly" },
  { name: "My Paperclip", searchName: "myPaperClip" },
  { name: "Cookie Man", searchName: "Cookie man" },
  { name: "Engine Terrain", searchName: "Indian Terrain" },
  { name: "The Whole Truth" },
  { name: "Bloppung" },
  { name: "JBL" },
  { name: "Marshall" },
  { name: "Philips" },
  { name: "Borussel" },
  { name: "Smur" },
  { name: "Kent" },
  { name: "Farrosa" },
  { name: "Sony" },
  { name: "Bombay Shaving Company" },
];

const REQUESTED_BRAND_LOGOS: Record<string, string> = {
  Adidas: "/brands/adidas-logo.svg",
  Reebok: "/brands/reebok-logo.svg",
  JBL: "/brands/jbl-logo.svg",
  Sony: "/brands/sony-logo.svg",
};

/** Keep the homepage selection intentional and in the order requested. */
export function getHomepagePartnerBrands(): BrandLogoItem[] {
  return REQUESTED_HOMEPAGE_BRANDS.map(({ name, searchName = name }) => {
    const catalogueBrand = HOMEPAGE_PARTNER_BRAND_CANDIDATES.find(
      (brand) => brand.name.toLowerCase() === searchName.toLowerCase(),
    );
    const src = catalogueBrand
      ? catalogueBrand.logoSrc ?? resolveBrandLogoSrc(catalogueBrand.slug)
      : undefined;
    const logo = src ?? REQUESTED_BRAND_LOGOS[name];

    return {
      name,
      ...(logo ? { src: logo } : {}),
      href: `/gifts?q=${encodeURIComponent(searchName)}`,
    };
  });
}
