/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner loads TypeScript directly. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(
  fs.readFileSync(file, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } },
).outputText, file);

const { getAllProducts } = require('../src/data/catalogue/products.ts');
const source = require('../src/data/catalogue/export/products.json').products;
const reviewedDescriptions = new Map(require('../src/data/catalogue/editorial/product-descriptions.json')
  .filter((entry) => entry.reviewed === true)
  .map((entry) => [entry.productId, entry.description]));

function publicImagePath(path) {
  if (path.startsWith('media/')) return `/catalogue-media/${path.slice(6)}`;
  if (path.startsWith('/')) return path;
  return `/catalogue-media/${path.startsWith('./') ? path.slice(2) : path}`;
}

test('all source products remain discoverable with original identity and product content', () => {
  const visible = getAllProducts();
  assert.equal(visible.length, source.length);
  const byId = new Map(visible.map((product) => [product.id, product]));

  for (const record of source) {
    const product = byId.get(record.sku);
    assert.ok(product, `${record.sku} remains in the catalogue`);
    assert.equal(product.sku, record.sku);
    assert.equal(product.catalogueSku, record.sku);
    assert.equal(product.name, record.title);
    assert.equal(product.description, record.description?.trim() || undefined);
    assert.equal(product.summary, reviewedDescriptions.get(record.sku) || (record.shortDescription || record.description || '').trim() || record.title);
    const sourcePrice = record.pricing?.amount;
    if (Number.isFinite(sourcePrice) && sourcePrice > 0) {
      assert.equal(product.pricing.kind, 'fixed', `${record.sku} keeps its verified price`);
      assert.equal(product.pricing.amountInr, sourcePrice, `${record.sku} keeps its source price`);
      assert.equal(product.pricing.gstBasis, record.pricing.gstBasis ?? null, `${record.sku} keeps its tax basis`);
    } else {
      assert.equal(product.pricing.kind, 'quote', `${record.sku} remains quote-on-request without a verified price`);
    }
    const overridePaths = new Set(require('../src/data/catalogue/productImageOverrides.json')
      .filter((override) => override.productId === record.sku)
      .map((override) => override.path));
    assert.deepEqual(
      product.images.filter((image) => !overridePaths.has(image.src)).map((image) => image.src),
      (record.images ?? []).map((image) => publicImagePath(image.path)),
    );
    assert.equal(product.minQuantity, [record.availability?.moq, record.availability?.minimumOrderQuantity]
      .find((minimum) => typeof minimum === 'number' && Number.isFinite(minimum) && minimum > 0));
  }
});

test('MGC-1422 uses the exact manufacturer-confirmed blue 14L Karbon photo without changing its source record', () => {
  const override = require('../src/data/catalogue/productImageOverrides.json').find((entry) => entry.productId === 'MGC-1422');
  const sourceProduct = source.find((record) => record.sku === 'MGC-1422');
  const runtimeProduct = getAllProducts().find((product) => product.id === 'MGC-1422');
  const assetPath = `public${override.path}`;
  assert.ok(sourceProduct);
  assert.ok(override);
  assert.ok(fs.existsSync(assetPath), `registered product image exists at ${assetPath}`);
  assert.ok(fs.statSync(assetPath).size > 100_000, 'registered product image is a substantial local image asset');
  assert.ok(runtimeProduct);
  assert.equal(sourceProduct.images.length, 0, 'original source record stays intact');
  assert.equal(runtimeProduct.images.length, 1);
  assert.match(runtimeProduct.images[0].src, /urban-gear-karbon-14l-blue/);
  assert.equal(runtimeProduct.images[0].alt, 'Urban Gear Karbon 14L anti-theft backpack in blue');
  assert.deepEqual(JSON.parse(fs.readFileSync('src/data/catalogue/export/products.json', 'utf8')).products.find((record) => record.sku === 'MGC-1422').images, []);
});
