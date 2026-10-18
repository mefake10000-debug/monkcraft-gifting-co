# Moncraft Automation Rollout Implementation Plan

> **For agentic workers:** Use this plan as the staged execution order. Each workstream should be implemented and accepted independently. Steps use checkbox syntax for tracking.

**Goal:** Progressively turn Moncraft's website and operations foundation into a secure, measurable, human-supervised operating system for leads, suppliers, quotes, fulfilment, finance, marketing, and customer care.

**Architecture:** Keep one Next.js repository/application, one protected database as the business source of truth, the operations app as the write surface, and Notion as a synced team control room. Use deterministic workflows for business state and bounded AI workers for evidence-based proposals, with explicit owners and approval gates.

**Tech Stack:** Next.js 16.4, TypeScript, Supabase/Postgres, Notion API, OpenAI Responses API when enabled, Meta WhatsApp Business Platform when approved, Vercel, Vyapar staff workflow pending vendor confirmation.

**Specs:** `docs/automation/moncraft-agent-operating-blueprint.md` and `docs/automation/moncraft-crm-salesforce-spec.md`

## Global constraints

- Read the installed Next.js guides under `node_modules/next/dist/docs/` before changing Next code.
- Preserve existing user working-tree changes and product data.
- No server secret may be exposed through `NEXT_PUBLIC_*` or committed to Git.
- Every workflow uses stable IDs, idempotency, activity/audit history, explicit owners, and a manual recovery path.
- AI does not invent prices, stock, supplier commitments, tax treatment, lead times, or delivery promises.
- Do not send unapproved customer/supplier messages, publish content, release POs, post/pay/refund money, or make legal/tax decisions.
- WhatsApp requires the official Meta platform, approved templates, recorded opt-in, verified mapping, webhook verification, and human escalation.
- Notion sync is one-way from the app until a separately reviewed two-way conflict model is implemented.
- Vyapar automation remains manual unless the exact installed edition has a confirmed supported interface.

## Review focus

- Duplicate website submission, duplicate webhook, retry-after-timeout, and stale outbox claims must not create duplicate records or repeat external sends.
- Missing, withdrawn, or mismatched consent must block the relevant channel and leave an auditable exception.
- Ambiguous supplier text, image, voice note, partial quantity, price change, and conflicting delivery date must go to a person.
- Stale Notion filters/board schema must not make a synced record invisible or cause bootstrap to create duplicate databases.
- An AI suggestion with no evidence, mismatched channel permission, unsupported claim, or impossible follow-up date must be rejected or clearly flagged before use.

## Workstreams

### 1. Foundation and live activation

**Files:** `.env.example`, `supabase/migrations/`, deployment configuration, `docs/automation/moncraft-website-notion-foundation.md`.

- [ ] Confirm owner-provided business identity, named staff/roles, privacy/retention policy, lead SLA, pricing/approval rules, supplier terms, tax owner, and restore/incident owner.
- [ ] Apply ordered migrations in Supabase and verify backups, RLS, service-role scope, and protected RPC access.
- [ ] Replace shared pilot staff key with named staff authentication before broad use.
- [ ] Configure Vercel secrets and verify cron/outbox execution in a sandbox.
- [ ] Acceptance: a synthetic website enquiry creates one Request ID, exact related records, one outbox sync, and a visible recovery path after a forced sync failure.

### 2. Notion control room provisioning

**Files:** `src/lib/automation/blueprint.ts`, `scripts/bootstrap-notion.cjs`, `tests/automation-foundation.test.cjs`, setup docs.

- [ ] Keep all team views over shared records and define board goal, required properties, owner fields, state options, and filtered views in code.
- [ ] Make board bootstrap idempotent: discover/update existing board/view IDs or stop with a clear report instead of creating duplicate databases.
- [ ] Create a dry-run manifest and schema check before external creation.
- [ ] Acceptance: one sandbox bootstrap creates seven boards with tested properties/filters; a second run updates or no-ops; every synced record is findable by stable business ID.

### 3. Lead-to-quote pilot

**Files:** `/api/enquiry`, lead operations APIs/UI, lead copilot, quote desk, activity migrations.

- [ ] Connect website payload, attribution, request ID, triage proposal, supplier-check draft, lead page, activity and coaching run.
- [ ] Add lead deduplication policy beyond client submission idempotency (email/company/window; human review for likely duplicates).
- [ ] Add explicit staff-owned follow-up task state, overdue transitions, time-zone-safe dates, and notifications only through a selected approved channel.
- [ ] Add AI evaluations for each coach output: evidence references, channel choice/consent, no invented facts, time-window sanity, and human correction capture.
- [ ] Acceptance: run synthetic leads for missing fields, repeat buyer, WhatsApp opt-in, urgent requested delivery, no reply, and lost deal; each results in the expected owned action and audit history.

### 3a. Full CRM and sales-force foundation

**Specification:** `docs/automation/moncraft-crm-salesforce-spec.md`.

- [ ] Extend beyond website quote requests with Accounts, Contacts, Leads, Opportunities, Activities, Tasks, Campaigns, versioned Quotes, and Orders linked by stable IDs. Preserve the submitted website request as immutable source evidence.
- [ ] Add duplicate suggestions with human review, source/evidence provenance, explicit `known / buyer-stated / staff-inferred / unknown` facts, and channel-specific permission history.
- [ ] Build My Day, saved role/team queues, searchable record detail pages, interaction timeline, task capture, explicit stage requirements, and visible domino effects.
- [ ] Implement one primary next action per active lead/opportunity with named owner and due time; overdue actions alert and escalate without automatically sending follow-ups.
- [ ] Add the guided, resumable business-learning wizard and versioned playbook. Require human confirmation for policy, commercial, consent, and approval changes; run reviewed examples as regression cases.
- [ ] Acceptance: staff can trace one target prospect and one submitted website enquiry through account/contact, activity, lead, opportunity, approved quote, decision and order without duplicating facts or losing evidence.

### 4. Supplier operations and WhatsApp pilot

**Files:** supplier directory/check APIs and UI, webhook, WhatsApp scripts/templates, exception desk, Notion supplier views.

- [ ] Load real supplier directory, verified SKU mappings, active state, contact, and evidence-backed opt-in.
- [ ] Have the business owner approve exact customer and supplier script wording and the Meta template.
- [ ] Configure webhook signatures, message dedupe, reply-to-check correlation, opt-out handling, and uncertain-send reconciliation.
- [ ] Add per-line reply capture for quantity, price/currency/validity, MOQ, lead time, customization, and delivery feasibility.
- [ ] Acceptance: test opted-in, not-opted-in, STOP, unknown sender, duplicate, late reply, voice/image, partial stock, price conflict, and delivery conflict with human escalation.

### 5. Quote-to-order and fulfilment

**Files:** quote workflow, order workflow, supplier readiness, milestone/shipment records and views.

- [ ] Approve price ownership, margin floor, discount authority, quote validity, payment terms, and buyer acceptance evidence standard.
- [ ] Connect approved quote version to order creation; build PO/artwork/proof/QC/shipping tasks with evidence and named owner.
- [ ] Select carrier(s), connect signed tracking events, and define failure/damage/split-shipment actions.
- [ ] Acceptance: rejected/expired quote cannot create order; accepted quote creates at most one order; every critical milestone requires evidence; a delayed shipment creates one owned exception.

### 6. Finance and Vyapar

**Files:** finance desk, data imports/integration adapter only after vendor confirmation, reconciliation report, onboarding guide.

- [ ] Confirm exact Vyapar edition/version and vendor-supported API/import process; capture evidence and field mapping.
- [ ] Define invoice number, GST/tax ownership, supplier bills, receipts, payment, refunds, credit notes, and close process with finance owner.
- [ ] Keep staff entry manual until official interface and duplicate-post protections are proven.
- [ ] Acceptance: reconcile synthetic accepted quote, customer invoice, receipt, supplier bill, and refund case; report every mismatch with source and reviewer.

### 7. Marketing, lead discovery, and content distribution

**Files:** content calendar, website SEO pages, attribution, publishing connectors only after selected.

- [ ] Define target company segments, exclusion criteria, allowable public research sources, offer proof, claims registry, editorial voice, seasonal calendar, and channel schedule.
- [ ] Add the Account Finder → Researcher → Outreach Drafter handoff, storing source URL/date and fact confidence; human verifies prospects and sends outreach.
- [ ] Connect Search Console/analytics and channel metrics; add consent/unsubscribe flow before email campaigns.
- [ ] Add approved asset library and platform-specific publishing only after channel scopes, review, and rollback are configured.
- [ ] Acceptance: one campaign can be planned, drafted per channel, fact-checked, approved, manually or safely published, attributed to enquiries, and evaluated on qualified leads/orders.

### 8. Customer care, analytics, and learning loop

**Files:** customer-care desk, exceptions, analytics, agent feedback board, report definitions.

- [ ] Define severity, response targets, refund/replace/compensation approval, privacy/deletion, repeat-buyer policy, and escalation roster.
- [ ] Complete metric definitions and source availability for funnel, response time, win/loss, gross margin, supplier SLA, on-time delivery, defects, cash collection, and care resolution.
- [ ] Create periodic human review of AI runs and update prompts/rules only through versioned changes and regression examples.
- [ ] Acceptance: dashboard metrics reconcile to sampled source records; AI quality report includes sample size, corrections, unsupported claims and outcome; no model self-modifies.

## Execution notes

- The current user authorized progressive implementation inline; continue with one independently testable workstream at a time.
- The agent operating blueprint is the detailed business specification; this plan is the engineering sequence.
- A live Notion bootstrap, production deployment, service-account setup, messaging, and money movement require configured accounts and owner approval at the relevant gate.
