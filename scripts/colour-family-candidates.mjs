#!/usr/bin/env node
/** Discover review-only colour candidates; this report never approves a family. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = process.env.MONKCRAFT_EXPORT_DATA
  ? path.resolve(process.env.MONKCRAFT_EXPORT_DATA)
  : path.join(root, "src/data/catalogue/export");
const products = JSON.parse(fs.readFileSync(path.join(sourceDirectory, "products.json"), "utf8")).products ?? [];
const ignoredSpecifications = new Set(["sku", "product code", "color", "stock availability", "dispatch timeline", "stock update date"]);
const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const titleWithoutColor = (title, color) => normalize(title.replace(new RegExp(escapeRegExp(color), "ig"), " ").replace(/[^a-z0-9]+/g, " "));
const groups = new Map();

for (const product of products) {
  const color = product.specifications?.Color?.trim();
  if (!color) continue;
  const brand = typeof product.brand === "string" ? product.brand : product.brand?.name;
  const titleKey = titleWithoutColor(product.title, color);
  const sharedSpecifications = Object.entries(product.specifications ?? {})
    .filter(([label, value]) => !ignoredSpecifications.has(normalize(label)) && normalize(value))
    .map(([label, value]) => [normalize(label), normalize(value)])
    .sort(([a], [b]) => a.localeCompare(b));
  const key = JSON.stringify([
    titleKey,
    normalize(brand),
    normalize(product.category?.id),
    normalize(product.category?.slug),
    normalize(product.subcategory?.slug),
    sharedSpecifications,
  ]);
  const group = groups.get(key) ?? [];
  group.push({ product, brand, color, titleKey });
  groups.set(key, group);
}

const candidates = [];
for (const records of groups.values()) {
  if (new Set(records.map(({ color }) => normalize(color))).size < 2) continue;
  const reference = records[0].product;
  const prices = records.map(({ product }) => product.pricing?.amount ?? null);
  const currencies = records.map(({ product }) => product.pricing?.currency ?? null);
  const priceMatch = prices.every((price) => price != null && price > 0 && price === prices[0]) && currencies.every((currency) => currency === currencies[0]);
  const commonTitle = records[0].titleKey;
  candidates.push({
    reviewOnly: true,
    categoryPath: `${reference.category?.id ?? ""}/${reference.category?.slug ?? ""}/${reference.subcategory?.slug ?? ""}`,
    titleKeywordsMatch: records.every(({ titleKey }) => titleKey === commonTitle),
    matchedTitleKeywords: commonTitle.split(" ").filter(Boolean),
    nonColorSpecificationsMatch: true,
    priceMatch,
    priceValues: [...new Set(prices.map((price) => price == null ? "unverified" : String(price)))],
    currencyValues: [...new Set(currencies.map((currency) => currency ?? "unverified"))],
    imageReviewRequired: true,
    title: reference.title,
    brand: records[0].brand ?? null,
    candidateProductIds: records.map(({ product }) => product.sku || product.id || product.slug),
    colorLabels: records.map(({ color }) => color),
    records: records.map(({ product, color }) => ({
      productId: product.sku || product.id || product.slug,
      slug: product.slug,
      sourceTitle: product.title,
      color,
      unitPrice: product.pricing?.amount ?? null,
      sourceDescription: product.shortDescription || product.description || "",
      specifications: product.specifications ?? {},
      imagePaths: (product.images ?? []).map((image) => image.path),
    })),
    reviewStatus: "NOT REVIEWED — verify image identity and all source fields before adding a family record",
  });
}

candidates.sort((a, b) => a.title.localeCompare(b.title) || a.categoryPath.localeCompare(b.categoryPath));
process.stdout.write(`${JSON.stringify({ generatedAt: new Date().toISOString(), candidateCount: candidates.length, priceMismatchCount: candidates.filter((candidate) => !candidate.priceMatch).length, candidates }, null, 2)}\n`);
