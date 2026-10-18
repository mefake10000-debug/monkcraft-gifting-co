import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exportData = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/export/products.json"), "utf8"));
const families = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/designFamilies.json"), "utf8"));
const colourFamilies = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/colourFamilies.json"), "utf8"));
const categoryOverrides = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalogue/categoryOverrides.json"), "utf8"));
const categoryOverrideById = new Map(categoryOverrides.map((entry) => [entry.productId, entry]));
const productsById = new Map(exportData.products.map((product) => [product.sku, product]));
const errors = [];
const familyIds = new Set();
const familyCodes = new Set();
const usedProductIds = new Set();
const colorProductIds = new Set(colourFamilies.flatMap((family) => family.productIds));
const variantSpecificSpecs = new Set([
  "sku", "product code", "color", "colour", "stock availability", "stock update date", "dispatch timeline", "country of origin",
]);

function normalize(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function coreSpecifications(product, family) {
  const familyVariantSpecs = new Set((family.variantSpecificSpecifications ?? []).map(normalize));
  const familyMissingSpecs = new Set((family.allowMissingSpecifications ?? []).map(normalize));
  return Object.entries(product.specifications ?? {})
    .filter(([label]) => !variantSpecificSpecs.has(normalize(label)) && !familyVariantSpecs.has(normalize(label)) && !familyMissingSpecs.has(normalize(label)))
    .map(([label, value]) => [normalize(label), normalize(value)])
    .sort(([left], [right]) => left.localeCompare(right));
}

for (const family of families) {
  if (!family.reviewed || !family.imageReviewed) errors.push(`${family.familyId}: family must be reviewed and image-reviewed`);
  if (!family.familyId || familyIds.has(family.familyId)) errors.push(`Duplicate or empty family id: ${family.familyId}`);
  if (!family.familyCode || familyCodes.has(family.familyCode)) errors.push(`Duplicate or empty family code: ${family.familyCode}`);
  familyIds.add(family.familyId);
  familyCodes.add(family.familyCode);
  if (!Array.isArray(family.productIds) || family.productIds.length < 2) errors.push(`${family.familyId}: needs at least two product IDs`);
  const labels = family.productIds.map((id) => normalize(family.labels?.[id]));
  if (labels.some((label) => !label) || new Set(labels).size !== labels.length) errors.push(`${family.familyId}: labels must be present and unique`);
  const members = family.productIds.map((id) => {
    const product = productsById.get(id);
    const category = categoryOverrideById.get(id);
    return product && category ? {
      ...product,
      category: { ...product.category, id: category.categoryId, slug: category.categorySlug, name: category.categoryName },
      subcategory: { ...product.subcategory, slug: category.subcategorySlug, name: category.subcategoryName },
    } : product;
  });
  for (let i = 0; i < family.productIds.length; i += 1) {
    const id = family.productIds[i];
    const product = members[i];
    if (usedProductIds.has(id)) errors.push(`${id}: appears in more than one design family`);
    usedProductIds.add(id);
    if (colorProductIds.has(id)) errors.push(`${id}: cannot be both a colour family and a design family`);
    if (!product) {
      errors.push(`${family.familyId}: missing catalogue product ID ${id}`);
      continue;
    }
    if (!Array.isArray(product.images) || product.images.length === 0) errors.push(`${id}: has no product image`);
    for (const image of product.images ?? []) {
      const relative = image.path?.replace(/^media\//, "");
      if (!relative || !fs.existsSync(path.join(root, "public/catalogue-media", relative))) errors.push(`${id}: image file is missing (${image.path ?? "empty path"})`);
    }
  }
  if (members.some((member) => !member)) continue;
  const first = members[0];
  for (const member of members.slice(1)) {
    if (member.category.slug !== first.category.slug || member.subcategory.slug !== first.subcategory.slug) errors.push(`${family.familyId}: ${member.sku} category differs from ${first.sku}`);
    if (normalize(member.brand?.name) !== normalize(first.brand?.name)) errors.push(`${family.familyId}: ${member.sku} brand differs from ${first.sku}`);
    if (member.pricing.amount !== first.pricing.amount || normalize(member.pricing.gstBasis) !== normalize(first.pricing.gstBasis) || member.pricing.currency !== first.pricing.currency) errors.push(`${family.familyId}: ${member.sku} price differs from ${first.sku}`);
    if (JSON.stringify(coreSpecifications(member, family)) !== JSON.stringify(coreSpecifications(first, family))) errors.push(`${family.familyId}: ${member.sku} core specifications differ from ${first.sku}`);
  }
  for (const optionalLabel of family.allowMissingSpecifications ?? []) {
    const label = normalize(optionalLabel);
    const values = new Set(members.flatMap((member) => Object.entries(member.specifications ?? [])
      .filter(([key]) => normalize(key) === label)
      .map(([, value]) => normalize(value))
      .filter(Boolean)));
    if (values.size > 1) errors.push(`${family.familyId}: conflicting ${optionalLabel} specifications across variants`);
  }
}

for (const override of categoryOverrides) {
  if (!productsById.has(override.productId)) errors.push(`Category override references missing product ID ${override.productId}`);
  if (!override.reason?.trim()) errors.push(`${override.productId}: category override needs an editorial reason`);
}

if (errors.length) {
  console.error(`Design-family validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const variantCount = families.reduce((total, family) => total + family.productIds.length, 0);
  console.log(`Validated ${families.length} reviewed design families (${variantCount} product variants).`);
}
