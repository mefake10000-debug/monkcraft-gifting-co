/* eslint-disable @typescript-eslint/no-require-imports -- Read the release probe contract as text. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const script = fs.readFileSync(
  path.join(process.cwd(), "scripts/launch-regression.mjs"),
  "utf8",
);

test("launch regression uses the storage readiness API and never posts a synthetic lead when ready", () => {
  assert.match(script, /storageConfigured/);
  assert.match(script, /storage_not_configured/);
  assert.match(script, /if \(enquiryStorageReady\)\s*\{\s*return \{ skip: "storage is configured; avoid creating a synthetic lead" \};/);
  assert.doesNotMatch(script, /deliveryConfigured|delivery_not_configured/);
});
