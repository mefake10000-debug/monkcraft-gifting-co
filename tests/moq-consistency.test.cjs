/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner loads TS modules directly. */
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return originalResolve.call(this, id.startsWith('@/') ? path.join(process.cwd(), 'src', id.slice(2)) : id, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText, file);

require.extensions['.tsx'] = require.extensions['.ts'];

const orders = require('../src/lib/companyStore/orderDraft.ts');
const shortlist = require('../src/lib/shortlist.ts');
const orderKey = 'monkcraft-company-store-order-v1';
const showcaseKey = 'monkcraft-company-store-showcase-cart-v1';
const line = (quantity, variants = []) => ({ productId: 'gift-a', slug: 'gift-a', name: 'Gift A', priceLabel: '₹100', amountInr: 100, quantity, variants });
const draft = (lines) => ({ version: 1, lines, notes: '', updatedAt: '' });
beforeEach(() => {
  const memory = new Map();
  global.localStorage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: (key) => memory.delete(key) };
  const events = new EventTarget();
  global.window = { localStorage, dispatchEvent: events.dispatchEvent.bind(events), addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) };
});

test('stored company order quantities are normalized before the first read', () => {
  localStorage.setItem(orderKey, JSON.stringify(draft([line(1), { ...line(7.8), productId: 'gift-b' }])));
  assert.deepEqual(orders.readStoreOrderDraft().lines.map((item) => item.quantity), [5, 7]);
});

test('writing company order drafts persists at least five whole units per line', () => {
  orders.writeStoreOrderDraft(draft([line(2), { ...line(6.8), productId: 'gift-b' }]));
  assert.deepEqual(JSON.parse(localStorage.getItem(orderKey)).lines.map((item) => item.quantity), [5, 6]);
});

test('adding a company order line starts and increments by at least five units', () => {
  assert.equal(orders.addStoreOrderLine(line(1)).lines[0].quantity, 5);
  assert.equal(orders.addStoreOrderLine(line(1)).lines[0].quantity, 10);
});

for (const quantity of [4, 1, 0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
  test(`editing company order quantity ${quantity} retains its line at MOQ five`, () => {
    orders.writeStoreOrderDraft(draft([line(7)]));
    const result = orders.setStoreOrderQuantity('gift-a', [], quantity);
    assert.equal(result.lines.length, 1);
    assert.equal(result.lines[0].quantity, 5);
    assert.equal(JSON.parse(localStorage.getItem(orderKey)).lines[0].quantity, 5);
  });
}

test('explicit order removal removes only the chosen product variant', () => {
  const red = [{ label: 'Colour', value: 'Red' }];
  const blue = [{ label: 'Colour', value: 'Blue' }];
  orders.writeStoreOrderDraft(draft([line(5, red), line(5, blue)]));
  assert.deepEqual(orders.removeStoreOrderLine('gift-a', red).lines, [line(5, blue)]);
});

test('V1 shortlist migration restores a quote-ready quantity when source MOQ is unknown', () => {
  localStorage.setItem('monkcraft-shortlist-v1', JSON.stringify(['gift-a', null, 'gift-b']));
  const migrated = shortlist.readShortlist();
  assert.deepEqual(migrated.map((item) => item.quantity), [1, 1]);
  assert.deepEqual(JSON.parse(localStorage.getItem('monkcraft-shortlist-v2')), migrated);
  assert.equal(localStorage.getItem('monkcraft-shortlist-v1'), null);
});

// Exercise the component's actual cart handlers with browser/network boundaries replaced.
async function storefront(showcase) {
  const states = [];
  const effects = [];
  let cursor = 0;
  let mounted = false;
  const companyDraft = require('../src/data/companyStore/types.ts').emptyCompanyStoreDraft();
  companyDraft.productIds = ['gift-a'];
  const hooks = {
    ...require('react'),
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], (next) => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    },
    useEffect(effect) { if (!mounted) effects.push(effect); },
    useMemo: (factory) => factory(),
  };
  const file = path.join(process.cwd(), 'src/components/company-store/EmployeeStorefront.tsx');
  const componentModule = new Module(file, module);
  componentModule.filename = file;
  componentModule.paths = module.paths;
  const dependencies = {
    react: hooks,
    'next/image': { __esModule: true, default: 'img' },
    'next/link': { __esModule: true, default: 'a' },
    'next/navigation': { useSearchParams: () => new URLSearchParams(showcase ? 'showcase=1' : '') },
    '@/lib/companyStore/useStoreDraft': { useStoreDraft: () => ({ draft: companyDraft, ready: true }) },
    '@/lib/studio/fetchProducts': { fetchStudioProducts: async () => [{ id: 'gift-a', slug: 'gift-a', name: 'Gift A', priceLabel: '₹100', amountInr: 100, attributes: [] }] },
  };
  componentModule.require = (id) => Object.hasOwn(dependencies, id) ? dependencies[id] : module.require(id);
  componentModule._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, file);
  const render = () => { cursor = 0; return componentModule.exports.EmployeeStorefront(); };
  render();
  mounted = true;
  for (const effect of effects) effect();
  await new Promise((resolve) => setImmediate(resolve));
  function find(node, predicate) {
    if (!node || typeof node !== 'object') return undefined;
    if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
    if (predicate(node)) return node;
    return find(node.props?.children, predicate);
  }
  return { render, find, effect: (index) => effects[index]() };
}

for (const showcase of [false, true]) {
  test(`${showcase ? 'showcase' : 'configured'} storefront disables decrement at MOQ and keeps explicit removal`, async () => {
    localStorage.setItem(showcase ? showcaseKey : orderKey, JSON.stringify(showcase ? [line(5)] : draft([line(5)])));
    const view = await storefront(showcase);
    const decrease = view.find(view.render(), (node) => node.props?.['aria-label'] === 'Decrease Gift A');
    assert.equal(decrease.props.disabled, true);
    decrease.props.onClick();
    const tree = view.render();
    const quantity = view.find(tree, (node) => node.props?.className === 'cs-cart__qty');
    assert.equal(quantity.props.children[1].props.children, 5);
    const remove = view.find(tree, (node) => node.type === 'button' && node.props.children === 'Remove');
    remove.props.onClick();
    if (!showcase) view.effect(0);
    assert.equal(view.find(view.render(), (node) => node.props?.className === 'cs-cart__qty'), undefined);
  });
}

test('showcase cart normalizes a restored legacy quantity before displaying it', async () => {
  localStorage.setItem(showcaseKey, JSON.stringify([line(1)]));
  const view = await storefront(true);
  const quantity = view.find(view.render(), (node) => node.props?.className === 'cs-cart__qty');
  assert.equal(quantity.props.children[1].props.children, 5);
});

test('showcase quantity controls change only the selected color variant', async () => {
  const red = line(6, [{ label: 'Colour', value: 'Red' }]);
  const blue = line(8, [{ label: 'Colour', value: 'Blue' }]);
  localStorage.setItem(showcaseKey, JSON.stringify([red, blue]));
  const view = await storefront(true);
  const decrease = view.find(view.render(), (node) => node.props?.['aria-label'] === 'Decrease Gift A');
  decrease.props.onClick();
  const quantities = [];
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (node.props?.className === 'cs-cart__qty') quantities.push(node.props.children[1].props.children);
    visit(node.props?.children);
  };
  visit(view.render());
  assert.deepEqual(quantities, [5, 8]);
});
