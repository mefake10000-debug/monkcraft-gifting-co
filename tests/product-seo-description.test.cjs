/* eslint-disable @typescript-eslint/no-require-imports -- Load the TypeScript utility directly in node:test. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const test = require("node:test");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(compiled.outputText, filename);
};

const helperPath = path.join(__dirname, "..", "src/lib/seoText.ts");

test("long product meta descriptions end at a word boundary", () => {
  assert.ok(fs.existsSync(helperPath), "SEO text helper exists");
  const { truncateMetaDescription } = require(helperPath);
  const source = "This description has a complete sentence, then a very long detail about volume pricing for teams that need corporate gifts, custom branded merchandise, welcome kits, company stores, and careful shipment planning across multiple office locations with confirmation before a delivery date is promised.";
  const result = truncateMetaDescription(source);

  assert.ok(result.length <= 160);
  assert.match(result, /…$/);
  assert.equal(source[result.length - 1], " ", "the last included character ends a complete word");
});

test("short product meta descriptions remain unchanged", () => {
  assert.ok(fs.existsSync(helperPath), "SEO text helper exists");
  const { truncateMetaDescription } = require(helperPath);
  assert.equal(truncateMetaDescription("A useful branded notebook."), "A useful branded notebook.");
});
