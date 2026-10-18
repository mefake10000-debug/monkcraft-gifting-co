#!/usr/bin/env node
/** Validate explicitly reviewed color-family links against the source catalogue. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectory = process.env.MONKCRAFT_EXPORT_DATA
  ? path.resolve(process.env.MONKCRAFT_EXPORT_DATA)
  : path.join(root, "src/data/catalogue/export");
const products = JSON.parse(fs.readFileSync(path.join(sourceDirectory, "products.json"), "utf8")).products ?? [];
const families = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/colourFamilies.json"), "utf8"));
const colourOverrides = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/colourLabelOverrides.json"), "utf8"));
const colourOverrideById = new Map(colourOverrides.map((entry) => [entry.productId, entry]));
const errors = [];
const productIds = new Map();
const familyIds = new Set();
const familyCodes = new Set();
const membership = new Set();

for (const product of products) {
  const id = product.sku || product.id || product.slug;
  productIds.set(id, (productIds.get(id) ?? 0) + 1);
}
for (const [id, count] of productIds) if (count > 1) errors.push(`source product ID "${id}" occurs ${count} times`);

for (const [index, family] of families.entries()) {
  const label = `family ${index + 1}${family.familyId ? ` (${family.familyId})` : ""}`;
  if (!family.familyId?.trim()) errors.push(`${label}: missing family ID`);
  if (familyIds.has(family.familyId)) errors.push(`${label}: duplicate family ID`);
  if (family.familyId) familyIds.add(family.familyId);
  if (!/^MGC-FAM-\d{3}$/.test(family.familyCode ?? "")) errors.push(`${label}: family code must use the MGC-FAM-### format`);
  if (familyCodes.has(family.familyCode)) errors.push(`${label}: duplicate family code`);
  if (family.familyCode) familyCodes.add(family.familyCode);
  if (family.reviewed !== true) errors.push(`${label}: family must be explicitly reviewed`);
  if (family.imageReviewed !== true) errors.push(`${label}: product images must be reviewed before publishing`);
  if (!Array.isArray(family.productIds) || family.productIds.length < 2) {
    errors.push(`${label}: at least two product IDs are required`);
    continue;
  }
  if (new Set(family.productIds).size !== family.productIds.length) errors.push(`${label}: duplicate product membership`);
  const titleExceptionIds = new Set();
  for (const exception of family.titleExceptions ?? []) {
    if (!family.productIds.includes(exception.productId)) errors.push(`${label}: title exception product "${exception.productId}" is not a family member`);
    if (titleExceptionIds.has(exception.productId)) errors.push(`${label}: duplicate title exception for product "${exception.productId}"`);
    if (!exception.reason?.trim()) errors.push(`${label}: title exception for product "${exception.productId}" needs an editorial reason`);
    titleExceptionIds.add(exception.productId);
  }
  const members = family.productIds.map((id) => products.find((product) => (product.sku || product.id || product.slug) === id));
  for (const id of family.productIds) {
    if (!productIds.has(id)) errors.push(`${label}: product ID "${id}" does not exist`);
    if (membership.has(id)) errors.push(`${label}: product ID "${id}" already belongs to another family`);
    membership.add(id);
  }
  if (members.some((product) => !product)) continue;
  const first = members[0];
  const firstId = family.productIds[0];
  const firstColor = family.optionLabels?.[firstId]?.trim() || first.specifications?.Color?.trim() || colourOverrideById.get(firstId)?.label?.trim();
  if (!firstColor) errors.push(`${label}: product "${family.productIds[0]}" has no verified Color value`);
  const firstPrice = first.pricing?.amount;
  if (firstPrice == null || !Number.isFinite(firstPrice) || firstPrice <= 0) errors.push(`${label}: a verified positive unit price is required`);
  const colors = [];
  const ignoredSpecifications = new Set(["SKU", "Product Code", "Color", "Stock Availability", "Dispatch Timeline", "Stock Update Date"]);
  const allowedMissingSpecifications = new Set((family.allowMissingSpecifications ?? []).map((value) => value.trim().toLocaleLowerCase()));
  const factLabels = new Set(members.flatMap((product) => Object.keys(product.specifications ?? {}).filter((key) => !ignoredSpecifications.has(key))));
  for (const fact of factLabels) {
    const values = members.map((product) => (product.specifications?.[fact] ?? "").trim().toLocaleLowerCase());
    const nonEmptyValues = new Set(values.filter(Boolean));
    const differsOnlyByMissing = allowedMissingSpecifications.has(fact.trim().toLocaleLowerCase()) && nonEmptyValues.size <= 1;
    if (new Set(values).size > 1 && !differsOnlyByMissing) {
      errors.push(`${label}: verified specification "${fact}" differs across family members`);
    }
  }
  for (const [memberIndex, product] of members.entries()) {
    const id = family.productIds[memberIndex];
    const color = family.optionLabels?.[id]?.trim() || product.specifications?.Color?.trim() || colourOverrideById.get(id)?.label?.trim();
    if (!color) errors.push(`${label}: product "${id}" has no verified Color value`);
    else colors.push(color.toLocaleLowerCase());
    if (product.category?.id !== first.category?.id || product.category?.slug !== first.category?.slug || product.subcategory?.slug !== first.subcategory?.slug) {
      errors.push(`${label}: product "${id}" has a different category path`);
    }
    const normalizedTitle = (title, colorValue) => title
      .replace(new RegExp(colorValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), " ")
      .toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
    const titleColor = family.optionLabels?.[id] && product.title?.toLocaleLowerCase().includes(family.optionLabels[id].toLocaleLowerCase())
      ? family.optionLabels[id]
      : product.specifications?.Color?.trim() || colourOverrideById.get(id)?.label?.trim() || color;
    const firstTitleColor = family.optionLabels?.[firstId] && first.title?.toLocaleLowerCase().includes(family.optionLabels[firstId].toLocaleLowerCase())
      ? family.optionLabels[firstId]
      : first.specifications?.Color?.trim() || colourOverrideById.get(firstId)?.label?.trim() || firstColor;
    if (normalizedTitle(product.title ?? "", titleColor ?? "") !== normalizedTitle(first.title ?? "", firstTitleColor ?? "") && !titleExceptionIds.has(id)) errors.push(`${label}: product "${id}" differs in name keywords beyond its verified color`);
    if ((product.brand?.name ?? "").trim().toLocaleLowerCase() !== (first.brand?.name ?? "").trim().toLocaleLowerCase()) errors.push(`${label}: product "${id}" has a different brand`);
    if (product.pricing?.amount !== firstPrice || product.pricing?.currency !== first.pricing?.currency) errors.push(`${label}: verified price or currency differs for product "${id}"`);
  }
  if (new Set(colors).size !== colors.length) errors.push(`${label}: colors must be unique within the family`);
}

for (const override of colourOverrides) {
  const product = products.find((candidate) => (candidate.sku || candidate.id || candidate.slug) === override.productId);
  if (!product) errors.push(`Colour label override references missing product ID "${override.productId}"`);
  else if (product.specifications?.Color?.trim()) errors.push(`${override.productId}: colour label override duplicates a source Color specification`);
  else if (override.sourceField !== "title" || !override.label?.trim() || !override.reason?.trim()) errors.push(`${override.productId}: title-based colour override needs a label and review reason`);
  else if (!product.title?.toLocaleLowerCase().includes(override.label.toLocaleLowerCase())) errors.push(`${override.productId}: colour label is not present in the source title`);
  if (!membership.has(override.productId)) errors.push(`${override.productId}: colour label override is not used by a reviewed colour family`);
}

if (errors.length) {
  console.error(`Colour-family validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${families.length} reviewed colour families against ${products.length} products.`);
}
