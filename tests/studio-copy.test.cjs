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
const { BrandingCanvas } = require("../src/components/studio/BrandingCanvas.tsx");
const catalogueBuilderPath = path.join(process.cwd(), "src/components/studio/CatalogueBuilder.tsx");
const catalogueBuilderSource = fs.readFileSync(catalogueBuilderPath, "utf8");
const studioCss = fs.readFileSync(path.join(process.cwd(), "src/app/studio/studio.css"), "utf8");
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
