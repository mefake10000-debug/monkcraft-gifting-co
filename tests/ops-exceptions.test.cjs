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

const { buildOperationsExceptions } = require('../src/lib/automation/exceptions.ts');

test('operations exceptions include unowned leads, failed syncs, supplier blockers, and late fulfilment with desk links', () => {
  const now = new Date('2026-10-20T12:00:00.000Z');
  const exceptions = buildOperationsExceptions({
    leads: [
      { id: 'lead-1', status: 'New', owner: null, next_action: null, next_action_at: null, created_at: '2026-10-19T12:00:00.000Z' },
      { id: 'lead-2', status: 'Won', owner: null, next_action: null, next_action_at: null, created_at: '2026-10-19T12:00:00.000Z' },
    ],
    syncRecords: [{ kind: 'lead', id: 'lead-3', label: 'Lead 3', status: 'failed', error: 'Notion 503', updated_at: '2026-10-20T11:00:00.000Z', href: '/ops/leads' }],
    orders: [],
    supplierChecks: [{ id: 'check-1', request_id: 'lead-1', supplier_name: null, status: 'Needs mapping', availability: 'Unknown', created_at: '2026-10-20T10:00:00.000Z' }],
    milestones: [{ id: 'mile-1', order_id: 'order-1', order_code: 'MC-001', stage: 'Customization', status: 'Blocked', owner: null, due_at: '2026-10-19T12:00:00.000Z' }],
    shipments: [], finance: [], customerCare: [], outbox: [],
  }, now);
  assert.deepEqual(exceptions.map((item) => item.code), ['lead_ownership', 'notion_sync_failed', 'supplier_mapping', 'milestone_blocked']);
  assert.ok(exceptions.every((item) => item.href.startsWith('/ops/')));
  assert.equal(exceptions.find((item) => item.code === 'lead_ownership').owner, 'Unassigned');
  assert.equal(exceptions.find((item) => item.code === 'notion_sync_failed').summary.includes('Notion 503'), true);
});

test('operations exceptions ignore healthy or resolved records and flag only overdue service, delivery, finance, and retry work', () => {
  const now = new Date('2026-10-20T12:00:00.000Z');
  const exceptions = buildOperationsExceptions({
    leads: [],
    orders: [],
    syncRecords: [
      { kind: 'content', id: 'content-1', label: 'Draft', status: 'synced', error: null, updated_at: '2026-10-20T11:00:00.000Z', href: '/ops/content' },
      { kind: 'content', id: 'content-2', label: 'Old draft', status: 'pending', error: null, updated_at: '2026-10-19T11:00:00.000Z', href: '/ops/content' },
    ],
    supplierChecks: [{ id: 'check-1', request_id: 'lead-1', supplier_name: 'Vendor A', status: 'Sent', availability: 'Unknown', created_at: '2026-10-17T12:00:00.000Z' }],
    milestones: [],
    shipments: [{ id: 'ship-1', order_id: 'order-1', order_code: 'MC-001', shipment_code: 'S-001', status: 'Exception', exception_notes: 'Address mismatch', updated_at: '2026-10-20T11:00:00.000Z' }],
    finance: [{ id: 'finance-1', order_code: 'MC-002', document_type: 'Invoice', status: 'Mismatch', notes: 'Amounts differ', updated_at: '2026-10-20T10:00:00.000Z' }],
    customerCare: [
      { id: 'care-1', title: 'Old complaint', status: 'Escalated', owner: null, due_at: '2026-10-19T10:00:00.000Z', updated_at: '2026-10-18T10:00:00.000Z' },
      { id: 'care-2', title: 'Resolved case', status: 'Resolved', owner: 'Sam', due_at: '2026-10-19T10:00:00.000Z', updated_at: '2026-10-18T10:00:00.000Z' },
    ],
    outbox: [{ id: 'outbox-1', event_type: 'quote_request.prepare_supplier_checks', status: 'pending', attempts: 4, last_error: 'Timeout', created_at: '2026-10-19T10:00:00.000Z' }],
  }, now);
  assert.deepEqual(exceptions.map((item) => item.code), ['supplier_reply_late', 'shipment_exception', 'finance_mismatch', 'customer_care_escalated', 'outbox_retry_exhausted']);
  assert.ok(exceptions.every((item) => item.severity === 'high' || item.severity === 'critical'));
});

test('a supplier send failure is labelled for manual provider reconciliation and never suggests an automatic resend', () => {
  const exceptions = buildOperationsExceptions({
    leads: [], syncRecords: [],
    orders: [],
    supplierChecks: [{ id: 'check-send', request_id: 'lead-1', supplier_name: 'Vendor A', status: 'Clarification needed', availability: 'Unknown', whatsapp_send_error: 'provider acceptance was ambiguous', created_at: '2026-10-20T10:00:00.000Z' }],
    milestones: [], shipments: [], finance: [], customerCare: [], outbox: [],
  }, new Date('2026-10-20T12:00:00.000Z'));
  assert.equal(exceptions[0].code, 'supplier_send_reconcile');
  assert.match(exceptions[0].summary, /provider acceptance was ambiguous/);
  assert.match(exceptions[0].nextAction, /reconcile.*Meta/);
});

test('orders on hold or past their promised delivery date are raised for fulfilment review', () => {
  const exceptions = buildOperationsExceptions({
    leads: [], orders: [
      { id: 'order-hold', order_code: 'MC-HOLD', status: 'On hold', promised_delivery_date: null },
      { id: 'order-late', order_code: 'MC-LATE', status: 'Dispatch', promised_delivery_date: '2026-10-19' },
      { id: 'order-done', order_code: 'MC-DONE', status: 'Delivered', promised_delivery_date: '2026-10-19' },
    ], syncRecords: [], supplierChecks: [], milestones: [], shipments: [], finance: [], customerCare: [], outbox: [],
  }, new Date('2026-10-20T12:00:00.000Z'));
  assert.deepEqual(exceptions.map((item) => item.code), ['order_on_hold', 'order_delivery_overdue']);
});
