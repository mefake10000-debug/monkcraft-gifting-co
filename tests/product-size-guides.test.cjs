/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner with TypeScript loader. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
require("../scripts/register-ts-hook.cjs");
const { getProductSizeGuide } = require("../src/data/catalogue/productGuides.ts");
const { getAllProducts } = require("../src/data/catalogue/products.ts");

test("only apparel products with a verified official brand size guide get a link", () => {
  const products = getAllProducts();
  const scottPolo = products.find((product) => product.id === "MGC-2563");
  assert.ok(scottPolo);
  assert.equal(getProductSizeGuide(scottPolo), null, "Scott's official page has no working chart download URL");

  assert.deepEqual(getProductSizeGuide({ brandName: "Columbia", filterCategorySlug: "apparel-lifestyle" }), {
    label: "Columbia size guide",
    href: "https://www.columbia.com/t/size-fit/",
  });
  assert.deepEqual(getProductSizeGuide({ brandName: "Reebok", filterCategorySlug: "apparel-lifestyle" }), {
    label: "Reebok size guide",
    href: "https://www.reebok.com/pages/size-guides",
  });
  assert.deepEqual(getProductSizeGuide({ brandName: "UCB", filterCategorySlug: "apparel-lifestyle" }), {
    label: "United Colors of Benetton size guide",
    href: "https://in.benetton.com/pages/size-guide",
  });

  assert.equal(
    getProductSizeGuide({ ...scottPolo, filterCategorySlug: "bags-travel" }),
    null,
  );
  assert.equal(
    getProductSizeGuide({ ...scottPolo, brandName: "Other brand" }),
    null,
  );
});
