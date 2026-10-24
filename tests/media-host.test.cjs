/* eslint-disable @typescript-eslint/no-require-imports -- Node's built-in test runner uses CommonJS here. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return resolve.call(this, id.startsWith('@/') ? path.join(process.cwd(), 'src', id.slice(2)) : id, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);

const root = path.resolve(__dirname, '..');
const productsFile = require.resolve('../src/data/catalogue/products.ts');
const imageLoader = require('../src/lib/imageLoader.ts').default;

function loadProducts(baseUrl) {
  const previous = process.env.MONKCRAFT_MEDIA_BASE_URL;
  if (baseUrl === undefined) delete process.env.MONKCRAFT_MEDIA_BASE_URL; else process.env.MONKCRAFT_MEDIA_BASE_URL = baseUrl;
  try {
    delete require.cache[productsFile];
    return require(productsFile).getAllProducts();
  } finally {
    if (previous === undefined) delete process.env.MONKCRAFT_MEDIA_BASE_URL; else process.env.MONKCRAFT_MEDIA_BASE_URL = previous;
    delete require.cache[productsFile];
  }
}

const sources = (products) => products.flatMap((product) => product.images.map((image) => image.src));

test('without a media host, product photos keep the site-relative /catalogue-media path', () => {
  const srcs = sources(loadProducts(undefined));
  assert.ok(srcs.length > 20000);
  assert.ok(srcs.every((src) => src.startsWith('/catalogue-media/') || src.startsWith('/catalogue-import/')));
});

test('with a media host, product photos point at it with no doubled slashes', () => {
  const srcs = sources(loadProducts('https://media.example.org/'));
  const hosted = srcs.filter((src) => src.startsWith('https://media.example.org/catalogue-media/products/'));
  assert.ok(hosted.length > 20000);
  assert.ok(srcs.every((src) => !src.includes('org//') && (src.startsWith('https://media.example.org/') || src.startsWith('/catalogue-import/'))));
  assert.ok(srcs.every((src) => !src.startsWith('/catalogue-media/')));
});

test('products without any photo are limited to the few the catalogue has never had pictures for', () => {
  const products = loadProducts('https://media.example.org');
  const imageless = products.filter((product) => product.images.length === 0);
  assert.ok(imageless.length <= 6, `unexpected imageless products: ${imageless.map((product) => product.slug).join(', ')}`);
});

test('image loader leaves hosted photos untouched and routes site artwork through the optimiser', () => {
  assert.equal(imageLoader({ src: 'https://media.example.org/catalogue-media/products/a.webp', width: 640, quality: 75 }), 'https://media.example.org/catalogue-media/products/a.webp');
  assert.equal(imageLoader({ src: '/brand/logo.png', width: 256 }), '/_next/image?url=%2Fbrand%2Flogo.png&w=256&q=75');
  assert.equal(imageLoader({ src: '/hero/a b.jpg', width: 1080, quality: 92 }), '/_next/image?url=%2Fhero%2Fa%20b.jpg&w=1080&q=92');
});

test('next.config registers the custom loader and the file exists', () => {
  const config = fs.readFileSync(path.join(root, 'next.config.ts'), 'utf8');
  assert.match(config, /loader:\s*"custom"/);
  assert.match(config, /loaderFile:\s*"\.\/src\/lib\/imageLoader\.ts"/);
  assert.ok(fs.existsSync(path.join(root, 'src/lib/imageLoader.ts')));
  assert.match(fs.readFileSync(path.join(root, 'src/lib/imageLoader.ts'), 'utf8'), /^"use client";/);
});

test('the media host setting is documented for operators', () => {
  assert.match(fs.readFileSync(path.join(root, '.env.example'), 'utf8'), /^MONKCRAFT_MEDIA_BASE_URL=/m);
});
