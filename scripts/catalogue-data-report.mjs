#!/usr/bin/env node
/**
 * Non-destructive quality snapshot of the live website-export catalogue.
 * Read-only — never mutates product data.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function exportDir() {
  if (process.env.MONKCRAFT_EXPORT_DATA) {
    return path.resolve(process.env.MONKCRAFT_EXPORT_DATA);
  }
  const local = path.join(ROOT, "src/data/catalogue/export");
  if (fs.existsSync(path.join(local, "products.json"))) return local;
  return path.resolve(ROOT, "../monkcraft/website-export/data");
}

const dir = exportDir();
const productsPath = path.join(dir, "products.json");
if (!fs.existsSync(productsPath)) {
  console.error("products.json not found at", productsPath);
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(productsPath, "utf8"));
const products = data.products ?? [];
const qualityPath = path.join(dir, "quality-report.json");
const segmentsPath = path.join(dir, "gifting-segments.json");

let withImages = 0;
let withMoq = 0;
let fixedPrice = 0;
const skus = new Set();
const dupSku = [];
for (const p of products) {
  if (p.sku) {
    if (skus.has(p.sku)) dupSku.push(p.sku);
    else skus.add(p.sku);
  }
  if ((p.images ?? []).length) withImages += 1;
  const moq = p.availability?.minimumOrderQuantity ?? p.availability?.moq;
  if (moq != null && Number(moq) > 0) withMoq += 1;
  const amt = p.pricing?.amount;
  if (amt != null && Number(amt) > 0) fixedPrice += 1;
}

let sourceMatched = 0;
if (fs.existsSync(segmentsPath)) {
  const segs = JSON.parse(fs.readFileSync(segmentsPath, "utf8"));
  for (const s of segs.segments ?? []) {
    sourceMatched += (s.sourceMatchedProductSlugs ?? []).length;
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  exportDir: dir,
  schemaVersion: data.schemaVersion ?? null,
  productCount: products.length,
  uniqueSkus: skus.size,
  duplicateSkuCount: dupSku.length,
  withImages,
  withoutImages: products.length - withImages,
  withMoq,
  withVerifiedFixedPrice: fixedPrice,
  sourceMatchMembershipRows: sourceMatched,
  qualityReportPresent: fs.existsSync(qualityPath),
  note: "Genuine website-export inventory. Occasions use source_match only in the app.",
};

console.log(JSON.stringify(report, null, 2));
