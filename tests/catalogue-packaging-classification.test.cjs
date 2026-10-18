/* eslint-disable @typescript-eslint/no-require-imports -- Load real product catalogue through its TypeScript mapper. */
const assert = require("node:assert/strict");
const test = require("node:test");
require("../scripts/register-ts-hook.cjs");

const products = require("../src/data/catalogue/products.ts").getAllProducts();
const byId = new Map(products.map((product) => [product.id, product]));

test("gift sets mentioning included gift-box packaging are not filed as packaging", () => {
  for (const id of ["MGC-3251", "MGC-3250", "MGC-3547", "MGC-3553", "MGC-3546"]) {
    const product = byId.get(id);
    assert.ok(product, `${id} remains in the catalogue`);
    assert.equal(product.filterCategorySlug, "hampers-gifting", `${id} stays with the gift set`);
  }
});

test("a figurine gift box keeps its product category rather than becoming packaging", () => {
  const product = byId.get("MGC-3062");
  assert.ok(product);
  assert.equal(product.filterCategorySlug, "eco-friendly");
});

test("actual packaging products remain in the packaging category", () => {
  for (const id of ["MGC-3296", "MGC-3297", "MGC-3299", "MGC-3461", "MGC-3631"]) {
    assert.equal(byId.get(id)?.filterCategorySlug, "packaging", `${id} remains packaging`);
  }
});
