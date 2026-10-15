# Monkcraft Production Architecture v1

**Status:** Architecture planning only — **stop for owner approval before any implementation**  
**Date:** 2026-10-15  
**Audience:** Business owner + technical implementers  
**Repo audited:** `/Users/nishantparihar/Desktop/monkcraft-gifting-co`

### Constraints respected for this assessment

No package installs, cloud account creation, databases, migrations, auth changes, deploys, product-data deletion/overwrite, secret exposure, feature rewrites, or `npm audit fix --force`. Diagnostics were read-only / non-mutating.

### Related docs

| Document | Status |
|----------|--------|
| `docs/monkcraft-catalogue-data-audit-v1.md` | **Present** (complete) — primary product-data evidence |
| `docs/monkcraft-platform-audit-v1.md` | **Missing** — this document covers the platform audit |
| `docs/conversion-enquiry-privacy.md` | Present — enquiry privacy & delivery gates |
| `docs/monkcraft-reference-direction.md` | Present — product/UX direction |
| `.cursor/rules/monkcraft-core.mdc`, `monkcraft-visual.mdc` | Present — business + visual rules |
| `AGENTS.md` | Present — Next.js 16 agent guidance |

---

## 1. Verified current architecture

### 1.1 Runtime stack (verified via `package.json` + `npm ls`)

| Layer | Installed version | Notes |
|-------|-------------------|--------|
| Next.js | **16.4.0** | App Router; `cacheComponents` + `partialPrefetching` enabled in `next.config.ts` |
| React / React DOM | **19.3.0** | |
| TypeScript | **5.9.3** (dev) | |
| Tailwind CSS | **4.3.3** (dev) via `@tailwindcss/turbopack` | |
| ESLint | **9.39.5** + `eslint-config-next@16.4.0` | |
| Production runtime deps | **Only** `next`, `react`, `react-dom` | No ORM, auth SDK, email SDK, AI SDK, PDF lib, object-storage SDK |

`npm audit` (no `--force`): **5 high** findings, all in the **eslint-config-next → fast-glob → micromatch → braces** chain (dev tooling DoS advisory). Suggested “fix” points at downgrading eslint-config-next to 14.x, which conflicts with Next 16 — **do not force-fix without a deliberate review**. Not a runtime production dependency of the live app today.

### 1.2 Application shape

- **Single Next.js monolith** under `src/app/` (no separate API microservice).
- **No `middleware.ts`.**
- **No Server Actions** (`"use server"` not present).
- **No authentication** libraries or session cookies for users/employees/admins.
- **No production database** in the app.
- **No deploy config** (no Dockerfile, `vercel.json`, or IaC). `.gitignore` ignores `.env*` and `.vercel`. Public `vercel.svg` is decorative only.

### 1.3 Routes and surfaces (verified)

| Area | Routes | Persistence |
|------|--------|-------------|
| Marketing homepage | `/` | Static/marketing components |
| Catalogue | `/gifts`, `/gifts/[slug]`, shortlist, brief, find, box | Server-rendered catalogue + client drafts |
| Studio | `/studio` | Browser `localStorage` drafts; PDF via browser print |
| Company Stores | `/company-stores`, configure, preview | Explicit **demo** — local drafts only |
| APIs | `POST /api/enquiry`, `GET /api/catalogue/search`, `POST /api/gift-finder/recommend` | See §1.6 |

### 1.4 Product-data storage (verified)

| Fact | Evidence |
|------|----------|
| Source of truth | Sibling export: `../monkcraft/website-export/data/products.json` (schema **2.0.0**) |
| Loader | `src/data/catalogue/products.ts` via `exportPath.ts` |
| Resolution order | `MONKCRAFT_EXPORT_DATA` → `src/data/catalogue/export/` → `../monkcraft/website-export/data` |
| Product count | **4,257** SKUs; **0** duplicate SKUs/slugs |
| File size | ~**18.5 MB** JSON; parse heap delta ~**57 MB** in a one-off Node check |
| In-process cache | Module-level `cachedProducts` / slug / id maps (load once per Node process) |
| Search / filter | In-memory string includes + facet filters + pagination (`query.ts`, page size 24) |
| Images | Symlink `public/catalogue-media` → `../monkcraft/website-export/media` (~**804 MB**, ~**22k** files) |
| Identity | `product.id` === **SKU**; URLs use **`slug`** |

There is **no** Postgres, Algolia, Typesense, Elasticsearch, or paid search in this repo.

### 1.5 Browser storage patterns (verified)

All customer work-in-progress is **device-local**:

| Key | Domain |
|-----|--------|
| `monkcraft-shortlist-v2` | Shortlist |
| `monkcraft-brief-v2` | Gifting brief (+ contact on prepare) |
| `monkcraft-box-v1` | Build a Box |
| `monkcraft-gift-finder-v1` | Gift Finder draft |
| `monkcraft-studio-branding-v1` / `monkcraft-studio-catalogue-v1` | Studio |
| `monkcraft-company-store-draft-v1` | Company Store admin demo |
| `monkcraft-company-store-order-v1` / `…-requests-v1` | Employee order demo |

Logo binaries stay in browser drafts (size-capped ~400 KB; SVG loaded as image data URL only — not injected as markup). **No server upload API exists.**

### 1.6 API / server boundaries (verified)

| Endpoint | Behaviour | Auth | Hardening present |
|----------|-----------|------|-------------------|
| `POST /api/enquiry` | Validate → rate limit → optional Resend delivery | None | Honeypot, field limits, in-memory rate limit (8 / 15 min / IP), idempotency (~30 min), no body logging |
| `GET /api/catalogue/search` | Public catalogue lookup for Studio/Store pickers | None | Limit capped (≤48); export-backed only |
| `POST /api/gift-finder/recommend` | Rule-based recommendations | None | JSON shape check; **not generative AI** |

Enquiry delivery stays **off** until all of `MONKCRAFT_ENQUIRY_DELIVERY_ENABLED=true`, `PROVIDER=resend`, API key, to/from emails are set (see `.env.example` + `docs/conversion-enquiry-privacy.md`). Rate limit + idempotency are **in-memory Maps** — suitable for a single process, not multi-instance production.

Public conversion env (safe for browser): `NEXT_PUBLIC_MONKCRAFT_ENQUIRY_EMAIL`, `…_BOOKING_URL`, `…_WHATSAPP_E164`.

### 1.7 Integrations (verified)

| Integration | Status |
|-------------|--------|
| Resend email | Optional foundation via native `fetch` — **not enabled** without env |
| WhatsApp | Client deep-link (`wa.me`) when E.164 configured — not a Business API |
| Google Calendar | Client booking URL when configured — not Calendar API |
| Generative AI | Explicitly **inactive** (`aiBoundary.ts`); Gift Finder is rule-based |
| PDF catalogues | Browser **Print → Save as PDF** — no PDF library |
| Payments / ERP / courier | Not present |
| CRM | Not present |

### 1.8 Company Store security model (verified)

Code and UI consistently label Company Stores as a **local demo**:

- Access rules (`requireWorkEmail`, allowances, approvals) are **config intent only** — not enforced server-side.
- Preview routes are public Next.js pages; product detail uses the **public catalogue** by slug.
- No tenant ID, no employee auth, no server-side order ingestion, no multi-company isolation.
- `StoreAdminShell` copy states production still needs authenticated multi-company isolation.

**Verdict:** Safe as a sales demo. **Unsafe** as a private employee store if treated as live.

### 1.9 File uploads (verified)

- Client-only FileReader → data URLs for logos.
- Type/size checks in `src/lib/studio/logo.ts`.
- No virus scanning, no object storage, no signed URLs.

### 1.10 Deployment readiness (verified)

- Catalogue and media depend on a **sibling folder + symlink** outside the Next app. Default Vercel/serverless packaging will **not** include ~804 MB of media or the 19 MB JSON unless deliberately redesigned.
- `outputFileTracingRoot` points at the workspace parent to allow reading the sibling export during local/build tracing — this is a **local monorepo convenience**, not a production media strategy.

---

## 2. Main production risks

| # | Risk | Severity | Why it matters |
|---|------|----------|----------------|
| R1 | Company Store “privacy” is frontend-only | **Launch-blocking** for private stores | Any employee store must use server authz + tenant isolation |
| R2 | No durable enquiry / quote records | **High** once online submit is live | Email-only delivery has no CRM audit trail, no retries store, no admin queue |
| R3 | In-memory rate limit / idempotency | **High** on multi-instance hosting | Limits reset per instance; spam/dupe protection weakens on serverless |
| R4 | Catalogue/media not deployable as-is | **Launch-blocking** for public catalogue hosting | Symlink + sibling export will break on typical PaaS |
| R5 | Public unauthenticated catalogue search API | **Medium** | Acceptable for public catalogue; must not later expose private store catalogues without auth |
| R6 | Customer PII only in browser / optional email | **Medium** | Cross-device brief recovery and compliance (retention, deletion) need a policy + store |
| R7 | No auth for any admin / merchandising UI | **Launch-blocking** before any write admin | Unauthenticated write APIs must never ship |
| R8 | No backups / monitoring / incident process | **High** before paid fulfilment | Orders and company data need RPO/RTO |
| R9 | SVG logos in drafts | **Low–Medium** | Currently local-only; if server-rendered later, treat as untrusted |
| R10 | AI not live (good) but future keys need boundary | **Medium (future)** | Cost, prompt injection, fabricated SKUs |

Honest strengths to preserve: export-backed inventory honesty, enquiry delivery gated until configured, honeypot + validation, Gift Finder not claiming AI, Company Store demo labelling.

---

## 3. Recommended technical stack

**Design principle:** Keep **one Next.js application** as the system of record for UX + BFF APIs. Add managed services only where file+localStorage cannot meet security or scale. Avoid microservices until a clear operational need appears.

### 3.1 Recommended “launch core” (simple + maintainable)

```
                    Next.js 16 (App Router)
              Vercel or equivalent Node host
         marketing, catalogue SSR, Route Handlers
              server-only authz for private APIs
                           |
          -----------------+-----------------
          |                                  |
   Managed Postgres                    Object storage + CDN
   (Neon or Supabase)                  (Cloudflare R2 or S3)
   products*, enquiries,               product images, logos,
   tenants, orders                     generated PDFs
          |
   Auth provider (Clerk or Auth.js)
```

\*Products may start as **synced tables** from the existing export (SKU/slug preserved), not a greenfield catalogue rewrite.

| Capability | Recommendation | Why |
|------------|----------------|-----|
| App host | **Vercel** (or Railway/Fly if India egress/cost prefers) | Native Next 16 fit; preview deploys |
| Primary DB | **Postgres** (Neon or Supabase) | Relational tenancy, enquiries, orders; SQL backups |
| Product search (launch) | **Postgres** (`pg_trgm` / full-text) + existing facet columns | Enough for 4–10k SKUs; no new search vendor yet |
| Images | **R2 or S3** + CDN; paths continue as `/catalogue-media/...` or CDN URLs with stable keys | Deployable; cheap egress on R2 |
| Auth (Company Store + admin) | **Clerk** *or* **Auth.js + Google Workspace / email OTP** | Server sessions; org/tenant claims |
| Enquiry email | Keep **Resend** foundation already coded | Minimal new surface |
| Secrets | Host env + later vault; never `NEXT_PUBLIC_*` for keys | Already aligned with `.env.example` |
| Monitoring | Host logs + **Sentry** (errors) + uptime check | Small cost, high leverage |
| Backups | Managed Postgres PITR + nightly object-storage versioning | Required before live orders |

### 3.2 What can wait (post-launch / P2–P3)

| Capability | Defer until |
|------------|-------------|
| Dedicated search (Typesense / Meilisearch / Algolia) | Measured latency pain, >~15k SKUs, or heavy typo/synonym needs |
| Generative AI discovery | After rule-based Finder + cost policy approved |
| Server-side PDF engine (Playwright/PDFKit) | When white-label PDF quality/SLA exceeds browser print |
| WhatsApp Business Cloud API | When volume justifies vs deep-links |
| Google Calendar API | When booking URL is insufficient |
| Microservices / event bus / Kafka | Not needed at this stage |
| Multi-region active-active | Premature |

---

## 4. Options and approximate cost considerations

Costs are **order-of-magnitude** (USD/month, India-friendly vendors where noted). Confirm current pricing before purchase. Assume early traffic: marketing site + few Company Store pilots, not marketplace scale.

### 4.1 Hosting

| Option | Approx. | Advantages | Disadvantages |
|--------|---------|------------|---------------|
| **Vercel Pro** | ~$20+/mo + usage | Best Next DX, previews, edge | Media must live off-platform; cold starts; India latency varies |
| **Railway / Render / Fly.io** Node | ~$5–40+/mo | Simple long-running Node; easier large FS if needed | More DIY for Next optimizations |
| **AWS Amplify / App Runner** | Variable | Enterprise familiarity | More ops complexity |

**Recommendation:** Vercel (or equivalent) for the app **plus** external object storage for media. Do not ship 804 MB media inside the Next deployment.

### 4.2 Database

| Option | Approx. | Advantages | Disadvantages |
|--------|---------|------------|---------------|
| **Neon** serverless Postgres | Free → ~$19+/mo | Branching, scale-to-zero, PITR on paid | Cold starts on free tier |
| **Supabase** | Free → ~$25+/mo | Auth+DB+storage combo | Coupling if you only need DB |
| Self-managed Postgres on VPS | ~$10–40+/mo | Full control | Backups, patches, on-call |

**Recommendation:** Managed Postgres (Neon or Supabase). Prefer **one** vendor for DB; add Supabase Auth only if choosing the Auth.js/Supabase path intentionally.

### 4.3 Image / file storage

| Option | Approx. | Advantages | Disadvantages |
|--------|---------|------------|---------------|
| **Cloudflare R2** | Storage ~$0.015/GB; **$0 egress** | Ideal for 0.8–few TB catalogue media | Extra CDN config |
| **AWS S3 + CloudFront** | Storage cheap; egress higher | Ubiquitous | Egress cost at image-heavy traffic |
| Keep export on disk beside app | “Free” locally | Works in current monorepo | **Fails** standard PaaS deploys |

**Recommendation:** R2 (or S3) with immutable keys derived from current media paths / SKU. Migrate once; keep URL stability via rewrite or CDN path mapping.

### 4.4 Search

| Option | Approx. | Advantages | Disadvantages |
|--------|---------|------------|---------------|
| **Postgres FTS / trigram** | Included in DB | Zero new vendor; enough for 4k SKUs | Weaker typo/synonym UX |
| **Meilisearch / Typesense** (self-host or cloud) | ~$0–50+/mo | Fast faceted search | Ops or another bill |
| **Algolia** | Often $$$$ at catalogue scale | Excellent UX | Cost + vendor lock-in |

**Recommendation:** Stay on Postgres search at launch; revisit Typesense/Meilisearch only if UX measurements demand it.

### 4.5 Auth

| Option | Approx. | Advantages | Disadvantages |
|--------|---------|------------|---------------|
| **Clerk** | Free tier → usage | Orgs, SSO path, fast | Vendor + per-MAU |
| **Auth.js** + Google / magic link | Mostly infra cost | Portable, lower lock-in | More engineering |
| Custom JWT | “Cheap” | — | **Do not** for a beginner-led team |

**Recommendation:** Clerk **or** Auth.js with Google Workspace for company admins + employee email-domain allowlists. Decision is owner-approval item #2.

### 4.6 Email / messaging

| Option | Approx. | Advantages | Disadvantages |
|--------|---------|------------|---------------|
| **Resend** (already wired) | Free tier → usage | Matches code | Need verified domain |
| WhatsApp deep-link | Free | Already designed | Not deliverability-guaranteed |
| WhatsApp Cloud API | Meta + BSP fees | Templates, two-way | Compliance + cost later |

### 4.7 AI (optional later)

| Option | Approx. | Notes |
|--------|---------|--------|
| Stay rule-based | $0 | Current honest position |
| OpenAI / Anthropic / Gemini via **server** adapter | Pay-per-token + hard caps | Must validate all product IDs against catalogue; never trust model prices |

### 4.8 Indicative monthly bands (early production)

| Band | What you get | Rough total |
|------|--------------|-------------|
| **Marketing + enquiry only** | Host + Resend + env secrets + monitoring | **~$25–80/mo** |
| **+ durable quotes + Postgres + R2 media** | Real catalogue hosting | **~$60–200/mo** |
| **+ Company Store auth (1–3 tenants)** | Auth provider + tenant tables | **~$100–350/mo** |
| **+ AI + dedicated search** | Optional | **+$50–400+/mo** depending on volume |

Prefer growing cost with **revenue-bearing features**, not speculative infrastructure.

---

## 5. Security requirements

### 5.1 Launch-blocking (must fix before private stores or live order money)

1. **Server-side authorization for every private resource**  
   Company catalogues, allowances, orders, admin configs — never “hide” via client UI alone.
2. **Tenant isolation**  
   Every store row keyed by `company_id` / `tenant_id`. Queries **always** scoped. Automated tests for cross-tenant IDOR.
3. **No unauthenticated write APIs** for store config, orders, or catalogue mutations.
4. **Secrets** only in server env / secret manager; rotate Resend keys; `.env*` stays gitignored (already).
5. **Production deploy of catalogue media** via object storage — not relying on local symlinks.
6. **Distributed rate limiting + idempotency** (Redis/Upstash or provider) before multi-instance enquiry delivery.
7. **Enquiry / PII retention policy** — what is stored, where, how long, who can access, how to delete.

### 5.2 Required before enabling online enquiry delivery

- Already designed: validation, honeypot, delivery gate, minimal logging.  
- Add: durable enquiry records (encrypted at rest via DB), admin access control, outbound domain authentication (SPF/DKIM/DMARC), abuse monitoring, WAF/bot protection on `/api/enquiry`.

### 5.3 File upload security (when server uploads land)

- Allowlist MIME + magic-byte check; block executable types.
- Size caps; virus scanning (ClamAV or cloud AV) for logos used in fulfilment.
- Store in private bucket; serve via signed URLs or sanitized CDN.
- **Never** render uploaded SVG as inline HTML; prefer rasterize or strict CSP.
- Separate buckets/prefixes per tenant.

### 5.4 Sessions & authz model (target)

| Role | Access |
|------|--------|
| Anonymous visitor | Public catalogue, marketing, prepare brief |
| Monkcraft staff | Admin: enquiries, catalogue publish, tenant support |
| Company admin | Own tenant store config, approvals, reports |
| Employee | Own tenant storefront + own orders only |

Use short-lived sessions / HttpOnly cookies (or provider session). Enforce authz in **Route Handlers / server components**, not only client components.

### 5.5 Audit logging (minimum)

Log (without dumping full PII bodies unnecessarily): auth failures, tenant-scoped admin changes, order status transitions, enquiry delivery success/failure IDs, export/publish events.

### 5.6 Backups & recovery

| Asset | Target |
|-------|--------|
| Postgres | Daily + PITR (e.g. 7–14 days) |
| Object storage | Versioning enabled |
| Secrets | Documented recovery owners |
| RPO / RTO (suggested) | RPO ≤ 24h; RTO ≤ 8h for early stage — tighten when fulfilment SLAs exist |

### 5.7 Production deploy risks

- Accidentally enabling `MONKCRAFT_ENQUIRY_DELIVERY_ENABLED` without verified domain.
- Shipping Company Store as “private” without auth.
- Bundling `internal-provenance.json` or review CSVs into public assets (must stay private).
- Logging enquiry bodies.
- Relying on `x-forwarded-for` without trusting only the platform’s proxy.

---

## 6. Product-data migration approach

**Do not run migrations until approved.** Strategy only.

### 6.1 Source of truth today

Canonical export schema 2.0.0 + app `Product` model (`docs/monkcraft-catalogue-data-audit-v1.md`). Stable IDs: **SKU**; URLs: **slug**.

### 6.2 Safe path to Postgres (when approved)

1. **Freeze** a dated export snapshot (copy `products.json` + media manifest); checksum it.  
2. **Schema design** preserving:
   - `sku` (PK / unique), `slug` (unique), all mapped fields from `Product`
   - `source_schema_version`, `exported_at`
   - Nullable incomplete attrs (MOQ, dispatch, GST, images) — never invent  
3. **Idempotent upsert** by SKU (not by array index).  
4. **Dry-run report**: inserts / updates / unchanged / conflicts (duplicate slug, price change deltas).  
5. **URL stability**: keep `/gifts/[slug]`; 301 only if business renames a slug deliberately.  
6. **Draft compatibility**: shortlist/box/studio drafts store product `id` (SKU) — migration must not renumber SKUs.  
7. **Occasions**: import only `source_match` memberships for public facets (same honesty rule).  
8. **Images**: upload to R2/S3 with keys mapped from current `media/...` paths; rewrite `src` in DB or via CDN mapping so existing relative paths remain valid.  
9. **Dual-read period** (optional): app reads DB if configured, else export file — feature-flagged.  
10. **Rollback**: keep prior export snapshot + DB dump; flip flag back to file loader.  
11. **Browser drafts**: cannot be centrally migrated; document that users may need to re-shortlist after ID policy changes (should be rare if SKUs stable). Optional later: “sign in to sync brief.”

### 6.3 Incomplete / review data

| Class | Handling |
|-------|----------|
| 108 missing images | Import product; UI empty state; do not generate fillers |
| 792 review-needed | Flag column; optional hide from “featured” until cleared |
| Templated descriptions | Import as-is; content rewrite is a separate approval |
| Zero structured variants | Do not invent size/colour SKUs |

### 6.4 Duplicate prevention

Unique constraints on `sku`, `slug`. Reject import batches that violate. Prefer human review on price swings above a threshold.

---

## 7. Performance recommendations

Evidence: 4,257 products, ~19 MB JSON, ~57 MB parse heap, in-memory filter, page size 24, ~804 MB / 22k images on disk, RSC catalogue page uses server `queryCatalogue`.

| Area | Current | Recommendation |
|------|---------|----------------|
| Catalogue list | Full array filter per request (cached array) | Fine for single Node + 4k SKUs; move facets/search to SQL when multi-instance or >10–15k |
| Cold start | Parsing 19 MB on first request per instance | Prefer DB or build-time snapshot; avoid re-parse on every lambda if possible |
| Images | Unoptimized local files | CDN + modern formats (WebP/AVIF) via `next/image` **remotePatterns** once on CDN; lazy load below fold |
| Product detail | Server load by slug map | Keep SSR; cache publicly at CDN for anonymous pages |
| API search | Loads same in-memory catalogue | Add HTTP cache headers for anonymous GETs; rate-limit later if abused |
| Mobile | Marketing + catalogue CSS | Keep payload lean; avoid shipping full catalogue JSON to the client (already mostly server-driven — preserve this) |
| Studio pickers | `/api/catalogue/search` paginated | Keep limit ≤48; add server cache |
| AI workloads | N/A | When added: async, strict timeouts, token budgets, never on critical render path |
| PDF | Browser print | Acceptable for v1; server PDF as batch job later |

**Practical rule:** Do not buy Algolia until Postgres search fails a measured UX/perf budget.

---

## 8. Prioritized implementation roadmap

### P0 — Security & data-integrity (before trusting the system)

| Milestone | Outcome | Depends on |
|-----------|---------|------------|
| P0.1 | Owner approves this architecture + catalogue audit | — |
| P0.2 | Git checkpoint of current honest foundation | Approval |
| P0.3 | Deployable media plan (R2/S3) design + URL map | Approval of storage vendor |
| P0.4 | Distributed rate limit / idempotency design for `/api/enquiry` | Hosting choice |
| P0.5 | Explicit “Company Store = demo” gate until auth ships (keep labelling; block any “go live” claims) | — |
| P0.6 | Secret + env checklist for production (no keys in git) | — |

### P1 — Infrastructure before live transactions or private Company Stores

| Milestone | Outcome | Depends on |
|-----------|---------|------------|
| P1.1 | Managed Postgres + enquiry/quote tables | Vendor approval |
| P1.2 | Media on object storage + CDN; remove deploy dependency on sibling symlink | P0.3 |
| P1.3 | Product sync pipeline (export → DB) with dry-run + rollback | Catalogue audit approval |
| P1.4 | Auth provider + Monkcraft staff admin (read enquiries first) | Auth vendor approval |
| P1.5 | Enable Resend delivery only after domain + non-prod test | Business inbox approval |
| P1.6 | Tenant model + **server-enforced** Company Store isolation | P1.1, P1.4 |
| P1.7 | Employee auth + order intake API (no payments required for pilot if invoice/offline) | P1.6 |
| P1.8 | Monitoring (Sentry/uptime) + backup verification drill | Hosting |

### P2 — Scalable operations

| Milestone | Outcome |
|-----------|---------|
| P2.1 | Catalogue admin (staging → promote) behind auth |
| P2.2 | Postgres FTS improvements / synonym list |
| P2.3 | Signed logo upload for fulfilment |
| P2.4 | Multi-address fulfilment fields + export to ops CSV/ERP |
| P2.5 | Company admin reporting |
| P2.6 | Stronger bot protection (WAF / Turnstile) on enquiry |

### P3 — Advanced / optional

| Milestone | Outcome |
|-----------|---------|
| P3.1 | Dedicated search engine if needed |
| P3.2 | AI-assisted discovery behind `aiBoundary` with hard catalogue validation |
| P3.3 | Server PDF white-label catalogues |
| P3.4 | WhatsApp Cloud API + Calendar API |
| P3.5 | Payments / allowances ledger / SSO |

### Dependency sketch

```
Approve architecture
    → Git checkpoint
    → Hosting + secrets
    → Object storage (media)
    → Postgres + enquiry durability
    → Auth
    → Private Company Stores
    → Orders / fulfilment
    → (optional) AI / search appliance / PDF engine
```

---

## 9. Exact decisions requiring approval

Do **not** proceed on these without an explicit owner decision:

1. **Hosting vendor** — Vercel vs Railway/Fly/other for the Next.js app.  
2. **Auth vendor** — Clerk vs Auth.js (Google/magic link) vs Supabase Auth.  
3. **Database vendor** — Neon vs Supabase vs other managed Postgres.  
4. **Object storage** — Cloudflare R2 vs AWS S3 (or other) for ~804 MB+ catalogue media.  
5. **When to migrate catalogue off the file export into Postgres** — now vs after marketing+enquiry launch.  
6. **Enable Resend enquiry delivery** — verified domain, inbox, commercial terms, privacy copy.  
7. **Public conversion channels** — set real `NEXT_PUBLIC_*` email / WhatsApp / booking URL values.  
8. **Company Store pilot scope** — demo-only until auth, vs paid pilot with 1 named tenant.  
9. **PII retention & DPDP-oriented policy** — retention days, who accesses enquiries, deletion process.  
10. **AI provider** — none (recommended initially) vs OpenAI / Anthropic / Gemini, with monthly spend cap.  
11. **Search appliance** — stay on Postgres vs introduce Typesense/Meilisearch/Algolia.  
12. **Server-side PDF generation** — defer (browser print) vs add a PDF pipeline.  
13. **Dependency vulnerability policy** — how to handle eslint-chain advisories without `audit fix --force`.  
14. **Budget band** — confirm acceptable monthly run-rate (see §4.8).  
15. **Any package installs / paid accounts / deploys** — each requires approval per project rules.

---

## 10. Recommended near-term posture (summary)

| If the goal is… | Do this first |
|-----------------|---------------|
| Public marketing + catalogue browsing | Deployable media + host; file or DB catalogue; keep honesty rules |
| Reliable quotation intake | Durable enquiry store + Resend + distributed rate limits |
| Private employee stores | **Auth + tenant isolation before any “go live”** |
| Scale to 10k+ SKUs / fancy search | Measure Postgres first; add search engine only if needed |
| AI discovery | Keep rule-based Finder; add server adapter later with ID validation |

---

## 11. Safeguards confirmation

This assessment did **not**: install packages, create cloud accounts, add databases, migrate data, change auth, deploy, delete/overwrite products, expose secrets, rewrite features, or run `npm audit fix --force`.

**STOP — wait for approval before any implementation.**
