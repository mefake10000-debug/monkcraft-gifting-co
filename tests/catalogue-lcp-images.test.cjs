/* eslint-disable @typescript-eslint/no-require-imports -- Node's built-in test runner uses CommonJS here. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("only the first two above-fold catalogue images load eagerly", () => {
  const shell = read("src/components/catalogue/CatalogueShell.tsx");
  const card = read("src/components/catalogue/ProductCard.tsx");

  assert.match(shell, /props\.products\.map\(\(product,index\)=>[\s\S]*?eagerImage=\{index<2\}/);
  assert.match(card, /eagerImage\?:\s*boolean/);
  assert.match(card, /loading=\{eagerImage\s*\?\s*["']eager["']\s*:\s*["']lazy["']\}/);
});
