#!/usr/bin/env node
/**
 * Local checklist: which homepage partner brands have a real logo file
 * under public/brands/, and which still need you to drop one in.
 *
 * Does NOT download, invent, or generate logos.
 *
 * Usage:
 *   node scripts/check-partner-brand-logos.mjs
 *
 * Exit 0 always (informational). Missing logos are expected until you supply them.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BRANDS_DIR = path.join(ROOT, "public", "brands");
const EXTS = ["svg", "png", "webp"];

/** Keep in sync with HOMEPAGE_PARTNER_BRAND_CANDIDATES in src/data/partnerBrands.ts */
const HOMEPAGE_CANDIDATES = [
  { slug: "greys-blues", name: "Greys & Blues" },
  { slug: "urban-gear", name: "Urban Gear" },
  { slug: "scott", name: "Scott" },
  { slug: "fuzo", name: "Fuzo" },
  { slug: "oblique", name: "Oblique" },
  { slug: "portronics", name: "Portronics" },
  { slug: "fur-jaden", name: "Fur jaden" },
  { slug: "power-plus", name: "Power Plus" },
  { slug: "bioq", name: "Bioq" },
  { slug: "the-backbencher", name: "The Backbencher" },
  { slug: "swiss-military", name: "Swiss Military" },
  { slug: "jack-jones", name: "Jack&Jones" },
  { slug: "shopnooe", name: "ShopNooe" },
  { slug: "offikraft", name: "Offikraft" },
  { slug: "stolt", name: "Stolt" },
  { slug: "hummel", name: "Hummel" },
  { slug: "stellers", name: "Stellers" },
  { slug: "ooge", name: "Ooge" },
  { slug: "levis", name: "Levis" },
  { slug: "3s", name: "3S" },
];

function resolveLogo(slug) {
  if (!fs.existsSync(BRANDS_DIR)) return null;
  for (const ext of EXTS) {
    for (const filename of [`${slug}-logo.${ext}`, `${slug}.${ext}`]) {
      const full = path.join(BRANDS_DIR, filename);
      if (fs.existsSync(full)) return filename;
    }
  }
  return null;
}

const present = [];
const missing = [];

for (const brand of HOMEPAGE_CANDIDATES) {
  const file = resolveLogo(brand.slug);
  if (file) present.push({ ...brand, file });
  else missing.push(brand);
}

console.log("Homepage partner brand logos");
console.log(`Folder: public/brands/`);
console.log(`Present: ${present.length} / ${HOMEPAGE_CANDIDATES.length}`);
console.log(`Missing: ${missing.length} / ${HOMEPAGE_CANDIDATES.length}`);
console.log("");

if (present.length) {
  console.log("Ready (image will show in the marquee):");
  for (const b of present) {
    console.log(`  ✓ ${b.name} → public/brands/${b.file}`);
  }
  console.log("");
}

if (missing.length) {
  console.log("Still need a verified logo file (name-only chip until then):");
  for (const b of missing) {
    console.log(`  · ${b.name} → drop as ${b.slug}-logo.svg (or .png / .webp)`);
  }
  console.log("");
  console.log("How: copy an official brand logo into public/brands/ using the");
  console.log("filename above, then refresh the homepage. See public/brands/README.md");
}

if (present.length === 0) {
  console.log("No partner logos in the repo yet — strip stays typography-only.");
}
