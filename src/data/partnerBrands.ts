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
 * invent logos. The marquee preserves its original partner set and appends
 * requested brands when a verified local mark is available.
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

export const REQUESTED_HOMEPAGE_BRANDS: { name: string; searchName?: string }[] = [
  { name: "Nooe", searchName: "ShopNooe" },
  { name: "Adidas" },
  { name: "Reebok" },
  { name: "United Colors of Benetton" },
  { name: "Jack in Jones", searchName: "Jack&Jones" },
  { name: "Assembly" },
  { name: "Columbia" },
  { name: "Jockey" },
  { name: "Mukubaara", searchName: "Mokobara" },
  { name: "Napa Dori", searchName: "NAPPA DORI" },
  { name: "Tommy Hilfiger" },
  { name: "Eumi" },
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
  "United Colors of Benetton": "/brands/benetton-logo.svg",
  Assembly: "/brands/assembly-logo.svg",
  Jockey: "/brands/jockey-logo.png",
  Mukubaara: "/brands/mokobara-logo.svg",
  "Tommy Hilfiger": "/brands/tommy-hilfiger-logo.png",
  Eumi: "/brands/eume-logo.png",
  "American Tourist": "/brands/american-tourister-logo.webp",
  "Alan Solly": "/brands/allen-solly-logo.png",
  "My Paperclip": "/brands/my-paperclip-logo.png",
  "Cookie Man": "/brands/cookie-man-logo.png",
  "Engine Terrain": "/brands/indian-terrain-logo.png",
  "The Whole Truth": "/brands/whole-truth-logo.svg",
  JBL: "/brands/jbl-logo.svg",
  Marshall: "/brands/marshall-logo.png",
  Philips: "/brands/philips-logo.svg",
  Kent: "/brands/kent-logo.svg",
  Sony: "/brands/sony-logo.svg",
  "Bombay Shaving Company": "/brands/bombay-shaving-company-logo.png",
};

const ORIGINAL_BRAND_ITEMS: { name: string; slug: string; searchName: string }[] = [
  { name: "Urban Gear", slug: "urban-gear", searchName: "Urban Gear" },
  { name: "bioQ", slug: "bioq", searchName: "bioQ" },
  { name: "FUZO", slug: "fuzo", searchName: "FUZO" },
  { name: "The Backbencher", slug: "the-backbencher", searchName: "The Backbencher" },
  { name: "Fur Jaden", slug: "fur-jaden", searchName: "Fur Jaden" },
  { name: "Levi's", slug: "levis", searchName: "Levis" },
  { name: "Offikraft", slug: "offikraft", searchName: "Offikraft" },
  { name: "Oblique", slug: "oblique", searchName: "Oblique" },
  { name: "Power Plus", slug: "power-plus", searchName: "Power Plus" },
  { name: "3S", slug: "3s", searchName: "3S" },
  { name: "Ooge", slug: "ooge", searchName: "Ooge" },
  { name: "Stolt", slug: "stolt", searchName: "Stolt" },
  { name: "Stellers", slug: "stellers", searchName: "Stellers" },
  { name: "Portronics", slug: "portronics", searchName: "Portronics" },
  { name: "Jack&Jones", slug: "jack-jones", searchName: "Jack&Jones" },
  { name: "Swiss Military", slug: "swiss-military", searchName: "Swiss Military" },
  { name: "Hummel", slug: "hummel", searchName: "Hummel" },
];

/** Identities/assets still needing confirmation; these stay out of the logo strip. */
export const PENDING_BRAND_LOGO_CANDIDATES: { name: string; source?: string }[] = [
  { name: "Nooe" },
  { name: "Columbia", source: "https://www.columbia.com/" },
  { name: "Napa Dori", source: "https://www.nappadori.com/" },
  { name: "Bloppung" },
  { name: "Borussel" },
  { name: "Smur" },
  { name: "Farrosa" },
];

function findCatalogueBrand(searchName: string) {
  return HOMEPAGE_PARTNER_BRAND_CANDIDATES.find(
    (brand) => brand.name.toLowerCase() === searchName.toLowerCase(),
  );
}

function toBrandItem(name: string, searchName: string, logo?: string): BrandLogoItem {
  const catalogueBrand = findCatalogueBrand(searchName);
  return {
    name,
    ...(logo || (catalogueBrand && resolveBrandLogoSrc(catalogueBrand.slug))
      ? { src: logo ?? resolveBrandLogoSrc(catalogueBrand!.slug) }
      : {}),
    href: `/gifts?q=${encodeURIComponent(searchName)}`,
  };
}

/** Keep the original set and add requested marks, deduplicating Jack&Jones. */
export function getHomepagePartnerBrands(): BrandLogoItem[] {
  const originals = ORIGINAL_BRAND_ITEMS.map(({ name, slug, searchName }) =>
    toBrandItem(name, searchName, resolveBrandLogoSrc(slug)),
  );
  const originalKeys = new Set(originals.map((brand) => brand.name.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const additions = REQUESTED_HOMEPAGE_BRANDS
    .filter(({ name, searchName = name }) => {
      const matchKey = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const searchKey = searchName.toLowerCase().replace(/[^a-z0-9]/g, "");
      return !originalKeys.has(matchKey) && !originalKeys.has(searchKey);
    })
    .map(({ name, searchName = name }) => toBrandItem(name, searchName, REQUESTED_BRAND_LOGOS[name]));

  return [...originals, ...additions];
}
