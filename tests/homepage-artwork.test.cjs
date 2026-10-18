/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS matches the repository's node:test suite. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

test("gift idea cards crop embedded poster copy before repeating UI text", () => {
  const css = fs.readFileSync(path.join(root, "src/app/globals.css"), "utf8");
  const component = fs.readFileSync(path.join(root, "src/components/GiftIdeas.tsx"), "utf8");
  const imageRules = css.match(/\.gift-ideas__image\s*\{[^}]*\}/)?.[0] ?? "";
  const mediaRules = css.match(/\.gift-ideas__media\s*\{[^}]*\}/)?.[0] ?? "";

  assert.match(imageRules, /object-fit:\s*cover/);
  assert.match(imageRules, /object-position:\s*center\s+bottom/);
  assert.match(mediaRules, /aspect-ratio:\s*1920\s*\/\s*700/);
  assert.doesNotMatch(component, /objectFit:\s*"contain"/);
});
