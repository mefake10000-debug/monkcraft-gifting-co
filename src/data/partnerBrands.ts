import type { BrandLogoItem } from "@/components/BrandLogoMarquee";
import catalogueBrands from "@/data/catalogue/export/brands.json";
import hustlemadBrandLogos from "@/data/hustlemadBrandLogos.json";

type CatalogueBrand = {
  slug: string;
  name: string;
  productCount: number;
};

const catalogueBrandList = catalogueBrands.brands.filter(
  (brand): brand is CatalogueBrand =>
    Boolean(brand.slug && brand.name && brand.slug !== "monkcraft" && brand.productCount > 0),
);

/** Brands omitted from the homepage logo row at the user's request. */
const excludedHomepageBrandSlugs = new Set([
  "3s",
  "fuzo",
  "oblique",
  "power-plus",
  "bioq",
  "offikraft",
  "stolt",
  "stellers",
  "ooge",
]);

/** Logo files already extracted and checked into public/brands. */
const verifiedLogoFiles: Record<string, string> = {
  "3s": "/brands/3s-logo.png",
  adidas: "/brands/adidas-logo.svg",
  "allen-solly": "/brands/allen-solly-logo.png",
  "american-tourister": "/brands/american-tourister-logo.webp",
  "bombay-shaving-company": "/brands/bombay-shaving-company-logo.png",
  bioq: "/brands/bioq-logo.svg",
  "cookie-man": "/brands/cookie-man-logo.png",
  eume: "/brands/eume-logo.png",
  "fur-jaden": "/brands/fur-jaden-logo-black.png",
  fuzo: "/brands/fuzo-logo.webp",
  hummel: "/brands/hummel-logo.svg",
  "indian-terrain": "/brands/indian-terrain-logo.png",
  "jack-jones": "/brands/jack-jones-logo.png",
  jbl: "/brands/jbl-logo.svg",
  jockey: "/brands/jockey-logo.png",
  kent: "/brands/kent-logo.svg",
  levis: "/brands/levis-logo.png",
  marshall: "/brands/marshall-logo.png",
  mokobara: "/brands/mokobara-logo.svg",
  mypaperclip: "/brands/my-paperclip-logo.png",
  oblique: "/brands/oblique-logo.png",
  offikraft: "/brands/offikraft-logo.png",
  ooge: "/brands/ooge-logo.jpg",
  philips: "/brands/philips-logo.svg",
  portronics: "/brands/portronics-logo-blacktext.png",
  "power-plus": "/brands/power-plus-logo.png",
  reebok: "/brands/reebok-logo.svg",
  scott: "/brands/scott-logo.png",
  shopnooe: "/brands/shopnooe-logo.png",
  sony: "/brands/sony-logo.svg",
  stellers: "/brands/stellers-logo.png",
  stolt: "/brands/stolt-logo.png",
  "swiss-military": "/brands/swiss-military-logo.png",
  "the-backbencher": "/brands/the-backbencher-logo.png",
  "the-whole-truth": "/brands/whole-truth-logo.svg",
  "tommy-hilfiger": "/brands/tommy-hilfiger-logo.png",
  "urban-gear": "/brands/urban-gear-logo.png",
};

const normalizeBrand = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const extractedLogoByName = new Map(
  hustlemadBrandLogos.map((brand) => [normalizeBrand(brand.name), brand]),
);

function getMarqueeLogoSrc(src: string): string {
  if (src === "/brand/Monkcraft-Black-Horizontal.png") {
    return "/brands/normalized/monkcraft.png";
  }
  // Keep vector marks as SVG so they stay crisp at every display size.
  if (/\.svg$/i.test(src)) {
    return src;
  }
  return src
    .replace(/^\/brands\//, "/brands/normalized/")
    .replace(/\.(jpe?g|webp)$/i, ".png");
}

/** Resolve a logo only when the corresponding brand is present in the catalogue. */
export function resolveBrandLogoSrc(slug: string): string | undefined {
  return verifiedLogoFiles[slug];
}

/** Only show actual catalogue brands with a locally available extracted logo. */
export function getHomepagePartnerBrands(): BrandLogoItem[] {
  const catalogueBrandsWithLogos = catalogueBrandList
    .filter((brand) => !excludedHomepageBrandSlugs.has(brand.slug))
    .map((brand) => {
      const extractedLogo = extractedLogoByName.get(normalizeBrand(brand.name));
      const originalSrc = extractedLogo?.src ?? resolveBrandLogoSrc(brand.slug);
      if (!originalSrc) return null;

      return {
        name: brand.name,
        src: getMarqueeLogoSrc(originalSrc),
        ...(brand.slug === "bombay-shaving-company" || brand.slug === "kent" ? { darkOnLight: true } : {}),
        ...(extractedLogo ? { source: "hustlemad" as const } : {}),
        href: `/gifts?brand=${encodeURIComponent(brand.slug)}`,
        productCount: brand.productCount,
      };
    })
    .filter((brand): brand is NonNullable<typeof brand> => brand !== null)
    .sort((a, b) => b.productCount - a.productCount || a.name.localeCompare(b.name));

  const monkcraftLogo: BrandLogoItem = {
    name: "Monkcraft",
    src: getMarqueeLogoSrc("/brand/Monkcraft-Black-Horizontal.png"),
    href: "/gifts?brand=monkcraft",
  };
  return [monkcraftLogo, ...catalogueBrandsWithLogos];
}
