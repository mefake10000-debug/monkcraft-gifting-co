# Moncraft Gifting

Moncraft's customer-facing gifting catalogue and its internal sales/operations workspace live in this repository as one Next.js application. They share code and deployment, while their business records live in protected external services.

## Start locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the customer website. The internal operations desk starts at `/ops`; it requires the server-side pilot access key. Copy `.env.example` to `.env.local` and configure the local database/integration values before expecting durable operations records. Never put server credentials in `NEXT_PUBLIC_*` variables or commit `.env.local`.

## Where things live

| Path | Responsibility |
|---|---|
| `src/app/` | Customer website, internal operations pages, and API routes |
| `src/components/ops/` | Staff work queues and decision screens |
| `src/lib/automation/` | Workflow rules, integration clients, data access, agent contracts |
| `src/lib/enquiry/` | Website quote-request validation and submission model |
| `supabase/migrations/` | Ordered durable schema, audit history, and guarded database transitions |
| `scripts/bootstrap-notion.cjs` | One-time creation of shared Notion operating boards and filtered views |
| `docs/automation/` | Operating model, business processes, integration requirements, and activation gates |

## Business workflow

Website quote request → durable Request ID → lead triage and supplier-check preparation → staff-owned sales follow-up → reviewed supplier availability → human-priced/approved quote → recorded customer acceptance → fulfilment milestones → finance reconciliation and customer care.

The database is the source of truth. Staff change business records in `/ops/*`. Notion displays shared filtered team queues and receives retryable syncs; it is not currently a two-way editing surface. AI suggestions require a staff trigger/review and do not send messages, approve prices, reserve stock, or move money.

## Read before changing the automation

1. [Agent operating blueprint](docs/automation/moncraft-agent-operating-blueprint.md) — finite agent jobs, handoff contracts, board definitions, WhatsApp flows, KPIs, integrations, and activation gates.
2. [Website and Notion operations foundation](docs/automation/moncraft-website-notion-foundation.md) — current workflow implementation and setup requirements.
3. [End-to-end automation roadmap](docs/automation/end-to-end-automation-roadmap.md) — staged business rollout and remaining decisions.
4. [Enquiry privacy notes](docs/conversion-enquiry-privacy.md) — captured data and model/service handling.
5. [Next.js agent rules](AGENTS.md) — read the installed Next 16.4 guides under `node_modules/next/dist/docs/` before editing Next.js code.

## Integrations

The repo contains integration foundations; it does not contain or prove live service accounts.

- **Supabase:** durable records, event history, idempotency, and outbox. Apply migrations in numeric order.
- **Notion:** one-time board bootstrap plus record sync. Configure its token and returned data-source IDs. Bootstrap creates external Notion pages; review the definitions and run it once only.
- **OpenAI:** optional server-side drafting/coaching key. Model calls are scoped, structured proposals with human review.
- **Meta WhatsApp Business Platform:** supplier messaging requires configured webhook/templates, verified mappings, consent evidence, and a staff send approval.
- **Vyapar:** staff currently enters approved estimates/invoices in Vyapar and records references in the operations desk. Do not assume an API is available for the installed edition.
- **Vercel:** deploys the web app and scheduled retry endpoint when environment variables are configured.

See `.env.example` for variable names and [the activation guide](docs/automation/moncraft-website-notion-foundation.md) for setup. Store secrets in the local environment or deployment secret manager, not in Git.

## Quality checks

```bash
npm test
npx eslint
npx tsc --noEmit
```

These checks validate repository behavior; they do not prove live database, Notion, WhatsApp, Vyapar, AI, or production-deployment connectivity. Use a sandbox/test workspace and synthetic records before a live pilot.
