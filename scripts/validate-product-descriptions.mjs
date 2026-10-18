#!/usr/bin/env node
/** Validate the reviewed customer-facing product-description overlay. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = process.env.MONKCRAFT_EXPORT_DATA
  ? path.resolve(process.env.MONKCRAFT_EXPORT_DATA)
  : path.join(root, "src/data/catalogue/export");
const productsPath = path.join(sourceDirectory, "products.json");
const overlayPath = path.join(root, "src/data/catalogue/editorial/product-descriptions.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf8")).products ?? [];
const overrides = JSON.parse(fs.readFileSync(overlayPath, "utf8"));
const productsById = new Map(products.map((product) => [product.sku || product.id || product.slug, product]));
const errors = [];
const seen = new Set();
const highRiskClaims = /\b(?:waterproof|water[- ]resistant|weatherproof|durable|long[- ]lasting|sustainable|eco[- ]friendly|recycled|organic|non[- ]toxic|food[- ]safe|luxury|premium|guaranteed|free shipping|pan[- ]india|best[- ]in[- ]class)\b/i;
const recommendationLanguage = /\b(?:ideal|perfect|suited|great|excellent)\s+for\b|\b(?:corporate|client|employee|diwali|annual[- ]day|festive|onboarding)\s+(?:gifting|gift|gifts|rewards?)\b|\b(?:gift|gifting)\s+for\b/i;

function evidenceFor(product) {
  return [product.title, product.shortDescription, product.description, product.category?.name, product.subcategory?.name,
    ...Object.values(product.specifications ?? {}).filter((value) => value != null).map(String)].filter(Boolean).join(" ");
}

for (const [index, entry] of overrides.entries()) {
  const row = `entry ${index + 1}${entry.productId ? ` (${entry.productId})` : ""}`;
  if (!entry.productId?.trim()) errors.push(`${row}: missing product ID`);
  if (entry.productId && seen.has(entry.productId)) errors.push(`${row}: duplicate product ID`);
  if (entry.productId) seen.add(entry.productId);
  if (!entry.description?.trim()) errors.push(`${row}: empty description`);
  if (entry.reviewed !== true) errors.push(`${row}: must be marked reviewed`);

  const product = productsById.get(entry.productId);
  if (!product) {
    errors.push(`${row}: product ID does not exist in the source catalogue`);
    continue;
  }
  if (entry.categoryLabel !== product.subcategory?.name) {
    errors.push(`${row}: category label must match the verified subcategory`);
  }
  const categoryPath = `${product.category?.code ?? product.category?.id}/${product.subcategory?.slug}`;
  if (entry.categoryPath !== categoryPath) {
    errors.push(`${row}: category path must match the verified category code and subcategory slug (${categoryPath})`);
  }
  if (!Array.isArray(entry.factRefs) || entry.factRefs.length === 0) {
    errors.push(`${row}: add at least one source fact reference`);
  } else {
    for (const ref of entry.factRefs) {
      let value;
      if (ref === "title") value = product.title;
      else if (ref === "description") value = `${product.shortDescription ?? ""} ${product.description ?? ""}`;
      else if (ref.startsWith("specifications.")) value = product.specifications?.[ref.slice("specifications.".length)];
      if (value == null || !String(value).trim()) errors.push(`${row}: source fact reference "${ref}" is missing`);
    }
  }

  if (!entry.description?.trim()) continue;
  if (highRiskClaims.test(entry.description)) errors.push(`${row}: contains a claim requiring additional source evidence`);
  if (recommendationLanguage.test(entry.description)) errors.push(`${row}: contains gifting or occasion recommendation language`);
  const sourceNumbers = new Set(evidenceFor(product).match(/\d+(?:\.\d+)?/g) ?? []);
  for (const number of entry.description.match(/\d+(?:\.\d+)?/g) ?? []) {
    if (!sourceNumbers.has(number)) errors.push(`${row}: number "${number}" is not present in source product facts`);
  }
}

if (errors.length) {
  console.error(`Product description validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${overrides.length} reviewed product descriptions against ${products.length} source products.`);
}
