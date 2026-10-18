# Moncraft Agent and Automation Operating Blueprint

**Purpose:** Define who does each job, what starts it, what information it may use, where its output goes, who approves it, and how failures return to a person.
**Business system:** Moncraft corporate gifting, starting with Bengaluru and nearby corporate buyers.
**Status:** Target operating design aligned to the current repository. The website and operations code exist, but external services and live records must be activated before this becomes a live operating system.

## 1. Operating model

Moncraft should run as one event-driven workflow over shared records. The secure application database is the system of record. The website collects buyer requests; the operations app is where staff make business changes; Notion is the shared team workspace and filtered workboard. Notion edits do not currently write back to the application database. Every object uses a stable ID and links to its parent request or order.

Use ordinary code for validation, permission checks, arithmetic, routing, due dates, retries, and state transitions. Use AI only to read, classify, summarize, compare approved data, and draft suggestions. Each AI run records its input references, proposed action, model, status, reviewer correction, and outcome. Human review data informs periodic evaluation; it is not live reinforcement learning and does not silently change prompts or model weights.

### System ownership

| System | Owns | Does not own |
|---|---|---|
| Moncraft website | Product discovery, shortlist, submitted quote brief, first/last campaign attribution | Supplier stock, final price, approved quote, order payment |
| Application database | Durable business records, IDs, activity/audit events, integration outbox | Staff-facing board presentation |
| Operations app (`/ops/*`) | Authorized staff edits, approvals, exceptions, agent review | Customer-facing browsing or accounting ledger |
| Notion | Shared filtered boards, human planning notes, team visibility | Authoritative quote/order state unless later two-way sync is explicitly designed |
| Meta WhatsApp Business Platform | Approved outbound/inbound WhatsApp transport | Supplier/customer business truth or inventory reservation |
| Vyapar | Accounting ledger for the current phase | CRM, supplier availability, website quote workflow |
| OpenAI API | Explicitly requested or event-triggered model inference | Durable business record, external messaging, payment, independent approvals |
| Vercel | Web application deployment and scheduled retry endpoint | Data store or AI decision policy |

## 2. Finite agent teams and job contracts

“Agent” means a bounded worker with one trigger, one work packet, an allowed tool set, a specific output, a handoff, and measurable quality. A coordinator routes work; it does not make commercial decisions. Start with the highlighted pilots. Do not deploy every role at once.

### Group A — Demand and marketing

| Agent | Trigger and finite ask | Reads | Writes / hands off | Allowed tools | Human gate and success measure |
|---|---|---|---|---|---|
| Campaign Planner | Monthly planning run or owner request: produce one campaign brief for a named occasion, segment, location, and channel | Approved positioning, product/category facts, season dates supplied by owner, prior campaign results | Content Calendar item with objective, audience, offer hypothesis, dates, asset needs, tracking tags | Internal catalogue, approved analytics; web research only from permitted sources | Owner approves offer, claims, and spend. Measure qualified enquiries and orders by campaign, not likes alone. |
| Search and SEO Analyst | Weekly run: review one priority landing page/query cluster and propose improvements | Website pages, Search Console data when connected, approved keyword research | Keyword hypotheses, page brief, FAQ and internal-link suggestions; assign to web developer | Search Console, analytics, keyword tool when connected | Human verifies facts and publishes. Measure qualified organic enquiries and index/CTR trends; never promise rank. |
| Social Copywriter | Approved campaign brief enters Draft | Approved offer, catalogue facts, audience, channel format, voice guide | Separate LinkedIn, Instagram, Google Business, and YouTube drafts with CTA and proof checklist | AI drafting, content calendar | Human checks product/brand claims and approves. Measure saves, qualified clicks, and attributed leads. |
| Creative Producer | Approved content draft needs an asset | Approved copy, product images, brand kit, aspect ratio, channel | Image/video brief, asset links, alt text, version ID | Image/video generator only if configured, approved asset library | Human checks product accuracy, logo use, rights, and final crop. No invented product variants. |
| Content Performance Analyst | Weekly after channel results are entered | Published URL, campaign tag, reach/click data, lead/order outcomes | Performance note and next experiment proposal linked to content ID | Analytics exports/API when connected | Owner approves experiment; do not automatically change paid spend. |

### Group B — Prospecting and sales

| Agent | Trigger and finite ask | Reads | Writes / hands off | Allowed tools | Human gate and success measure |
|---|---|---|---|---|---|
| Account Finder | Owner requests a named target segment, geography, and quantity | Public company websites, directories whose terms permit use, event exhibitor pages | Candidate company with source URL, evidence date, fit reason, and missing facts | Web search/browser; no private account scraping | Staff verifies each candidate and contact permission before outreach. Measure verified fit rate. |
| Account Researcher | Candidate passes initial screen | Public company pages and candidate record | Company profile: sector, location, likely gifting occasions, evidence and confidence | Permitted public sources | No guessed budget, named decision maker, email, or intent. Staff approves qualification. |
| Outreach Drafter | Qualified prospect or approved lead needs first/next message | Verified account facts, approved case studies, prior logged messages, contact preference/consent | Channel-specific editable message plus follow-up proposal | CRM, AI text drafting | Person sends. No automated LinkedIn connections, DMs, comments, likes, or scraping. Measure human-approved reply and qualified meeting rates. |
| Website Lead Triage | New durable quote request | Request payload, catalogue IDs, attribution, completeness rules | Completeness proposal, missing fields, product ID exceptions, suggested owner/next task | Database trigger and deterministic rules | Existing foundation. Staff reviews exceptions. Measure complete briefs and response time. |
| Lead Conversion Coach | Staff clicks “Get AI coaching” after saving relevant interactions | Website brief, lead status, dated history and allowed contact preference | Summary, buying signals, unanswered questions, one next action, timing/channel, editable draft, evidence references | OpenAI Responses API (`store:false`) and CRM record | Staff decides whether to use/save/send. No direct send, status change, price, stock, or deadline promises. Measure accepted/corrected suggestions and eventual outcomes. |
| Product Recommender | Staff requests options for a qualified brief | Stable catalogue records, MOQ, verified category/use-case tags; supplier/price data only if current and reviewed | Ranked shortlist with reason, fit gaps, unknowns, and source IDs | Product catalogue query | Human checks availability, suitability and price before customer communication. |
| Quote Preparation Assistant | Supplier checks are reviewed and a salesperson opens quote desk | Buyer quantities, human-entered prices, approved adjustments, terms, supplier response evidence | Versioned quote draft and checklist | Quote desk rules and database | Human approves commercial terms and sends externally. Never derive price from model guess. |

### Group C — Supplier and fulfilment operations

| Agent | Trigger and finite ask | Reads | Writes / hands off | Allowed tools | Human gate and success measure |
|---|---|---|---|---|---|
| Supplier Mapper | New/unmapped catalogue product or supplier change | Product ID, supplier directory, category evidence supplied by staff | Proposed product-supplier mapping with confidence and source | Supplier desk, catalogue | Authorized staff verifies and activates the mapping. Measure mapped-line coverage and mapping error rate. |
| Availability Request Preparer | Quote request contains mapped product lines | Request ID, requested SKU/name/quantity, required delivery date, active supplier mapping, supplier consent | One grouped supplier-check record per vendor; unmapped exception | Deterministic grouping and supplier check desk | Human approves send. Message asks for quantity-specific availability, price validity, MOQ, lead time, customization and ship-to feasibility. No reservation claim. |
| Supplier Reply Classifier | Inbound WhatsApp webhook or staff-pasted reply | Supplier-check ID, sender identity, original question, reply text/media reference | Parsed candidate fields and confidence; ambiguous/voice/image content to exception | Meta webhook, constrained classifier/OCR only if enabled | Staff verifies availability/price/MOQ/date. No reply can auto-approve a quote or PO. |
| Purchase Order Preparer | Customer accepts quote and sourcing plan is approved | Accepted quote, supplier-reviewed terms, approved quantities, PO rules | PO draft and commitment checklist | Operations system; Vyapar only if supported interface confirmed | Human releases purchase order and spend. Measure PO errors and supplier confirmation lag. |
| Customization and QC Tracker | Order milestone changes or due-time threshold reached | Approved artwork, order lines, production dates, QC checklist, evidence | Milestone task, blocker, evidence reference, late-risk flag | Orders desk, file store, courier API when connected | Staff approves artwork proof, QC release, substitutions and delay promises. |
| Logistics Tracker | Shipment booked or carrier webhook arrives | Order destination, package count, carrier/tracking ID, promised date | Tracking state, delivery evidence, exception and owner task | Carrier API/webhook when selected | Staff handles lost/damaged/split shipment and confirms business impact. Measure on-time delivery and exception age. |

### Group D — Finance, service, and control

| Agent | Trigger and finite ask | Reads | Writes / hands off | Allowed tools | Human gate and success measure |
|---|---|---|---|---|---|
| Vyapar Entry Preparer | Accepted order or recorded supplier bill | Approved quote/order, buyer/vendor details, entered Vyapar reference | Entry pack/checklist and reconciliation row | Current protected finance desk; export/import only after edition-specific verification | Finance staff enters and verifies in Vyapar. No tax classification, posting, payment, or refund. |
| Reconciliation Analyst | New invoice/payment/supplier bill reference or scheduled close | Order totals, approved documents, finance rows and source references | Matched/unmatched/amount-gap finding with evidence and owner | Database query; Vyapar integration only if official supported API for Moncraft edition is confirmed | Finance owner resolves mismatches. Measure aged open amount and reconciliation time. |
| Customer Care Drafter | Delivery confirmed, complaint logged, or buyer asks for help | Order milestones, shipment evidence, buyer channel and consent scope, prior messages | Task classification, priority, response draft, owner and due time | Customer care desk, approved channel API only after separately enabled | Human approves every message, remedy, refund, replacement, or compensation. |
| Operations Analyst | Daily exception queue / weekly KPI run | Saved leads, supplier checks, orders, finance, content and care events | Ranked blockers, KPI explanations, recommended owner/action | Read-only analytics queries | Owner changes staffing/process. Never edit source records or hide bad outcomes. |
| Workflow Coordinator (deterministic) | Explicit events, due-time jobs, webhook events | State, idempotency keys, policy rules, retry state | Calls bounded worker, writes run/outbox event, routes failure | Internal APIs, queue/outbox | Cannot invent data or bypass approval gates. Every retry is idempotent and visible. |

## 3. Handoff envelope and event contracts

Every agent handoff should carry this minimum envelope. PII is minimized to the fields needed for that work packet.

```json
{
  "event_id": "stable UUID",
  "event_type": "quote_request.received",
  "occurred_at": "ISO-8601 timestamp",
  "entity_type": "quote_request",
  "entity_id": "stable request UUID",
  "parent_id": null,
  "source": "website | staff | meta_webhook | vyapar_import | carrier_webhook",
  "actor": "system or named staff identity",
  "consent_scope": ["quote_follow_up_email"],
  "data_version": 1,
  "idempotency_key": "event-type:entity-id:version",
  "payload_reference": "protected database record reference",
  "required_approval": "none | staff_review | commercial_approval | external_send"
}
```

| Event | Producer | Exact consumers | Completion signal | Recovery owner |
|---|---|---|---|---|
| `quote_request.received` | Website API/database transaction | Lead triage, mapped supplier-check preparation, Notion lead sync, analytics | Durable Request ID + created run/checks/outbox rows | Sales owner for data gaps; system owner for storage/outbox failure |
| `lead.interaction_logged` | Sales staff form | Lead context, AI coach only when explicitly invoked, activity timeline | Interaction ID attached to Request ID and actor | Sales owner |
| `agent.proposal_created` | Bounded AI/rules worker | Agent review board, reviewer queue | Stable run ID and review state | Agent reviewer |
| `supplier_check.approved_to_send` | Authorized operations staff | Meta sender | Provider message ID and send state | Operations staff reconciles uncertain send; no blind retry |
| `supplier.reply_received` | Meta webhook | Reply classifier, supplier check, exception queue | Raw evidence stored, parse confidence, reviewer status | Operations staff |
| `quote.approved` | Authorized approver | Quote send task, Notion quote upsert | Approved version ID + approver + time | Sales owner |
| `quote.accepted` | Staff records customer evidence | Order eligibility and fulfilment setup | Acceptance evidence + unique order | Sales/operations owner |
| `order.milestone_changed` | Staff/courier webhook | Exceptions, analytics, customer-care trigger at Delivered | Milestone event + evidence | Fulfilment owner |
| `finance.document_recorded` | Finance staff/Vyapar import | Reconciliation and analytics | External reference + recorded amount/date | Finance owner |
| `notion.sync_failed` / `integration.retry_due` | Outbox worker | Exception queue and scheduled retry | Confirmed external ID or surfaced terminal failure | Integration owner |

Rules: save source record before calling external services; use idempotency keys; retry transient integration failures only; never retry a possibly delivered WhatsApp message without reconciliation; preserve raw supplier/customer evidence and parsed values separately; every record has an owner or a visible unassigned exception.

## 4. Notion operating hub: boards, goals, properties, and views

Notion uses one shared database per record type. Role views are filtered lenses over the same records, not copies. The following filters are the required view intent; where a view uses “today/overdue”, configure a relative date filter in Notion, otherwise use the live `/ops/exceptions` or `/ops/leads` due view as authoritative.

| Database | Goal and record unit | Must-have properties | Required views and filter intent |
|---|---|---|---|
| **Leads & Outreach** | One submitted quote request or staff-created prospect per Lead/Request ID | Status, Request ID, company, contact, source/campaign, contact preference, consent scope, products/quantities, occasion, recipient count, budget, delivery date/location, owner, next action, next action date, last activity | **Sales — Open:** Team=Sales AND Status not Won/Lost. **Sales — Unassigned:** Owner empty. **Sales — Follow-up scheduled:** next action date set. **Sales — New enquiries:** Status=New. **Marketing — Attributed leads:** Team=Marketing AND Campaign is not empty. Live overdue/today filtering is in `/ops/leads` and `/ops/exceptions`, where the date is evaluated at page load. |
| **Supplier Directory** | One supplier legal/contact entity | Supplier Code, category, contacts, active/mapped state, product IDs, WhatsApp opt-in, response notes with opt-in evidence, owner | **Operations — Needs product mapping:** Status=Needs mapping. **Operations — Mapped suppliers:** Status=Mapped. **Operations — WhatsApp opt-in recorded:** checkbox=true; staff must still verify evidence in the secure supplier desk before sending. **Operations — Paused suppliers:** Status=Paused. |
| **Supplier Checks** | One supplier response request for one quote request and mapped SKU group | Supplier Check ID, Request ID, supplier, products/SKUs, quantities, requested delivery date, status, availability, quoted price/currency/validity, MOQ, lead time, customization feasibility, raw reply reference, parsed values, reviewer, reviewed time, sent timestamp | **Operations — Needs mapping:** Status=Needs mapping. **Ready to review:** Status=Ready for review. **Awaiting supplier:** Status=Sent. **Replies to verify:** Status=Replied. **Clarifications:** Status=Clarification needed. Quote readiness is enforced in the quote desk against reviewed evidence and product/quantity linkage. |
| **Quotes & Orders** | One quote version per Request ID, then one linked Order ID | Quote ID/version, Request ID, Order ID, company, products, quantities, human-entered line prices, adjustments, subtotal/total/currency, terms, expiry, supplier evidence IDs, approver, sent reference/time, buyer decision evidence/time, promised date, owner | **Sales — Quote drafts:** Team=Sales AND Status=Draft. **Approval queue:** Status=Approval requested. **Awaiting buyer:** Status=Sent. **Accepted — order not created:** Status=Accepted AND Order ID empty. **Operations — Active orders:** Team=Operations AND Order ID set AND Status not Delivered / Closed or Cancelled. Finance source records currently remain in `/ops/finance` and are not synced to this board. |
| **Content Calendar** | One channel-specific content asset or post | Content ID, objective, campaign, audience, channel, brief, draft copy, image/video brief, asset, keywords, fact check, owner, approval, publish date, URL, results, related lead/order IDs | **Marketing — Ideas/Drafts/Review/Approved/Scheduled/Published:** corresponding Status and Team filters. **Marketing — LinkedIn/Instagram/YouTube/Google Business/Website/Email:** matching Channel. Publication remains a human-operated action and is recorded by URL/status. |
| **Agent Feedback & Decisions** | One agent proposal/run with immutable Run ID | Run ID, Agent, trigger, Request/Order/Content ID, input references, model/version, proposed action, confidence, status, reviewer, correction, correction reason, outcome, created/reviewed time | **Agents — Human review:** Status=Needs review. **Agents — [role]:** exact Agent match for each defined agent label. **Agents — Failed runs:** Status=Failed. Feedback informs reviewed evaluations; it does not train or change a model automatically. |
| **Customer Care** | One internal care task tied to Request/Order ID | Task ID, Order ID, Request ID, task type, priority, status, owner, due date, contact channel, applicable consent, draft, reviewer, outcome, evidence | **Care — Open tasks:** Status not Resolved/Dismissed. **Care — Escalations:** Status=Escalated. **Care — Delivery check-ins / Issues / Feedback requests:** matching Task type. Date-sensitive due work is evaluated in the operations desk. |

### Board operating rules

1. The ID is the join key; never create a second “copy lead” for another team.
2. Every open record has one named owner, one next action, and one due date, or an explicit “unassigned” exception.
3. Status changes happen in `/ops/*` until a secure two-way Notion integration is specified and tested.
4. Notion views organize work; they do not enforce permissions. Sensitive records remain behind operations authentication.
5. Sync errors are resolved from the source desk and retried by the outbox. Do not manually duplicate a Notion card to “fix” a sync.
6. Board creation is a one-time action. Do not rerun bootstrap to change filters; add views to the existing database through a reviewed idempotent migration/update script.

## 5. WhatsApp flows and scripts

### 5.1 Customer inbound quote intake (future customer-facing bot)

**Availability:** The current build records website follow-up preference and has supplier WhatsApp foundations. A customer-facing WhatsApp bot is not yet live. Enable only after Meta Business Platform, approved templates, webhook verification, retention policy, and named staff escalation are configured.

**Entry message**

> Hello, you’ve reached Moncraft Corporate Gifting. I can collect a few details so our gifting team can prepare a suitable quote. We’ll use them to respond to this request. You can ask for a person at any time. Shall we continue? Reply YES to continue or STOP to end.

If YES, collect one field at a time and confirm uncertain responses:

1. Work email and contact name.
2. Company and city.
3. Occasion/event and delivery date.
4. Approximate recipient count.
5. Budget per recipient and currency (optional; record “not shared” rather than guess).
6. Gift categories or catalogue SKUs (allow multiple).
7. Branding/customization needs.
8. Single delivery city, multiple addresses, or international.
9. Preferred contact channel. WhatsApp quote follow-up permission must be explicitly recorded; marketing consent is a separate question and unchecked by default.
10. Read back a concise summary, ask the buyer to confirm, then create the durable quote request.

**Confirmation script:** “Thanks, I’ve recorded request {{request_id}} for {{company}}: {{quantity}} recipients for {{occasion}}, requested delivery {{date}} in {{location}}. This is a quote request only; price, supplier availability, and delivery are not confirmed yet. A Moncraft team member will review it and follow up via {{selected_channel}}.” Send only after the database returns a durable Request ID.

**Minimum structured record:** `request_id`, contact, company, city, occasion, recipient count, budget/currency/unknown, item IDs and quantities, branding, requested delivery date, delivery locations/mode, source=`whatsapp`, message IDs/timestamps, explicit channel permission and evidence, summary, missing fields, status, owner, next action/due.

### 5.2 Supplier availability request (current guarded path; exact template must be approved by Meta)

Send only if supplier is active, the product mapping is verified, the supplier has WhatsApp opt-in evidence, the approved template is configured, and a staff member approves the specific check.

> Hello {{supplier_contact}}, Moncraft is checking availability for corporate gifting request {{request_reference}}. Please confirm each item and quantity below: {{products_and_quantities}}. Requested delivery date: {{requested_delivery_date}}. For each line, reply with available quantity, unit price and currency, price validity, MOQ, production/customization lead time, and delivery feasibility. Please reply with one option: AVAILABLE / PARTIAL / UNAVAILABLE, followed by details. This is an availability enquiry only and is not a purchase order or stock reservation. Thank you — Moncraft Operations.

**Supplier response record:** raw inbound text/media ID, provider message ID, sender phone match, associated check ID, received time, parsed availability per SKU, exact quantity, unit price/currency/validity, MOQ, lead time, feasibility, ambiguity reason, reviewer and reviewed time. Replies such as “yes”, an image, voice note, changed price, quantity shortfall, date conflict, or unknown sender must go to **Clarification needed** and a human. Do not interpret an unmatched message as stock confirmation.

**Clarification script:** “Thanks. To make sure we record this correctly, please confirm {{specific_missing_field}} for {{sku}} at quantity {{quantity}}. Please also confirm the price currency and how long it is valid. We have not reserved stock or placed an order.”

**Opt-out / stop:** If a supplier says STOP, remove send eligibility immediately, record exact message ID/time as withdrawal evidence, and route to staff. Do not ask the bot to persuade them or send another template.

### 5.3 Human handoff and failure scripts

- **Customer asks for a person:** “Of course. I’ve passed request {{request_id}} and your message to our gifting team. A team member will respond via {{permitted_channel}}.” Create an owned task and stop bot questioning.
- **Missing data:** “I haven’t got {{field}} yet. You can share it now, or I can leave it for the team to clarify.” Record unknowns explicitly.
- **No supplier reply:** No repeated WhatsApp sends automatically. Create overdue task for Operations with last send ID/time and check owner.
- **Webhook/AI/DB unavailable:** Tell the customer the request was not confirmed unless a Request ID was durably returned. For uncertain supplier send outcomes, reconcile provider message ID before retry.
- **Complaint, payment, tax, privacy, legal threat, refund, or safety issue:** stop automation, preserve original message, mark Escalated, assign a named owner and due time.

## 6. Daily operating rhythm

**Opening (10–15 minutes):** Sales reviews overdue/unassigned leads; Operations reviews supplier replies, clarifications and late milestones; Finance reviews unmatched documents; owner scans critical exceptions. Assign one owner and due time to each open blocker.

**During the day:** New request → verify the website brief → assign lead owner → log every consequential interaction → ask coach when useful → map products/prepare checks → approve/send supplier check → review response → price quote → approve and send externally → record evidence and buyer decision → create order only on recorded acceptance → update milestones and finance.

**Close of day (10 minutes):** Each owner completes or reschedules tasks with a note; do not leave stale “today” dates. Resolve sync and uncertain-send exceptions at their owning desk. Review only actionable analytics.

**Weekly (30–45 minutes):** Review qualified-lead conversion, response time, quote win/loss reasons, supplier responsiveness, gross margin once source costs exist, delivery risks, complaint age, campaign-qualified leads, AI corrections, and recurring failure causes. Change rules only through a reviewed change log and regression examples.

## 7. Scorecard and learning loop

| Area | Metric | Definition / required inputs |
|---|---|---|
| Demand | Qualified enquiry by source/campaign | Lead meets owner-approved qualification rules; source and campaign recorded at submission |
| Sales | First-human-response time | First logged staff response minus durable request time |
| Sales | Stage conversion / aging | Unique Request IDs entering each stage and elapsed time; exclude duplicates/test data |
| Sales | Quote win rate | Accepted quotes / quotes sent, with cohort date and loss reasons |
| Supplier | Response rate and time | Replies / checks sent; response time from send to matched reply |
| Supplier | Availability confidence | Reviewed checks with complete SKU/qty/price/lead-time evidence / checks reviewed |
| Operations | On-time milestone and delivery | Milestone/delivery evidence against approved promised date |
| Finance | Reconciliation gap and aging | Expected versus recorded amounts from approved source records; finance owner validates |
| Customer | Issue resolution time | Resolved time minus issue task creation; segment by severity |
| AI | Acceptance/correction rate | Human-approved proposals and explicit corrections by task type; report sample size and outcome |
| AI | Harmful/unsupported claim rate | Suggestions violating evidence/consent/price/stock/delivery rules; target zero |

Learning loop: save run → record reviewer decision → capture correction/reason/outcome → weekly sample and categorize → update written playbook/prompt/rules through versioned change → run regression cases → owner approves release. This is supervised evaluation, not autonomous reinforcement learning.

## 8. Implementation sequence and exit criteria

| Phase | Build and configure | Exit gate |
|---|---|---|
| 0. Business truth | Confirm brand/legal name, staff identities, existing software, privacy/retention, contact permission, price/margin/tax/approval policies, supplier terms, and actual customer journey examples | One owner-approved workflow map, data dictionary, and exception policy |
| 1. Foundation | Apply ordered Supabase migrations, configure server secrets, named staff authentication, backups, and monitoring; never expose credentials in browser | Test enquiry yields exactly one durable Request ID; authorization and restore path proved |
| 2. Website-to-sales pilot | Connect real site submission, activity timeline, AI coach, owner/tasks, Notion sync; use synthetic/test leads then a small live pilot | Duplicate submission safe; staff can trace same ID; failed sync visible; AI proposal is review-only |
| 3. Supplier pilot | Load real directory, verify mappings and consent evidence, approve one supplier template, pilot with a few willing suppliers | Correct vendor grouping; opt-out works; duplicates/ambiguous/late replies route to staff; no false stock confirmation |
| 4. Quote-to-order | Set price ownership, margin floors, quote terms, approval hierarchy, acceptance evidence, PO policy | Quote gate blocks unsupported lines; accepted quote required before order; audit trail complete |
| 5. Fulfilment | Define customization, artwork approval, QC checklist, dispatch partners, webhook/evidence and escalation rules | Sample order traced through delivered with evidence and late-alert owner |
| 6. Finance | Confirm Vyapar edition and officially supported import/API; define GST/tax/accounting owner; populate invoice, receipt, bill data | Reconcile sample order and supplier bill; no duplicate posting; finance signs totals |
| 7. Marketing and retention | Connect Search Console/analytics/ad data, publishing tools, permissions/unsubscribe, asset approvals, customer-care policy | Consent-tested campaign, publication proof, attributed qualified lead, opt-out and escalation tested |
| 8. Controlled autonomy | Only after several clean repetitions, enable specific low-risk actions with caps, kill switch, monitoring and owner | Measured quality/error thresholds met over owner-approved sample; immediate rollback demonstrated |

## 9. Exact integration inventory

| Tool | Why it is used | Data direction | Activation dependency | Current status |
|---|---|---|---|---|
| Next.js/Vercel | Website, ops screens, APIs, scheduled outbox retry | Browser/server → database and connected APIs | Deploy environment variables, domain, cron verification | Repo foundation exists; deployment/credentials not verified here |
| Supabase/Postgres | Durable source of truth, protected RPC, event/audit/outbox | App APIs ↔ DB; server-only service role | Project, migrations, secret, backups, RLS/RPC verification | Schema code exists; live project not verified |
| Notion API | Shared team boards and visibility | App → Notion retryable upsert | Integration token, parent page access, existing DB IDs, idempotent view setup | Bootstrap/sync code exists; no live board creation verified |
| OpenAI Responses API | Sales/content proposal generation | Minimal selected data → model; structured response → database | Server-only API key, model selection/budget cap, retention review | Optional AI code; no live key verified |
| Meta WhatsApp Business Platform | Approved supplier/customer messages and inbound webhook | App → Meta; Meta webhook → app | Business verification, sender, templates, webhook secrets, consent records, opt-out handling | Supplier guarded foundations; customer bot not live |
| Vyapar | Books, estimates/invoices and accounting records | Staff → Vyapar; approved totals/reference → Moncraft reconciliation | Exact edition's supported API/import confirmed by Vyapar and finance policy | Staff-led process; no verified API integration |
| Search Console/GA4/ad tools | SEO and campaign performance evidence | Read-only exports/API → analytics | Property access, consent/cookie policy, campaign standards | Not verified/connected |
| Carrier tools | Tracking status, POD, exception | Carrier webhook/API → order timeline | Selected carrier account, webhook signatures, mapping | Not connected |
| File storage | Artwork, proofs, POD, quote/PO documents | Authorized staff upload → private object storage → record reference | Private bucket, signed URLs, retention and ACLs | Must select and configure before real sensitive files |

## 10. Owner-provided facts required before live automation

Do not invent these. Create a controlled onboarding sheet and assign a human owner for each:

1. Public/legal brand spelling and approved short description.
2. Named staff, team, operating hours, escalation phone, authorization level and backup owner.
3. Lead qualification rules and service-level target for first response.
4. Contact/marketing consent wording, retention period, correction/deletion process, and privacy notice.
5. Supplier legal/business name, categories, contact details, active status, WhatsApp consent evidence/date/source, products/SKUs, MOQ, normal lead times, price validity and escalation contact.
6. Product and supplier mapping approval owner; substitution rules.
7. Price list/cost source, packaging/customization costs, margin floors, discounts, freight, GST/tax classification owner, validity and payment terms.
8. Who can prepare/approve/send quotes, approve POs, pay suppliers, confirm refunds/credit and sign off QC.
9. Customization vendors, artwork formats/proof sign-off, sample approval, production stages, QC checklist and defect remedy.
10. Delivery partners, cutoffs, pincode coverage, split shipments, proof-of-delivery standard and damage/loss process.
11. Vyapar edition/build, licensing, import/API documentation from vendor, invoice fields, invoice-number source, payment and supplier-bill process.
12. Monthly lead/order volumes, seasonal calendar, baseline conversion and current tools/owners.
13. One anonymized successful order and one lost/delayed/complaint order with event timestamps and actual decision points.

**Do not connect production sending or money movement until the relevant facts and approval owner are recorded.**
