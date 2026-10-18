/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner loads TypeScript directly. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(
  fs.readFileSync(file, 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } },
).outputText, file);

const products = require('../src/data/catalogue/products.ts').getAllProducts();
const families = require('../src/data/catalogue/designFamilies.json');
const { getProductVariantFamily } = require('../src/data/catalogue/query.ts');

test('Monkcraft mug records remain visible and reviewed designs retain exact-price variants', () => {
  const monkcraftMugs = products.filter((product) => product.brandName === 'Monkcraft' && /mug/i.test(product.name));
  const source = require('../src/data/catalogue/export/products.json').products;
  const sourceMugs = source.filter((product) => product.brand?.name === 'Monkcraft' && /mug/i.test(product.title));
  assert.equal(monkcraftMugs.length, sourceMugs.length, 'all source mug records remain available');
  assert.ok(monkcraftMugs.every((product) => product.filterCategorySlug === 'drinkware-barware' && product.subcategorySlug === 'mugs'));

  const groups = new Map();
  for (const product of monkcraftMugs) {
    const family = getProductVariantFamily(product);
    const code = family?.code || product.id;
    if (!groups.has(code)) groups.set(code, family?.options || [product]);
  }
  for (const [familyCode, members] of groups) {
    const prices = new Set(members.map((product) => product.pricing.kind === 'fixed' ? product.pricing.amountInr : 'quote'));
    assert.equal(prices.size, 1, `${familyCode} has a consistent verified price`);
  }
  assert.equal(groups.get('MGC-FAM-376')?.length, 4, 'Signature Plus mug colors stay together');
  assert.equal(groups.get('MGC-DES-008')?.length, 6, 'Holi Signature Plus designs stay together');
  assert.equal(groups.get('MGC-DES-012')?.length, 21, 'Signature 350 ml design variants stay together');
  assert.equal(groups.get('MGC-DES-013')?.length, 5, 'black Signature 350 ml variants stay together');
  assert.ok(monkcraftMugs.some((product) => product.id === 'MGC-0675'), 'the unique Signature Glow mug remains');
  assert.ok(monkcraftMugs.some((product) => product.id === 'MGC-0646'));
  assert.ok(monkcraftMugs.some((product) => product.id === 'MGC-0647'));
  assert.ok(monkcraftMugs.some((product) => product.id === 'MGC-0648'));
});

test('Monkcraft signature mug families are reviewed and have one label per image-reviewed member', () => {
  for (const familyId of ['monkcraft-signature-350ml-mugs', 'monkcraft-signature-black-350ml-mugs']) {
    const family = families.find((entry) => entry.familyId === familyId);
    assert.ok(family?.reviewed && family.imageReviewed);
    assert.equal(new Set(Object.values(family.labels)).size, family.productIds.length);
    assert.equal(Object.keys(family.labels).length, family.productIds.length);
  }
});

test('Monkcraft framed certificates group only exact-price, same-size frame variants', () => {
  const source = require('../src/data/catalogue/export/products.json').products;
  const expected = [
    ['MGC-4245', 'MGC-4246'],
    ['MGC-4250', 'MGC-4251'],
    ['MGC-4247', 'MGC-4248', 'MGC-4249'],
  ];
  for (const ids of expected) {
    const members = ids.map((id) => products.find((product) => product.id === id));
    assert.ok(members.every(Boolean));
    const family = getProductVariantFamily(members[0]);
    assert.ok(family?.type === 'design');
    assert.equal(family.options.length, ids.length);
    assert.deepEqual(new Set(family.options.map((product) => product.id)), new Set(ids));
    const sourceMembers = ids.map((id) => source.find((product) => product.sku === id));
    assert.equal(new Set(sourceMembers.map((product) => product.pricing.amount)).size, 1);
    assert.equal(new Set(sourceMembers.map((product) => product.specifications?.Material)).size, 1);
    assert.ok(sourceMembers.every((product) => product.category.slug === 'awards-trophies' && product.subcategory.slug === 'certificates-frames'));
  }
});
