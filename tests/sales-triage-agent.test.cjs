/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.join(process.cwd(), 'supabase/migrations/202610170014_sales_triage_agent.sql');

test('new durable quote requests create one reviewable sales triage proposal transactionally', () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.match(sql, /create\s+or\s+replace\s+function\s+public\.propose_sales_triage\(\)/i);
  assert.match(sql, /after\s+insert\s+on\s+public\.quote_requests/i);
  assert.match(sql, /insert\s+into\s+public\.agent_runs/i);
  assert.match(sql, /'sales'\s*,\s*'quote_request_received'/i);
  assert.match(sql, /'Needs review'/i);
  assert.match(sql, /product_ids_missing/);
  assert.match(sql, /next_action/);
  assert.doesNotMatch(sql, /sendgrid|twilio|whatsapp.*send|http_post/i);
});

test('quote intake attempts triage Notion sync after durable save without making it a receipt gate', () => {
  const route = fs.readFileSync(path.join(process.cwd(), 'src/app/api/enquiry/route.ts'), 'utf8');
  assert.match(route, /syncOneNotionAgentRun/);
  assert.match(route, /isNotionAgentFeedbackSyncConfigured/);
  assert.match(route, /stored\.requestId/);
  assert.match(route, /if \(isNotionAgentFeedbackSyncConfigured\(\)\)[\s\S]*?syncOneNotionAgentRun/);
});
