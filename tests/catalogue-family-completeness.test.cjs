/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS matches the repository's node:test suite. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(
  fs.readFileSync(file, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } },
).outputText, file);

const products = require('../src/data/catalogue/products.ts').getAllProducts();
const { getProductVariantFamily } = require('../src/data/catalogue/query.ts');

const expected = [
  ['MGC-2610', ['MGC-2603', 'MGC-2604', 'MGC-2605', 'MGC-2606', 'MGC-2607', 'MGC-2608', 'MGC-2609', 'MGC-2610']],
  ['MGC-2535', ['MGC-2532', 'MGC-2533', 'MGC-2534', 'MGC-2535']],
  ['MGC-2554', ['MGC-2554', 'MGC-2555', 'MGC-2556']],
  ['MGC-2582', ['MGC-2582', 'MGC-2583', 'MGC-2584', 'MGC-2585', 'MGC-2586', 'MGC-2588', 'MGC-2589', 'MGC-2590', 'MGC-2591']],
];

const additionalReviewedFamilies = [
  ['MGC-2838', ['MGC-2838', 'MGC-2839', 'MGC-2840']],
  ['MGC-2132', ['MGC-2132', 'MGC-2133', 'MGC-2134', 'MGC-2138']],
  ['MGC-2213', ['MGC-2213', 'MGC-2214', 'MGC-2215', 'MGC-2216', 'MGC-2217']],
  ['MGC-2910', ['MGC-2910', 'MGC-2911', 'MGC-2912', 'MGC-2913', 'MGC-2914']],
  ['MGC-2518', ['MGC-2518', 'MGC-2519', 'MGC-2520', 'MGC-2521', 'MGC-2522']],
  ['MGC-2500', ['MGC-2500', 'MGC-2501', 'MGC-2502', 'MGC-2503', 'MGC-2504']],
  ['MGC-2779', ['MGC-2779', 'MGC-2780', 'MGC-2781', 'MGC-2782']],
  ['MGC-2795', ['MGC-2795', 'MGC-2796', 'MGC-2797', 'MGC-2798', 'MGC-2799']],
];

test('verified Scott colourways are complete and grouped as one selectable family', () => {
  for (const [representativeId, expectedIds] of expected) {
    const representative = products.find((product) => product.id === representativeId);
    const family = getProductVariantFamily(representative);
    assert.equal(family?.type, 'colour', `${representativeId} is a colour family`);
    assert.deepEqual(new Set(family.options.map((option) => option.id)), new Set(expectedIds));
    assert.equal(new Set(family.options.map((option) => option.pricing.amountInr)).size, 1);
  }
});

test('these corrections only alter family metadata, not exported product records', () => {
  const source = JSON.parse(fs.readFileSync('src/data/catalogue/export/products.json', 'utf8')).products;
  const runtime = new Map(products.map((product) => [product.id, product]));
  for (const id of expected.flatMap(([, ids]) => ids)) {
    const record = source.find((product) => product.sku === id);
    assert.ok(record, `${id} remains a source catalogue record`);
    const rendered = runtime.get(id);
    assert.equal(rendered.sku, record.sku);
    assert.equal(rendered.name, record.title);
    assert.equal(rendered.description, record.description);
  }
});

test('reviewed apparel variants no longer leave verified colour options isolated', () => {
  for (const [representativeId, expectedIds] of additionalReviewedFamilies) {
    const representative = products.find((product) => product.id === representativeId);
    const family = getProductVariantFamily(representative);
    assert.equal(family?.type, 'colour', `${representativeId} is a colour family`);
    assert.deepEqual(new Set(family.options.map((option) => option.id)), new Set(expectedIds));
    assert.equal(new Set(family.options.map((option) => option.pricing.amountInr)).size, 1);
  }
});
