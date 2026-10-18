/* eslint-disable @typescript-eslint/no-require-imports -- Static route security regression checks. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const routeDirectory = path.join(root, 'src/app/ops');
const pages = [];
function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(full);
    else if (entry.name === 'page.tsx' && full !== path.join(routeDirectory, 'page.tsx')) pages.push(full);
  }
}
collect(routeDirectory);

test('every internal operations desk requires a signed session on direct URL access', () => {
  assert.ok(pages.length > 0);
  for (const page of pages) {
    const source = fs.readFileSync(page, 'utf8');
    assert.match(source, /await requireOperationsSession\(\)/, `${path.relative(root, page)} guards direct access`);
  }
  const layout = fs.readFileSync(path.join(routeDirectory, 'layout.tsx'), 'utf8');
  assert.match(layout, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
});
