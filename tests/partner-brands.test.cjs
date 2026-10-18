/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner with an isolated TypeScript require hook. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const { spawnSync } = require('node:child_process');

const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return resolve.call(this, id.startsWith('@/') ? path.join(process.cwd(), 'src', id.slice(2)) : id, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, file);

test('verified missing brand logos link to the existing catalogue records', () => {
  const { getHomepagePartnerBrands, resolveBrandLogoSrc } = require('../src/data/partnerBrands.ts');
  const brands = getHomepagePartnerBrands();

  for (const [slug, name, asset] of [
    ['scott', 'Scott', 'scott-logo.png'],
    ['shopnooe', 'ShopNooe', 'shopnooe-logo.png'],
    ['ooge', 'Ooge', 'ooge-logo.jpg'],
  ]) {
    assert.equal(resolveBrandLogoSrc(slug), `/brands/${asset}`);
    assert.ok(fs.existsSync(path.join(process.cwd(), 'public', 'brands', asset)), `${asset} should exist`);
    const item = brands.find((brand) => brand.name === name);
    if (slug === 'ooge') {
      assert.equal(item, undefined, 'Ooge should remain catalogued but be omitted from the homepage brand row');
    } else {
      assert.ok(item, `${name} should appear in the homepage brand row`);
      assert.equal(item.href, `/gifts?brand=${slug}`);
      assert.ok(fs.existsSync(path.join(process.cwd(), 'public', item.src.slice(1))), `${name} homepage image ${item.src} should exist`);
    }
  }

  const products = require('../src/data/catalogue/products.ts').getAllProducts();
  for (const slug of ['greys-blues', 'scott', 'shopnooe', 'ooge']) {
    const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    assert.ok(products.filter((product) => normalize(product.brandName) === normalize(slug)).length >= 5, `${slug} needs at least five real products`);
  }

  const { queryCatalogue } = require('../src/data/catalogue/query.ts');
  const { emptyCatalogueQuery } = require('../src/data/catalogue/queryParams.ts');
  for (const [name, slug] of [['Greys & Blues', 'greys-blues'], ['Scott', 'scott'], ['ShopNooe', 'shopnooe'], ['Ooge', 'ooge']]) {
    assert.ok(queryCatalogue({ ...emptyCatalogueQuery(), brands: [slug] }).total >= 5, `${name} link should surface at least five catalogue products`);
  }
});

test('brand logo checklist audits only the active homepage marquee', () => {
  const result = spawnSync(process.execPath, ['scripts/check-partner-brand-logos.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Monkcraft/);
  assert.doesNotMatch(result.stdout, /Fuzo|Oblique|Power Plus|Bioq|Offikraft|Stolt|Stellers|Ooge|3S/);
  assert.match(result.stdout, /active homepage marquee/i);
});

test('homepage brand row starts with Monkcraft and omits the requested brands', () => {
  const { getHomepagePartnerBrands } = require('../src/data/partnerBrands.ts');
  const brands = getHomepagePartnerBrands();
  assert.equal(brands[0]?.name, 'Monkcraft');
  for (const [name, src] of [
    ['Adidas', '/brands/adidas-logo.svg'],
    ['Reebok', '/brands/reebok-logo.svg'],
    ['Sony', '/brands/sony-logo.svg'],
  ]) {
    assert.equal(brands.find((brand) => brand.name.toLowerCase() === name.toLowerCase())?.src, src);
  }

  const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const removed = new Set(['Fuzo', 'Oblique', 'Power Plus', 'Bioq', 'Offikraft', 'Stolt', 'Stellers', 'Ooge', '3S'].map(normalize));
  assert.deepEqual(brands.filter((brand) => removed.has(normalize(brand.name))).map((brand) => brand.name), []);
});

test('brand marquee keeps Monkcraft fully visible at the right on its opening frame and scrolls left', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'src', 'app', 'globals.css'), 'utf8');
  const group = css.match(/\.brand-marquee__group\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  const keyframes = css.match(/@keyframes brand-marquee-scroll\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  const viewport = css.match(/\.brand-marquee__viewport\s*\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.doesNotMatch(group, /flex-direction:\s*row-reverse/);
  assert.match(keyframes, /from\s*\{[\s\S]*?100vw\s*-\s*var\(--brand-marquee-item-width/);
  assert.match(keyframes, /to\s*\{[\s\S]*?100vw\s*-\s*var\(--brand-marquee-item-width[\s\S]*?-\s*50%/);
  assert.match(viewport, /mask-image:\s*linear-gradient\(\s*90deg,\s*transparent 0%,\s*#000 8%,\s*#000 100%\s*\)/);
});

test('looped logo copies stay clickable without entering the keyboard tab order', () => {
  const component = fs.readFileSync(path.join(process.cwd(), 'src', 'components', 'BrandLogoMarquee.tsx'), 'utf8');
  assert.match(component, /tabIndex=\{interactive \? undefined : -1\}/);
  assert.match(component, /if \(brand\.href\)/);
  assert.match(component, /className="brand-marquee__group" aria-hidden="true"/);
  assert.match(component, /interactive=\{false\}/);
});

test('Next image optimizer allows the high quality used by brand logos', () => {
  const config = fs.readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8');
  assert.match(config, /images:\s*\{\s*qualities:\s*\[[^\]]*100/);
});
