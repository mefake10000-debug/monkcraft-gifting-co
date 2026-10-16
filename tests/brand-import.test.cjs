/* eslint @typescript-eslint/no-require-imports: "off" */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const catalogue = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../src/data/catalogue/export/products.json'), 'utf8'));
const batch = catalogue.products.filter(
  (product) => product.specifications?.['Catalogue Import Batch'] === 'curated-corporate-gifting-2026-10',
);

test('curated brand import has sourced product details and useful image galleries', () => {
  assert.ok(batch.length > 0, 'curated import batch should be present');
  const perBrand = new Map();
  for (const product of batch) {
    const brand = product.brand?.name;
    assert.ok(brand, `${product.slug} needs a brand`);
    perBrand.set(brand, (perBrand.get(brand) || 0) + 1);
    assert.ok(perBrand.get(brand) <= 25, `${brand} exceeds the 25 product cap`);
    assert.ok(product.images?.length >= 1, `${product.slug} should have a verified product image`);
    assert.ok(product.images?.length <= 8, `${product.slug} gallery should avoid repetitive imagery`);
    for (const image of product.images) {
      assert.ok(['MASTER', 'ANGLE', 'LIFESTYLE', 'OTHER'].includes(image.role), `${product.slug} image needs a recognized role`);
      assert.ok(image.variantKey, `${product.slug} image needs a primary or source variant label`);
      assert.ok(image.path.startsWith('/catalogue-import/products/'), `${product.slug} image should use the curated import asset set`);
      assert.ok(fs.existsSync(path.resolve(__dirname, `../public${image.path}`)), `${product.slug} image file is missing`);
    }
    assert.match(product.specifications?.['Source Product URL'] || '', /^https:\/\//);
    assert.ok(product.category?.id && product.subcategory?.slug, `${product.slug} needs a catalogue category`);
    assert.ok(product.description?.trim(), `${product.slug} needs a concise description`);
  }
  assert.ok(perBrand.size >= 10, 'catalogue should represent at least ten source brands');
  assert.ok(perBrand.size >= 15, 'catalogue should represent the broader source brand list');
  for (const product of batch) {
    const imageOptions = product.specifications?.['Variant Image Colors']
      ?.split(/\s*,\s*/)
      .filter(Boolean) || [];
    for (const label of imageOptions) {
      assert.ok(
        product.images.some((image) => image.variantKey === label),
        `${product.slug} must have an image for source option ${label}`,
      );
    }
  }
});
