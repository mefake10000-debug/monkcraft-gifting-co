/**
 * Resolve the Monkcraft website-export data directory.
 * Priority:
 * 1. MONKCRAFT_EXPORT_DATA env
 * 2. Repo-local symlink/dir: src/data/catalogue/export
 * 3. Sibling folder: ../monkcraft/website-export/data
 */

import fs from "node:fs";
import path from "node:path";

function candidatePaths(): string[] {
  const candidates: string[] = [];
  if (process.env.MONKCRAFT_EXPORT_DATA) {
    candidates.push(path.resolve(process.env.MONKCRAFT_EXPORT_DATA));
  }
  candidates.push(
    path.resolve(process.cwd(), "src/data/catalogue/export"),
    path.resolve(process.cwd(), "../monkcraft/website-export/data"),
  );
  return candidates;
}

export function getExportDataDir(): string {
  for (const candidate of candidatePaths()) {
    if (fs.existsSync(path.join(candidate, "products.json"))) {
      return candidate;
    }
  }
  // Default expectation for local Monkcraft workspace layout
  return path.resolve(process.cwd(), "../monkcraft/website-export/data");
}

export function getExportMediaPublicPrefix(): string {
  return "/catalogue-media";
}

export function getExportSchemaVersion(): string | undefined {
  const filePath = path.join(getExportDataDir(), "products.json");
  if (!fs.existsSync(filePath)) return undefined;
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    // Read only the leading meta without parsing the full 19MB when possible
    const match = raw.slice(0, 400).match(/"schemaVersion"\s*:\s*"([^"]+)"/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

export function isExportDataAvailable(): boolean {
  return fs.existsSync(path.join(getExportDataDir(), "products.json"));
}
