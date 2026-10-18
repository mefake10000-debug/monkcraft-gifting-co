#!/usr/bin/env node
/**
 * Verify the actual logo assets rendered by the homepage brand marquee.
 * Brands without a verified local mark are intentionally omitted by the
 * runtime resolver, so this checks rendered marks rather than stale candidates.
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);
require("./register-ts-hook.cjs");
const Module = require("node:module");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  const resolved = request.startsWith("@/")
    ? path.join(ROOT, "src", request.slice(2))
    : request;
  return originalResolve.call(this, resolved, ...args);
};

const { getHomepagePartnerBrands } = require("../src/data/partnerBrands.ts");
const brands = getHomepagePartnerBrands();
const present = [];
const missing = [];

for (const brand of brands) {
  if (!brand.src) continue;
  const file = path.join(ROOT, "public", brand.src.replace(/^\//, ""));
  (fs.existsSync(file) ? present : missing).push({ ...brand, file });
}

console.log("Logo assets used by the active homepage marquee");
console.log(`Present: ${present.length} / ${brands.length}`);
console.log(`Missing: ${missing.length} / ${brands.length}`);
console.log("");

for (const brand of present) {
  console.log(`  ✓ ${brand.name} → ${path.relative(ROOT, brand.file)}`);
}

if (missing.length) {
  console.log("\nMissing assets:");
  for (const brand of missing) {
    console.log(`  ✗ ${brand.name} → ${brand.src}`);
  }
  process.exitCode = 1;
}
