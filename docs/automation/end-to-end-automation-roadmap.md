# End-to-End Business Automation Roadmap

**Status:** Implementation in progress; live integration activation still needs business data, service credentials, and owner-approved operating policies.
**Date:** 2026-10-17
**Business name:** “Monkraft” is used in the request; the current repository and existing documents spell it “Monkcraft”. Confirm the preferred public/legal spelling before customer-facing automation.

## Objective

Build a dependable operating system for the complete gifting journey, from first customer signal through repeat purchase, while connecting marketing, sales, finance, procurement, fulfilment, customer service, and analytics. Automate repeatable work; keep people responsible for commitments, exceptions, and financial or customer-impacting decisions until policies are explicitly approved.

## Verified implementation state

The repository now includes a customer-facing Next.js catalogue and quote-request flow, durable quote-request schema and retryable integration outbox, protected lead/supplier/order/finance/customer-care/marketing-consent/content operations APIs, staff queues for supplier directory/mappings, supplier checks, sales, customer care, fulfilment, marketing drafts, agent decisions, and cross-workflow exceptions, plus a manual Vyapar reconciliation desk and operational analytics page. New quote requests create a deterministic Sales triage proposal that checks brief completeness and missing catalogue IDs, without sending messages or inventing commercial facts. A Notion bootstrap script and sync workers are implemented for leads, supplier directory records/checks, accepted orders, customer-care tasks, content drafts, and agent-run decisions. Supabase migrations define the source-of-truth records and protected operations RPCs; Notion remains the staff control room.

These code paths are not proof of live connectivity. No live Supabase migration, Notion workspace bootstrap, WhatsApp Business endpoint, or production deployment was verified in the implementation session. Supplier contacts, product-to-supplier mappings, consent records, customer quote/payment rules, named staff accounts, and real Vyapar credentials/records still need owner-supplied evidence. Company Stores remain a demo, not a live private employee ordering system. These are repository findings, not claims about tools Moncraft may use outside this project.

## End-to-end journey to support

| Stage | Business outcome | Automation candidates | Human decision / exception |
|---|---|---|---|
| 1. Demand and audience | Reach the right corporate or individual gift buyer | Campaign scheduling, audience and channel tagging, content variants, spend and lead attribution | Brand claims, budgets, audience policy |
| 2. Lead capture | Collect a complete, consent-aware enquiry | Validate and deduplicate submissions; create a lead; route by segment, value, occasion, and urgency; acknowledge receipt only after confirmed delivery | Suspicious leads, consent issues, high-value accounts |
| 3. Qualification and discovery | Understand recipient count, budget, date, locations, branding, and occasion | Completeness checks, reminders, account history, brief summary, suggested questions | Qualification, unusual needs, relationship handling |
| 4. Product and proposal | Recommend feasible gifts and packaging | Match catalogue against budget, MOQ, stock/lead-time data; generate proposal draft and options | Product substitution, margin, discount, final quote approval |
| 5. Quote and approval | Issue a correct, traceable commercial offer | Version quote, validate prices/tax rules, approval routing, expiry and follow-up reminders | Price, margin exception, contractual terms |
| 6. Order and payment | Convert accepted quote to an order with clear terms | Create order record, payment request/status updates, invoice request, customer confirmation | Payment exceptions, credit, refunds, order changes |
| 7. Sourcing and production | Secure stock, customization, packaging, and schedule | Supplier RFQs, PO drafts, MOQ/date checks, artwork proof routing, shortage and delay alerts | Supplier selection, PO release, proof approval |
| 8. Quality and fulfilment | Deliver the right kits to the right destinations on time | Pick/pack instructions, address validation, shipment booking, tracking ingestion, dispatch notifications | QA sign-off, damaged goods, substitutions, split shipments |
| 9. Accounting and reconciliation | Keep receivables, payables, taxes, and order economics current | Sync approved transactions to accounting system; match payment, invoice, and supplier bill; flag mismatch | Tax treatment, journal adjustments, write-offs, payments |
| 10. Service and retention | Resolve issues and earn the next order | Case classification, response drafts, delivery check-in, feedback request, reorder and occasion reminders | Complaint resolution, compensation, sensitive cases |
| 11. Business intelligence | Make the operation visible | Funnel, conversion, margin, on-time delivery, defect, cash collection, supplier, and campaign dashboards | Targets, trade-offs, operating changes |

## Agent and automation design

Start with workflow automation and structured records. An “agent” should be a bounded worker with a named trigger, approved data access, permitted actions, and a clear handoff—not a single unrestricted assistant controlling every system.

1. **Workflow orchestrator:** Moves a lead/order through explicit states, invokes deterministic services, retries safely, and records every action.
2. **Sales desk assistant:** Summarizes a lead, detects missing details, drafts follow-ups and quotes from approved catalogue and pricing data, and requests approval before sending a commercial offer.
3. **Sourcing and fulfilment assistant:** Checks supplier MOQ, availability, lead time, and shipment milestones; drafts RFQs/POs and flags risk. A person releases purchase commitments.
4. **Customer care assistant:** Classifies an incoming message, retrieves order context, drafts a response, and routes sensitive complaints or refunds to a person.
5. **Finance operations assistant:** Matches orders, invoices, receipts, and supplier bills; prepares reconciliation exceptions. It does not approve payments, tax filings, or accounting adjustments.
6. **Marketing and analytics assistant:** Produces campaign drafts and reports based on attributed, consent-aware data; publishing and spend changes follow approved limits.

Use AI for reading, summarizing, drafting, and proposing. Use ordinary code and business rules for totals, MOQ, tax calculations, permission checks, state transitions, idempotency, and reconciliation. Each integration should have audit history, access controls, retries, failure alerts, and a manual recovery path.

## Recommended implementation sequence

### Workstream 0 — Process and systems discovery

Document actual steps, roles, decision rules, exception paths, customer messages, current tools, and volumes. Agree on the source of truth for contacts, products, supplier terms, quotes, orders, inventory/availability, shipments, and finance. No live integrations should be chosen until this map is reviewed.

**Deliverable:** Approved process map, system inventory, data dictionary, automation permissions, baseline metrics, and a short list of highest-cost bottlenecks.

### Workstream 1 — Durable lead and quote operations

**Code status:** Website submissions now persist to a protected database RPC with idempotency and a retryable Notion event. A transactional trigger creates a Sales triage proposal for each newly inserted request. `/ops/leads` provides status, owner, next action, and activity history; `/ops/agents` records human decisions on proposals. External service setup and authenticated live acceptance checks remain open.

Create a durable lead/enquiry record, owner and status queue, deduplication, consent/retention policy, follow-up tasks, and quote history. Connect the existing website handoff only after storage, privacy, auth, and delivery configuration are approved. Keep the current quote request distinct from a confirmed paid order.

**Deliverable:** One auditable lead-to-approved-quote path with staff ownership and honest customer status.

### Workstream 2 — Quote-to-order control

**Code status:** `/ops/quotes` supports versioned, manually priced quote drafts, approval requests, recorded human approval, manually sent quote evidence, and recorded buyer decisions. A database gate requires each requested item to have an active supplier mapping and a human-reviewed Available response before approval or sending; this records point-in-time evidence and does not reserve stock. An accepted quote is required before a lead becomes Won or an order is created. The backend records quote snapshots and transition history. Staff still provide prices, named adjustments, terms, expiry, and communication references. The system does not infer tax, margin, or delivery terms, generate a quote PDF, or send a quote to a customer.

Define approved price lists, margin floors, validity, payment terms, tax rules, approval thresholds, and what constitutes accepted quote/order. Then automate quote conversion, order creation, confirmation, and changes with explicit status history.

**Deliverable:** Accepted quote produces a traceable order without silently changing the commercial agreement.

### Workstream 3 — Supplier, production, and logistics

**Code status:** Supplier grouping, guarded availability checks, reviewed supplier replies, and order fulfilment stage records exist. No supplier data or live WhatsApp opt-in has been configured; purchase orders, customization proofs, courier tracking, and address validation are not integrated.

Capture supplier catalogue, MOQ, price breaks, stock/lead times, customization constraints, and delivery performance. Add PO approval, proofs, production milestones, shipment tracking, address checks, delivery confirmation, and exception routing.

**Deliverable:** Orders have feasible, monitored fulfilment plans and visible customer impact when a risk appears.

### Workstream 4 — Finance and accounting

**Code status:** Vyapar reconciliation records are staff-entered through `/ops/finance`, with an audit trail for updates. Staff can download a protected JSON entry pack for an order linked to an accepted quote; it includes line items and approval evidence, identifies billing/GST details the app does not have, and explicitly leaves tax classification to the finance owner. It is not a Vyapar import format, connection, or automatic accounting posting. Public Vyapar materials reviewed describe Excel item-master import and Tally data transfer, but do not establish an edition-specific sales/invoice API. Receivables/payables and order-level cost data remain incomplete; only reconcile reports once supported source records exist.

Choose the accounting system and define invoice, payment, refund, tax, settlement, supplier-bill, and reconciliation ownership. Integrate only approved records; maintain reconciliation reports and an audit trail.

**Deliverable:** Order-level revenue, costs, receivables, payables, and exceptions can be reconciled to accounting records.

### Workstream 5 — Marketing, service, and analytics

**Code status:** Role definitions, a Notion content calendar, a supervised `/ops/content` desk for manual or AI-assisted drafts, human review/approval/scheduling/publication records, retryable Notion sync, a protected `/ops/analytics` view, and `/ops/exceptions` queue now exist. The exception queue surfaces missing lead ownership/next actions, failed or stalled Notion sync, supplier mapping/reply/send-reconciliation issues, orders on hold or past promised delivery, blocked or late fulfilment stages, shipment failures, finance exceptions, overdue/escalated customer-care tasks, and repeated outbox failures. It links staff to the owning desk; it does not mutate records or send push/email alerts. Content is not published by the app; staff publish through channel tools and record the public URL. Optional email marketing permission is captured separately from quote follow-up; staff can record withdrawals, but no marketing sender or unsubscribe flow is connected. Campaign attribution records first/last-touch UTM tags, landing path, and referrer host only when a quote is submitted. Spend, impressions, automated publishing, margin, cash collection, and on-time delivery rates remain unconnected to verified source data.

Connect consent-aware campaign attribution to lead and order outcomes. Automate approved content and service drafts, post-delivery feedback, repeat-order reminders, and dashboards for funnel conversion, gross margin, on-time delivery, defects, and cash collection.

Agent decisions are reviewed at `/ops/agents`. Keep proposed actions, human corrections, reasons, reviewers, and outcomes in the append-only feedback history and sync the same run to Notion by stable run ID. Use this history for periodic human-led evaluation; never let an agent change its own instructions based on a single review.

**Deliverable:** A measurable customer lifecycle with approved communications and decision-ready operating metrics.

## Guardrails for the first release

- Do not let an AI invent stock, supplier commitments, prices, lead times, tax treatment, or delivery status. Missing data should trigger a question or hold.
- Do not send quotes, make discounts, release purchase orders, charge/refund money, file taxes, or promise delivery without explicit rules and approval thresholds.
- Do not treat a submitted website form, opened email app, or WhatsApp draft as a delivered message or accepted order.
- Give each customer, supplier, and employee record a stable identifier and enforce role access before enabling write actions.
- Preserve a person-owned exception queue and a full activity history for each consequential automation.
- Measure time saved and error/exception rates alongside conversion and revenue; automate a step only when its inputs and decision policy are clear.

## Business discovery packet needed to turn this roadmap into build plans

For each workflow, capture: **trigger → information received → steps taken → person/role → rule or judgment → systems/files used → customer/supplier message → completion signal → exception → volume/time/cost**.

Begin with one recent real order and one lost, delayed, or complicated order, from first contact to final payment/delivery. Also list the tools already in use (CRM, email, WhatsApp, accounting, spreadsheets, inventory, supplier communication, courier, ads), who uses each, approximate monthly lead/order volume, and the top three repetitive tasks. Redact customer personal and payment information.

Once this discovery is available, create separate reviewed specifications for lead-to-quote, quote-to-order, fulfilment, finance, and marketing/analytics. Sequence the first implementation around the highest-value workflow that has reliable data and clear approval rules.
