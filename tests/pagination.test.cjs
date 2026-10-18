/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner with an isolated TypeScript require hook. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return resolve.call(this, id.startsWith('@/') ? path.join(process.cwd(), 'src', id.slice(2)) : id, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, file);

test('pagination numbers provide nearby pages and first/last access', () => {
  const { getPaginationItems } = require('../src/lib/pagination.ts');
  assert.deepEqual(getPaginationItems(1, 10), [1, 2, 3, 4, 5, 'ellipsis', 10]);
  assert.deepEqual(getPaginationItems(5, 10), [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  assert.deepEqual(getPaginationItems(10, 10), [1, 'ellipsis', 6, 7, 8, 9, 10]);
  assert.deepEqual(getPaginationItems(2, 4), [1, 2, 3, 4]);
});
