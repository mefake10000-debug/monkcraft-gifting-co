/* eslint-disable @typescript-eslint/no-require-imports -- Source and real-data regressions for the box catalogue. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const Module = require("node:module");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return resolve.call(this, id.startsWith("@/") ? path.join(root, "src", id.slice(2)) : id, ...args);
};
require.extensions[".ts"] = (mod, file) => mod._compile(ts.transpileModule(
  fs.readFileSync(file, "utf8"),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } },
).outputText, file);

test("Build a Box stays separate from the main catalogue and preserves exact product selection", () => {
  const boxBuilder = read("src/components/box/BoxBuilder.tsx");
  const boxPage = read("src/app/gifts/box/page.tsx");
  const card = read("src/components/catalogue/ProductCard.tsx");

  assert.match(boxBuilder, /catalogueItems/);
  assert.match(boxBuilder, /box-catalogue-picker/);
  assert.doesNotMatch(boxBuilder, /catalogue:\s*ReactNode|\{catalogue\}/);
  assert.doesNotMatch(boxPage, /CatalogueShell|queryCatalogue/);
  assert.match(boxPage, /<BoxBuilder\s*\/>/);
  assert.match(card, /boxSnapshot\s*=\s*productToBoxSnapshot\(activeCardProduct\)/);
  assert.match(card, /AddToBoxButton snapshot=\{boxSnapshot\}/);
});

test("Build a Box catalogue URL carries filters and page in its own history route", () => {
  const { buildCatalogueHref, emptyCatalogueQuery } = require("../src/data/catalogue/queryParams.ts");
  const { parseCatalogueQuery, queryCatalogue } = require("../src/data/catalogue/query.ts");
  const query = {
    ...emptyCatalogueQuery(),
    categories: ["drinkware-barware"],
    page: 2,
  };
  const href = buildCatalogueHref(query, "/gifts/box");
  assert.equal(href, "/gifts/box?category=drinkware-barware&page=2");
  const url = new URL(href, "https://monkcraft.local");
  const parsed = parseCatalogueQuery(Object.fromEntries(url.searchParams.entries()));
  const filteredPage = queryCatalogue(parsed);
  assert.equal(filteredPage.page, 2);
  assert.ok(filteredPage.products.length > 0);
  assert.ok(filteredPage.products.every((product) => product.filterCategorySlug === "drinkware-barware"));

  const catalogue = read("src/components/catalogue/CatalogueShell.tsx");
  assert.match(catalogue, /buildCatalogueHref\(next,\s*basePath/);
  assert.match(catalogue, /from=box/);
  assert.match(catalogue, /window\.addEventListener\('popstate',pop\)/);
  assert.match(catalogue, /pendingScroll\.current=true/);
  assert.match(catalogue, /getPaginationItems\(props\.page,props\.totalPages\)/);
});

test("Build a Box owns its product search and paging without embedding the catalogue page", () => {
  const boxBuilder = read("src/components/box/BoxBuilder.tsx");
  const boxPage = read("src/app/gifts/box/page.tsx");
  assert.match(boxBuilder, /fetch\(`\/api\/catalogue\/search\?/);
  assert.match(boxBuilder, /cataloguePage/);
  assert.match(boxBuilder, /box-catalogue-pagination/);
  assert.match(boxBuilder, /addToBox\(\{/);
  assert.match(boxBuilder, /function onStartOver\(\)[\s\S]*clearBoxDraft\(\)/);
  assert.doesNotMatch(boxBuilder, /router\.(push|replace)\([^)]*gifts/);
  assert.match(boxPage, /<BoxBuilder\s*\/>/);
  assert.doesNotMatch(boxPage, /CatalogueShell/);
});

test("the separate box picker uses the same catalogue product data and verified colour-family grouping", () => {
  const { queryCatalogue } = require("../src/data/catalogue/query.ts");
  const { emptyCatalogueQuery } = require("../src/data/catalogue/queryParams.ts");
  const result = queryCatalogue({
    ...emptyCatalogueQuery(),
    q: "Aquaminder Rio",
    categories: ["drinkware-barware"],
  });
  const family = result.products.find((product) => product.id === "MGC-0481");
  assert.ok(family, "the canonical AquaMinder Rio family is discoverable");
  assert.deepEqual(family.colourVariantOptions.map((product) => product.id), ["MGC-0481", "MGC-0482"]);
  assert.equal(family.colourVariantCount, 2);
});

test("box picker has a dedicated return path without changing main catalogue state", () => {
  const browsing = read("src/lib/catalogueBrowsing.ts");
  assert.match(browsing, /gifts/);
  const safeCatalogueHref = require("../src/lib/catalogueBrowsing.ts").safeCatalogueHref;
  assert.equal(safeCatalogueHref("/gifts/box?category=drinkware-barware&page=2&from=box"), "/gifts/box?category=drinkware-barware&page=2&from=box");
});

test("Build a Box keeps every step visible on phone screens without a clipped progress rail", () => {
  const styles = read("src/app/experience.css");
  const stepRules = styles.match(/\.box-steps\s*\{[^}]*\}/g) ?? [];
  const mobileRules = stepRules.at(-1) ?? "";
  assert.match(mobileRules, /display:\s*grid/);
  assert.match(mobileRules, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.doesNotMatch(mobileRules, /overflow-x:\s*auto/);
});

test("the catalogue keeps its original stylesheet and links to the separate builder route", () => {
  const layout = read("src/app/gifts/layout.tsx");
  const intro = read("src/components/catalogue/CatalogueIntro.tsx");
  const nav = require("../src/lib/nav.ts");
  assert.match(layout, /\.\/catalogue\.css/);
  assert.doesNotMatch(layout, /catalogue-v2\.css/);
  assert.equal(nav.BOX_CATALOGUE_HREF, "/gifts/box");
  assert.match(intro, /href=\{BOX_CATALOGUE_HREF\}/);
});
