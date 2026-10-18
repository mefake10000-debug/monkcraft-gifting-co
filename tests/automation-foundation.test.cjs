/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner with an isolated TypeScript require hook. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { createHmac } = require('node:crypto');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return resolve.call(this, id.startsWith('@/') ? path.join(process.cwd(), 'src', id.slice(2)) : id, ...args);
};
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText, file);

const blueprint = require('../src/lib/automation/blueprint.ts');
const operations = require('../src/lib/automation/operations.ts');
const whatsapp = require('../src/lib/automation/whatsapp.ts');
const opsSession = require('../src/lib/automation/opsSession.ts');
const leadPipeline = require('../src/lib/automation/leadPipeline.ts');
const orderWorkflow = require('../src/lib/automation/orderWorkflow.ts');
const { validateEnquiryPayload } = require('../src/lib/enquiry/validateServer.ts');
const attribution = require('../src/lib/marketing/attribution.ts');
const supplierAdmin = require('../src/lib/automation/supplierAdmin.ts');
const quoteWorkflow = require('../src/lib/automation/quoteWorkflow.ts');

test('automation blueprint defines the shared operating boards and bounded agent roles', () => {
  assert.deepEqual(blueprint.MONCRAFT_BOARDS.map((board) => board.key), [
    'leads', 'suppliers', 'supplier_checks', 'quotes_orders', 'content', 'agent_feedback', 'customer_care',
  ]);
  assert.deepEqual(blueprint.AGENT_ROLES.map((agent) => agent.key), [
    'prospect_crm', 'marketing_seo', 'sales', 'supplier_whatsapp', 'fulfillment', 'finance_analytics', 'customer_care',
  ]);
  assert.ok(blueprint.AGENT_ROLES.every((agent) => agent.approvalGates.length > 0));
  assert.ok(blueprint.AGENT_ROLES.find((agent) => agent.key === 'prospect_crm').prohibitedActions.includes('linkedin_automated_engagement'));
});

test('Notion board definitions expose purpose-specific filtered work queues without duplicating records', () => {
  const leadViews = blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'leads').views.roleViews;
  const directoryViews = blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'suppliers').views.roleViews;
  const supplierViews = blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'supplier_checks').views.roleViews;
  const quoteViews = blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'quotes_orders').views.roleViews;
  const contentViews = blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'content').views.roleViews;
  const decisionViews = blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'agent_feedback').views.roleViews;
  const careViews = blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'customer_care').views.roleViews;
  assert.ok(leadViews.some((view) => view.name === 'Sales — Unassigned' && view.filter));
  assert.ok(leadViews.some((view) => view.name === 'Sales — Follow-up scheduled' && view.filter));
  assert.ok(directoryViews.some((view) => view.name === 'Operations — Needs product mapping' && view.filter));
  assert.ok(directoryViews.some((view) => view.name === 'Operations — WhatsApp opt-in recorded' && view.filter));
  assert.ok(supplierViews.some((view) => view.name === 'Operations — Replies to verify' && view.filter));
  assert.ok(supplierViews.some((view) => view.name === 'Operations — Needs mapping' && view.filter));
  assert.ok(quoteViews.some((view) => view.name === 'Sales — Approval queue' && view.filter));
  assert.ok(quoteViews.some((view) => view.name === 'Operations — Active orders' && view.filter));
  assert.ok(contentViews.some((view) => view.name === 'Marketing — Review queue' && view.filter));
  assert.ok(decisionViews.some((view) => view.name === 'Agents — Human review' && view.filter));
  assert.ok(careViews.some((view) => view.name === 'Care — Open tasks' && view.filter));
  assert.ok(leadViews.every((view) => view.type === 'board' && view.groupBy === 'Status'));
});

test('quote lines are grouped only with explicit product-to-supplier mappings', () => {
  const grouped = blueprint.groupQuoteItemsBySupplier([
    { id: 'SKU-1', name: 'Bottle', quantity: 100 },
    { id: 'SKU-2', name: 'Notebook', quantity: 50 },
  ], [
    { productId: 'SKU-1', supplierId: 'vendor-x', category: 'drinkware' },
  ]);
  assert.deepEqual(grouped.mapped.map((group) => group.supplierId), ['vendor-x']);
  assert.deepEqual(grouped.mapped[0].items.map((item) => item.id), ['SKU-1']);
  assert.deepEqual(grouped.unmapped.map((item) => item.id), ['SKU-2']);
});

test('supplier check drafts create one safe check per mapped vendor and an exception for unmapped SKUs', () => {
  const drafts = operations.buildSupplierCheckDrafts([
    { id: 'SKU-1', name: 'Bottle', quantity: 100 },
    { id: 'SKU-2', name: 'Notebook', quantity: 50 },
    { id: 'SKU-3', name: 'Mug', quantity: 25 },
  ], [
    { productId: 'SKU-1', supplierId: 'vendor-x', category: 'drinkware' },
    { productId: 'SKU-3', supplierId: 'vendor-x', category: 'drinkware' },
  ]);
  assert.equal(drafts.length, 2);
  assert.deepEqual(drafts[0], {
    supplierId: 'vendor-x', status: 'Draft', productIds: ['SKU-1', 'SKU-3'],
    totalUnits: 125, canSendWhatsApp: false,
  });
  assert.deepEqual(drafts[1], {
    supplierId: null, status: 'Needs mapping', productIds: ['SKU-2'],
    totalUnits: 50, canSendWhatsApp: false,
  });
});

test('supplier directory mutations validate opted-in contact details and stable catalogue product mappings', () => {
  const supplier = supplierAdmin.validateSupplierDirectoryInput({
    supplierCode: 'VENDOR-X', displayName: 'Vendor X', category: 'Drinkware',
    phoneE164: '+919876543210', email: 'vendor@example.com', whatsappOptIn: true,
    whatsappOptInEvidenceReference: 'supplier onboarding form 14', actor: 'Ops User',
  });
  assert.equal(supplier.ok, true);
  assert.equal(supplier.value.whatsappOptIn, true);
  assert.equal(supplierAdmin.validateSupplierDirectoryInput({
    supplierCode: 'VENDOR-X', displayName: 'Vendor X', category: 'Drinkware',
    phoneE164: '+919876543210', email: '', whatsappOptIn: true,
    whatsappOptInEvidenceReference: '', actor: 'Ops User',
  }).ok, false);
  assert.equal(supplierAdmin.validateSupplierDirectoryInput({
    supplierCode: 'VENDOR X', displayName: 'Vendor X', category: 'Drinkware',
    phoneE164: '9876543210', whatsappOptIn: false, actor: '',
  }).ok, false);

  const mapping = supplierAdmin.validateSupplierProductMappingInput({
    productId: 'SKU-987', supplierId: '123e4567-e89b-42d3-a456-426614174000',
    category: 'Drinkware', verifiedBy: 'Ops User', actor: 'Ops User',
  });
  assert.equal(mapping.ok, true);
  assert.equal(supplierAdmin.validateMappingRetirementInput({ productId: 'SKU-987', actor: 'Ops User' }).ok, true);
  assert.equal(supplierAdmin.validateSupplierProductMappingInput({
    productId: '', supplierId: 'not-a-uuid', category: '', verifiedBy: '', actor: '',
  }).ok, false);
});

test('supplier directory changes require staff authorization, audited RPCs and retryable Notion synchronization', () => {
  const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170009_supplier_directory_management.sql'), 'utf8');
  assert.match(migration, /whatsapp_opt_in_evidence_reference text/);
  assert.match(migration, /create table public\.supplier_directory_events/);
  assert.match(migration, /create table public\.product_supplier_mapping_events/);
  assert.match(migration, /create or replace function public\.save_supplier_directory_record/);
  assert.match(migration, /create or replace function public\.save_product_supplier_mapping/);
  assert.match(migration, /create or replace function public\.deactivate_product_supplier_mapping/);
  assert.match(migration, /create or replace function public\.claim_supplier_directory_notion_sync/);
  assert.match(migration, /create or replace function public\.finish_supplier_directory_notion_sync/);
  assert.match(migration, /grant execute on function public\.save_supplier_directory_record.*to service_role/);
  const route = fs.readFileSync(path.join(process.cwd(), 'src/app/api/ops/suppliers/route.ts'), 'utf8');
  assert.equal((route.match(/isAuthorizedOperationsRequest\(request\)/g) || []).length, 2);
  assert.match(route, /getProductById\(parsed\.value\.productId\)/);
  const directory = blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'suppliers');
  assert.ok(directory.properties['Supplier Code']);
  const notion = fs.readFileSync(path.join(process.cwd(), 'src/lib/automation/notion.ts'), 'utf8');
  assert.match(notion, /syncOneNotionSupplierDirectoryRecord/);
  assert.match(notion, /findExistingSupplier\(supplier\.supplier_code\)/);
  assert.match(notion, /finishSupplierDirectoryNotionSync\(supplier\.id, supplier\.updated_at/);
  const cron = fs.readFileSync(path.join(process.cwd(), 'src/app/api/cron/automation-outbox/route.ts'), 'utf8');
  assert.match(cron, /syncOneNotionSupplierDirectoryRecord/);
});

test('quote drafts require explicit human-entered prices and calculate money in integer paise', () => {
  const draft = quoteWorkflow.validateQuoteDraftInput({
    requestId: '123e4567-e89b-42d3-a456-426614174000',
    lines: [
      { productId: 'SKU-987', description: 'Insulated bottle', quantity: 10, unitPricePaise: 12550 },
      { productId: 'CUSTOM-BOX', description: 'Custom printed packaging', quantity: 10, unitPricePaise: 5500 },
    ],
    adjustments: [{ label: 'Delivery', amountPaise: 75000 }, { label: 'Tax per approved invoice', amountPaise: 123450 }],
    terms: 'Quote valid for 15 days. Delivery subject to final approval.',
    actor: 'Sales User',
  });
  assert.equal(draft.ok, true);
  assert.equal(draft.value.subtotalPaise, 180500);
  assert.equal(draft.value.totalPaise, 378950);
  assert.equal(quoteWorkflow.validateQuoteDraftInput({
    requestId: '123e4567-e89b-42d3-a456-426614174000',
    lines: [{ productId: 'SKU-987', description: 'Bottle', quantity: 10, unitPricePaise: 125.5 }],
    adjustments: [], terms: '', actor: 'Sales User',
  }).ok, false);
  assert.equal(quoteWorkflow.validateQuoteDraftInput({
    requestId: '123e4567-e89b-42d3-a456-426614174000',
    lines: [{ productId: 'SKU-987', description: 'Bottle', quantity: 10, unitPricePaise: 12550 }],
    adjustments: [{ label: 'Over-discount', amountPaise: -500000 }], terms: '', actor: 'Sales User',
  }).ok, false);
});

test('quote transitions require references for approval, send, and buyer acceptance', () => {
  assert.equal(quoteWorkflow.validateQuoteTransitionInput({ quoteId: '123e4567-e89b-42d3-a456-426614174000', actor: 'Reviewer' }, 'approve').ok, true);
  assert.equal(quoteWorkflow.validateQuoteTransitionInput({ quoteId: '123e4567-e89b-42d3-a456-426614174000', actor: 'Sales User' }, 'mark_sent').ok, false);
  assert.equal(quoteWorkflow.validateQuoteTransitionInput({ quoteId: '123e4567-e89b-42d3-a456-426614174000', actor: 'Buyer' }, 'accept').ok, false);
  assert.equal(quoteWorkflow.validateQuoteTransitionInput({ quoteId: '123e4567-e89b-42d3-a456-426614174000', actor: 'Sales User', evidenceReference: 'Sent email 2026-10-20' }, 'mark_sent').ok, true);
  assert.equal(quoteWorkflow.validateQuoteTransitionInput({ quoteId: '123e4567-e89b-42d3-a456-426614174000', actor: 'Buyer', evidenceReference: 'Buyer PO 456' }, 'accept').ok, true);
});

test('quote readiness blocks missing, unmapped, unreviewed, partial, unavailable, and unchecked products', () => {
  const line = [{ productId: 'SKU-1' }];
  const readyCheck = [{ supplierId: 'vendor-1', status: 'Replied', availability: 'Available', reviewedAt: '2026-10-17T09:00:00Z', productIds: ['SKU-1'] }];
  assert.equal(quoteWorkflow.assessQuoteSupplierReadiness(line, readyCheck).ready, true);
  assert.equal(quoteWorkflow.assessQuoteSupplierReadiness(line, []).ready, false);
  assert.equal(quoteWorkflow.assessQuoteSupplierReadiness(line, [{ ...readyCheck[0], supplierId: null }]).ready, false);
  assert.equal(quoteWorkflow.assessQuoteSupplierReadiness(line, [{ ...readyCheck[0], status: 'Sent' }]).ready, false);
  assert.equal(quoteWorkflow.assessQuoteSupplierReadiness(line, [{ ...readyCheck[0], reviewedAt: null }]).ready, false);
  assert.equal(quoteWorkflow.assessQuoteSupplierReadiness(line, [{ ...readyCheck[0], availability: 'Partial' }]).ready, false);
  assert.equal(quoteWorkflow.assessQuoteSupplierReadiness(line, [{ ...readyCheck[0], availability: 'Unavailable' }]).ready, false);
  assert.equal(quoteWorkflow.assessQuoteSupplierReadiness([{ productId: 'SKU-2' }], readyCheck).ready, false);
});

test('WhatsApp webhook accepts only a matching Meta HMAC and extracts text replies without interpreting stock', () => {
  const raw = JSON.stringify({ entry: [{ changes: [{ value: { messages: [
    { id: 'wamid.1', from: '919876543210', type: 'text', text: { body: 'Yes, 100 pieces are available' }, context: { id: 'wamid.out' } },
    { id: 'wamid.2', from: '919876543211', type: 'image', image: { id: 'media.1' } },
  ] } }] }] });
  const signature = `sha256=${createHmac('sha256', 'app-secret').update(raw).digest('hex')}`;
  assert.equal(whatsapp.verifyWhatsAppSignature(raw, signature, 'app-secret'), true);
  assert.equal(whatsapp.verifyWhatsAppSignature(raw, signature, 'wrong-secret'), false);
  assert.deepEqual(whatsapp.extractSupplierReplies(JSON.parse(raw)), [
    { providerMessageId: 'wamid.1', senderPhone: '919876543210', contextMessageId: 'wamid.out', text: 'Yes, 100 pieces are available', messageType: 'text' },
    { providerMessageId: 'wamid.2', senderPhone: '919876543211', contextMessageId: null, text: '[non-text reply: image]', messageType: 'image' },
  ]);
});

test('supplier WhatsApp sends use only the fixed approved-template payload fields', () => {
  assert.deepEqual(whatsapp.buildSupplierAvailabilityTemplate({
    phone: '+91 98765 43210', templateName: 'moncraft_supplier_availability_check', language: 'en',
    checkReference: 'A1B2C3D4', requestReference: 'E5F6A7B8', products: 'SKU-1 × 100, SKU-2 × 50',
    totalUnits: 150, requestedDeliveryDate: 'Please confirm date',
  }), {
    messaging_product: 'whatsapp', to: '919876543210', type: 'template',
    template: {
      name: 'moncraft_supplier_availability_check', language: { code: 'en' },
      components: [{ type: 'body', parameters: [
        { type: 'text', text: 'A1B2C3D4' }, { type: 'text', text: 'E5F6A7B8' },
        { type: 'text', text: 'SKU-1 × 100, SKU-2 × 50' }, { type: 'text', text: '150' },
        { type: 'text', text: 'Please confirm date' },
      ] }],
    },
  });
  assert.throws(() => whatsapp.buildSupplierAvailabilityTemplate({ phone: 'abc', templateName: 'bad name', language: 'en', checkReference: '', requestReference: '', products: '', totalUnits: 0, requestedDeliveryDate: '' }));
});

test('shared boards describe a Kanban status property and readable lifecycle statuses', () => {
  for (const board of blueprint.MONCRAFT_BOARDS) {
    assert.ok(board.statuses.length >= 3, `${board.key} needs lifecycle statuses`);
    assert.ok(board.properties.Status, `${board.key} needs a Status property`);
    assert.equal(board.views.kanban.type, 'board');
  }
  assert.ok(blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'quotes_orders').views.roleViews.some((view) => view.name === 'Operations Queue'));
  assert.ok(blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'content').views.roleViews.some((view) => view.name === 'Marketing Queue'));
});

test('quote request validation supports phone or consented WhatsApp as the selected reply channel', () => {
  const input = {
    contact: { name: 'Buyer', company: 'Acme', phone: '9876543210' },
    contactPreference: 'whatsapp',
    whatsappUpdatesOptIn: true,
    summary: '100 welcome kits for Bengaluru',
    clientSubmissionId: '0123456789abcdef0123456789abcdef',
  };
  assert.equal(validateEnquiryPayload(input).ok, true);
  const withoutConsent = validateEnquiryPayload({ ...input, whatsappUpdatesOptIn: false });
  assert.equal(withoutConsent.ok, false);
  assert.ok(withoutConsent.fieldErrors.contactPreference);
  const phonePreference = validateEnquiryPayload({ ...input, contactPreference: 'phone', whatsappUpdatesOptIn: false });
  assert.equal(phonePreference.ok, true);
});

test('email marketing permission is separate and requires an email only when explicitly selected', () => {
  const base = {
    contact: { name: 'Buyer', company: 'Acme', phone: '9876543210' },
    contactPreference: 'phone',
    summary: '100 welcome kits for Bengaluru',
    clientSubmissionId: '0123456789abcdef0123456789abcdef',
  };
  assert.equal(validateEnquiryPayload(base).ok, true);
  const optedInWithoutEmail = validateEnquiryPayload({ ...base, marketingEmailOptIn: true });
  assert.equal(optedInWithoutEmail.ok, false);
  assert.ok(optedInWithoutEmail.fieldErrors.email);
  const optedIn = validateEnquiryPayload({ ...base, contact: { ...base.contact, email: 'buyer@example.com' }, marketingEmailOptIn: true });
  assert.equal(optedIn.ok, true);
  assert.equal(optedIn.payload.marketingEmailOptIn, true);
  assert.equal(validateEnquiryPayload({ ...base, marketingEmailOptIn: false }).payload.marketingEmailOptIn, false);
});

test('campaign attribution stores first and last touches in session storage and sanitizes identifying URL data', () => {
  const data = new Map();
  global.window = {
    location: { hostname: 'monkcraft.example' },
    sessionStorage: { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) },
  };
  attribution.captureCampaignAttribution('/gifts', '?utm_source=linkedin&utm_medium=social&utm_campaign=diwali_2026&utm_term=hr%20gifting', '');
  attribution.captureCampaignAttribution('/gifts/boxes', '?utm_source=google&utm_medium=cpc&utm_campaign=brand_search', 'https://search.example.com/private?q=secret');
  const saved = attribution.readCampaignAttribution();
  assert.equal(saved.firstTouch.source, 'linkedin');
  assert.equal(saved.firstTouch.campaign, 'diwali_2026');
  assert.equal(saved.lastTouch.source, 'google');
  assert.equal(saved.lastTouch.landingPath, '/gifts/boxes');
  assert.equal(saved.lastTouch.referrerHost, 'search.example.com');
  assert.equal(JSON.stringify(saved).includes('private?q=secret'), false);
  const sanitized = attribution.sanitizeCampaignAttribution({
    firstTouch: saved.firstTouch,
    lastTouch: { ...saved.lastTouch, landingPath: '/gifts?email=buyer@example.com' },
  });
  assert.equal(sanitized.lastTouch.landingPath, '/gifts');
  delete global.window;
});

test('Notion lead board exposes consent and selected campaign attribution without creating duplicate campaign board', () => {
  const leads = blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'leads');
  assert.ok(leads.properties['Email marketing opt-in']);
  assert.ok(leads.properties['First touch source']);
  assert.ok(leads.properties['Campaign']);
  assert.equal(blueprint.MONCRAFT_BOARDS.some((board) => board.key === 'marketing_permissions'), false);
});

test('marketing consent migration audits opt-ins and withdrawals while leaving sends disconnected', () => {
  const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170008_marketing_consent_attribution.sql'), 'utf8');
  assert.match(migration, /create table public\.customer_marketing_permissions/);
  assert.match(migration, /quote_request_marketing_consent_trigger/);
  assert.match(migration, /marketingEmailOptIn.*distinct from 'true'/);
  assert.match(migration, /create or replace function public\.revoke_customer_marketing_permission/);
  assert.match(migration, /create or replace view public\.marketing_campaign_performance/);
  assert.match(migration, /create or replace view public\.marketing_consent_summary/);
});

test('durable quote storage uses unique submission keys and a restricted retryable outbox', () => {
  const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170001_moncraft_quote_operations.sql'), 'utf8');
  assert.match(migration, /client_submission_id text unique/);
  assert.match(migration, /unique \(event_type, aggregate_id\)/);
  assert.match(migration, /create or replace function public\.claim_quote_notion_sync/);
  assert.match(migration, /alter table public\.quote_requests enable row level security/);
  assert.match(migration, /revoke all on public\.quote_requests.*from anon, authenticated/);
  const operationsMigration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170002_supplier_fulfilment_analytics.sql'), 'utf8');
  assert.match(operationsMigration, /create table if not exists public\.supplier_checks/);
  assert.match(operationsMigration, /create table if not exists public\.orders/);
  assert.match(operationsMigration, /create table if not exists public\.vyapar_reconciliation/);
  assert.match(operationsMigration, /create or replace view public\.business_funnel_daily/);
  const humanReviewMigration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170003_supplier_reply_review.sql'), 'utf8');
  assert.match(humanReviewMigration, /create or replace function public\.review_supplier_check_reply/);
  assert.match(humanReviewMigration, /supplier_reply_reviewed_at = null/);
  assert.match(humanReviewMigration, /availability = 'Unknown'/);
  assert.match(humanReviewMigration, /supplier_reply_reviewed_by/);
  assert.match(humanReviewMigration, /revoke all on function public\.review_supplier_check_reply/);
  const salesMigration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170004_sales_pipeline.sql'), 'utf8');
  assert.match(salesMigration, /create table public\.lead_activity_events/);
  assert.match(salesMigration, /create or replace function public\.update_quote_request_pipeline/);
  assert.match(salesMigration, /create or replace function public\.finish_quote_notion_sync_v2/);
  assert.match(salesMigration, /v_current_version = p_claimed_crm_updated_at/);
  assert.match(salesMigration, /revoke all on function public\.update_quote_request_pipeline/);
});

test('operations sessions are signed, expire, and cannot be forged with a different key', () => {
  const issuedAt = 1_800_000_000_000;
  const token = opsSession.createOperationsSession('a-long-test-operations-secret', issuedAt);
  assert.equal(opsSession.verifyOperationsSession(token, 'a-long-test-operations-secret', issuedAt), true);
  assert.equal(opsSession.verifyOperationsSession(token, 'different-operations-secret', issuedAt), false);
  assert.equal(opsSession.verifyOperationsSession(token, 'a-long-test-operations-secret', issuedAt + 9 * 60 * 60 * 1000), false);
  assert.equal(opsSession.verifyOperationsSession('v1.not-a-date.invalid', 'a-long-test-operations-secret', issuedAt), false);
});

test('sales pipeline starts quote submissions in the supported lead lifecycle', () => {
  assert.equal(leadPipeline.INITIAL_LEAD_STATUS, 'Quote request');
  assert.deepEqual([...leadPipeline.LEAD_PIPELINE_STATUSES], blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'leads').statuses);
  assert.equal(leadPipeline.isLeadPipelineStatus('Qualified'), true);
  assert.equal(leadPipeline.isLeadPipelineStatus('Payment received'), false);
  assert.equal(leadPipeline.LEAD_PIPELINE_STATUSES.length, 9);
});

test('fulfilment milestones cannot complete out of sequence or without delivery proof', () => {
  assert.equal(orderWorkflow.canCompleteOrderStage('Customization', []), false);
  assert.equal(orderWorkflow.canCompleteOrderStage('Customization', ['Procurement']), true);
  assert.equal(orderWorkflow.canCompleteOrderStage('Quality check', ['Procurement', 'Customization']), true);
  assert.equal(orderWorkflow.canCompleteOrderStage('Delivered', [...orderWorkflow.ORDER_MILESTONE_STAGES.slice(0, 4)]), false);
  assert.equal(orderWorkflow.canCompleteOrderStage('Delivered', [...orderWorkflow.ORDER_MILESTONE_STAGES.slice(0, 4)], true), true);
});

test('accepted orders require approval evidence and enforce fulfilment proof gates', () => {
  const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170005_order_fulfilment_workflow.sql'), 'utf8');
  assert.match(migration, /create or replace function public\.create_order_from_accepted_quote/);
  assert.match(migration, /v_request\.status <> 'Won'/);
  assert.match(migration, /customer_approval_reference/);
  assert.match(migration, /already has an order with different approval evidence/);
  assert.match(migration, /evidence is required to complete quality check or dispatch/);
  assert.match(migration, /proof-of-delivery evidence/);
  assert.match(migration, /create or replace function public\.claim_order_notion_sync/);
  assert.match(migration, /finish_order_notion_sync/);
  assert.match(migration, /revoke all on function public\.update_fulfillment_shipment/);
  const board = blueprint.MONCRAFT_BOARDS.find((item) => item.key === 'quotes_orders');
  assert.ok(board.statuses.includes('On hold'));
  assert.ok(board.properties['Promised delivery date']);
  assert.ok(board.properties['Approval reference']);
});

test('Vyapar records are human-entered, permission-gated, and keep correction history', () => {
  const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170006_vyapar_reconciliation_workflow.sql'), 'utf8');
  assert.match(migration, /create table public\.vyapar_reconciliation_events/);
  assert.match(migration, /create or replace function public\.record_vyapar_reconciliation/);
  assert.match(migration, /client_submission_id uuid unique/);
  assert.match(migration, /finance submission key was reused with different content/);
  assert.match(migration, /p_status = 'Matched' and abs\(p_expected_amount - p_recorded_amount\) > 0\.01/);
  assert.match(migration, /p_status = 'Mismatch' and abs\(p_expected_amount - p_recorded_amount\) <= 0\.01/);
  assert.match(migration, /event_type, before_record, after_record, actor/);
  assert.match(migration, /revoke all on function public\.record_vyapar_reconciliation/);
  const route = fs.readFileSync(path.join(process.cwd(), 'src/app/api/ops/finance/route.ts'), 'utf8');
  assert.match(route, /isAuthorizedOperationsRequest/);
  assert.match(route, /listFinanceRecords/);
  assert.match(route, /saveFinanceRecord/);
  const analyticsRoute = fs.readFileSync(path.join(process.cwd(), 'src/app/api/ops/analytics/route.ts'), 'utf8');
  assert.match(analyticsRoute, /isAuthorizedOperationsRequest/);
  const analyticsStore = fs.readFileSync(path.join(process.cwd(), 'src/lib/automation/store.ts'), 'utf8');
  assert.match(analyticsStore, /business_funnel_daily/);
  assert.match(analyticsStore, /supplier_response_metrics/);
  assert.match(analyticsStore, /fulfillment_health/);
});

test('accepted orders produce a complete manual Vyapar entry pack without inventing tax or missing customer fields', () => {
  const { buildVyaparEntryPack } = require('../src/lib/automation/financePack.ts');
  const pack = buildVyaparEntryPack({
    exportedAt: '2026-10-17T10:00:00.000Z',
    order: { orderCode: 'MC-1001', requestId: 'request-1', acceptedQuoteVersion: 'v2', approvalReference: 'buyer email 14', customerPoReference: 'PO-99', promisedDeliveryDate: '2026-11-01' },
    customer: { company: 'Acme Ltd', contact: 'Buyer', email: 'buyer@example.com', phone: '9876543210', deliveryLocation: 'Bengaluru' },
    quote: { version: 2, subtotalPaise: 180500, totalPaise: 200500, terms: 'Payment in 30 days', lines: [{ productId: 'SKU-1', description: 'Bottle', quantity: 10, unitPricePaise: 18050 }], adjustments: [{ label: 'Packaging', amountPaise: 20000 }] },
  });
  assert.equal(pack.order.acceptedQuoteVersion, 'v2');
  assert.equal(pack.lineItems[0].lineAmountINR, 1805);
  assert.equal(pack.adjustments[0].amountINR, 200);
  assert.equal(pack.totalINR, 2005);
  assert.equal(pack.customer.gstin, null);
  assert.equal(pack.customer.billingAddress, null);
  assert.match(pack.taxInstruction, /do not infer/i);
  assert.equal(pack.vyaparImportCompatible, false);
  assert.equal(pack.manualReviewRequired.includes('Confirm customer GSTIN, billing address, state, and place of supply.'), true);
});


test('delivery creates an auditable internal customer-care task without sending a message', () => {
  const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170007_customer_care_workflow.sql'), 'utf8');
  assert.match(migration, /after update of status on public\.orders/);
  assert.match(migration, /new\.status = 'Delivered'/);
  assert.match(migration, /'Delivery check-in'/);
  assert.match(migration, /create table public\.customer_care_events/);
  assert.match(migration, /create or replace function public\.update_customer_care_task/);
  const route = fs.readFileSync(path.join(process.cwd(), 'src/app/api/ops/customer-care/route.ts'), 'utf8');
  assert.match(route, /isAuthorizedOperationsRequest/);
  const page = fs.readFileSync(path.join(process.cwd(), 'src/components/ops/CustomerCareDesk.tsx'), 'utf8');
  assert.match(page, /does not create repeat-order marketing tasks/);
  assert.match(page, /This system will not send it/);
  assert.equal(blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'customer_care').views.roleViews.some((view) => view.name === 'Escalations'), true);
});

test('quote approval is versioned, evidence-gated, and required before a lead can be won or ordered', () => {
  const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170010_quote_approval_workflow.sql'), 'utf8');
  assert.match(migration, /create table public\.quote_versions/);
  assert.match(migration, /create table public\.quote_version_events/);
  assert.match(migration, /create or replace function public\.save_quote_draft/);
  assert.match(migration, /create or replace function public\.transition_quote_version/);
  assert.match(migration, /sent_evidence_reference/);
  assert.match(migration, /buyer_decision_reference/);
  assert.match(migration, /create trigger orders_require_accepted_quote_trigger/);
  assert.match(migration, /q\.status = 'Accepted'/);
  assert.match(migration, /create trigger quote_requests_require_accepted_quote_trigger/);
  assert.match(migration, /a lead can be marked Won only after a quote version is accepted/);
  const route = fs.readFileSync(path.join(process.cwd(), 'src/app/api/ops/quotes/route.ts'), 'utf8');
  assert.match(route, /isAuthorizedOperationsRequest/);
  assert.match(route, /validateQuoteDraftInput/);
  assert.match(route, /transitionOperationsQuote/);
  const quoteBoard = blueprint.MONCRAFT_BOARDS.find((board) => board.key === 'quotes_orders');
  for (const status of ['Draft', 'Approval requested', 'Approved', 'Sent', 'Accepted', 'Declined', 'Superseded']) {
    assert.ok(quoteBoard.statuses.includes(status));
  }
  const readinessMigration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/202610170011_quote_supplier_readiness_gate.sql'), 'utf8');
  assert.match(readinessMigration, /create or replace function public\.assert_quote_supplier_readiness/);
  assert.match(readinessMigration, /supplier_reply_reviewed_at is null/);
  assert.match(readinessMigration, /sc\.availability <> 'Available'/);
  assert.match(readinessMigration, /pm\.product_id = \(checked_line\.value->>'id'\)/);
  assert.match(readinessMigration, /quote_versions_require_supplier_readiness_trigger/);
});

test('same-origin browser GETs can use the signed operations cookie without an Origin header', () => {
  const { isAuthorizedOperationsRequest } = require('../src/lib/automation/opsAuth.ts');
  const previousSecret = process.env.MONKCRAFT_OPS_API_SECRET;
  const secret = 'a-long-test-operations-secret';
  process.env.MONKCRAFT_OPS_API_SECRET = secret;
  const token = opsSession.createOperationsSession(secret);
  const sameOriginGet = new Request('http://localhost:3000/api/ops/agents', {
    headers: { cookie: `moncraft_ops_session=${token}`, 'sec-fetch-site': 'same-origin' },
  });
  const crossSiteGet = new Request('http://localhost:3000/api/ops/agents', {
    headers: { cookie: `moncraft_ops_session=${token}`, 'sec-fetch-site': 'cross-site' },
  });
  assert.equal(isAuthorizedOperationsRequest(sameOriginGet), true);
  assert.equal(isAuthorizedOperationsRequest(crossSiteGet), false);
  if (previousSecret === undefined) delete process.env.MONKCRAFT_OPS_API_SECRET;
  else process.env.MONKCRAFT_OPS_API_SECRET = previousSecret;
});
