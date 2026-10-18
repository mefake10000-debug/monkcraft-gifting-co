/* eslint-disable @typescript-eslint/no-require-imports -- Load the catalogue's TypeScript mapper. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(
  fs.readFileSync(file, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } },
).outputText, file);

const products = require('../src/data/catalogue/products.ts').getAllProducts();
const byId = new Map(products.map((product) => [product.id, product]));

test('physical product form wins over design words such as plant, garden, or tree', () => {
  for (const [id, category, subcategory] of [
    ['MGC-0344', 'executive-writing', 'desk-companions'],
    ['MGC-0393', 'executive-writing', 'desk-companions'],
    ['MGC-3951', 'drinkware-barware', 'coasters'],
    ['MGC-0009', 'executive-writing', 'pens'],
  ]) {
    const product = byId.get(id);
    assert.ok(product, `${id} remains active`);
    assert.equal(product.filterCategorySlug, category, `${id} product category`);
    assert.equal(product.subcategorySlug, subcategory, `${id} product subcategory`);
  }
  for (const id of ['MGC-3072', 'MGC-3073']) {
    const product = byId.get(id);
    assert.equal(product.categorySlug, 'office-stationery', `${id} source taxonomy follows the coaster form`);
    assert.equal(product.subcategorySlug, 'coasters', `${id} uses the coaster subcategory`);
  }
  for (const [id, category, subcategory] of [
    ['MGC-1544', 'bags-travel', 'totes'],
    ['MGC-3938', 'office-stationery', 'stationery'],
  ]) {
    const product = byId.get(id);
    assert.ok(product, `${id} remains active`);
    assert.equal(product.filterCategorySlug, category, `${id} physical type outranks artwork text`);
    assert.equal(product.subcategorySlug, subcategory, `${id} has the correct browse path`);
  }
});

test('an espresso coffee maker is filed with appliances while French press stays with drinkware', () => {
  const appliance = byId.get('MGC-0798');
  const press = byId.get('MGC-0793');
  assert.equal(appliance.filterCategorySlug, 'tech-gadgets');
  assert.equal(appliance.subcategorySlug, 'home-appliances');
  assert.equal(appliance.pricing.amountInr, 4725);
  assert.equal(press.filterCategorySlug, 'drinkware-barware');
  assert.equal(press.subcategorySlug, 'coffee');
});

test('Monkcraft snapdot pin badges share the stationery subcategory regardless of artwork theme', () => {
  for (const id of ['MGC-3042', 'MGC-3028', 'MGC-3068', 'MGC-3850', 'MGC-3869', 'MGC-3887']) {
    const product = byId.get(id);
    assert.equal(product.filterCategorySlug, 'office-stationery', `${id} category`);
    assert.equal(product.subcategorySlug, 'stationery', `${id} subcategory`);
  }
});
