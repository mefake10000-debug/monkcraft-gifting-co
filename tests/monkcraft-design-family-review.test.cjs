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
const families = require('../src/data/catalogue/designFamilies.json');
const { getProductVariantFamily } = require('../src/data/catalogue/query.ts');
const expectedFamilies = [
  ['holi-4-inch-acrylic-coasters', ['MGC-3030', 'MGC-3910', 'MGC-3911', 'MGC-3912', 'MGC-3920', 'MGC-3921', 'MGC-3922', 'MGC-3923', 'MGC-3924', 'MGC-3925', 'MGC-3926', 'MGC-3072', 'MGC-3073', 'MGC-3915', 'MGC-3916', 'MGC-3917', 'MGC-3918', 'MGC-3919', 'MGC-3044']],
  ['monkcraft-9cm-foam-coasters', ['MGC-3943', 'MGC-3944', 'MGC-3948', 'MGC-3949', 'MGC-3950', 'MGC-3951', 'MGC-3952', 'MGC-3953', 'MGC-3954', 'MGC-3955', 'MGC-3945', 'MGC-3946', 'MGC-3947']],
  ['monkcraft-foam-coaster-shape-size-options', ['MGC-0789', 'MGC-0790', 'MGC-0791', 'MGC-0792']],
  ['monkcraft-snapdot-magnets', ['MGC-3891', 'MGC-3892', 'MGC-3893', 'MGC-3894', 'MGC-3895', 'MGC-3896', 'MGC-3897', 'MGC-3898', 'MGC-3901', 'MGC-3902', 'MGC-3903', 'MGC-3904', 'MGC-3905', 'MGC-3906', 'MGC-3907']],
  ['monkcraft-visionbook-a5-100-executive', ['MGC-0376', 'MGC-0377', 'MGC-0378', 'MGC-0379', 'MGC-0380', 'MGC-0381', 'MGC-0382']],
  ['monkcraft-visionbook-a5-160-executive', ['MGC-0387', 'MGC-0388', 'MGC-0389', 'MGC-0390', 'MGC-0391', 'MGC-0392', 'MGC-0393', 'MGC-0395']],
  ['monkcraft-holi-visionbook-a5-100', ['MGC-4158', 'MGC-4159', 'MGC-4160', 'MGC-4161', 'MGC-4162', 'MGC-4163']],
  ['monkcraft-visionbook-a5-160-office', ['MGC-3981', 'MGC-3982', 'MGC-3983', 'MGC-3984', 'MGC-3985', 'MGC-3986', 'MGC-3987', 'MGC-3988', 'MGC-3991', 'MGC-3992']],
  ['monkcraft-desktop-calendar-12-sheets', ['MGC-0403', 'MGC-0399', 'MGC-0405', 'MGC-0402', 'MGC-0398', 'MGC-0404', 'MGC-0400', 'MGC-0397', 'MGC-0401']],
  ['monkcraft-desktop-calendar-6-sheets', ['MGC-0414', 'MGC-0411', 'MGC-0408', 'MGC-0413', 'MGC-0410', 'MGC-0407', 'MGC-0412', 'MGC-0409', 'MGC-0406']],
  ['monkcraft-3-in-1-hampers', ['MGC-3444', 'MGC-3445', 'MGC-3446', 'MGC-3447', 'MGC-3448', 'MGC-3449', 'MGC-3450', 'MGC-3451']],
  ['monkcraft-snapdot-pin-badge-designs', ['MGC-3042', 'MGC-3028', 'MGC-3068', 'MGC-3850', 'MGC-3851', 'MGC-3852', 'MGC-3853', 'MGC-3855', 'MGC-3856', 'MGC-3857', 'MGC-3858', 'MGC-3859', 'MGC-3860', 'MGC-3861', 'MGC-3862', 'MGC-3863', 'MGC-3864', 'MGC-3865', 'MGC-3866', 'MGC-3867', 'MGC-3868', 'MGC-3869', 'MGC-3870', 'MGC-3871', 'MGC-3872', 'MGC-3873', 'MGC-3875', 'MGC-3876', 'MGC-3877', 'MGC-3878', 'MGC-3879', 'MGC-3880', 'MGC-3881', 'MGC-3883', 'MGC-3884', 'MGC-3885', 'MGC-3886', 'MGC-3887']],
  ['monkcraft-14-by-16-inch-canvas-tote-designs', ['MGC-1511', 'MGC-1512', 'MGC-1513', 'MGC-1514', 'MGC-1515', 'MGC-1516', 'MGC-1517', 'MGC-1518', 'MGC-1519', 'MGC-1520', 'MGC-1521', 'MGC-1522']],
  ['monkcraft-14-by-16-inch-canvas-tote-designs', ['MGC-1511', 'MGC-1512', 'MGC-1513', 'MGC-1514', 'MGC-1515', 'MGC-1516', 'MGC-1517', 'MGC-1518', 'MGC-1519', 'MGC-1520', 'MGC-1521', 'MGC-1522']],
  ['monkcraft-custom-canvas-tote-designs', ['MGC-1531', 'MGC-1532', 'MGC-1536', 'MGC-1537', 'MGC-1541', 'MGC-1542', 'MGC-1543', 'MGC-1544', 'MGC-1545', 'MGC-1546', 'MGC-1547', 'MGC-1548']],
  ['monkcraft-earth-day-snapdot-magnets', ['MGC-3069', 'MGC-3070']],
  ['monkcraft-22-by-19-cm-pixelpad-designs', ['MGC-3927', 'MGC-3928', 'MGC-3929', 'MGC-3930', 'MGC-3937', 'MGC-3938', 'MGC-3939', 'MGC-3940', 'MGC-3941', 'MGC-3942']],
  ['monkcraft-fleximat-designs', ['MGC-3998', 'MGC-3999', 'MGC-4000', 'MGC-4001', 'MGC-4002', 'MGC-4003', 'MGC-4004']],
  ['monkcraft-holi-pixelpad-designs', ['MGC-3963', 'MGC-3964', 'MGC-3965', 'MGC-3966', 'MGC-3967']],
];

test('reviewed Monkcraft coaster, stationery, and calendar designs appear as grouped variants', () => {
  for (const [familyId, productIds] of expectedFamilies) {
    const family = families.find((entry) => entry.familyId === familyId);
    assert.ok(family?.reviewed && family.imageReviewed, `${familyId} has editorial and image review`);
    assert.deepEqual(new Set(family.productIds), new Set(productIds), `${familyId} has its approved members`);
    const options = getProductVariantFamily(products.find((product) => product.id === productIds[0]));
    assert.equal(options?.type, 'design', `${familyId} is a design family`);
    assert.deepEqual(new Set(options.options.map((product) => product.id)), new Set(productIds));
    assert.equal(new Set(options.options.map((product) => product.pricing.amountInr)).size, 1, `${familyId} keeps a single exact price`);
  }
});
