/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner with isolated TS loader. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return resolve.call(this, id.startsWith('@/') ? path.join(process.cwd(), 'src', id.slice(2)) : id, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);

const { validateAgentRunReview } = require('../src/lib/automation/agentFeedback.ts');

test('agent review rejects invalid decisions and requires correction evidence for rejected runs', () => {
  const base = { id: '123e4567-e89b-42d3-a456-426614174000', reviewer: 'Ops Reviewer' };
  assert.equal(validateAgentRunReview({ ...base, status: 'Rejected' }).ok, false);
  const rejected = validateAgentRunReview({ ...base, status: 'Rejected', humanCorrection: 'Ask for a confirmed date.', correctionReason: 'The supplier response omitted delivery timing.' });
  assert.equal(rejected.ok, true);
  assert.equal(rejected.value.status, 'Rejected');
  assert.equal(validateAgentRunReview({ ...base, status: 'Needs review', outcome: 'Looks fine' }).ok, false);
});

test('approved, completed, and failed agent runs require a human-recorded outcome', () => {
  const base = { id: '123e4567-e89b-42d3-a456-426614174000', reviewer: 'Ops Reviewer' };
  for (const status of ['Approved', 'Completed', 'Failed']) {
    assert.equal(validateAgentRunReview({ ...base, status }).ok, false);
    const result = validateAgentRunReview({ ...base, status, outcome: `Reviewed ${status.toLowerCase()} result.` });
    assert.equal(result.ok, true);
    assert.equal(result.value.status, status);
  }
});
