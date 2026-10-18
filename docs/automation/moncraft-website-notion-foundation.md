# Moncraft website and Notion operations foundation

**Status:** Code foundation implemented; live database and Notion workspace still need credentials and one-time setup.  
**Updated:** 2026-10-17

## What the website now does

The catalogue, product pages, shortlist, and gifting brief remain in place. The customer’s browser keeps the draft until they press **Submit quote request**. That explicit action sends the contact details, contact preference, product IDs and quantities, occasion, budget, branding, delivery needs, source, and brief summary to `POST /api/enquiry`.

The API validates and saves the request through one database transaction. The transaction assigns a durable request ID and puts a Notion-sync event in the outbox. Repeated submissions with the same client submission ID return the same saved request; reusing that ID for a different brief is rejected. The page says **Quote request saved** only after the database confirms the write. It does not claim that a quote, price, stock, stock hold, order, or delivery is confirmed.

The API then tries to sync the exact request into the Leads board. A database-backed lock and a Request ID lookup prevent normal retries from creating a second Notion lead. If Notion is unavailable, the saved request remains safe and the outbox retries with exponential backoff.

The quote form also offers a separate, optional email-marketing checkbox. It defaults to unchecked and is not implied by the quote follow-up channel or WhatsApp consent. First/last campaign attribution is kept in tab-scoped browser storage and submitted with the quote only; it records allowlisted campaign tags, landing paths, and referrer hostnames. The `/ops/marketing` consent register supports staff-recorded withdrawals with an audit reference. No email campaign sender or unsubscribe flow is connected, so marketing sends remain off.

The same quote transaction queues supplier-check preparation. Mapped product lines become one draft per active supplier; unmapped or inactive supplier lines create a **Needs mapping** operations exception. These are internal drafts only. The quote request does not send a WhatsApp message, reserve stock, or create a purchase commitment. When the Supplier Checks data source is configured, draft checks sync to that board with their own retry state.

The Sales Pipeline includes a **Conversation history & AI coach** on each website enquiry. Staff can paste a relevant email, WhatsApp, LinkedIn exchange, call note, or internal note into a protected lead-interactions table. The entry is retained with its channel, direction, timestamp, and staff name. When staff explicitly request coaching, the server sends that lead's website brief and logged interactions to the configured OpenAI model with `store: false`; the model returns an opportunity summary, evidence-linked signals and open questions, one suggested next step, timing, channel, and an editable draft. The run is recorded in Agent Review & Decisions and syncs to Notion when configured. Staff must choose and save any follow-up task; the coach does not send messages, change pipeline status, reserve stock, or approve quotes. Avoid pasting payment data, passwords, or unrelated sensitive information.

The protected `/ops/content` desk now creates durable campaign drafts, either manually or through an explicit AI request. Drafts move through Draft → Review → Approved → Scheduled → Published / Repurpose with actor, time, notes, model usage, and publication URL recorded. Notion sync is retryable. Approval and scheduling are logged; staff must publish outside the app and then record the public URL. The optional model call receives only campaign/channel/audience/brief/keyword-theme fields, not customer or supplier records. Keyword ideas are hypotheses, not verified search-volume data. Add `OPENAI_API_KEY` server-side only if AI drafting is enabled; no key means manual drafting continues.

WhatsApp is only recorded as the preferred quote follow-up when the customer selects WhatsApp and checks the quote-specific consent box. No customer WhatsApp message is sent by this implementation. Supplier messaging has a separate, gated path: a staff member approves an eligible supplier check through the operations endpoint, then explicitly invokes the send endpoint. The supplier must be active, mapped, and have recorded WhatsApp opt-in; a configured approved template is required. Send failures and ambiguous network outcomes go to manual reconciliation without automatic resend. Replies are matched where possible and stored for human review; “available” is never translated automatically into stock confirmation.

## Notion control room

The one-time bootstrap creates seven shared databases under a parent page you choose, each with a Kanban view grouped by Status:

1. **Leads & Outreach** — New → Qualified → Draft ready → Contacted → Replied → Discovery → Quote request → Won / Lost.
2. **Supplier Directory** — Needs mapping → Mapped → Active → Paused → Do not contact. Includes supplier category, contact, product notes, and opt-in state.
3. **Supplier Checks** — Draft → Ready for review → Sent → Replied → Clarification needed → Expired → Closed. Captures quantities, availability, price, MOQ, lead time, and reply.
4. **Quotes & Orders** — Request received → Supplier checks → Draft → Changes requested → Approval requested → Approved → Sent → Accepted / Declined → Procurement → Customization → Quality check → Dispatch → Delivered / Closed. Quote versions are separate records on this shared board, linked to the lead by Request ID.
5. **Content Calendar** — Idea → Draft → Review → Approved → Scheduled → Published → Repurpose.
6. **Agent Feedback & Decisions** — Proposed → Needs review → Approved / Rejected → Completed / Failed. Include the `Run ID` rich-text property (stable database UUID) for idempotent run sync.
7. **Customer Care** — Open → Draft ready → Needs review → Waiting on customer → Escalated → Resolved / Dismissed. One internal delivery check-in is created after delivery; issue and feedback tasks are staff-created.

Email permissions and campaign outcomes remain in the protected Supabase source of truth, not a ninth Notion board. The Leads board contains the opt-in flag and selected attribution fields for staff context.

These are shared records rather than separate agent-owned copies. The bootstrap adds role-filtered views such as Sales Queue, Operations Queue, Marketing Queue, Finance Review, Needs Human Review, and Customer Care Escalations without fragmenting record history. Leads, quote versions, supplier directory records, supplier checks, orders, and customer-care tasks sync to Notion; the protected database remains the durable source of truth and retains retry state.

The protected `/ops/quotes` desk creates manual-price quote versions from submitted product IDs and quantities. A staff member enters all item prices, named adjustments, terms, and expiry. Approval is held until every requested item has an active supplier mapping and a human-reviewed `Available` reply, and each quoted catalogue item has a matching reviewed check. Partial, unavailable, unmapped, missing, or unreviewed checks block approval in the database as well as in the UI. This is point-in-time supplier evidence, not a stock reservation. Staff approve a version, manually send the quote outside the app, and record evidence of sending. Buyer acceptance or decline is recorded with a communication reference. Only acceptance marks a lead Won, and order creation requires the accepted quote version plus customer approval evidence. The desk does not infer tax, calculate margin, create a PDF, email a quote, reserve supplier stock, or create an order automatically.

The Quotes & Orders data source needs quote properties such as `Quote ID`, `Quote total INR`, `Quote valid until`, `Quote terms`, `Approved by`, `Sent reference`, `Buyer decision reference`, `Products`, and `Notes`, plus quote status options matching the lifecycle above. If that database already exists from an earlier bootstrap, add the missing properties and status options manually; do not rerun bootstrap, which would create duplicate databases. Quote records retry-sync through the protected backend and upsert by Quote ID.

The bootstrap adds a `Supplier Code` rich-text property used for idempotent supplier sync. Supplier saves attempt an immediate Notion update after the durable database write; if Notion is unavailable, the protected daily outbox cron retries. If the Notion Supplier Directory was created by an earlier bootstrap before this field existed, add that property manually before enabling the supplier sync variable; do not rerun bootstrap and create duplicate databases.

The Content Calendar data source must contain `Content ID`, `Objective`, `Audience`, `Brief`, `Draft copy`, `Image brief`, `Keywords`, and `Fact check` in addition to the existing `Content item`, `Status`, `Channel`, `Campaign`, `Asset`, `Publish date`, `Result / URL`, `Owner`, `Team`, and `Next action` properties. Fresh bootstraps include these fields. If the database already exists, add them manually before setting `MONKCRAFT_NOTION_CONTENT_DATA_SOURCE_ID`; do not rerun bootstrap. The Agent Feedback & Decisions data source must contain a `Run ID` rich-text property; add it manually to an existing database before setting its environment variable. The Notion integration needs access to each configured database.

The protected `/ops/exceptions` page is a live, read-only aggregation of records from the source workflows, not a second system of record. It detects unowned or overdue leads, failed/stale Notion syncs, supplier mapping/clarification/no-reply or ambiguous-send issues, orders on hold or past promised delivery, blocked/late fulfilment milestones, shipment exceptions, finance items needing entry/review, overdue or escalated customer-care tasks, and repeatedly failing outbox jobs. Staff resolve them from the linked desk. Current thresholds are 48 hours for stale Notion sync and supplier no-reply; outbox jobs appear after three attempts. It refreshes on page open or manual refresh and does not send external notifications.

## Agent boundaries

The code defines seven role cards and their allowed/prohibited work in `src/lib/automation/blueprint.ts`:

- **Prospect / CRM:** research public, permitted company information, qualify, draft messages, and schedule follow-ups. No LinkedIn scraping or automated engagement.
- **Marketing / SEO:** seasonal planning, keyword research, content and image briefs, and results reporting. A person approves publication.
- **Sales:** completeness checks, opportunity summaries, catalogue suggestions, and quote drafts. A person approves all prices, discounts, quote sends, and delivery promises.
- **Supplier WhatsApp:** group lines only where a verified product-to-supplier mapping exists. Sending requires supplier opt-in and an approved Meta template. No bot message reserves stock.
- **Order / Fulfilment:** track procurement, customization, quality, dispatch, delivery, and exceptions; evidence and a person are required to confirm critical stages.
- **Finance / Analytics:** prepare Vyapar entry packs and reconciliation/funnel/margin/supplier/delivery reports. It cannot post unapproved entries, decide tax treatment, pay suppliers, or refund.

These are bounded workflow definitions, not six autonomous AI runtimes. They become live AI workers only after a model/runtime and credentials are selected. No agent can silently adjust its own rules; reviewed examples belong in Agent Feedback & Decisions.

## Supplier WhatsApp operating path

1. Apply all fifteen ordered database migrations and populate `supplier_directory` and `product_supplier_mappings` through the protected `/ops/suppliers` desk. Record opt-in evidence; do not infer consent from an existing business relationship.
2. Configure the official Meta Business Platform webhook and server-only variables in `.env.example`. Meta must approve the supplier availability template with the five body parameters used by the send route: check reference, request reference, products, total units, and requested delivery date.
3. Open `/ops` and sign in with the server-side operations access key. Review mapping, quantity, supplier, and opt-in before approving. Approval and sending are separate actions; a second explicit confirmation is required to send. The console uses an expiring signed HttpOnly cookie. Keep the access key out of Notion and the customer-facing website.
4. Check the returned status and reply in Notion and `/ops` after the outbox sync. The reply review form records availability, price, MOQ, lead time, and notes only after a person selects and saves the verified values. The audit log records the reviewer; this still does not reserve stock.
5. Reconcile checks left in `Sending` with Meta before deciding what to do. A provider acceptance followed by a database error may mean the supplier already received the message.

## Sales pipeline operating path

The protected sales queue lives at `/ops/leads` and uses the same operations sign-in as the supplier console. Staff can review the request brief, choose a supported lead stage, set an owner and next action/date, and add a note. Each save writes a `lead_activity_events` record and queues an update to the existing Notion lead. The CRM version check makes a late Notion retry requeue itself instead of overwriting a newer stage or follow-up.

Each newly saved quote request now creates one deterministic Sales triage proposal in the same database transaction. It checks for missing company/occasion/recipient-count/budget/delivery details and product lines without stable catalogue IDs, then recommends the next staff step. It does not message the buyer or invent prices, stock, tax, or delivery promises. Review proposals in `/ops/agents`; run sync to the Notion Agent Feedback & Decisions board through the retryable outbox.

This is a supervised queue, not automated prospect outreach. Contact permission still follows the buyer's selected channel; the WhatsApp opt-in remains quote-specific. Lead data is returned only to the authenticated operations API and should not be copied into public analytics or model prompts without an approved data-handling policy.

## Current website changes

- Preserved the product catalogue, stable catalogue IDs/SKUs, product details, shortlist, MOQ display, and prepared brief.
- Changed the final online action to **Submit quote request**.
- Added preferred follow-up selection and explicit quote-related WhatsApp opt-in.
- Changed success to mean the request was persisted; the request reference is shown after durable save.
- Added a truthful pending state when Notion is not synced yet.
- No payment checkout, live inventory claims, or confirmed-order screen was introduced.

The `/api/enquiry` GET readiness check is now based on durable database setup, not the old optional Resend email-delivery foundation. The old delivery helper is not used to confirm saved requests.

## Required activation steps

1. Create a Supabase project and apply all fifteen ordered migrations: `202610170001_moncraft_quote_operations.sql` through `202610170015_lead_conversion_copilot.sql` in numeric order.
2. In the Moncraft Notion workspace, create a parent page named **Moncraft Operating Hub**, share it with an internal Notion integration that can read content, create databases/pages/views, and update content.
3. Run the bootstrap once from the repo root. It creates the seven databases and Kanban views, including the Customer Care queue, and prints their IDs. Do not run it twice; the Notion API will create duplicates.
4. Set the server-only environment variables below in local and Vercel environments. Never prefix secrets with `NEXT_PUBLIC_`.
5. Deploy, send a controlled test quote request, confirm one durable request and one linked Leads card, then check that the outbox and cron recover from a temporary Notion outage.
6. Add supplier records, obtain and record each supplier’s WhatsApp opt-in, then verify product-to-supplier mappings before enabling any supplier send workflow.

Required server variables:

| Variable | Purpose |
| --- | --- |
| `MONKCRAFT_SUPABASE_URL` | Supabase project URL |
| `MONKCRAFT_SUPABASE_SERVICE_ROLE_KEY` | Server-only access to protected RPCs; never expose to browser |
| `MONKCRAFT_NOTION_TOKEN` | Notion internal integration secret |
| `MONKCRAFT_NOTION_LEADS_DATA_SOURCE_ID` | Leads data source ID printed by bootstrap |
| `MONKCRAFT_NOTION_SUPPLIERS_DATA_SOURCE_ID` | Supplier Directory data source ID printed by bootstrap |
| `MONKCRAFT_NOTION_SUPPLIER_CHECKS_DATA_SOURCE_ID` | Supplier Checks data source ID printed by bootstrap |
| `MONKCRAFT_NOTION_QUOTES_ORDERS_DATA_SOURCE_ID` | Quotes & Orders data source ID printed by bootstrap |
| `MONKCRAFT_NOTION_CUSTOMER_CARE_DATA_SOURCE_ID` | Customer Care data source ID printed by bootstrap |
| `MONKCRAFT_NOTION_CONTENT_DATA_SOURCE_ID` | Content Calendar data source ID printed by bootstrap |
| `MONKCRAFT_NOTION_AGENT_FEEDBACK_DATA_SOURCE_ID` | Agent Feedback & Decisions data source ID printed by bootstrap; board needs `Run ID` rich-text property |
| `OPENAI_API_KEY` | Optional server-only key for staff-triggered campaign drafts and lead coaching |
| `MONKCRAFT_MARKETING_MODEL` | Optional model override for marketing drafting |
| `MONKCRAFT_SALES_MODEL` | Optional model override for lead-conversion coaching |
| `CRON_SECRET` | Bearer secret for `/api/cron/automation-outbox` |
| `MONKCRAFT_OPS_API_SECRET` | Server-side bearer secret for guarded supplier approval/send endpoints |
| `META_APP_SECRET` | Meta webhook signature verification |
| `MONKCRAFT_WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Meta webhook verification handshake |
| `MONKCRAFT_WHATSAPP_ACCESS_TOKEN` | Server-side Meta API access token |
| `MONKCRAFT_WHATSAPP_PHONE_NUMBER_ID` | Official WhatsApp Business phone number ID |
| `MONKCRAFT_WHATSAPP_GRAPH_API_VERSION` | Explicit Graph API version configured for the Meta app |
| `MONKCRAFT_SUPPLIER_AVAILABILITY_TEMPLATE` | Approved WhatsApp supplier template name |
| `MONKCRAFT_SUPPLIER_TEMPLATE_LANGUAGE` | Approved template language code (defaults to `en`) |
| `MONKCRAFT_NOTION_PARENT_PAGE_ID` | One-time local bootstrap only; not needed by the web app |

Use a randomly generated operations access key with at least 32 characters. The current pilot console uses a shared key and a staff-entered reviewer name; it does not provide individual accounts, role-based permissions, or an identity audit trail. Upgrade to named staff authentication before adding more users or broader operations controls.

`MONKCRAFT_NOTION_PARENT_PAGE_ID` and `MONKCRAFT_NOTION_TOKEN` must be present in the local shell before `npm run notion:bootstrap`. This command has a `--confirm-create` guard because it creates external Notion content.

## Current integration limits

- No Supabase, Notion, or Vercel credentials were available in this repository session, so no live workspace/database was created and no deployment was made.
- The Notion bootstrap command has not run against a real workspace. Confirm its integration permissions before using production records.
- `/ops/suppliers` is the protected staff desk for supplier contacts, WhatsApp opt-in evidence, active status, and product-ID mapping changes. Supplier and mapping changes are audited; supplier records retry-sync to the Notion Supplier Directory when its data source ID is configured. No supplier records/mappings were supplied, so availability routing and vendor messaging still need Moncraft's real data and supervised testing.
- Supplier availability drafts, audited human-reviewed reply fields, a managed sales pipeline, order/milestone/shipment records, Vyapar reconciliation references, customer-care tasks, and funnel/response/fulfilment analytics views now exist in the backend schema. `/ops/orders` creates orders only for Won leads with recorded approval evidence and tracks procurement, customization, QC, dispatch, delivery, and proof-of-delivery. Stage and shipment transitions are database-gated and audited. Orders sync to the shared Quotes & Orders Notion board when the data source ID above is configured. `/ops/finance` records and reconciles documents staff entered in Vyapar; it does not post to Vyapar. For accepted orders, staff can download a protected JSON entry pack from `/api/ops/finance/entry-pack`; it summarizes the accepted quote and customer/order data, marks missing accounting fields, and leaves tax classification to finance. It is not a Vyapar import format. Corrections create audit events. `/ops/analytics` summarizes recent quote request cohorts, supplier replies, fulfilment risk, and reconciliation exceptions; it is an operational indicator view, not a financial statement. `/ops/customer-care` creates an internal, audited task when an order reaches Delivered and supports staff-owned issue/feedback follow-ups; outbound messages are not sent.
- `/ops/agents` is the human review desk for proposed agent actions. Decisions require a named reviewer and outcome; rejection requires a correction and reason. Every review appends a protected feedback event and queues retryable Notion sync keyed by run ID. These examples support evaluation and future rule changes, but do not train or modify agents automatically.
- The official WhatsApp Business Platform account does not by itself prove an approved template, supplier opt-in, reply parsing, or webhook configuration. The guarded endpoints and inbound webhook are code foundations only until configured and tested with opted-in suppliers.
- The `/ops` console covers supplier check review and gated WhatsApp send; `/ops/leads` covers the quote-request pipeline; `/ops/orders` covers accepted orders and fulfilment; `/ops/finance` covers manual Vyapar entry logging and reconciliation. The console does not provide named user accounts. Use a restricted staff group and a high-entropy shared access key during the supervised pilot; move to individual staff authentication before wider rollout.
- `/ops/customer-care` queues one internal delivery check-in after an order reaches Delivered and supports staff-created issue and feedback tasks. It never sends messages. Quote-specific WhatsApp opt-in is shown with that scope and must not be treated as consent to marketing or broader messages.
- `/ops/marketing` lists email permissions and records staff-entered opt-outs with evidence. Analytics reports attributed quote requests, Won leads, and orders using last-touch campaign tags. It does not measure spend, impressions, or revenue attribution. The campaign sender is not connected; implement unsubscribe and suppression checks before enabling sends.
- Vyapar remains staff-operated. This repo does not claim a public Vyapar API connection. The reviewed [Vyapar item-import guide](https://vyaparapp.in/free/inventory-management-software/excel) describes importing item-master data via the in-app Excel template, and the [Vyapar data transfer guide](https://vyaparapp.in/guides/how-to-import-and-export-vyapar-app-data-into-tally) describes Tally transfers. An edition-specific sales/invoice API was not established from these public materials; confirm with Vyapar before building direct posting.
- Lead data is personal/business contact data. Apply an approved retention period, restrict Notion membership, and document deletion/subject-request handling before public launch.
- The Vercel cron schedule is once daily for Hobby-plan compatibility. Vercel documents Hobby cron as once per day with coarse timing; more frequent recovery requires a plan that supports a faster schedule. [Vercel Cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs)

## Rollback

The site can be rolled back while keeping the database migration and records. Do not drop quote tables to roll back application code. Disable the cron and remove server-only integration variables to stop Notion sync; stored requests remain available to a controlled recovery process. Database deletion requires a separate, explicit retention and backup decision.
