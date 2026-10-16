/* eslint @typescript-eslint/no-require-imports: "off" */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const catalogue = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/data/catalogue/export/products.json'), 'utf8'));
const batch = catalogue.products.filter(
  (product) => product.specifications?.['Catalogue Import Batch'] === 'curated-corporate-gifting-2026-10',
);

test('curated brand import has no junk: capped per brand with one sourced hero image', () => {
  assert.ok(batch.length > 0, 'curated import batch should be present');
  const perBrand = new Map();
  for (const product of batch) {
    const brand = product.brand?.name;
    assert.ok(brand, `${product.slug} needs a brand`);
    perBrand.set(brand, (perBrand.get(brand) || 0) + 1);
    assert.ok(perBrand.get(brand) <= 25, `${brand} exceeds the 25 product cap`);
    assert.equal(product.images?.length, 1, `${product.slug} should have one primary product image`);
    assert.equal(product.images?.[0]?.role, 'MASTER', `${product.slug} image should be the master image`);
    assert.match(product.specifications?.['Source Product URL'] || '', /^https:\/\//);
    assert.ok(product.category?.id && product.subcategory?.slug, `${product.slug} needs a catalogue category`);
    assert.ok(product.description?.trim(), `${product.slug} needs a concise description`);
  }
  assert.ok(perBrand.size >= 10, 'catalogue should represent at least ten source brands');
});
