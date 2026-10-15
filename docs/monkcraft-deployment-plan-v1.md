# Monkcraft Deployment Plan v1

**Status:** Planning and verification only — **STOP for owner approval. Do not deploy from this document alone.**  
**Date:** 2026-10-15  
**Repo:** `/Users/nishantparihar/Desktop/monkcraft-gifting-co`  
**Audience:** Business owner + implementers  

### Constraints respected

No deploy, DNS changes, paid purchases, external service connections, secret exposure, product-data upload, major dependency installs, or `npm audit fix --force`. Findings are from code and docs inspection plus local verification.

### Source evidence (re-read for this plan)

| Document / artefact | Role |
|---------------------|------|
| `docs/monkcraft-launch-readiness-report.md` | **Authoritative launch verdict** (Step 44/45) |
| `docs/monkcraft-production-architecture-v1.md` | Target stack, risks, cost bands |
| `docs/monkcraft-platform-audit-v1.md` | Platform reliability / journeys |
| `docs/monkcraft-catalogue-data-audit-v1.md` | 4,257 SKUs, media, data gaps |
| `docs/conversion-enquiry-privacy.md` | Enquiry delivery gates |
| `.env.example`, `package.json`, `next.config.ts` | Runtime + env surface |
| Local: `npm run lint` (pass), `scripts/launch-regression.mjs` **5/5** against `localhost:3000` | Smoke only — **not** staging |

---

## 1. Current launch-readiness verdict

### Verdict: **NOT READY for public production launch**

Aligned with `docs/monkcraft-launch-readiness-report.md`:

| Mode | Status |
|------|--------|
| Controlled **demo / stakeholder review** (discovery → shortlist/box/studio → **copy** quotation) | Strong, after recent P0/P1 code fixes |
| Public site claiming **live inbox delivery**, booking, WhatsApp Business handoff | **Blocked** — channels unset; delivery gated |
| Production-hosted **catalogue with images** on typical PaaS | **Blocked** — sibling symlink + ~804 MB media not deployable as-is |
| **Private** Company Stores / employee commerce | **Blocked** — demo only; no server authz / tenancy |
| “Lint and build pass ⇒ production-ready” | **False** — explicitly rejected |

### Unresolved blockers that stop “go live” recommendation

| # | Blocker | Severity | Evidence |
|---|---------|----------|----------|
| B1 | Catalogue **data + media deploy path** (symlink `public/catalogue-media` → `../monkcraft/website-export/media`, ~804 MB; JSON ~19 MB via `MONKCRAFT_EXPORT_DATA` / sibling path) | **P0 deploy** | `exportPath.ts`, `next.config.ts` `outputFileTracingRoot`, architecture R4 |
| B2 | Public conversion channels **not configured** (no `.env.local`) | **P1 / launch** | `.env.example`; readiness §6–8 |
| B3 | Online enquiry delivery **off** until approved Resend + domain + privacy | **P0 conversion** | `delivery.ts`; `503 delivery_not_configured` (expected) |
| B4 | Company Stores must **not** be marketed as secure private commerce | **P0 product/security** | Demo banners; no `middleware.ts`; no auth |
| B5 | Legal / privacy pages missing before production PII collection | **P1 compliance** | No `/privacy` / `/terms` routes |
| B6 | In-memory rate limit + idempotency unsuitable for multi-instance serverless once delivery is on | **P1 ops** | `rateLimit.ts`, `idempotency.ts`; architecture R3 |
| B7 | No monitoring / error reporting / backup process for production | **P1 ops** | No Sentry/uptime config in repo |
| B8 | No deploy config yet (no Dockerfile, `vercel.json`, IaC) | **P1 ops** | Repo inspection |

**Therefore:** this plan documents how to prepare a safe launch later. It does **not** recommend deploying the website now.

---

## 2. Recommended hosting provider

### Recommendation (app): **Vercel** (Hobby → Pro when needed)

| Criterion | Assessment |
|-----------|------------|
| Next.js 16 / App Router / Route Handlers | Native fit; preview deployments for staging |
| SSR catalogue + APIs (`/api/enquiry`, search, gift-finder) | Supported as Node serverless / fluid compute |
| Current deps | Only `next`, `react`, `react-dom` — low surface |
| Cost (early) | Free/Hobby for demos; Pro ~$20+/mo when team/previews/limits matter |
| Security / maintainability | Managed TLS, env secrets UI, git-linked previews; low ops for a beginner owner |

### Recommendation (catalogue media): **Cloudflare R2** (or AWS S3 + CDN) — **required companion**

Do **not** ship ~804 MB / ~22k files inside the Next deployment. Serve `/catalogue-media/...` (or CDN URLs with stable keys) from object storage.

### Recommendation (optional later, not for day-1 marketing-only)

| Service | When |
|---------|------|
| Managed Postgres (Neon or Supabase) | Durable enquiries, tenancy, product sync |
| Auth (Clerk or Auth.js) | Before any private Company Store |
| Upstash Redis (or equivalent) | Distributed rate limit / idempotency when enquiry delivery is multi-instance |
| Sentry + uptime check | Before or at first public traffic |

### Alternatives considered

| Host | When to prefer | Trade-off |
|------|----------------|-----------|
| Railway / Fly / Render (long-running Node) | Want simpler persistent process / larger local disk experiments | Still should externalize media; more DIY for Next optimizations |
| Self-managed VPS | Full control / India colocated | Owner must own patches, TLS, backups — not recommended as first host |

### Why not “Vercel alone with current layout”

`outputFileTracingRoot` pointing at the workspace parent is a **local monorepo convenience**. Default Vercel packaging will not include the sibling `website-export` tree. Without an explicit media + data strategy, `/gifts` and images will fail or be incomplete in production.

---

## 3. Hosting and ongoing cost considerations

Order-of-magnitude **USD/month** (confirm current pricing before purchase). India-friendly traffic assumed light at launch.

| Band | What is included | Rough total |
|------|------------------|-------------|
| **A — Preview / internal demo** | Vercel Hobby + no paid email; media still local or temporary | **~$0–20** |
| **B — Public marketing + browseable catalogue** | Vercel + R2 (~0.8 GB+) + CDN + monitoring | **~$25–80** |
| **C — + live enquiry inbox (Resend)** | Band B + Resend + verified domain email | **~$30–100** |
| **D — + durable quotes / Postgres** | Band C + Neon/Supabase | **~$60–200** |
| **E — + authenticated Company Store pilot** | Band D + Auth | **~$100–350** |

**Cost control rules**

1. Grow spend with revenue-bearing features — not speculative AI/search appliances.  
2. Keep Gift Finder **rule-based** (current) until an AI spend cap is approved.  
3. Stay on in-process / Postgres search for 4k SKUs; defer Algolia/Typesense.  
4. Dev-only npm audit findings (`braces` via eslint toolchain): **0 runtime vulns** with `npm audit --omit=dev` (verified 2026-10-15). Do not force-fix eslint-config-next.

---

## 4. Domain / DNS prerequisites

**Do not change DNS until hosting + SSL path are chosen and approved.**

### Prefer a single canonical public hostname

Pick one primary (examples only — **do not assume registrar or name**):

- `www.example.com` **or** apex `example.com` as canonical  
- Redirect the other → canonical (301)

### DNS records (typical for Vercel)

| Record | Purpose |
|--------|---------|
| Apex / `www` CNAME or A/ALIAS per host docs | Point domain at the app platform |
| Optional `preview` / staging subdomain | Non-production verification |
| Email (when Resend/domain mail live) | SPF, DKIM, DMARC for `MONKCRAFT_ENQUIRY_FROM_EMAIL` |

### HTTPS / SSL

- Use platform-managed certificates (Vercel Automatic HTTPS).  
- Enforce HTTPS redirects at the host.  
- Never put secrets in client-visible URLs.

### Env-specific URLs (checklist — names only)

| Concept | Guidance |
|---------|----------|
| Production site URL | Set after domain decision; use for absolute links / future `metadataBase` |
| Preview / staging URL | Host-provided preview URLs OK for QA |
| `NEXT_PUBLIC_MONKCRAFT_BOOKING_URL` | Must be **https** verified schedule (Google Calendar appointment preferred) |
| WhatsApp | E.164 digits only — not a domain concern |
| Resend from-domain | Must match DNS-authenticated sender |

### Redirect strategy

1. HTTP → HTTPS  
2. Non-canonical host → canonical host  
3. Avoid duplicate content on preview URLs (noindex previews if they become publicly linkable)  
4. Product URLs stay `/gifts/[slug]` — do not renumber SKUs/slugs during media migration  

**Note:** Repo currently has no `robots.txt` / `sitemap` / `metadataBase` — add before SEO-sensitive public launch (implementation later, after approval).

---

## 5. Environment variable checklist

Copy from `.env.example`. **Never invent live-looking placeholders. Never commit values. Never put API keys in `NEXT_PUBLIC_*`.**

### Public (safe for browser — appear in links / UI)

| Variable | Purpose | Required for |
|----------|---------|--------------|
| `NEXT_PUBLIC_MONKCRAFT_ENQUIRY_EMAIL` | Mailto “Request a Quote” inbox | Email CTA |
| `NEXT_PUBLIC_MONKCRAFT_BOOKING_URL` | HTTPS booking schedule URL | Book CTA |
| `NEXT_PUBLIC_MONKCRAFT_WHATSAPP_E164` | WhatsApp Business number, digits only | WhatsApp CTA |

Empty / invalid → UI stays honest (“unavailable” / copy-only). Verified in `ConversionChannels.tsx` + `contactConfig.ts`.

### Server-only (secrets / delivery — never `NEXT_PUBLIC_*`)

| Variable | Purpose | Required for |
|----------|---------|--------------|
| `MONKCRAFT_ENQUIRY_DELIVERY_ENABLED` | Must be exactly `true` to enable send | Online submit |
| `MONKCRAFT_ENQUIRY_PROVIDER` | Only `resend` supported today | Online submit |
| `MONKCRAFT_ENQUIRY_API_KEY` | Provider API key | Online submit |
| `MONKCRAFT_ENQUIRY_TO_EMAIL` | Destination inbox for structured enquiries | Online submit |
| `MONKCRAFT_ENQUIRY_FROM_EMAIL` | Verified sender at provider | Online submit |

Without the full set, `POST /api/enquiry` validates and returns **`503 delivery_not_configured`** — it does **not** transmit customer data.

### Server data path (hosting-sensitive)

| Variable | Purpose |
|----------|---------|
| `MONKCRAFT_EXPORT_DATA` | Absolute path to export `data/` containing `products.json` (priority 1 in `exportPath.ts`) |

On PaaS this usually becomes a **build-time bake**, object-storage sync, or DB — not a laptop sibling path.

### Future (not in `.env.example` today — reserve names when approved)

| Area | Guidance |
|------|----------|
| Database | e.g. `DATABASE_URL` — server-only |
| Auth | Provider secret + publishable keys per vendor docs |
| Object storage | Access keys server-only; public CDN URL separate |
| AI | Server-only keys; wire only through `aiBoundary.ts`; never invent SKUs/prices |
| Monitoring | e.g. Sentry DSN — prefer server + carefully scoped public DSN |

### Current workspace state

| File | Status |
|------|--------|
| `.env.example` | Present (documented) |
| `.env.local` / `.env` | **Absent** |
| Git-tracked env files | **None** (`.env*` gitignored) |

---

## 6. Security prerequisites

### Must be true before any public “live conversion” claim

1. **Delivery gate remains off** until Resend domain + inbox + privacy copy approved.  
2. **No fake success** — UI only shows delivered when `delivered: true` (already coded).  
3. **Distributed rate limit / idempotency** before multi-instance delivery enablement.  
4. **Privacy / terms** pages + retention stance (DPDP-oriented) before collecting production PII via email.  
5. **SPF/DKIM/DMARC** for enquiry sender domain.  
6. **Secrets only in host env** — rotate if ever leaked; never in git or client bundles.  
7. **Company Store** remains clearly labelled demo, or routes are access-restricted / disabled for public launch.  
8. **Do not** expose `internal-provenance.json` or review CSVs as public static assets.  
9. **Uploads** stay client-local until a server upload design with MIME allowlist + private storage is approved.  
10. **Error responses** must not echo API keys or provider raw bodies (current enquiry path avoids body logging — preserve).

### Company Store / admin

| Fact | Implication |
|------|-------------|
| No `middleware.ts`, no auth SDK | Configure/preview routes are public Next pages |
| Access rules (`requireWorkEmail`, etc.) are draft intent only | **Not** server-enforced |
| Admin shell is a local demo | Safe for sales demos; **unsafe** as private employee store |

**Launch rule:** Demo may stay publicly reachable **only** with honest labelling. Do not promise private catalogues or secure admin. Prefer hiding configure deep-links from primary marketing CTAs until auth exists.

### Production behavior checks (verified locally)

| Check | Result |
|-------|--------|
| Enquiry delivery without env | `503` / `delivered: false` |
| Honeypot spam | `400 spam_rejected` |
| Conversion CTAs without env | Email / Book / WhatsApp show unavailable |
| Gift Finder | Rule-based; not generative AI |
| Runtime npm audit (`--omit=dev`) | **0 vulnerabilities** |
| Dev toolchain audit | 5 high in eslint `braces` chain — do not force-fix |

---

## 7. Staging verification plan

**There is no dedicated staging environment in this repo today.** Do not claim “staging tested” until a preview host exists.

### Phase 0 — Local production-mode (available now)

Repeatable on a machine that has the sibling export + media symlink:

```bash
npm run lint
npm run build
npm run start   # or PORT=3457 npm run start
npm run catalogue:validate
npm run launch:regression -- http://127.0.0.1:3000
```

| Area | What to verify |
|------|----------------|
| Routes | `/`, `/gifts`, PDP, shortlist, brief, box, find, studio, company-stores (+ configure/preview) return 200 without Next error overlay |
| Catalogue | Search, facets, sort, pagination; prices/SKUs match export |
| Shortlist / brief | Persist in browser; prepare + copy; online submit honest when delivery off |
| Box / Studio | Drafts local; packaging “to be confirmed” if empty; Studio mockup not called a print proof |
| Gift Finder | Recommendations rule-based; budget uses verified fixed prices |
| Enquiry / booking / WhatsApp | Channels match env; no false “sent” |
| Company Stores | Demo banners visible; no claim of live auth/orders |
| Desktop + mobile | Homepage + catalogue + brief at ~390px width |
| a11y (manual) | Keyboard to primary CTAs; focus visible; images have alt where product UI provides |
| Perf (manual) | Note TTFB on `/gifts` cold start; image weight on PDP |
| Security/privacy | No secrets in Network tab responses; enquiry body not logged |

**Evidence already gathered (local only):** readiness report browser + prod `:3457` catalogue fix; this plan’s `launch-regression` **5/5** on `:3000`; `npm run lint` pass. **Not** a substitute for host preview testing.

### Phase 1 — Host preview / staging (after account approval — not done here)

1. Create preview deployment **without** enabling enquiry delivery.  
2. Attach **staging** env: public channels optional; `MONKCRAFT_ENQUIRY_DELIVERY_ENABLED` unset/false.  
3. Confirm catalogue JSON + media resolve (R2/CDN or approved bake).  
4. Re-run `launch:regression` against the preview base URL.  
5. Manual journey A (HR discovery → brief → copy).  
6. Confirm Company Store still labelled demo.  
7. Only then consider a **staging** Resend test with a private inbox (owner-approved).

### Phase 2 — Production cutover checklist (future)

- [ ] Canonical domain + HTTPS  
- [ ] Production env reviewed (no leftover debug)  
- [ ] Delivery still off **or** fully approved + tested  
- [ ] Monitoring live  
- [ ] Rollback owner named  
- [ ] Launch scope matches §9 (no private stores as live)

---

## 8. Backup and rollback plan

### Before any release attempt

| Asset | Action |
|-------|--------|
| Git | Annotated release tag / checkpoint commit **on owner request** (e.g. `launch-prep-YYYYMMDD`) |
| Product export | Dated copy of `products.json` + media manifest; checksum (sha256) |
| Browser drafts | Cannot be centrally backed up — document that shortlist/brief are device-local |
| Secrets | Password manager / host secret store; documented rotation owner |

### If/when Postgres exists

- Managed automated backups + PITR (target RPO ≤ 24h early stage)  
- Verify restore on a branch/staging DB before trusting it  

### If/when object storage exists

- Bucket versioning on  
- Immutable keys mapped from current media paths  

### App rollback strategy

1. **Prefer:** redeploy previous known-good git SHA on the host (Vercel instant rollback / promote prior deployment).  
2. **Data:** flip feature flag / env back to prior export snapshot or prior DB dump.  
3. **Delivery kill switch:** set `MONKCRAFT_ENQUIRY_DELIVERY_ENABLED` ≠ `true` immediately if spam or mis-send.  
4. **DNS:** keep prior host reachable until new host is verified (avoid hard cut without overlap).  

### Monitoring / recovery (minimum when public)

| Tool | Purpose |
|------|---------|
| Host logs | Request errors, 5xx |
| Sentry (or equivalent) | Client + server exceptions |
| Uptime check | `/` and `/gifts` (and `/api/enquiry` GET readiness) |
| On-call lite | Owner + one technical contact for first 2 weeks |

**This plan does not run destructive backup drills or deletes.**

---

## 9. Public launch scope

### (1) Ready to expose publicly — **after** hosting/media path + owner approval

Honest marketing + discovery, **without** claiming live inbox delivery or private stores:

| Surface | Notes |
|---------|-------|
| Homepage | Approved hero v5; consultation copy path |
| Catalogue browse + PDP | Export-backed 4,257 SKUs; empty state for 108 no-image |
| Shortlist / brief **copy** handoff | Device-local |
| Gift Finder (rule-based) | Honest non-AI labelling |
| Studio / Box | Partial tools; conceptual branding / packaging TBD |

### (2) Requires config / verification before calling “live”

| Item | Needs |
|------|-------|
| Mailto / Booking / WhatsApp CTAs | Verified `NEXT_PUBLIC_*` values |
| Online enquiry submit | Full Resend env + privacy + non-prod test |
| Production catalogue images | R2/S3 (or approved equivalent) + URL map |
| Legal | Privacy / terms + footer contact |
| SEO basics | `metadataBase`, robots, sitemap (post-approval) |
| Distributed abuse controls | Before multi-instance delivery |

### (3) Demo-only — must remain clearly private / non-production

| Surface | Rule |
|---------|------|
| Company Stores configure + employee preview | Sales demo; localStorage only; **no** “secure employee store” marketing |
| Studio “print proof” expectations | Watermarked / conceptual only |
| Partner logo marquee | Stay empty until real logos |

### (4) Must be disabled or tightly gated before launch

| Item | Action |
|------|--------|
| `MONKCRAFT_ENQUIRY_DELIVERY_ENABLED` | Leave unset/false until approval |
| Generative AI finder | Remain inactive (`aiBoundary`) |
| Any future unauthenticated write/admin APIs | Must not ship |
| Treating Company Store access rules as security | Forbidden until server authz |

Initial launch does **not** require: payments, ERP, WhatsApp Cloud API, Calendar API, Algolia, server PDF, or full packaging catalogue.

---

## 10. Exact approvals and business inputs required

Do **not** proceed on these without explicit owner decision:

1. **Hosting vendor** — Confirm Vercel (recommended) vs Railway/Fly/other.  
2. **Object storage** — Cloudflare R2 vs S3 (or other) for ~804 MB+ media.  
3. **Canonical domain name** + www vs apex preference + registrar owner.  
4. **Public channels** — real enquiry email, booking URL, WhatsApp E.164 (or consciously ship copy-only).  
5. **Enquiry delivery** — approve Resend + commercial terms + `TO`/`FROM` + privacy copy, or keep offline.  
6. **Launch band** — Demo-only vs Band B (public browse) vs Band C (live email).  
7. **Company Store posture** — demo labelled in nav vs de-emphasize/hide configure until auth.  
8. **Legal** — privacy/terms content and who drafts them.  
9. **Budget band** — acceptable monthly run-rate (§3).  
10. **PII retention** — how long enquiry emails/records are kept; deletion process.  
11. **Database / auth timing** — defer (recommended for first public browse) vs build before launch.  
12. **Git release checkpoint** — owner requests commit/tag when ready.  
13. **Any paid account creation, DNS change, or deploy** — each requires a separate yes.

---

## 11. Recommended sequence (after approvals — not authorized yet)

```
Owner approvals (§10)
  → Git checkpoint
  → Object storage + media URL map (B1)
  → Host project + preview env (delivery OFF)
  → Staging verification (Phase 1)
  → Optional: public NEXT_PUBLIC_* channels
  → Optional: Resend staging test → production delivery
  → Canonical DNS + HTTPS
  → Monitoring + rollback drill
  → Public announce within agreed scope (§9)
```

**Company Store auth / Postgres tenancy remain a separate programme** after the marketing+catalogue(+enquiry) path.

---

## 12. Safeguards confirmation

This planning pass did **not**: deploy the website, purchase services, change DNS, upload customer/product data to a host, install major dependencies, run `npm audit fix --force`, expose secrets, or enable enquiry delivery.

### Local verification performed for this plan

| Check | Result |
|-------|--------|
| Readiness report | Present; verdict used above |
| `npm run lint` | Pass |
| `npm run launch:regression` @ `:3000` | **5/5 pass** |
| `npm audit --omit=dev` | **0** vulnerabilities |
| `.env.local` | Absent |
| Deploy configs | None present |

---

## STOP

**Await owner approval** before any hosting account work, DNS, media migration, env activation, or deployment.

**Immediate deploy recommendation: NO.**
