/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner loads the real TSX page through TypeScript. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const test = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const originalLoad = Module._load;
const originalResolve = Module._resolveFilename;
const originalExtensions = { '.ts': require.extensions['.ts'], '.tsx': require.extensions['.tsx'] };
let CompanyStoresLandingPage;
let StoreAdminShell;
let focusCompanyStorePanelHeading;
let focusCompanyStoreCatalogueResult;
let revealCompanyStoreStep;
let buildCompanyStoreCataloguePageHref;
let parseCompanyStoreCataloguePage;
let emptyCompanyStoreDraft;
let mockView = 'branding';
let mockDraft = null;

try {
  Module._resolveFilename = function (id, ...args) {
    return originalResolve.call(this, id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : id, ...args);
  };
  for (const extension of ['.ts', '.tsx']) {
    require.extensions[extension] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText, file);
  }
  emptyCompanyStoreDraft = require('../src/data/companyStore/types.ts').emptyCompanyStoreDraft;
  Module._load = function (request, parent, isMain) {
    if (request === 'next/navigation') {
      return {
        useRouter: () => ({ push() {} }),
        useSearchParams: () => new URLSearchParams(`view=${mockView}`),
      };
    }
    if (request === '@/lib/companyStore/useStoreDraft') {
      return { useStoreDraft: () => ({ draft: mockDraft || emptyCompanyStoreDraft(), ready: true }) };
    }
    return originalLoad.call(this, request, parent, isMain);
  };
  StoreAdminShell = require('../src/components/company-store/StoreAdminShell.tsx').StoreAdminShell;
  focusCompanyStorePanelHeading = require('../src/components/company-store/StoreAdminShell.tsx').focusCompanyStorePanelHeading;
  focusCompanyStoreCatalogueResult = require('../src/components/company-store/StoreAdminShell.tsx').focusCompanyStoreCatalogueResult;
  revealCompanyStoreStep = require('../src/components/company-store/StoreAdminShell.tsx').revealCompanyStoreStep;
  buildCompanyStoreCataloguePageHref = require('../src/components/company-store/StoreAdminShell.tsx').buildCompanyStoreCataloguePageHref;
  parseCompanyStoreCataloguePage = require('../src/components/company-store/StoreAdminShell.tsx').parseCompanyStoreCataloguePage;
  CompanyStoresLandingPage = require('../src/app/company-stores/page.tsx').default;
  Module._load = originalLoad;
} finally {
  Module._load = originalLoad;
  Module._resolveFilename = originalResolve;
  for (const [extension, handler] of Object.entries(originalExtensions)) {
    if (handler) require.extensions[extension] = handler;
    else delete require.extensions[extension];
  }
}

function pageElements() {
  const elements = [];
  function visit(node) {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== 'object' || !node.props) return;
    elements.push(node);
    visit(node.props.children);
  }
  visit(CompanyStoresLandingPage());
  return elements;
}

test('Company Stores offers one responsive Company Store film before the illustrated walkthrough', () => {
  const elements = pageElements();
  const films = elements.filter(element => element.type?.name === 'BrandVideoBand');
  assert.equal(films.length, 1, 'the landing page has one video band');
  const film = films[0];
  assert.equal(film.props.id, 'company-store-brief');
  assert.equal(film.props.src, '/videos/monkcraft-company-store-brief-mobile.mp4');
  assert.equal(film.props.desktopSrc, '/videos/monkcraft-company-store-brief-desktop.mp4');
  assert.ok(film.props.ariaLabel);
  for (const media of [film.props.src, film.props.desktopSrc, film.props.poster, film.props.desktopPoster]) {
    assert.ok(media && fs.existsSync(path.join(root, 'public', media)), `${media} exists`);
  }
  assert.ok(!elements.some(element => element.props.id === 'company-store-brand-film'), 'the repeated general brand film is omitted');
  const briefIndex = elements.findIndex(element => element.props.id === 'company-store-brief');
  const firstPosterIndex = elements.findIndex(element => element.props.src === '/marketing/company-stores/cs-merchandise-selection-v3.jpg');
  assert.ok(firstPosterIndex > briefIndex, 'the brief leads into the illustrated walkthrough');
});

test('Company Store demo explains draft behavior and live-system limits in concise language', () => {
  const banner = fs.readFileSync(path.join(root, 'src/components/company-store/StoreDemoBanner.tsx'), 'utf8');
  assert.match(banner, /Your draft stays in this browser/);
  assert.match(banner, /No live orders are created/);
  assert.match(banner, /Employee sign-in/);
  assert.match(banner, /Live credits, stock and order processing/);
  assert.doesNotMatch(banner, /DEMO \/ NOT LIVE/);
});

test('Company Stores keeps all four original walkthrough images with accessible descriptions', () => {
  const elements = pageElements();
  for (const image of ['cs-merchandise-selection-v3.jpg', 'cs-employee-access-v3.jpg', 'cs-ordering-fulfilment-v3.jpg', 'cs-store-branding-v3.jpg']) {
    const source = `/marketing/company-stores/${image}`;
    const poster = elements.find(element => element.props.src === source);
    assert.ok(poster, `${image} appears in the walkthrough`);
    assert.ok(poster.props.alt?.trim(), `${image} has a description`);
    assert.ok(fs.existsSync(path.join(root, 'public', source)), `${image} exists`);
  }
  assert.ok(elements.some(element => element.type?.name === 'StoreAdminShell'), 'the landing page renders the manager setup demo');
});

test('Company Stores opens the manager demo before the long overview media', () => {
  const elements = pageElements();
  const managerDemo = elements.findIndex(element => element.type?.name === 'StoreAdminShell');
  const overviewFilm = elements.findIndex(element => element.type?.name === 'BrandVideoBand');
  assert.ok(managerDemo >= 0, 'the company setup demo is embedded on the landing page');
  assert.ok(overviewFilm >= 0 && managerDemo < overviewFilm, 'the original Company Store video remains visible after direct manager setup');
  assert.ok(elements.some(element => element.props.id === 'company-demo'), 'the manager demo has a named section');
  assert.ok(!elements.some(element => element.type === 'details' && textContent(element).includes('Watch the Company Store overview')), 'the overview is not hidden behind a disclosure');
  const firstPoster = elements.findIndex(element => element.props.src === '/marketing/company-stores/cs-merchandise-selection-v3.jpg');
  assert.ok(firstPoster > overviewFilm, 'the original walkthrough images remain visible after the film');
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const html = renderToStaticMarkup(React.createElement(StoreAdminShell, { embedded: true }));
  assert.ok(elements.some(element => element.props.href === '/?interest=company-store#enquire'), 'the landing page offers one direct programme contact route');
  assert.ok(!html.includes('href="/?interest=company-store#enquire"'), 'embedded setup stays focused on the manager demo');
  assert.ok(!elements.some(element => element.type === 'h2' && textContent(element) === 'How a Company Store works'));
  assert.ok(!elements.some(element => element.type === 'h2' && textContent(element) === 'From interest to proposal'));
});

test('Company Stores has a clear page heading and direct manager-demo entry before the long overview media', () => {
  const elements = pageElements();
  const heading = elements.find(element => element.type === 'h1');
  assert.ok(heading, 'the page has one visible H1');
  assert.match(textContent(heading), /company store/i);
  const demoLink = elements.find(element => element.props.href === '#company-demo');
  assert.ok(demoLink, 'visitors can jump directly to the manager demo');
  assert.match(textContent(demoLink), /open company demo/i);
  const showcaseIndex = elements.findIndex(element => element.props.className?.includes('cs-company-landing__showcase'));
  const demoIndex = elements.findIndex(element => element.props.id === 'company-demo');
  assert.ok(elements.indexOf(heading) < demoIndex && demoIndex < showcaseIndex, 'the manager demo follows the page identity and precedes the overview media');
  assert.equal(elements.filter(element => element.type === 'h1').length, 1, 'the route has one page-level heading');
});

test('Gifts is one primary destination; Build a Box is launched from the catalogue segment', () => {
  const { PRIMARY_NAV } = require('../src/lib/nav.ts');
  const { BOX_CATALOGUE_HREF } = require('../src/lib/nav.ts');
  assert.ok(PRIMARY_NAV.some(item => item.href === '/gifts' && item.label === 'Catalogue'));
  assert.ok(!PRIMARY_NAV.some(item => item.href === '/gifts/box'), 'Build a Box is not separated as a top-level section');
  assert.equal(BOX_CATALOGUE_HREF, '/gifts/box');
  const intro = fs.readFileSync(path.join(root, 'src/components/catalogue/CatalogueIntro.tsx'), 'utf8');
  assert.match(intro, /href=\{BOX_CATALOGUE_HREF\}/);
  assert.match(intro, /Build a box/i);
});

test('manager setup progress separates three decisions from the employee presentation step', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  mockView = 'preview';
  const html = renderToStaticMarkup(React.createElement(StoreAdminShell));
  assert.match(html, /Setup progress · 0 of 3/);
  assert.match(html, /Check your setup, then give the team view its moment/);
  assert.match(html, /Add company name · 0 gifts/);
  assert.doesNotMatch(html, /Start fresh demo/);
});

test('embedded manager steps and preview return to the Company Stores landing page', () => {
  const source = fs.readFileSync(path.join(root, 'src/components/company-store/StoreAdminShell.tsx'), 'utf8');
  assert.match(source, /const routeBase = embedded \? "\/company-stores" : "\/company-stores\/configure"/);
  assert.match(source, /router\.push\(`\$\{routeBase\}\?/);
  assert.match(source, /const returnTo = `\$\{routeBase\}\?view=preview`/);
  assert.match(source, /summaryHref=\{summaryHref\}/);
  assert.doesNotMatch(source, /href="\/company-stores\/configure\?view=summary"/);
});

test('manager presentation embeds the employee storefront without an escape link back to setup', () => {
  const storefront = fs.readFileSync(path.join(root, 'src/components/company-store/EmployeeStorefront.tsx'), 'utf8');
  const banner = fs.readFileSync(path.join(root, 'src/components/company-store/StoreDemoBanner.tsx'), 'utf8');
  const productDetail = fs.readFileSync(path.join(root, 'src/components/company-store/EmployeeProductDetail.tsx'), 'utf8');
  const styles = fs.readFileSync(path.join(root, 'src/app/company-stores/company-stores.css'), 'utf8');
  assert.match(storefront, /searchParams\.get\("embed"\)/);
  assert.match(storefront, /showBackLink=\{!embedded\}/);
  assert.match(banner, /showBackLink\?: boolean/);
  assert.match(productDetail, /showBackLink=\{!embedded\}/);
  assert.match(storefront, /embedded \? "&embed=1"/);
  assert.match(productDetail, /embedded \? "&embed=1"/);
  assert.match(productDetail, /\{!embedded \? \(showcase \?/);
  assert.match(storefront, /\{embedded \? <p className="cs-field__hint">Choose gifts in the Gifts step/);
  assert.match(styles, /\.cs-storefront--embedded ~ \.site-footer\s*\{\s*display:\s*none;/);
});

test('manager view changes focus and scroll to the newly rendered panel heading', () => {
  const calls = [];
  const heading = {
    setAttribute: (...args) => calls.push(['setAttribute', ...args]),
    focus: (...args) => calls.push(['focus', ...args]),
    scrollIntoView: (...args) => calls.push(['scrollIntoView', ...args]),
  };
  const panel = {
    querySelector: (selector) => {
      assert.equal(selector, 'h2');
      return heading;
    },
  };

  focusCompanyStorePanelHeading(panel);

  assert.deepEqual(calls, [
    ['setAttribute', 'tabindex', '-1'],
    ['focus', { preventScroll: true }],
    ['scrollIntoView', { block: 'center', behavior: 'smooth' }],
  ]);

  const source = fs.readFileSync(path.join(root, 'src/components/company-store/StoreAdminShell.tsx'), 'utf8');
  assert.match(source, /const panelRef = useRef<HTMLDivElement>\(null\)/);
  assert.match(source, /focusCompanyStorePanelHeading\(panelRef\.current\)/);
  assert.match(source, /<div className="cs-admin__panel" ref=\{panelRef\}>/);
});

test('initial manager step reveal scrolls only its horizontal step rail', () => {
  const calls = [];
  const activeStep = {
    offsetWidth: 80,
    getBoundingClientRect: () => ({ left: 310 }),
  };
  const nav = {
    clientWidth: 240,
    scrollLeft: 60,
    getBoundingClientRect: () => ({ left: 100 }),
    querySelector: (selector) => {
      assert.equal(selector, '[aria-current="step"]');
      return activeStep;
    },
    scrollTo: (options) => calls.push(options),
    scrollIntoView: () => assert.fail('revealing a step must not scroll the page'),
  };

  revealCompanyStoreStep(nav, true);

  assert.deepEqual(calls, [{ left: 190, behavior: 'auto' }]);
});

test('company catalogue page links preserve setup params and add a history-addressable page', () => {
  assert.equal(
    buildCompanyStoreCataloguePageHref('/company-stores/configure', 'view=merchandise&fresh=3', 2),
    '/company-stores/configure?view=merchandise&fresh=3&cataloguePage=2',
  );
  assert.equal(
    buildCompanyStoreCataloguePageHref('/company-stores', 'view=merchandise&cataloguePage=2', 1),
    '/company-stores?view=merchandise',
  );
  assert.equal(parseCompanyStoreCataloguePage('2'), 2);
  assert.equal(parseCompanyStoreCataloguePage('0'), 1);
  assert.equal(parseCompanyStoreCataloguePage('invalid'), 1);
});

test('company catalogue page results focus and scroll the first product after data arrives', () => {
  const calls = [];
  const heading = {
    setAttribute: (...args) => calls.push(['setAttribute', ...args]),
    focus: (...args) => calls.push(['focus', ...args]),
    scrollIntoView: (...args) => calls.push(['scrollIntoView', ...args]),
  };
  focusCompanyStoreCatalogueResult(heading);
  assert.deepEqual(calls, [
    ['setAttribute', 'tabindex', '-1'],
    ['focus', { preventScroll: true }],
    ['scrollIntoView', { block: 'start', behavior: 'smooth' }],
  ]);
});

test('manager demo summary uses singular gift wording for one selected item', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  mockDraft = {
    ...emptyCompanyStoreDraft(),
    identity: { ...emptyCompanyStoreDraft().identity, companyName: 'Acme' },
    productIds: ['MGC-1'],
    categories: [{ id: 'cat-general', name: 'General', productIds: ['MGC-1'] }],
  };
  const html = renderToStaticMarkup(React.createElement(StoreAdminShell));
  assert.match(html, /Acme · 1 gift/);
  assert.doesNotMatch(html, /1 gifts/);
  const freshAction = html.indexOf('Start fresh demo');
  const tools = html.indexOf('<details class="cs-admin__tools">');
  assert.ok(freshAction >= 0 && freshAction < tools, 'a saved draft can be cleared without hunting in demo tools');
  mockDraft = null;
});

test('manager demo keeps proposal details available in a collapsed summary outside the setup form', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  mockView = 'preview';
  const html = renderToStaticMarkup(React.createElement(StoreAdminShell));
  const detailsIndex = html.indexOf('class="cs-admin__summary"');
  const summaryIndex = html.indexOf('Your store at a glance', detailsIndex);
  const formIndex = html.indexOf('class="cs-admin__panel"');
  assert.ok(detailsIndex >= 0, 'proposal summary remains available as a disclosure');
  assert.ok(summaryIndex > detailsIndex && summaryIndex < formIndex, 'summary sits above the setup form');
  assert.ok(!html.slice(detailsIndex, formIndex).includes('<details class="cs-admin__summary" open'), 'summary starts collapsed');
  assert.match(html, /aria-label="Company Store proposal steps"/);
  assert.match(html, /Open employee preview/);
  mockView = 'branding';
  const companyHtml = renderToStaticMarkup(React.createElement(StoreAdminShell));
  assert.match(companyHtml, /Continue to gifts/);
  assert.doesNotMatch(companyHtml, /Save &amp; choose gifts/);
  assert.equal((companyHtml.match(/Continue to gifts/g) || []).length, 1, 'the company form has one forward action');
});

function textContent(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (!node || typeof node !== 'object') return '';
  return textContent(node.props?.children);
}
