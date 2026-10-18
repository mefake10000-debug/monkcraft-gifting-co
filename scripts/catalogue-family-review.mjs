#!/usr/bin/env node
/** Create a review-only queue for likely product-family gaps. Nothing is auto-grouped. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const products = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/export/products.json"), "utf8")).products ?? [];
const overrides = new Map(JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/categoryOverrides.json"), "utf8")).map((entry) => [entry.productId, entry]));
const designFamilies = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/designFamilies.json"), "utf8"));
const colourFamilies = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/colourFamilies.json"), "utf8"));
const membership = new Map();
for (const family of designFamilies) for (const id of family.productIds) membership.set(id, `design:${family.familyId}`);
for (const family of colourFamilies) for (const id of family.productIds) membership.set(id, `colour:${family.familyId}`);

const volatileSpecifications = new Set([
  "sku", "product code", "color", "colour", "stock availability", "stock update date",
  "dispatch timeline", "country of origin",
]);
const stopWords = new Set([
  "a", "an", "and", "by", "for", "in", "of", "the", "to", "with", "your", "our",
  "monkcraft", "custom", "customized", "customised", "design", "designs", "edition",
]);
const norm = (value) => String(value ?? "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
const tokens = (value) => new Set(norm(value).replace(/[^a-z0-9]+/g, " ").split(" ").filter((word) => word.length > 2 && !stopWords.has(word)));
const brandArg = process.argv.findIndex((argument) => argument === "--brand");
const requestedBrand = brandArg >= 0 ? norm(process.argv[brandArg + 1]) : "";

function canonicalProduct(product) {
  const override = overrides.get(product.sku);
  return {
    ...product,
    category: override ? { ...product.category, id: override.categoryId, slug: override.categorySlug } : product.category,
    subcategory: override ? { ...product.subcategory, slug: override.subcategorySlug } : product.subcategory,
  };
}

function coreFacts(product) {
  return Object.entries(product.specifications ?? {})
    .filter(([label, value]) => !volatileSpecifications.has(norm(label)) && norm(value))
    .map(([label, value]) => [norm(label), norm(value)])
    .sort(([a], [b]) => a.localeCompare(b));
}

function signature(product) {
  return JSON.stringify([
    norm(typeof product.brand === "string" ? product.brand : product.brand?.name),
    norm(product.category?.slug),
    norm(product.subcategory?.slug),
    norm(product.pricing?.currency),
    product.pricing?.amount ?? null,
    norm(product.pricing?.gstBasis),
    coreFacts(product),
  ]);
}

function titleOverlap(group) {
  const sets = group.map((product) => tokens(product.title));
  const shared = [...sets[0]].filter((term) => sets.every((set) => set.has(term)));
  return shared.sort();
}

const candidatesBySignature = new Map();
for (const raw of products) {
  const product = canonicalProduct(raw);
  const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name;
  if (requestedBrand && norm(brandName) !== requestedBrand) continue;
  if (!product.sku || !product.images?.some((image) => image.path)) continue;
  const key = signature(product);
  const bucket = candidatesBySignature.get(key) ?? [];
  bucket.push(product);
  candidatesBySignature.set(key, bucket);
}

const candidateGroups = [];
for (const records of candidatesBySignature.values()) {
  if (records.length < 2) continue;
  const sharedTitleTerms = titleOverlap(records);
  if (sharedTitleTerms.length === 0) continue;
  const familyIds = [...new Set(records.map((product) => membership.get(product.sku)).filter(Boolean))];
  const hasUnmapped = records.some((product) => !membership.has(product.sku));
  if (!hasUnmapped) continue;
  const imageStatus = records.map((product) => ({
    productId: product.sku,
    paths: (product.images ?? []).map((image) => image.path),
    allFilesPresent: (product.images ?? []).length > 0 && product.images.every((image) => {
      const relative = image.path?.replace(/^media\//, "");
      return Boolean(relative && fs.existsSync(path.join(root, "public/catalogue-media", relative)));
    }),
  }));
  candidateGroups.push({
    reviewOnly: true,
    status: familyIds.length === 1 ? "possible-family-gap" : "possible-family",
    currentFamilyIds: familyIds,
    sharedTitleTerms,
    exactPriceMatch: true,
    exactCoreSpecificationMatch: true,
    imageFilesPresent: imageStatus.every((entry) => entry.allFilesPresent),
    imageReviewRequired: true,
    products: records.map((product) => ({
      productId: product.sku,
      title: product.title,
      brand: typeof product.brand === "string" ? product.brand : product.brand?.name,
      category: product.category?.slug,
      subcategory: product.subcategory?.slug,
      price: product.pricing?.amount ?? null,
      color: product.specifications?.Color ?? null,
      imagePaths: (product.images ?? []).map((image) => image.path),
      existingFamilyId: membership.get(product.sku) ?? null,
    })),
    reviewInstruction: "Compare product photos and source records. Approve only when each item is the same base model with a different verified color, artwork, or documented option.",
  });
}

candidateGroups.sort((a, b) =>
  (a.products[0].brand ?? "").localeCompare(b.products[0].brand ?? "") ||
  (a.products[0].category ?? "").localeCompare(b.products[0].category ?? "") ||
  a.products[0].title.localeCompare(b.products[0].title),
);
process.stdout.write(`${JSON.stringify({
  generatedAt: new Date().toISOString(),
  brandFilter: requestedBrand || null,
  sourceProductCount: products.length,
  reviewedDesignFamilies: designFamilies.filter((family) => family.reviewed && family.imageReviewed).length,
  reviewedColourFamilies: colourFamilies.filter((family) => family.reviewed && family.imageReviewed).length,
  candidateCount: candidateGroups.length,
  candidateGroups,
}, null, 2)}\n`);
