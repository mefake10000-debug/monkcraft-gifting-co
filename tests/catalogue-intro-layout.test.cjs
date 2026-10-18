/* eslint-disable @typescript-eslint/no-require-imports -- Render the real catalogue intro in the Node test runner. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const Module = require("node:module");
const ts = require("typescript");

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return originalResolve.call(this, id.startsWith("@/") ? path.join(process.cwd(), "src", id.slice(2)) : id, ...args);
};
require.extensions[".ts"] = (mod, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  mod._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename);
};
require.extensions[".tsx"] = (mod, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  mod._compile(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
};

const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { CatalogueIntro } = require("../src/components/catalogue/CatalogueIntro.tsx");

test("catalogue title, guidance and price note stay grouped beside the Build a Box action", () => {
  const html = renderToStaticMarkup(React.createElement(CatalogueIntro));
  const copy = html.match(/<div class="browse-intro__copy">([\s\S]*?)<\/div>/)?.[1] ?? "";

  assert.match(copy, /<h1[^>]*>Gifts worth giving\.<\/h1>/);
  assert.match(copy, /Find something thoughtful/);
  assert.match(copy, /Prices are indicative/);
  assert.match(html, /<a[^>]*class="browse-intro__box-cta"/);
  assert.ok(html.indexOf("browse-intro__copy") < html.indexOf("browse-intro__box-cta"));
});
