# Moncraft CRM and Sales Operating Specification

**Purpose:** Define the full prospect-to-repeat-order workflow, the records that must exist, what each status means, what the system does after every change, and how Moncraft teaches its rules to the system once and improves them safely.

**Scope:** This is the target CRM design for Moncraft. “Salesforce” here means Salesforce-like sales-force capability; it does not mean Moncraft has selected or deployed Salesforce software. The current application is the system to extend.

**Current state:** The repository has a pipeline for submitted website quote requests, an owner/next-action field, an activity trail, a sales triage proposal, and an AI coaching foundation. It does not yet provide a complete CRM for manually researched prospects, reusable company/contact records, account ownership, campaigns, meetings, opportunity qualification, or a fully governed task queue. The current lead pipeline must not be represented as a finished CRM.

## 1. Operating promise

The CRM should let a person answer, from one screen: **Who is this buyer? What are they considering? What have we said and learned? What must happen next, by whom, and by when? What evidence supports the recommendation?**

Every active record must have an owner and a next action, or appear in an unassigned/blocked queue. Every change must update the related views and create a dated activity. An agent may prepare, summarize, classify, and recommend; deterministic rules own IDs, permissions, calculations, transitions, due dates, and retries. A human owns relationship judgment and commercial commitments.

## 2. Record model: one truth, connected records

| Record | One record means | Stable identity and links | Created by |
|---|---|---|---|
| **Account** | One buyer organization or business unit | `account_id`; normalized name/domain; optional parent account | Staff, approved prospect research, or website enquiry match proposal |
| **Contact** | One person at an account | `contact_id`; account link; channel details and channel-specific consent evidence | Staff, buyer form, or approved import |
| **Lead** | One potential buying relationship not yet accepted as a qualified opportunity | `lead_id`; account/contact links when known; original source/campaign | Website request, staff entry, approved list import |
| **Opportunity** | One specific gifting requirement that may become one order | `opportunity_id`; account/contact; originating lead or `quote_request_id`; occasion/programme; expected decision and delivery dates | Qualified lead or submitted website quote request |
| **Activity** | One dated interaction or meaningful internal event | `activity_id`; account/contact/lead/opportunity link; actor, channel, direction, evidence/reference | Staff entry, website event, approved connector, workflow |
| **Task** | One action with one accountable owner and due time | `task_id`; exactly one primary record link; task type, owner, due time, state, completion evidence | Staff or deterministic workflow |
| **Campaign** | One measurable marketing/outreach initiative | `campaign_id`; audience, objective, channel, dates, approved offer, tracking code | Marketing owner |
| **Quote** | One immutable commercial version offered to the buyer | `quote_id` + version; opportunity; line items, approved prices/terms, approvals and sent evidence | Staff/quote workflow |
| **Order** | One accepted and authorized fulfilment commitment | `order_id`; accepted quote version; buyer and supplier commitments | Workflow after recorded acceptance and human approval |

### Relationship rules

- A website quote request remains an immutable submitted brief with its existing `request_id`. It links to a lead (or an existing active lead after staff confirms a match), and then to an opportunity. Never overwrite the submitted buyer brief with later interpretation.
- One account can have many contacts, leads, opportunities, activities, quotes, and orders. One contact may relate to only the accounts permitted by Moncraft's chosen data policy; do not infer employment from a matching email domain alone.
- An opportunity may have multiple quote versions, but at most one accepted quote version may create the corresponding order. Revisions never erase sent versions.
- Activities and tasks link to their subject record and inherit enough parent links to show a complete timeline. Do not copy private data into every related record.
- Notion is a filtered work surface, not a second CRM database of truth. The application database owns IDs, links, state, audit history, and integrations. Notion changes do not update authoritative CRM records in the current design.

## 3. CRM navigation and work queues

The `/ops` CRM should open on **My work today**, not a generic dashboard. Provide a left navigation with:

1. **My day:** due/overdue tasks, new inbound requests, waiting replies, upcoming meetings, quote approvals assigned to the user.
2. **Leads:** saved views for New inbound, Unassigned, Needs qualification, Outreach ready, Follow-up due, Replied, Nurture, Disqualified.
3. **Accounts:** active accounts, target accounts, customers, inactive/reorder opportunities, duplicates to review.
4. **Opportunities:** pipeline by stage, close/delivery calendar, quote requested, quote approval, buyer decision, won/lost.
5. **Activities:** searchable interaction timeline and add-interaction form.
6. **Tasks:** My open tasks, Team queue, Overdue, Waiting on buyer, Waiting on supplier, Blocked.
7. **Campaigns and content:** linked activity/campaign attribution, approved drafts and performance.
8. **Exceptions:** integration failures, missing owners/data/evidence, duplicate candidates, ambiguous AI/supplier outputs.
9. **Reports:** funnel, follow-up discipline, conversion, margin after finance validation, sourcing and delivery performance.

### Required list behavior

- Each queue shows the business name, person, current stage, last meaningful activity, next action, owner, due time in Asia/Kolkata, source, and a direct open-record action.
- Search by company, contact, email/phone, request/opportunity/quote/order ID, or product SKU. Respect access limits and do not reveal secrets in search results.
- Filters must be saved named views; users should not need to reconstruct a view each visit. Provide filter chips, clear-all, sort, row count, and empty-state instructions.
- A stage change must ask for required missing fields and then show the exact downstream task(s) it created. No hidden dominoes.
- Every AI suggestion appears next to its evidence, uncertainty, and **Accept / Edit / Dismiss** controls. Accepting a suggestion saves the chosen CRM change and logs who accepted it; it never sends an external message by itself.

### Notion layout: clean team views over the CRM

Keep one **Moncraft Control Room** home page with sections for Sales, Operations, Marketing, Finance, and Agent Review. Each database below is created once and linked from relevant sections; do not create a separate copy per team. The application remains authoritative. Notion relations and synced IDs are navigation aids until bidirectional editing has a separately reviewed conflict model.

| Notion database | Goal and key properties | Saved views and exact filter intent |
|---|---|---|
| **Accounts** | One organization; Account ID, name, domain, sector, location, account type, owner, source/evidence, last activity, next action | **Target accounts:** Type=Target. **Customers:** Type=Customer. **Unassigned:** Owner is empty. **Review evidence:** Verification status is not Verified. **Inactive customers:** Type=Customer AND last activity older than owner-configured window. |
| **Contacts** | One person; Contact ID, Account ID/relation, name, role (evidence-backed), email/phone, channel permission state/evidence, owner, last activity | **Permission review:** Permission state=Unknown or Needs review. **Permitted contact:** requested channel permission=Allowed (still check current source record before send). **Opted out:** any relevant channel=Opted out. **Unlinked:** Account relation empty. |
| **Leads** | One potential buying relationship; Lead ID, Account/Contact links, source/campaign, status, owner, qualification fields, last activity, next task/due | **New inbound:** Status=New. **Needs qualification:** Status in New/Needs info/Researching. **Outreach ready:** Status=Outreach ready. **Follow-up due:** linked next-task due date is on/before today AND lead is active. **Unassigned:** Owner empty AND status active. **Nurture:** Status=Nurture. **Closed:** Status in Converted/Disqualified. |
| **Opportunities** | One gifting requirement; Opportunity ID, Account/Contact, source Lead/Request ID, occasion, estimated quantity/date, stage, owner, decision date, delivery date, amount only when approved | **Open pipeline:** Stage not Won/Lost/Cancelled and not On hold. **Supplier checks:** Stage=Supplier verification. **Quote work:** Stage in Quote preparation/Approval. **Awaiting buyer:** Stage in Quote sent/Decision pending. **Closing soon:** target decision date in owner-configured window and stage open. **Won:** Stage=Won. **Lost:** Stage=Lost. |
| **Activities** | One interaction/event; Activity ID, record links, date/time, channel, direction, type, actor, summary, sent-vs-draft, evidence reference, outcome | **Today:** activity date is today. **Recent inbound:** direction=Inbound sorted newest first. **Outbound drafts:** sent-vs-draft=Draft. **Meetings:** type=Meeting. **By channel:** one saved view per active channel. Do not use this board to expose full message bodies to roles that lack permission. |
| **Tasks** | One accountable action; Task ID, record link, type, owner, due date/time, status, blocker/waiting-on, completion evidence | **My open tasks:** Owner=current user AND Status not Done/Cancelled. **Due today:** Status open AND due date=today. **Overdue:** Status open AND due date before today. **Waiting on buyer:** Waiting-on=Buyer. **Waiting on supplier:** Waiting-on=Supplier. **Unassigned:** Owner empty AND Status open. **Completed:** Status=Done sorted by completion time. |
| **Quotes & Orders** | Use separate record types or separate connected databases; quote versions remain immutable and orders link to accepted quote version | **Quote approval:** record type=Quote AND Status=Approval. **Awaiting buyer:** record type=Quote AND Status=Sent. **Accepted, order missing:** Quote accepted AND Order relation empty. **Active fulfilment:** record type=Order AND status not Delivered/Closed/Cancelled. **Late risk:** Order active AND milestone due date before today. |
| **Campaigns & Content** | Campaign ID, content ID, objective, audience, channel, dates, owner, approval, publish URL, attribution code, measured outcome | **Marketing approvals:** status=Review. **Approved calendar:** Status=Approved/Scheduled grouped by publish date. **Published, needs results:** Status=Published AND results missing. **By channel:** Channel equals selected network. **Seasonal planning:** campaign period overlaps configured planning window. |
| **Agent Reviews** | Run ID, agent/contract version, linked records, playbook version, review state, confidence/evidence, correction, outcome | **Needs human review:** Review state=Needs review. **Failed runs:** status=Failed. **Repeated corrections:** correction category count above owner-approved threshold. **By agent:** Agent equals selected role. **Playbook changes:** Change status=Proposed/Testing/Approved. |

Views that require “current user”, relative dates, linked-record rollups, or permission checks are convenience views. The `/ops` application enforces access and remains authoritative. Every Notion row includes the stable Moncraft ID and link to its `/ops` record where available. Avoid putting confidential costs, unrestricted contact data, raw webhook payloads, or credentials into broadly shared Notion pages.

## 4. Lead lifecycle: exact entry/exit and handoffs

Statuses describe a business state, not a vague percentage. Keep `Lead` qualification separate from `Opportunity` sales stage. Website-originated records can enter directly as an opportunity candidate when their submitted brief is sufficiently concrete; the triage decision is still recorded.

| Lead status | Entry rule | Required before leaving | Default action and owner | Exit choices |
|---|---|---|---|---|
| **New** | New website submission or staff-created candidate is saved | Source, created time, owner or unassigned reason | Deduplicate proposal; capture source; create first-review task | Needs info, Researching, Qualified, Disqualified |
| **Needs info** | Essential contact/company/requirement fact is missing or inconsistent | Missing-item list and permissible contact channel | Draft a concise clarification; salesperson reviews/sends; task due date set | Researching, Qualified, Nurture, Disqualified |
| **Researching** | A person has accepted a prospect candidate for verification | Source URL/evidence date for material researched facts; researcher | Research agent proposes account fit and buying-context facts with confidence; human verifies | Qualified, Nurture, Disqualified |
| **Qualified** | Human confirms fit and a plausible gifting need or buying path | Fit reason, need/occasion hypothesis, buyer/contact path, qualification reviewer/date | Create or link Opportunity; assign salesperson and discovery task | Converted to opportunity, Nurture, Disqualified |
| **Outreach ready** | Lead is qualified for contact and has channel-permission basis | Contact identity/source, permission/compliance basis for channel, approved message evidence or reviewed draft | Outreach drafter makes one channel-specific draft and follow-up plan; staff sends | Contacted, Nurture, Disqualified |
| **Contacted** | Staff or approved connector records that a message was actually sent | Channel, sent timestamp, actor, message/reference, next action/date | Create follow-up task based on the owner-approved cadence; monitor reply | Replied, Nurture, Disqualified |
| **Replied** | Buyer has replied and the interaction is logged | Reply date/channel, intent classification with evidence; human review if ambiguous | Summarize response; create one next step (discovery, information, follow-up, close-out) | Qualified, Discovery, Nurture, Disqualified |
| **Nurture** | Potential fit, but no active buying window or a buyer asked for later contact | Reason, buyer's requested timing if stated, lawful channel basis, next review date | Create a dated nurture task; suppress any channel not permitted | Re-open to Researching/Qualified or Disqualified |
| **Converted** | Qualified lead has linked opportunity | Opportunity ID, conversion actor/time | Preserve Lead history; opportunity now owns the active deal | Terminal for lead; track deal on opportunity |
| **Disqualified** | Human decides no fit, invalid, duplicate, opted out, or no permitted path | Reason code, evidence/note, suppression rule if applicable | Close open outreach tasks; preserve opt-out and suppression evidence | Reopen only with a logged human reason |

### Qualification notes

Use a structured qualification card, not an unexplained AI score. Capture: organization fit, gifting use case, estimated recipient range if known, event/occasion, delivery location/date, customization needs, decision process/contact role evidence, buying timeline, source, and missing facts. For each field use `known`, `buyer-stated`, `staff-inferred`, `unknown`, or `not-applicable`, plus evidence/date where relevant. AI may summarize and point out gaps; it cannot convert an unknown into a fact.

If Moncraft later wants a priority score, start with an explainable rubric whose weights and thresholds are approved by the owner. Show each factor and source. A score is sorting assistance, never a reason to ignore a lead or send a message.

## 5. Opportunity lifecycle and stage gates

| Opportunity stage | What it means | Gate to enter/leave | Automatic work created |
|---|---|---|---|
| **Discovery** | Buyer need and constraints are being confirmed | Log discovery interaction; fill known occasion, quantity/recipient range, budget basis, branding, destination/date; mark unknowns explicitly | Summarize brief; create missing-info task if needed |
| **Solution shaping** | Team is assembling suitable products and feasible delivery/customization | Product IDs/SKUs and quantities; mapped supplier or explicit unmapped exception; availability still unconfirmed | Group lines by mapped supplier; create supplier-check drafts; task to resolve unmapped products |
| **Supplier verification** | Operations is collecting quantity/date-specific evidence | Each relevant supplier check has raw reply/evidence and reviewer status; ambiguous data remains exception | Availability questions and reply review tasks; no customer stock claim |
| **Quote preparation** | Staff is preparing a commercial offer | Complete line items, source of each price, currency, MOQ, freight/tax responsibility, terms, expiry and supplier evidence; missing commercial rules block | Build versioned draft from verified entries; never infer price or tax |
| **Approval** | Quote draft awaits authorized commercial approver | All approval requirements met and named approver recorded | Approval task; on rejection return with explicit revision request |
| **Quote sent** | Exact approved quote version was sent to buyer | Channel, recipient, actor, timestamp, sent artifact/reference and version | Buyer follow-up task at configured date; capture questions/changes as activities |
| **Decision pending** | Buyer is evaluating or negotiating | Record buyer-stated decision timing; all negotiation points and quote versions linked | Next-action task; AI may suggest evidence-based response; discounts/terms remain gated |
| **Won** | Buyer acceptance is evidenced and required internal approval is complete | Accepted quote version, acceptance evidence/time, delivery and billing facts, order owner | Create exactly one order and fulfilment plan; prepare finance entry pack |
| **Lost** | Buyer declined or the opportunity became inactive under a reviewed rule | Loss reason, date, competitor only if buyer-stated, price/fit/timing evidence if known | Close deal tasks; optional nurture/reorder task only if appropriate and channel is allowed |
| **Cancelled / On hold** | Buyer or Moncraft pauses/cancels after a deal was active | Reason, effective date, commitments and owners for supplier/customer resolution | Create cancellation/hold review; no automatic PO cancellation or refund |

Do not conflate supplier availability, a quote sent, buyer acceptance, an order, a payment, and a shipment. These are distinct facts and events.

## 6. Activity capture: “paste it here” becomes useful CRM context

Provide **Log interaction** on every lead, account, contact, opportunity, quote, and order. Minimum fields:

- occurred date/time and timezone; direction (`inbound`, `outbound`, `internal`); channel; participants;
- interaction type (`email`, `call`, `meeting`, `WhatsApp`, `LinkedIn`, `website`, `note`, `supplier update`, `other`);
- pasted message/notes or secure file reference; whether it was sent or is only a draft;
- source/consent context where relevant; linked campaign/message/quote/request IDs;
- outcome (no response, asked question, meeting booked, needs revised offer, declined, etc.); factual next step, owner and due time.

When a user pastes a draft, default it to **draft/not sent**. AI can return: concise summary, buyer signals and their text evidence, unanswered questions, tone/clarity edits, one recommended next step, recommended timing window with reason, suitable channel based on recorded preference/permission, and a message draft. It must distinguish buyer facts from interpretation, state uncertainty, and never claim a sent message or create a commitment. Staff can accept/edit/dismiss each item. If an interaction was sent, user must explicitly mark it sent and provide channel/date; do not infer from pasted wording.

### Follow-up planner

For every active lead/opportunity, require a single **primary next action** with owner, due date/time, and reason. Other tasks can exist, but the CRM should surface the one next move. Cadences are owner-configured per channel and stage; no default time interval is treated as Moncraft policy until approved. On an overdue task, the system alerts the owner and then the configured backup; it does not silently send another message. If a buyer asks for a specific date, that date overrides generic cadence. Opt-out immediately cancels/suppresses promotional follow-ups on that channel and creates a compliance exception if prior scheduled messages exist.

## 7. Website connection and domino rules

On explicit website **Submit quote request**, persist the brief first and return its Request ID only after durable storage succeeds. Preserve the current catalogue/shortlist flow and do not transmit identifiable cart data before submission. Then run these linked changes:

1. Create the immutable `quote_request` and initial activity `website_request_received` with server timestamp and submitted source/attribution.
2. Run deterministic duplicate candidates on normalized contact/company plus a configurable time window. Never merge automatically; present candidates to a staff reviewer.
3. Propose Account/Contact links if a verified match exists; otherwise create a prospecting exception or pending account/contact record according to the approved policy.
4. Create/link a Lead and an Opportunity candidate; link every submitted stable product ID/SKU and quantity. Preserve unknown fields as unknown.
5. Assign queue owner by approved routing rule; if none, put it in **Unassigned new enquiries** and alert the sales lead.
6. Create a review task with due time based on the approved first-response SLA, in Asia/Kolkata. The SLA is a configuration to learn from the owner, not invented here.
7. Check required brief fields. Create a customer clarification draft only for missing critical information; staff approves/send. Never imply current stock or confirmed pricing.
8. Group product lines by active, verified supplier mapping. Create one supplier-check draft per supplier and an exception for unmapped/inactive mapping. Sending follows supplier consent and human gate.
9. Upsert linked records to Notion and write Notion page IDs back to integration mapping. A failed sync does not lose the request; it remains in outbox retry/exception queues.
10. Create analytics events with stable IDs and campaign source. Only approved, privacy-reviewed fields enter the analytics view.

Every downstream record includes parent IDs, actor (`system` or named staff), event time, policy/playbook version, and idempotency key. Retrying the same submission must not make duplicate leads, opportunities, supplier messages, quotes, or orders.

## 8. One-time business learning and governed memory

The aim is to teach the system Moncraft's stable rules once, then ask the owner only when something is new, ambiguous, or changed. This is **structured onboarding plus versioned playbook management**, not autonomous reinforcement learning. Reviewed examples improve tests and recommendations; they do not silently train a model or rewrite policy.

### Initial learning session

Run a guided 60–90 minute session in the app, saved progressively so it can be completed in short blocks. The app asks one domain at a time, shows a plain-language summary, and asks the owner to confirm or correct it. Required domains:

1. **Business identity:** approved spelling, description, service geography, languages, operating hours, escalation owner.
2. **Ideal buyers:** target industries/company size/use cases, exclusions, buyer roles only when known, geography, minimum viable orders if policy exists.
3. **Offer and brand:** differentiators, proof/case studies, voice examples, approved claims, prohibited claims, approved images/assets.
4. **Products and sourcing:** product IDs/SKUs, category, mapped suppliers, MOQ, availability source, cost/price ownership, customization, replacement/substitution constraints.
5. **Commercial policy:** price/margin inputs and who may see them, discount/quote approval levels, quote validity, GST/tax owner, freight, payment terms, PO authority. Unknown items remain blocked instead of guessed.
6. **Sales process:** qualification questions, follow-up rules, owner routing, response targets, meeting process, loss reasons, nurture permission.
7. **Supplier communication:** contacts, channel permission evidence, approved scripts, required availability fields, escalation and opt-out procedure.
8. **Production and fulfilment:** artwork stages, proof approval, production gates, QC evidence, packing, dispatch, carrier handoff, delivery proof, delay/damage actions.
9. **Finance and care:** Vyapar version/process, invoice/reference fields, reconciliation owner, complaint categories, remedy approval limits, privacy/retention rules.
10. **Examples:** one anonymized successful order and one lost, delayed, or corrected order, including key timestamps and what a person actually decided.

For each answer store: value, scope, owner, evidence/source, confidence, last verified date, effective date, sensitivity, and playbook version. The UI distinguishes `confirmed policy`, `example`, `temporary exception`, `unknown`, and `needs review`. Sensitive cost/tax/contact data has role-based access.

### After onboarding

- Reuse confirmed facts automatically in eligible agent prompts and deterministic workflows; show the source/version where recommendations depend on them.
- Ask the owner a narrow question only when a workflow is blocked by a missing rule or when evidence conflicts. Never ask again for a confirmed unchanged rule.
- Each user correction becomes a **proposed playbook change** with before/after value, reason, example IDs, impact preview, requester and approver. A person approves policy changes.
- Test a playbook change against a small versioned regression set: known-good lead examples, disallowed claims, no-consent cases, ambiguous vendor answers, commercial approvals, and fulfilment exceptions.
- Publish a new version with effective date and rollback. Existing quotes/orders retain the rule version under which they were approved.
- Weekly, show a short learning review: repeated corrections, common missing facts, agent acceptance/edit/dismiss rates, failure reasons, and proposed rule changes. Batch low-risk editorial changes; keep prices, consent, finance, approvals, and external-send policy under explicit authorization.

## 9. Agent task contracts and limits

| Agent | Receives | Produces | Must not do |
|---|---|---|---|
| Prospect Finder | Approved segment, geography, permitted sources and quantity cap | Evidence-linked candidate accounts; source and research date | Scrape restricted services, invent personal contacts, contact prospects |
| Account Researcher | Candidate account and public evidence | Verified profile fields, source links, unknowns and confidence | Treat inference as verified fact |
| CRM Triage | New website/staff lead | Duplicate candidates, missing data, proposed owner/next task, linked-record suggestions | Merge records, silently disqualify, change consent |
| Sales Coach | Saved lead/opportunity and dated interactions | Evidence-backed summary, next action/timing/channel suggestion, editable draft | Send, invent urgency/budget, guarantee result, change stage without review |
| Outreach Drafter | Qualified record, permitted channel, approved campaign/voice | One channel-specific draft and follow-up plan | Automate LinkedIn engagement or bypass channel policy |
| Product Matcher | Opportunity constraints and approved catalogue facts | Shortlist with product IDs, rationale, gaps, supplier mapping | Claim current stock, exact price, delivery feasibility without evidence |
| Supplier Workflow Assistant | Approved check and mapped supplier | Structured question; extracted candidate reply fields and confidence | Reserve stock, accept price, create PO, treat unclear replies as yes |
| Quote Assistant | Reviewed supplier evidence and human-entered commercial inputs | Versioned quote draft and missing-item checklist | Set tax, price, discount, payment terms or send without approval |
| Order/Logistics Coordinator | Approved order, milestones and evidence | Tasks, late-risk alert, status summary | Mark delivered without carrier/staff evidence or promise remedy |
| Finance Analyst | Approved quote/order plus finance-entered references | Entry checklist and evidence-linked reconciliation exception | Post in Vyapar, pay/refund, decide tax treatment |
| Marketing Planner/Creator | Confirmed brand, campaign objective, audience, product facts | Channel-specific drafts, asset brief, source/claims checklist | Publish, spend, claim unverified product attributes, promise SEO rank |

Each run stores task-contract version, relevant playbook version, input references, output, citations/evidence IDs, model/tool, cost/latency where available, review decision, correction, and outcome. Failed/low-confidence output goes to a named reviewer queue.

## 10. Approval and autonomy ladder

| Level | Agent/system behavior | Enable only when |
|---|---|---|
| **0 — Observe** | Read permitted records and report gaps | Access control, audit trail, and data minimization are ready |
| **1 — Draft** | Prepare internal summaries, tasks, messages, content, quote checklists | Reviewer and evidence display are ready |
| **2 — Staff-approved action** | Staff accepts a CRM change or sends an approved message | Permission, recipient, exact message, audit and failure path are verified |
| **3 — Bounded routine action** | A narrowly defined, reversible action runs under caps (e.g., internal task creation or approved acknowledgement) | Repeated clean pilot, kill switch, monitoring, owner-approved limits and tested recovery |
| **4 — Commercial/external commitment** | Quote/discount, PO, payment/refund, supplier stock commitment, customer promise | Keep human authorization; do not infer eligibility from model confidence |

The initial live system should operate at Level 0–2. Advancement is per action, never per “agent.”

## 11. Metrics with precise definitions

| Metric | Definition | Owner / interpretation |
|---|---|---|
| First human response time | First logged human outbound response minus durable inbound request time, business-hours calculation per approved calendar | Sales lead; report median and 90th percentile, exclude no records silently |
| Lead completeness | Required fields known or explicitly marked unknown at triage completion / required fields applicable to that lead | Sales operations; separate buyer-stated from inferred |
| Follow-up discipline | Active records with owner + next action + due time / all active records | Sales owner; target set by owner, show count and percentage |
| Stage conversion | Unique records reaching next stage / eligible records entering prior stage in selected cohort/window | Analytics owner; define cohort date and exclude duplicates with logged reason |
| Quote win rate | Opportunities marked Won with acceptance evidence / opportunities with Won or Lost outcome in cohort | Sales owner; never count quote drafts as opportunities won |
| Supplier response reliability | Checks with reviewed supplier answer by requested response deadline / checks sent and due | Operations; include no-response and partial-response buckets |
| Gross margin actual | Finance-validated net sales less associated costs under finance-approved treatment / finance-validated net sales | Finance owner; do not use AI estimate as actual margin |
| On-time delivery | Orders with evidence-backed delivery on/before approved buyer promise / orders due in period | Fulfilment; identify buyer-approved date changes separately |
| AI proposal usefulness | Accepted without edit, accepted after edit, dismissed, or incorrect by role and sample size | Agent owner; low sample sizes shown, never optimize solely for acceptance |

Every report names time window, timezone, record cohort, source tables, exclusions, and last refresh. Missing integrations are labeled **not connected**, never reported as zero performance.

## 12. Minimum implementation order

1. **CRM foundation:** account/contact/lead/opportunity/activity/task schema, roles, audit and duplicate review; preserve current quote request records and IDs.
2. **My work + record pages:** My day, searchable account/contact, lead and opportunity list/detail, timeline, task capture, explicit stage gates.
3. **Website connection:** verified request-to-CRM links, duplicate suggestions, routing, SLA task, supplier grouping/outbox, Notion mirror.
4. **Sales assist:** paste/log interaction, coaching proposal with evidence, editable task and draft; evaluation/correction capture.
5. **Supplier/quote/order:** mapped supplier checks, reply review, quote versioning/approval, accepted quote-to-order, fulfilment task chain.
6. **One-time learning wizard:** collect confirmed rules and examples, version playbook, regression review, missing-rule questions.
7. **Channels and reporting:** enable approved WhatsApp/email/calendar/social/search/carrier/Vyapar integrations one at a time after credentials, permission, source-of-truth and failure behavior are verified.
8. **Controlled autonomy:** graduate individual low-risk tasks only after measured clean operation and rollback proof.

### Done means

- A staff member can create or find an account/contact, create a lead, log a conversation, schedule/complete a task, convert to an opportunity, prepare and approve a quote, record a decision, and trace the resulting order without re-entering the same facts.
- A website request preserves its original contents and creates or links the exact records once. Staff can see why every downstream task exists.
- Every active item has one accountable owner and a dated next action or a visible exception.
- The sales coach distinguishes known facts, buyer statements, internal inference and unknowns, cites evidence, proposes a next step, and waits for a human decision.
- Notion and the operations app show the same stable IDs and stage/status. Sync failures are visible and recoverable.
- Policies are learned once, versioned and confirmed; later changes are reviewed and testable, not silent self-training.
