/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS matches the repository's node:test suite. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('design options keep a readable label beside the thumbnail scroller on narrow cards', () => {
  const component = fs.readFileSync(path.join(root, 'src/components/catalogue/ProductCard.tsx'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'src/app/gifts/catalogue-v2.css'), 'utf8');
  const pickerLabel = css.match(/\.product-card__design-picker\s*>\s*p\s*\{[^}]*\}/)?.[0] ?? '';

  assert.match(component, /<p>\{product\.designFamilyOptionLabel === "design" \? "Designs"/);
  assert.match(component, /visually-hidden[^>]*>\. Selected:/);
  assert.match(pickerLabel, /flex:\s*0\s+0\s+[\d.]+rem/);
});
