# Monkcraft Staging Test Plan v1

**Date:** 2026-10-15  
**Role:** Senior QA / deployment / product experience  
**Repo:** `/Users/nishantparihar/Desktop/monkcraft-gifting-co`  
**Constraint:** Pre-deployment verification only — **no external hosting accounts, DNS changes, paid services, or public deploy**

---

## Critical gate (read first)

| Required input | Status at time of writing |
|----------------|---------------------------|
| `docs/monkcraft-launch-readiness-report.md` | **Present** — verdict **NOT READY — BLOCKERS REMAIN** |
| `docs/monkcraft-deployment-plan-v1.md` | **Missing** (Step 46 not delivered yet) |
| Unresolved P0 / P1 security or data-integrity blockers | **Yes** — see launch-readiness report (enquiry delivery, public channels, catalogue/media hosting, Company Store authz if marketed as live) |

**Gate decision:** **STOP before any external staging setup.**  
This document still records local production-build evidence and a private-staging *plan* so work can resume when the deployment plan exists and the owner approves next steps.

Passing lint/build alone does **not** mean production-ready. No obscure-URL-only “privacy.”

---

## Executive summary

| Question | Answer |
|----------|--------|
| Is Monkcraft ready for private external staging? | **Not yet** — deployment plan missing; launch blockers remain; media/catalogue packaging for PaaS unresolved |
| Is local production-mode testing usable? | **Yes, with care** — `next start` on a free port works when memory allows |
| Can real customer journeys be demoed locally? | **Discovery → shortlist → brief (prep/copy)** verified on local prod; box/studio/PDF and full mobile QA only partly exercised |
| Should we deploy externally now? | **No** — wait for owner approval after deployment plan + staging prerequisites |

---

## A. Local production verification (performed)

### A.1 Process / port honesty

| Attempt | Result |
|---------|--------|
| `next start -p 3456` (restart after FacetGroup fix) | **Failed** — `EADDRINUSE` (exit **1**) |
| Prior prod process on `:3456` | **Killed** — exit **137** (typically OOM / SIGKILL under memory pressure) |
| Host memory at QA time | Very tight (~tens of MB free; multi‑GB in compressor) — rebuilds are risky |
| `next start -p 3457` | **Success** — Ready in ~124 ms; HTTP **200** |
| Browser E2E against `:3456` in this pass | **Not claimed** — port not serving |

**Do not treat concurrent agent browsers on `:3000` (dev) as proof of production behaviour.** This pass used production mode on **`http://localhost:3457`**.

### A.2 Build / scripts / data

| Check | Result | Notes |
|-------|--------|-------|
| Prior `npm run build` (terminal evidence) | **Pass** (exit 0) | Next.js 16.4.0; routes for `/`, gifts, studio, company-stores, APIs |
| Active `.next` | `BUILD_ID=ThkR9ngjmAjyu93vYNPEa` | Served by `:3457` after FacetGroup / CatalogueShell guard |
| Fresh rebuild in this pass | **Skipped** | Memory pressure; prefer existing artifact over risking another exit 137 |
| `npm run catalogue:report` | **Pass** | 4,257 products; 0 duplicate SKUs; 4,149 with images; 108 without |
| `node scripts/launch-regression.mjs http://127.0.0.1:3457` | **5/5 Pass** | Enquiry honesty + catalogue search + gift-finder |

Catalogue source (verified): sibling `../monkcraft/website-export/data` (schema **2.0.0**), media via `public/catalogue-media` symlink.

### A.3 HTTP route smoke (`http://localhost:3457`)

All returned **200** with **no** `__next_error__` / Application error HTML:

| Route | Notes |
|-------|--------|
| `/` | Homepage |
| `/gifts` | Full catalogue HTML (~400 KB) |
| `/gifts?occasion=employee-onboarding` | Previously crashed on stale prod build; **fixed** on current artifact |
| `/gifts?category=tech-gadgets`, `/gifts?q=bottle` | Filter / search OK |
| `/gifts/find`, `/gifts/box`, `/gifts/shortlist`, `/gifts/brief` | Tool routes OK |
| `/studio` | Studio shell OK |
| `/company-stores`, `/configure`, `/preview` | Demo routes OK |
| Sample PDPs | e.g. Aquaminder / Adidas slugs **200** |

### A.4 API honesty (`:3457`)

| Probe | Result |
|-------|--------|
| `GET /api/enquiry` | `deliveryConfigured: false` |
| `POST /api/enquiry` (valid) | **503** `delivery_not_configured`, `delivered: false` |
| `POST` honeypot | spam rejected (regression) |
| `GET /api/catalogue/search?q=bottle&limit=3` | **147** matches; sample price **₹1,595** (export-backed) |
| `POST /api/gift-finder/recommend` | `mode: rule-based`; universe **4257**; sample Adidas tee match |

No `.env` / `.env.local` present — channels remain copy-only (correct).

### A.5 Browser journeys on local prod (`:3457`)

| Journey | Status this pass | Evidence |
|---------|------------------|----------|
| Catalogue + occasion filter | **Pass** | Grid shows products + prices; “1,644 products · page 1 of 69”; Employee onboarding chip |
| Shortlist from grid | **Pass** | Nav → Shortlist (1) / My Brief (1) |
| Brief hydration | **Pass** | “4 In 1 Laser Pointer Pen- Black” · **₹215** · qty 5 |
| Gift Finder shell | **Pass** | Form loads; honest “rule-based — not generative AI”; 4,257 products |
| Gift Finder → click recommendations | **API-verified only** | UI recommend click not re-done this pass (API 5 matches) |
| Company Stores landing | **Pass (demo honesty)** | Copy states demo does not authenticate; fulfilment not claimed live |
| Homepage → full click path | **Partial** | Homepage HTTP 200; prior audit browser on `:3000` |
| Build a Box → packaging → enquiry | **Not fully click-through** | Route 200; packaging often TBC (empty packaging catalogue) |
| Studio logo → PNG export | **Not re-asserted** | Route 200; treat as conceptual mockup |
| White-label → Print PDF | **Not performed** | Browser print dialog not exercised |
| Quotation prepare → copy / unavailable channels | **Not re-clicked on `:3457`** | Expected unavailable without env (launch-readiness verified on `:3000`) |
| Mobile / tablet / keyboard / reduced-motion | **Not completed** | Needs dedicated pass; host memory was constrained |

**Earlier FacetGroup crash** (`Cannot read properties of undefined (reading 'length')` in CatalogueShell) appeared on a **stale** `:3456` build. Current source uses `safeFacets` + `useMemo`; current `:3457` artifact serves filtered catalogue without error pages.

---

## B. Private staging access plan (proposal only — not executed)

Compatible with architecture recommendation: **Vercel (or equivalent Node host) + object storage/CDN for media** (`docs/monkcraft-production-architecture-v1.md`). Deployment plan doc is still missing — treat the following as the default proposal until Step 46 supersedes it.

### Recommended approach

1. **Host:** Vercel Preview / Staging project (or Railway/Fly long-running Node if large FS preferred temporarily).  
2. **Access control (required — not optional):**  
   - **Vercel Deployment Protection** (password, or SSO / Vercel Authentication for teammates), **or**  
   - Edge / reverse-proxy **HTTP Basic Auth** / Cloudflare Access in front of the preview.  
3. **Do not** rely on an obscure URL alone.  
4. **Do not** enable public production domain until channels + media strategy are approved.  
5. **Env:** Staging project uses its own env; server secrets never in `NEXT_PUBLIC_*`.  
6. **Media:** Staging cannot depend on the local sibling symlink. Need approved plan for `MONKCRAFT_EXPORT_DATA` + CDN/object storage (or an explicitly approved temporary packaging approach).

### How unauthorized users are blocked

| Control | Purpose |
|---------|---------|
| Deployment Protection / Access gate | Blocks anonymous internet users before the app HTML loads |
| No public DNS to staging | Reduces discovery; **not** sufficient alone |
| No production enquiry delivery on staging | Or use a **test inbox** only after approval |
| Company Store remains labelled demo | Prevents false “private store” trust |

---

## C. Tests that still require a real staging environment

These cannot be honestly closed on localhost alone:

1. Deployed media URLs (no sibling symlink) + cold start with full catalogue  
2. HTTPS, canonical host, redirects  
3. Staging-only env (test enquiry inbox / Resend sandbox if approved)  
4. Multi-device stakeholder demos with shared URL + access gate  
5. Preview-deploy CI smoke (`launch:regression` against preview URL)  
6. India latency / image CDN behaviour  
7. Access-control negative test (anonymous request returns challenge / 401)

---

## D. Device, accessibility, performance, security (status)

| Area | Local status | Staging follow-up |
|------|--------------|-------------------|
| Desktop nav / catalogue / brief | Exercised on `:3457` | Re-run behind access gate |
| Tablet / mobile layouts | Incomplete | Viewport matrix on staging |
| Keyboard / focus / drawers | Incomplete | Catalogue facets + modals |
| `prefers-reduced-motion` | Not re-checked this pass | Spot-check hero/motion |
| Prod build runtime | Facet crash fixed on current artifact | Watch `/gifts` TTFB with CDN media |
| Secrets / `.env` | None in repo; `.env.example` names only | Host secret store |
| Enquiry | Honest 503; honeypot OK | Staging provider test only with approval |
| Company Store | Demo banners present | Never remove banners without authz |

---

## E. Critical failures & recommended fixes

| ID | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| S-1 | Process | Local `:3456` restart failed (EADDRINUSE / exit 137) | Prefer free port; free memory before rebuild; avoid parallel heavy Node agents |
| S-2 | Was P0 (fixed in source) | Catalogue FacetGroup `.length` on undefined facets | Keep `safeFacets` guard; always rebuild before claiming prod fix |
| S-3 | P0 (business) | No live enquiry / channels | Do not market live submit; configure verified env only with approval |
| S-4 | P0 (hosting) | ~804 MB media + symlink not PaaS-ready | Approve media/CDN plan before external staging |
| S-5 | P0 (if claimed live) | Company Store no server authz | Keep demo labelling; no private-store launch claims |
| S-6 | Doc gate | Deployment plan missing | Finish Step 46 before external staging approval |

---

## F. Staging prerequisites checklist

- [ ] `docs/monkcraft-deployment-plan-v1.md` completed and reviewed  
- [ ] Owner accepts launch-readiness verdict (not full production)  
- [ ] Hosting vendor chosen (default proposal: Vercel + R2/S3 media)  
- [ ] Staging access gate chosen (Deployment Protection / SSO / Access — not URL secrecy)  
- [ ] Media + `MONKCRAFT_EXPORT_DATA` strategy for non-local hosts  
- [ ] Staging env names prepared from `.env.example` (values supplied by business — no invented contacts)  
- [ ] Git checkpoint of current honest foundation (owner-requested commit)  
- [ ] Optional: staging-only test inbox if delivery tests are approved  
- [ ] Company Store remains demo-only on staging unless authz ships  

---

## G. Approval gate — exact ask before external steps

**Verified launch-readiness status:** NOT READY for full production; OK for controlled local/demo review with copy-only conversion.

**Proposed staging provider & protection:** Vercel Preview/Staging + **Deployment Protection** (password or SSO). Alternative: Railway/Fly + Cloudflare Access / Basic Auth.

**Required environment configuration (names only):**

| Kind | Variables |
|------|-----------|
| Public (optional for staging demos) | `NEXT_PUBLIC_MONKCRAFT_ENQUIRY_EMAIL`, `NEXT_PUBLIC_MONKCRAFT_BOOKING_URL`, `NEXT_PUBLIC_MONKCRAFT_WHATSAPP_E164` |
| Server (only if testing delivery) | `MONKCRAFT_ENQUIRY_DELIVERY_ENABLED`, `MONKCRAFT_ENQUIRY_PROVIDER`, `MONKCRAFT_ENQUIRY_API_KEY`, `MONKCRAFT_ENQUIRY_TO_EMAIL`, `MONKCRAFT_ENQUIRY_FROM_EMAIL` |
| Data | `MONKCRAFT_EXPORT_DATA` (or equivalent packaged export path) |

**Expected cost implications (order of magnitude — confirm before purchase):** Vercel Hobby/Pro (~$0–20+/mo) + object storage/CDN for media; Access/SSO may be included or add-on. Do not purchase without approval.

**Exact steps intended after approval (not started):**

1. Finish / review deployment plan.  
2. Create staging project (no production domain).  
3. Enable Deployment Protection / Access.  
4. Configure media + export path for the host.  
5. Set staging env (test values only).  
6. Deploy preview; run `launch:regression` + browser matrix behind the gate.  
7. Report results; wait again before production DNS.

**Remaining blockers:** Conversion channels, media hosting, Company Store authz for any “private live store” claim, legal pages, monitoring/backups for paid fulfilment.

---

## H. Approval needed to proceed

Please reply with an explicit decision on:

1. Whether to wait for `docs/monkcraft-deployment-plan-v1.md` before any hosting account work (**recommended: yes**).  
2. Preferred private staging host + access gate.  
3. Whether staging may use a **test** enquiry inbox / Resend sandbox (or stay copy-only).  
4. Media packaging approach for non-local hosts.  
5. Permission to create accounts / connect the repo / spend money (currently **denied**).

**Until then: no external deploy.** Local `next start` on a free port remains the verified production-mode sandbox.

---

## Appendix — evidence snapshot

```
Local prod: http://localhost:3457  (not :3456)
BUILD_ID: ThkR9ngjmAjyu93vYNPEa
launch-regression: 5/5 against :3457
catalogue:report: 4257 products, 0 duplicate SKUs, 108 without images
Browser: catalogue occasion filter + shortlist + brief (₹215 product) + gift finder shell + company stores honesty
Memory: constrained — avoid unnecessary rebuilds
External staging: not created
```
