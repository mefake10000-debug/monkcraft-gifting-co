/* eslint-disable @typescript-eslint/no-require-imports -- Load the real catalogue query and filter definitions. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const Module = require("node:module");
const ts = require("typescript");

require("../scripts/register-ts-hook.cjs");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return originalResolve.call(this, id.startsWith("@/") ? path.join(process.cwd(), "src", id.slice(2)) : id, ...args);
};
require.extensions[".tsx"] = (mod, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  mod._compile(compiled.outputText, filename);
};

const { FILTER_GROUPS } = require("../src/components/catalogue/CatalogueFilters.tsx");
const { getAllProducts } = require("../src/data/catalogue/products.ts");
const { filterProducts, getContextualFacets } = require("../src/data/catalogue/query.ts");
const { buildCatalogueHref, countActiveFilters, emptyCatalogueQuery, parseCatalogueQuery } = require("../src/data/catalogue/queryParams.ts");

test("catalogue filters omit Customisation while source branding details remain available", () => {
  assert.ok(FILTER_GROUPS.every((group) => group.key !== "brandings"));
  assert.ok(FILTER_GROUPS.every((group) => !/customisation|customization/i.test(group.label)));

  const products = getAllProducts();
  const brandedProduct = products.find((product) => product.customization || product.brandingOptions.length > 0);
  assert.ok(brandedProduct, "source-backed branding information remains in product data");
  const detailSource = fs.readFileSync(path.join(process.cwd(), "src/components/catalogue/ProductVariantExperience.tsx"), "utf8");
  assert.match(detailSource, /product\.customization/);
  assert.match(detailSource, /Branding options/);
});

test("legacy Customisation query parameters no longer filter or count as active", () => {
  const parsed = parseCatalogueQuery({ branding: "screen-printing" });
  assert.deepEqual(parsed.brandings, []);
  assert.equal(countActiveFilters(parsed), 0);

  const oldSavedQuery = { ...emptyCatalogueQuery(), brandings: ["screen-printing"] };
  assert.equal(filterProducts(getAllProducts(), oldSavedQuery).length, getAllProducts().length);
  assert.doesNotMatch(buildCatalogueHref(oldSavedQuery), /branding=/);
  assert.equal(Object.hasOwn(getContextualFacets(emptyCatalogueQuery()), "brandings"), false);
});

test("the Artiart Dark Grey mug remains reachable as a verified colour option", () => {
  const products = getAllProducts();
  const families = require("../src/data/catalogue/colourFamilies.json");
  const family = families.find((item) => item.familyId === "mgc-colour-186");
  assert.deepEqual(family.productIds, ["MGC-0609", "MGC-0610", "MGC-0611"]);
  assert.equal(family.optionLabels["MGC-0610"], "Dark Grey");
  assert.match(family.titleExceptions.find((item) => item.productId === "MGC-0610").reason, /source title|Color field/i);
  assert.ok(products.some((product) => product.id === "MGC-0610" && product.colourOptionLabel === "Dark Grey"));
});

test("source-described kit contents are stated without inventing Binge Kit contents", () => {
  const contents = require("../src/data/catalogue/editorial/bundle-contents.json");
  const byId = new Map(contents.filter((entry) => entry.reviewed === true).map((entry) => [entry.productId, entry.contents]));
  assert.deepEqual(byId.get("MGC-3510"), ["Laptop sleeve", "Ceramic mug", "Mobile stand", "Wireless charger"]);
  assert.deepEqual(byId.get("MGC-3501"), ["Notebook", "Mouse mat", "Bottle", "Wireless charger"]);
  assert.deepEqual(byId.get("MGC-3520"), ["Goal book", "Mug", "Pen"]);
  assert.equal(byId.has("MGC-3516"), false, "Binge Kit contents remain unconfirmed until an owner verifies them");
  const component = fs.readFileSync(path.join(process.cwd(), "src/components/catalogue/ProductVariantExperience.tsx"), "utf8");
  assert.match(component, /getReviewedBundleContents/);
});
