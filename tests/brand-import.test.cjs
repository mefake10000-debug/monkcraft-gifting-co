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

test('every advertised colour is selectable through its matching product image', () => {
  const Module = require('node:module');
  const previousResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, ...args) {
    return previousResolve.call(this, request.startsWith('@/')
      ? path.resolve(__dirname, '../src', request.slice(2))
      : request, ...args);
  };
  require.extensions['.ts'] = (module, filename) => {
    const ts = require('typescript');
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText, filename);
  };
  const { getAllProducts } = require('../src/data/catalogue/products.ts');
  const imported = getAllProducts().filter((product) =>
    product.images.some((image) => image.src.startsWith('/catalogue-import/products/')));
  for (const product of imported) {
    for (const option of product.colourOptions || []) {
      assert.ok(product.images[option.imageIndex], `${product.slug} colour ${option.label} needs an image`);
      const image = product.images[option.imageIndex];
      assert.ok(
        image.variantKey?.split(/\s*\/\s*/).some((part) => part.trim().toLowerCase() === option.label.toLowerCase()),
        `${product.slug} colour ${option.label} must select its matching image`,
      );
      assert.ok(fs.existsSync(path.resolve(__dirname, `../public${image.src}`)), `${product.slug} colour ${option.label} asset missing`);
    }
  }
  const carryMug = imported.find((product) => product.slug === 'fellow-carter-carry-water-bottle');
  assert.ok(carryMug?.colourOptions && carryMug.colourOptions.length >= 5, 'Carter Carry colours should resolve despite size-prefixed Shopify labels');
  const galleryCss = fs.readFileSync(path.resolve(__dirname, '../src/app/gifts/catalogue.css'), 'utf8');
  assert.match(galleryCss, /var\(--mc-mist-lilac\)/, 'product image background should use the approved Mist Lilac token');
  assert.match(galleryCss, /var\(--mc-powder-blue\)/, 'product image background should use the approved Powder Blue token');
});
