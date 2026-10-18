/* eslint-disable @typescript-eslint/no-require-imports -- Render the real header tool with the Node test runner. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const Module = require("node:module");
const ts = require("typescript");

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return originalResolve.call(
    this,
    id.startsWith("@/") ? path.join(process.cwd(), "src", id.slice(2)) : id,
    ...args,
  );
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
const { HeaderTools } = require("../src/components/HeaderTools.tsx");

test("header contact icon opens WhatsApp with a ready-to-review first message", () => {
  const html = renderToStaticMarkup(React.createElement(HeaderTools, { pathname: "/" }));
  const link = html.match(/<a[^>]*class="[^"]*mc-header-tools__call[^"]*"[^>]*>/)?.[0];

  assert.ok(link, "header contact link is rendered");
  assert.match(link, /href="https:\/\/wa\.me\/917483221188\?text=/);
  assert.match(link, /aria-label="Message Monkcraft on WhatsApp/);
  assert.doesNotMatch(html, /href="tel:/);
  assert.match(decodeURIComponent(link), /Hi Monkcraft.*corporate gifting/i);
});
