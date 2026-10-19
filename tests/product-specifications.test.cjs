/* eslint @typescript-eslint/no-require-imports: "off" */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (mod, file) => mod._compile(
  ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText,
  file,
);

const { clearCatalogueCache, getAllProducts } = require('../src/data/catalogue/products.ts');

test('public catalogue specifications preserve product facts and exclude source/import metadata', () => {
  const products = getAllProducts();
  assert.ok(products.length > 0);
  for (const product of products) {
    for (const { label } of product.attributes) {
      assert.ok(
        !['Source Display Price', 'Catalogue Import Batch', 'Source Product URL'].includes(label),
        `${product.id} exposes ${label}`,
      );
    }
    for (const { label, value } of product.attributes) {
      assert.doesNotMatch(
        value,
        /^\$?undefined$/i,
        `${product.id} exposes an invalid ${label} placeholder`,
      );
    }
  }
});

test('specification filtering hides country of origin, import metadata and embedded links while preserving buyer facts', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'monkcraft-specifications-'));
  const previousExportPath = process.env.MONKCRAFT_EXPORT_DATA;
  t.after(() => {
    if (previousExportPath === undefined) delete process.env.MONKCRAFT_EXPORT_DATA;
    else process.env.MONKCRAFT_EXPORT_DATA = previousExportPath;
    clearCatalogueCache();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const exported = {
    schemaVersion: '2.0.0',
    products: [{
      id: 'TEST-SPECIFICATIONS',
      sku: 'TEST-SPECIFICATIONS',
      slug: 'test-specifications',
      title: 'Steel Bottle',
      category: { slug: 'drinkware-barware', name: 'Drinkware & Barware' },
      subcategory: { slug: 'bottles', name: 'Bottles' },
      pricing: { amount: 1500, currency: 'INR', gstBasis: 'GST_NOT_STATED' },
      specifications: {
        'country_of_origin': 'India',
        'Customization Type': 'Screen printing',
        'Dispatch Timeline': '7 to 10 working days',
        '  Source  Display Price  ': 'INR 1500.00',
        sourceStore: 'Supplier storefront',
        'catalogue-import-batch': 'private-import-2026',
        'Import Batch': 'private-import-2026',
        'Internal Notes': 'Supplier negotiation notes',
        Provenance: 'Supplier export',
        'Source Product URL': 'https://supplier.example/products/bottle',
        'Reference': 'See https://supplier.example/products/bottle for source details',
        'Direct Source Link': 'supplier.example/products/bottle',
        Material: 'Stainless Steel',
        Dimensions: '20 × 8 cm',
        'Capacity in Ltrs': '0.75L',
        'Stock Availability': '100',
      },
      sourceUrl: 'https://supplier.example/products/bottle',
      sourcePrice: '1500.00',
      images: [],
    }],
  };
  const original = JSON.stringify(exported);
  const file = path.join(directory, 'products.json');
  fs.writeFileSync(file, original);
  process.env.MONKCRAFT_EXPORT_DATA = directory;
  clearCatalogueCache();

  const [product] = getAllProducts();
  assert.deepEqual(product.attributes, [
    { label: 'Customization Type', value: 'Screen printing' },
    { label: 'Dispatch Timeline', value: '7 to 10 working days' },
    { label: 'Provenance', value: 'Supplier export' },
    { label: 'Material', value: 'Stainless Steel' },
    { label: 'Dimensions', value: '20 × 8 cm' },
    { label: 'Capacity in Ltrs', value: '0.75L' },
  ]);
  assert.equal(product.attributes.some(({ label }) => /country of origin/i.test(label)), false, 'country of origin stays out of buyer-facing product details');
  assert.equal(product.attributes.some(({ label }) => label === 'Stock Availability'), false, 'undated numeric stock is not presented as live inventory');
  const storedExport = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(storedExport.products[0].specifications['Stock Availability'], '100', 'the source export remains unchanged');
  assert.deepEqual(product.pricing, { kind: 'fixed', amountInr: 1500, gstBasis: 'GST_NOT_STATED' });
  assert.deepEqual(product.source, {
    system: 'website-export', schemaVersion: '2.0.0', exportSlug: 'test-specifications',
  });
  assert.equal(fs.readFileSync(file, 'utf8'), original, 'the source export must remain intact');
});
