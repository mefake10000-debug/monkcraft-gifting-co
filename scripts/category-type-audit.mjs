#!/usr/bin/env node
/**
 * Read-only audit of export categories vs classifier filterCategorySlug.
 * Does not mutate the website-export.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
const jiti = require("jiti")(path.join(ROOT, "scripts/category-type-audit.mjs"), {
  interopDefault: true,
  alias: {
    "@": path.join(ROOT, "src"),
  },
});

const { getAllProducts } = jiti(path.join(ROOT, "src/data/catalogue/products.ts"));
const { queryCatalogue, parseCatalogueQuery } = jiti(
  path.join(ROOT, "src/data/catalogue/query.ts"),
);
const { getCategoryFacets } = jiti(path.join(ROOT, "src/data/catalogue/facets.ts"));
const { recommendGifts } = jiti(
  path.join(ROOT, "src/lib/giftFinder/recommend.ts"),
);

const products = getAllProducts();
const byExport = new Map();
const byFilter = new Map();
const remapped = [];
for (const p of products) {
  byExport.set(p.categorySlug, (byExport.get(p.categorySlug) || 0) + 1);
  byFilter.set(
    p.filterCategorySlug,
    (byFilter.get(p.filterCategorySlug) || 0) + 1,
  );
  if (p.filterCategorySlug !== p.categorySlug) remapped.push(p);
}

console.log("total", products.length);
console.log("\n=== BEFORE (export categorySlug) ===");
[...byExport.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(String(v).padStart(5), k));

console.log("\n=== AFTER (filterCategorySlug) ===");
[...byFilter.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(String(v).padStart(5), k));

console.log("\nremapped", remapped.length);
const remapPairs = new Map();
for (const p of remapped) {
  const k = `${p.categorySlug}→${p.filterCategorySlug}`;
  remapPairs.set(k, (remapPairs.get(k) || 0) + 1);
}
[...remapPairs.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(String(v).padStart(4), k));

const drinkware = products.filter(
  (p) => p.filterCategorySlug === "drinkware-barware",
);
const polluteRe =
  /\b(candle|diya|plant|vacuum|air\s?fryer|speaker|trimmer|shaver|steamer|microwave|cookware|rattle|fridge\s?magnet|string\s?light|lunch\s?bag|lunch\s?box)\b/i;
const polluted = drinkware.filter((p) => polluteRe.test(p.name));
console.log("\ndrinkware filter", drinkware.length);
console.log("pollution keywords in drinkware filter", polluted.length);
polluted.forEach((p) =>
  console.log(" ", p.sku, p.name, p.productTypeRuleId),
);

const candles = products.filter((p) => /candle/i.test(p.name));
console.log(
  "\ncandles:",
  candles.map((p) => ({
    sku: p.sku,
    export: p.categorySlug,
    filter: p.filterCategorySlug,
    rule: p.productTypeRuleId,
  })),
);

for (const cat of [
  "drinkware-barware",
  "tech-gadgets",
  "apparel-lifestyle",
  "bags-travel",
]) {
  const page = queryCatalogue(parseCatalogueQuery({ category: cat }));
  console.log(`\nquery ${cat} total=${page.total}`);
  page.products.slice(0, 8).forEach((p) => console.log(" ", p.name));
}

const rec = recommendGifts({
  requirements: {
    schemaVersion: 1,
    occasionIds: [],
    audience: "",
    recipientCount: "",
    budgetPerRecipientInr: null,
    budgetTotalInr: null,
    budgetPerRecipientLabel: "",
    categorySlugs: ["drinkware-barware"],
    preferenceKeywords: [],
    brandingPreference: "",
    brandingNotes: "",
    packagingNotes: "",
    deliveryDate: "",
    deliveryLocation: "",
    specialInstructions: "",
    freeText: "",
    updatedAt: "",
  },
  limit: 24,
});
console.log(
  "\nGift Finder drinkware matches",
  rec.meta.matchCount,
  "candles",
  rec.matches.filter((m) => /candle/i.test(m.product.name)).length,
);

console.log("\nfacets:");
getCategoryFacets().forEach((f) =>
  console.log(String(f.count).padStart(5), f.id, f.label),
);

const other = products.filter((p) => p.filterCategorySlug === "other");
console.log("\nother count", other.length);
other.slice(0, 40).forEach((p) =>
  console.log(
    `  [${p.sku}] ${p.name} | export=${p.categorySlug}/${p.subcategorySlug} | ${p.productTypeRuleId}`,
  ),
);

const rules = new Map();
for (const p of products) {
  rules.set(p.productTypeRuleId, (rules.get(p.productTypeRuleId) || 0) + 1);
}
console.log("\ntop rules:");
[...rules.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 25)
  .forEach(([k, v]) => console.log(String(v).padStart(5), k));
