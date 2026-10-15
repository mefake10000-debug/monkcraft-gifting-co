#!/usr/bin/env node
/**
 * Safe catalogue import / update validation (preview only).
 *
 * Does NOT write into the production-facing catalogue.
 * Does NOT delete, overwrite, or invent product records.
 *
 * Usage:
 *   node scripts/catalogue-validate.mjs
 *   node scripts/catalogue-validate.mjs --source /path/to/products.json
 *   node scripts/catalogue-validate.mjs --source ./incoming.csv --format csv
 *
 * Exit codes: 0 = ok (warnings allowed), 1 = blocking errors, 2 = usage error
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { source: null, format: "auto", help: false };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") out.help = true;
    else if (arg === "--source" || arg === "-s") out.source = argv[++i];
    else if (arg === "--format" || arg === "-f") out.format = argv[++i];
    else if (!arg.startsWith("-") && !out.source) out.source = arg;
  }
  return out;
}

function defaultExportPath() {
  if (process.env.MONKCRAFT_EXPORT_DATA) {
    return path.resolve(process.env.MONKCRAFT_EXPORT_DATA, "products.json");
  }
  const local = path.join(ROOT, "src/data/catalogue/export/products.json");
  if (fs.existsSync(local)) return local;
  return path.resolve(ROOT, "../monkcraft/website-export/data/products.json");
}

function detectFormat(filePath, forced) {
  if (forced && forced !== "auto") return forced;
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".json") return "json";
  if (ext === ".csv") return "csv";
  if (ext === ".xlsx" || ext === ".xls") return "xlsx-unsupported";
  return "unknown";
}

/** Minimal CSV parser (quoted fields supported). No new dependencies. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n" || (ch === "\r" && next === "\n")) {
      if (ch === "\r") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    if (ch === "\r") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim());
  return rows.slice(1).filter((r) => r.some((c) => c.trim())).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = r[idx] ?? "";
    });
    return obj;
  });
}

function loadProducts(filePath, format) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (format === "json") {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return { schemaVersion: null, products: data };
    return {
      schemaVersion: data.schemaVersion ?? null,
      products: data.products ?? [],
    };
  }
  if (format === "csv") {
    return { schemaVersion: null, products: parseCsv(raw) };
  }
  throw new Error(`Unsupported format: ${format}`);
}

function asProduct(row) {
  // Accept export JSON shape or flat CSV columns
  if (row.slug && row.sku && (row.title || row.name)) {
    return {
      slug: String(row.slug).trim(),
      sku: String(row.sku).trim(),
      title: String(row.title || row.name).trim(),
      pricingAmount:
        row.pricing?.amount ??
        (row.price != null && row.price !== "" ? Number(row.price) : null) ??
        (row.amount != null && row.amount !== "" ? Number(row.amount) : null),
      categorySlug: row.category?.slug || row.categorySlug || row.category || "",
      subcategorySlug:
        row.subcategory?.slug || row.subcategorySlug || row.subcategory || "",
      imageCount: Array.isArray(row.images) ? row.images.length : Number(row.imageCount || 0),
      moq:
        row.availability?.minimumOrderQuantity ??
        row.availability?.moq ??
        (row.moq != null && row.moq !== "" ? Number(row.moq) : null),
      status: row.availability?.status || row.status || "",
    };
  }
  return null;
}

function validate(products, meta) {
  const errors = [];
  const warnings = [];
  const skus = new Map();
  const slugs = new Map();

  if (!products.length) {
    errors.push("No products found in source.");
  }

  let withPrice = 0;
  let quoteOrMissingPrice = 0;
  let withImages = 0;
  let withMoq = 0;

  products.forEach((raw, index) => {
    const p = asProduct(raw);
    const rowLabel = `row ${index + 1}`;
    if (!p) {
      errors.push(`${rowLabel}: unrecognised shape (need sku, slug, title/name)`);
      return;
    }
    if (!p.sku) errors.push(`${rowLabel}: missing sku`);
    if (!p.slug) errors.push(`${rowLabel}: missing slug`);
    if (!p.title) errors.push(`${rowLabel}: missing title/name`);

    if (p.sku) {
      if (skus.has(p.sku)) {
        errors.push(
          `Duplicate SKU "${p.sku}" at ${rowLabel} and ${skus.get(p.sku)}`,
        );
      } else skus.set(p.sku, rowLabel);
    }
    if (p.slug) {
      if (slugs.has(p.slug)) {
        errors.push(
          `Duplicate slug "${p.slug}" at ${rowLabel} and ${slugs.get(p.slug)}`,
        );
      } else slugs.set(p.slug, rowLabel);
    }

    const amount = p.pricingAmount;
    if (amount == null || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      quoteOrMissingPrice += 1;
      warnings.push(
        `${rowLabel} (${p.sku || p.slug}): price missing/non-positive → must map to quote, never ₹0`,
      );
    } else {
      withPrice += 1;
    }

    if (p.imageCount > 0) withImages += 1;
    else warnings.push(`${rowLabel} (${p.sku || p.slug}): no images`);

    if (p.moq != null && Number(p.moq) > 0) withMoq += 1;
    if (!p.categorySlug) {
      warnings.push(`${rowLabel} (${p.sku || p.slug}): missing category`);
    }
  });

  return {
    meta,
    summary: {
      productCount: products.length,
      uniqueSkus: skus.size,
      uniqueSlugs: slugs.size,
      withVerifiedPrice: withPrice,
      quoteOrMissingPrice,
      withImages,
      withMoq,
    },
    errors: errors.slice(0, 200),
    warnings: warnings.slice(0, 200),
    truncatedErrors: errors.length > 200,
    truncatedWarnings: warnings.length > 200,
    errorCount: errors.length,
    warningCount: warnings.length,
  };
}

function printReport(report, sourcePath) {
  console.log("\n=== Monkcraft catalogue validation (preview only) ===");
  console.log(`Source: ${sourcePath}`);
  if (report.meta.schemaVersion) {
    console.log(`Schema: ${report.meta.schemaVersion}`);
  }
  console.log("\nSummary:");
  for (const [k, v] of Object.entries(report.summary)) {
    console.log(`  ${k}: ${v}`);
  }
  console.log(`\nErrors (${report.errorCount}):`);
  if (!report.errors.length) console.log("  (none)");
  else report.errors.forEach((e) => console.log(`  - ${e}`));
  if (report.truncatedErrors) console.log("  … truncated");

  console.log(`\nWarnings (${report.warningCount}, showing up to 200):`);
  if (!report.warnings.length) console.log("  (none)");
  else report.warnings.slice(0, 40).forEach((w) => console.log(`  - ${w}`));
  if (report.warningCount > 40) {
    console.log(`  … ${report.warningCount - 40} more`);
  }

  console.log("\nSafe update strategy (manual approval required):");
  console.log("  1. Match incoming rows by SKU (stable id).");
  console.log("  2. Preview field diffs; never silent mass overwrite.");
  console.log("  3. Preserve unknown fields; do not invent prices/specs.");
  console.log("  4. Do not auto-import unverified rows into the live catalogue.");
  console.log("====================================================\n");
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(`Usage: node scripts/catalogue-validate.mjs [--source path] [--format json|csv]`);
    process.exit(0);
  }

  const sourcePath = path.resolve(args.source || defaultExportPath());
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source not found: ${sourcePath}`);
    console.error("Set MONKCRAFT_EXPORT_DATA or pass --source.");
    process.exit(2);
  }

  const format = detectFormat(sourcePath, args.format);
  if (format === "xlsx-unsupported") {
    console.error(
      "XLSX detected. Export to CSV/JSON first — no XLSX dependency is installed (approval required to add one).",
    );
    process.exit(2);
  }
  if (format === "unknown") {
    console.error("Could not detect format. Pass --format json|csv");
    process.exit(2);
  }

  try {
    const { schemaVersion, products } = loadProducts(sourcePath, format);
    const report = validate(products, { schemaVersion });
    printReport(report, sourcePath);
    process.exit(report.errorCount > 0 ? 1 : 0);
  } catch (err) {
    console.error("Validation failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
