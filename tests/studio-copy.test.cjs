/* eslint-disable @typescript-eslint/no-require-imports -- Render the real Studio component in the Node test runner. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const path = require("node:path");

const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return resolve.call(
    this,
    id.startsWith("@/") ? path.join(process.cwd(), "src", id.slice(2)) : id,
    ...args,
  );
};
require.extensions[".ts"] = (mod, file) => {
  const source = fs.readFileSync(file, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });
  mod._compile(result.outputText, file);
};
require.extensions[".tsx"] = (mod, file) => {
  const source = fs.readFileSync(file, "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });
  mod._compile(result.outputText, file);
};

const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { BrandingCanvas, focusBrandingTarget } = require("../src/components/studio/BrandingCanvas.tsx");
const catalogueBuilderPath = path.join(process.cwd(), "src/components/studio/CatalogueBuilder.tsx");
const catalogueBuilderSource = fs.readFileSync(catalogueBuilderPath, "utf8");
const studioCss = fs.readFileSync(path.join(process.cwd(), "src/app/studio/studio.css"), "utf8");
const studioPageSource = fs.readFileSync(path.join(process.cwd(), "src/app/studio/page.tsx"), "utf8");
const brandingEditorSource = fs.readFileSync(path.join(process.cwd(), "src/components/studio/BrandingEditor.tsx"), "utf8");
const { focusStudioCatalogueStepHeading } = require("../src/components/studio/CatalogueBuilder.tsx");

test("Studio empty preview gives device-neutral, concise setup guidance", () => {
  const html = renderToStaticMarkup(
    React.createElement(BrandingCanvas, {
      transform: { x: 0.5, y: 0.5, scale: 0.28, rotation: 0 },
      onTransformChange: () => {},
    }),
  );

  assert.match(
    html,
    /Choose a product from the catalogue, then upload your logo\./,
  );
  assert.doesNotMatch(html, /on the right/i);
  assert.equal((html.match(/not a print proof/gi) || []).length, 1);
});

test("Studio quick controls scroll to and focus the exact setting", () => {
  const calls = [];
  const control = {
    scrollIntoView: (options) => calls.push(["scroll", options]),
    focus: (options) => calls.push(["focus", options]),
  };
  const root = {
    getElementById: (id) => id === "studio-logo-size" ? control : null,
    defaultView: { matchMedia: () => ({ matches: true }) },
  };

  assert.equal(typeof focusBrandingTarget, "function");
  if (typeof focusBrandingTarget !== "function") return;
  assert.equal(focusBrandingTarget("studio-logo-size", root), true);
  assert.deepEqual(calls, [
    ["scroll", { behavior: "auto", block: "center" }],
    ["focus", { preventScroll: true }],
  ]);
  assert.equal(focusBrandingTarget("missing-setting", root), false);
});

test("Studio logo preview exposes a stable target for the placement shortcut", () => {
  const html = renderToStaticMarkup(React.createElement(BrandingCanvas, {
    logoDataUrl: "data:image/png;base64,AA==",
    transform: { x: 0.5, y: 0.5, scale: 0.28, rotation: 0 },
    onTransformChange: () => {},
  }));
  assert.match(html, /id="studio-logo-position"/);
});

test("company swag is a separate Monkcraft concept range, not catalogue products", () => {
  const concepts = require("../src/data/catalogue/swagConcepts.ts").SWAG_CONCEPTS;
  assert.ok(concepts.length >= 15);
  assert.ok(concepts.some((item) => /pen/i.test(item.name)));
  assert.ok(concepts.some((item) => /hoodie/i.test(item.name)));
  assert.ok(concepts.some((item) => /apron/i.test(item.name)));
  assert.ok(concepts.some((item) => /notebook/i.test(item.name)));
  assert.ok(concepts.some((item) => /backpack|pack/i.test(item.name)));
  assert.ok(concepts.some((item) => /mug/i.test(item.name)));
  assert.ok(concepts.every((item) => item.price === ""));
  assert.match(concepts[0].specNote, /concept/i);
  for (const item of concepts) {
    assert.ok(item.image.startsWith("/marketing/swag-concepts/"));
    assert.ok(fs.existsSync(path.join(process.cwd(), "public", item.image.slice(1))), `${item.name} has its own mockup image`);
  }
});

test("Studio puts plain black-and-white company swag after the client catalogue", () => {
  const shell = fs.readFileSync(path.join(process.cwd(), "src/components/studio/StudioShell.tsx"), "utf8");
  const swag = fs.readFileSync(path.join(process.cwd(), "src/components/studio/SwagStarter.tsx"), "utf8");
  const switcher = shell.slice(shell.indexOf('className="studio-switcher"'), shell.indexOf("</div>", shell.indexOf('className="studio-switcher"')));
  assert.ok(switcher.indexOf("Client catalogue") < switcher.indexOf("Company swag"));
  assert.match(swag, /Black|White/);
  assert.match(swag, /Product colour/);
  assert.doesNotMatch(swag, /Logo placement|Logo size|Logo angle|Personalise|Monkcraft-\$\{colour\}-Logomark\.png/);
  assert.match(swag, /Plain, unbranded mockup/i);
  assert.doesNotMatch(swag, /fetchStudioProducts|Catalogue brand:/);
});

test("company swag deep links preserve the mode and seed the official Monkcraft mark", () => {
  assert.match(studioPageSource, /modeParam === "swag"[\s\S]*?\? "swag"/);
  assert.match(studioPageSource, /seedMonkcraftLogo=\{first\(params\.logo\) === "monkcraft"\}/);
  assert.match(brandingEditorSource, /seedMonkcraftLogo/);
  assert.match(brandingEditorSource, /loadMonkcraftLogoAsset\("Black"\)/);
});

test("Studio product colour selection updates the preview and exported mockup", () => {
  assert.match(brandingEditorSource, /product\.imageVariants\.map/);
  assert.match(brandingEditorSource, /setActiveImage\(\{ productId: product\.id, src: variant\.imageSrc/);
  assert.match(brandingEditorSource, /productImageSrc,\s*logoDataUrl:/);
  assert.match(studioCss, /\.studio-colour-picker__option--active/);
});

test("catalogue builder step changes focus and scroll the new heading without focusing on mount", () => {
  const calls = [];
  const heading = {
    setAttribute: (...args) => calls.push(["setAttribute", ...args]),
    focus: (...args) => calls.push(["focus", ...args]),
    scrollIntoView: (...args) => calls.push(["scrollIntoView", ...args]),
  };
  focusStudioCatalogueStepHeading({ querySelector: () => heading });
  assert.deepEqual(calls, [
    ["setAttribute", "tabindex", "-1"],
    ["focus", { preventScroll: true }],
    ["scrollIntoView", { block: "center", behavior: "smooth" }],
  ]);
  assert.match(catalogueBuilderSource, /aria-current=\{step === id \? "step" : undefined\}/);
  assert.match(catalogueBuilderSource, /if \(previousStepRef\.current === step\) return/);
  assert.match(catalogueBuilderSource, /focusStudioCatalogueStepHeading\(stepPanelRef\.current\)/);
  assert.match(catalogueBuilderSource, /ref=\{stepPanelRef\}/);
});

test("empty quote import gives inline accessible feedback instead of a blocking alert", () => {
  assert.doesNotMatch(catalogueBuilderSource, /window\.alert\(/);
  assert.match(catalogueBuilderSource, /const \[importError, setImportError\] = useState\(""\)/);
  assert.match(catalogueBuilderSource, /role="alert"[^>]*>[\s\S]*importError/);
});

test("mobile Studio product picker uses page scrolling while retaining the two-column grid", () => {
  assert.match(studioCss, /@media \(max-width: 560px\)[\s\S]*?\.studio-picker__list\s*\{[^}]*max-height:\s*none;[^}]*overflow:\s*visible;/);
  assert.match(studioCss, /@media \(max-width: 960px\)\s*\{\s*\.studio-picker__list\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/);
});

test("logo adjustment guidance is compact and white swag previews retain visible shape", () => {
  assert.match(brandingEditorSource, /studio-branding-options__shortcut/);
  assert.doesNotMatch(brandingEditorSource, /studio-branding-options["] aria-label="Jump to a branding control"[\s\S]*?<small>/);
  assert.doesNotMatch(studioCss, /\.studio-swag-card__product--white\s*\{[^}]*brightness\(0\)/);
  assert.match(studioCss, /\.studio-swag-card__visual--white\s*\{[^}]*#(?:5|6|7|8)[0-9a-f]{5}/i);
});
