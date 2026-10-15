import fs from "node:fs";
import path from "node:path";
import type { BrandLogoItem } from "@/components/BrandLogoMarquee";

/**
 * Homepage partner / catalogue-brand strip candidates.
 *
 * Source: `src/data/catalogue/export/brands.json` ranked by productCount.
 * House brand `monkcraft` is excluded (platform, not a partner mark).
 * Unnamed / null brand rows are excluded.
 *
 * `logoSrc` is resolved at runtime from verified files in `public/brands/` only —
 * never invent or AI-generate logos. Until files land, the marquee shows
 * typography-only real brand names.
 */

export type PartnerBrandCandidate = {
  slug: string;
  name: string;
  productCount: number;
  /** Empty until a verified file exists under public/brands/ */
  logoSrc?: string;
};

/** Top catalogue brands by volume (third-party), for the homepage strip. */
export const HOMEPAGE_PARTNER_BRAND_CANDIDATES: PartnerBrandCandidate[] = [
  { slug: "greys-blues", name: "Greys & Blues", productCount: 284 },
  { slug: "urban-gear", name: "Urban Gear", productCount: 200 },
  { slug: "scott", name: "Scott", productCount: 189 },
  { slug: "fuzo", name: "Fuzo", productCount: 127 },
  { slug: "oblique", name: "Oblique", productCount: 89 },
  { slug: "portronics", name: "Portronics", productCount: 78 },
  { slug: "fur-jaden", name: "Fur jaden", productCount: 68 },
  { slug: "power-plus", name: "Power Plus", productCount: 64 },
  { slug: "bioq", name: "Bioq", productCount: 58 },
  { slug: "the-backbencher", name: "The Backbencher", productCount: 55 },
  { slug: "swiss-military", name: "Swiss Military", productCount: 52 },
  { slug: "jack-jones", name: "Jack&Jones", productCount: 51 },
  { slug: "shopnooe", name: "ShopNooe", productCount: 51 },
  { slug: "offikraft", name: "Offikraft", productCount: 50 },
  { slug: "stolt", name: "Stolt", productCount: 46 },
  { slug: "hummel", name: "Hummel", productCount: 44 },
  { slug: "stellers", name: "Stellers", productCount: 38 },
  { slug: "ooge", name: "Ooge", productCount: 37 },
  { slug: "levis", name: "Levis", productCount: 34 },
  { slug: "3s", name: "3S", productCount: 33 },
];

const LOGO_EXTENSIONS = ["svg", "png", "webp"] as const;

/**
 * Look for a verified logo file under public/brands/.
 * Accepted names: `{slug}-logo.{ext}` or `{slug}.{ext}`.
 */
export function resolveBrandLogoSrc(slug: string): string | undefined {
  const dir = path.join(process.cwd(), "public", "brands");
  if (!fs.existsSync(dir)) return undefined;

  const filenames = LOGO_EXTENSIONS.flatMap((ext) => [
    `${slug}-logo.${ext}`,
    `${slug}.${ext}`,
  ]);

  for (const filename of filenames) {
    if (fs.existsSync(path.join(dir, filename))) {
      return `/brands/${filename}`;
    }
  }
  return undefined;
}

/** Wire homepage marquee: real logo when file exists, else name-only. */
export function getHomepagePartnerBrands(): BrandLogoItem[] {
  return HOMEPAGE_PARTNER_BRAND_CANDIDATES.map((brand) => {
    const src = brand.logoSrc ?? resolveBrandLogoSrc(brand.slug);
    return src
      ? { name: brand.name, src }
      : { name: brand.name };
  });
}
