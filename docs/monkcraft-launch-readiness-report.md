# Monkcraft Launch Readiness Report

**Date:** 2026-10-15  
**Role:** Senior QA / UX / security / ecommerce product review  
**Repo:** `/Users/nishantparihar/Desktop/monkcraft-gifting-co`  
**Method:** Code inspection + prior audit docs + `npm run lint` / `npm run build` / `npm audit` / `catalogue:validate` + browser smoke on `localhost:3000` (dev) and production verify on `localhost:3457`  
**Constraints:** No deploy, no dependency upgrades, no fabricated product data, no paid services enabled  

---

## Verdict

**READY AFTER SPECIFIC FIXES** — strong for **controlled demo / stakeholder review** of discovery → shortlist / box / studio → prepared quotation **copy**.

**Not ready** to market as live online quotation delivery, authenticated private Company Stores, or production-hosted catalogue without the blockers in §8.

---

## 1. Actual feature inventory

Classification: **Working and tested** · **Partially working** · **Demo/preview only** · **Blocked by missing integration** · **Missing or broken**

| Area | Routes / APIs | Class | Evidence |
|------|---------------|-------|----------|
| Homepage / nav | `/` | **Working and tested** | Browser: hero `monkcraft-hero-v5`, What We Do, Gift Ideas, Consultation, FAQ, footer. Mobile: Menu + stacked CTAs. Partner marquee correctly empty. |
| Catalogue | `/gifts`, `/gifts/[slug]` | **Working and tested** | Browser: occasion filter (1,644 onboarding), search, facets, cards, PDP with SKU/price/MOQ. Prod SSR crash fixed this pass (§4). |
| Search / filters / details | catalogue + `GET /api/catalogue/search` | **Working and tested** | API: bottle search 142 hits with real SKUs/prices. PDP gallery interactive. |
| Shortlist | `/gifts/shortlist` + `localStorage` | **Working and tested** | Browser: add on PDP → nav count 2→3; brief shows 3 products. |
| Build a Box | `/gifts/box` | **Partially working** | Route 200; draft persists (nav “Build a Box (1)”); packaging catalogue empty → honest “to be confirmed”. Quote via brief/channels, not checkout. |
| Studio branding | `/studio` | **Partially working** | Route 200; mockup + PNG export path (conceptual watermark). Not a print proof. |
| White-label PDF builder | `/studio?mode=catalogue` | **Partially working** | Builder + browser Print → Save as PDF. No server PDF library. |
| Company Stores | `/company-stores`, configure, preview | **Demo/preview only** | Landing honestly states no employee auth / live fulfilment. Local draft only. |
| Smart Gift Finder | `/gifts/find`, `POST /api/gift-finder/recommend` | **Working and tested** | Browser form loads (no crash); API rule-based matches ≤ ₹2,000 with verified prices; honest “not generative AI”. |
| Unified Brief | `/gifts/brief` | **Partially working** | Browser: shortlist + linked box/studio; Prepare → “Your brief is ready”; Copy works. Online submit not live. |
| Quotation enquiries | `POST /api/enquiry` | **Blocked by missing integration** | Returns `503 delivery_not_configured` when provider env unset (by design). |
| Google Calendar booking | `NEXT_PUBLIC_MONKCRAFT_BOOKING_URL` | **Blocked by missing integration** | No `.env.local`; CTAs stay copy / unavailable. |
| WhatsApp | `NEXT_PUBLIC_MONKCRAFT_WHATSAPP_E164` | **Blocked by missing integration** | Same — deep-link only when E.164 set. |
| Generative AI finder | `aiBoundary.ts` | **Missing or broken** (intentional) | Explicitly inactive. |

---

## 2. Working customer journeys

| Journey | Result | How verified |
|---------|--------|----------------|
| **A HR** Homepage → Discovery → Filters → Shortlist → Brief → Quotation prep | **Pass (prep / copy only)** | Browser: `/gifts?occasion=employee-onboarding` → PDP Aquaminder → shortlist → brief with 3 products → Prepare → Copy + honest “delivery not connected”. |
| **B Event** Catalogue → Details → Branding → Enquiry | **Pass to prep** | PDP “Customize in Studio” + Request a Quote links present; Studio route OK. Full logo upload + PNG export not re-clicked this pass (code path + prior audit). |
| **C Gift box** Box → Selection → Qty → Packaging → Review → Quotation | **Partial** | Box draft linked in brief (“1 product · packaging noted”). Approved packaging SKUs empty. |
| **D Marketing** Studio mockup + Catalogue Builder PDF | **Partial (code + route)** | `/studio` and `?mode=catalogue` HTTP 200; export = canvas PNG / browser print. |
| **E Corporate admin** Company Stores → Configure → Preview → Enquiry | **Demo only** | Landing + routes OK; messaging discloses no auth/orders. |

**Browser testing performed:** yes (Cursor browser on `localhost:3000`; production catalogue re-verified on `localhost:3457`).  
**Code-path / HTTP only:** full Box packaging wizard click-through, Studio file upload + PNG download, Company Store configure→cart, PDF print dialog.

---

## 3. Failed / incomplete journeys

| Journey gap | Why |
|-------------|-----|
| Live online enquiry delivery | Resend foundation off until approved env (`docs/conversion-enquiry-privacy.md`). |
| Book consultation / WhatsApp handoff | Public channel env unset. |
| Private employee Company Store commerce | No auth, tenancy, payments, inventory. |
| Build a Box with verified packaging SKUs | `APPROVED_PACKAGING` empty. |
| Production deploy of catalogue media | Sibling symlink + ~804 MB media / ~19 MB JSON — not PaaS-ready as-is. |
| Cross-device brief recovery | Browser `localStorage` only. |

---

## 4. Verified defects and fixes

### Fixed this pass (P0 / P1)

| ID | Issue | Fix |
|----|--------|-----|
| **P0-A** | Production `/gifts` SSR crash: `TypeError: Cannot read properties of undefined (reading 'length')` in `CatalogueShell` (stale/incomplete props under `next start`) | Defensive normalize of `products`, `query` arrays, and facet lists in `CatalogueShell.tsx`. Rebuilt; prod on `:3457` returns OK without `__next_error__`. |
| **P1-A** | ESLint error: `setState` in effect in `ProductGallery.tsx` (broke `npm run lint`) | Render-time load-state adjust when `active.src` changes; removed effect. |
| **P1-B** | Brief prepare could fail silently on thrown errors (no `catch`) | `catch` sets user-visible error in `GiftingBrief.tsx`. |

### Already fixed / confirmed from prior audit (still valid)

| ID | Notes |
|----|--------|
| Gift Finder `useSyncExternalStore` crash | Stable snapshots in `giftFinder/draft.ts` / `shortlist.ts` — form loads in browser. |
| Brief shortlist mirror | `unionProductIds: false` when refreshing linked ids. |

### Open (not silently “fixed”)

| Severity | Issue |
|----------|--------|
| **P0 (launch)** | Online enquiry delivery absent — intentional until business configures provider. |
| **P1** | Conversion channels unconfigured (no `.env.local`). |
| **P1** | ~108 products without images; occasion source-match covers ~half of SKUs for occasion facets. |
| **P2** | Dev hydration warning overlay referenced `SiteHeader` (nav counts hydrate after mount — usable; worth follow-up). |
| **P2** | Budget range strings (e.g. `₹200–300`) parse coarsely. |
| **P2** | npm audit: 5 high in `braces` via eslint toolchain — **do not** `npm audit fix --force`. |
| **P3** | Packaging concept art / partner logos / legal pages. |

---

## 5. Security and performance findings

### Security / privacy

| Topic | Finding |
|-------|---------|
| Enquiry API | Validates; honeypot; in-memory rate limit + idempotency; no body logging; delivery gated. |
| Secrets | No `.env.local`; API key only via server env names in `delivery.ts` — not committed. |
| Uploads | Client-only logos; size/type limits; SVG as image data URL (not injected as HTML). |
| Company Store | **Not** secure private commerce — correctly disclosed. |
| `dangerouslySetInnerHTML` | Not used for these flows. |
| Catalogue search API | Public (appropriate for public catalogue); must not later expose private store catalogues without auth. |

### Performance

| Topic | Finding |
|-------|---------|
| Catalogue | Full export loaded in-process (~4,257 SKUs); acceptable for demo; watch cold start / memory on serverless. |
| Prod rebuild | Clean compile; `/gifts` dynamic. |
| Dev | Concurrent agent work can slow recompiles. |

### npm audit

- **5 high** — `braces` ← micromatch ← fast-glob ← `@next/eslint-plugin-next` ← `eslint-config-next`  
- Fix via `--force` would downgrade eslint-config-next to 14.x — **rejected**. Needs upstream or approved overrides later.

---

## 6. Missing business integrations

1. Verified enquiry inbox + Resend (or approved) provider + sender domain  
2. `NEXT_PUBLIC_MONKCRAFT_ENQUIRY_EMAIL`, `BOOKING_URL`, `WHATSAPP_E164`  
3. Privacy / legal pages + public contact email in footer  
4. Company Store IdP + multi-tenant isolation + order ingestion  
5. Payments / fulfilment / inventory  
6. Durable rate-limit / idempotency store for multi-instance hosting  
7. Hosting strategy for export JSON + catalogue media (CDN / object storage)  
8. Monitoring / error reporting  

---

## 7. Remaining product / image assets

From `docs/monkcraft-visual-assets-needed.md` (still accurate):

1. **P0** — Master photos for **108** products with no images  
2. **P1** — Approved packaging SKUs + photos for Build a Box  
3. **P2** — Extra angles for high-traffic SKUs  
4. **P3** — Verified partner logos (marquee stays empty until then)  
5. Approved homepage hero **v5** and category tiles — **do not replace**

---

## 8. Launch blockers

Must resolve before claiming production “live conversion” or “private stores”:

1. **Configure & test** public contact channels + (optional) server enquiry delivery after approval  
2. **Deploy path** for catalogue data/media (symlink model will fail on typical PaaS)  
3. **Do not** market Company Stores as authenticated live commerce  
4. **Legal / privacy** pages before collecting production PII via email  
5. **Decision:** ship copy-only handoff now vs wait for inbox delivery  

Non-blocking for demo: packaging catalogue, partner logos, 108 missing images (empty states exist).

---

## 9. Modified files (this QA pass)

- `src/components/catalogue/CatalogueShell.tsx` — defensive prop normalization (P0 prod crash)  
- `src/components/catalogue/ProductGallery.tsx` — lint-safe load-state reset  
- `src/components/catalogue/GiftingBrief.tsx` — prepare error `catch`  
- `docs/monkcraft-launch-readiness-report.md` — this report  

No genuine product records altered. No packages installed. No deploy.

---

## 10. Test results

| Check | Result |
|-------|--------|
| `npm run lint` | **Pass** after ProductGallery / CatalogueShell fixes (exit 0) |
| `npm run build` | **Pass** — Next.js 16.4.0; TS OK; routes generated |
| `npm audit` | **5 high** (eslint toolchain `braces`) — no force-fix |
| `npm run catalogue:validate` | Runs; reports 108 no-image rows (data gap, not app crash) |
| `POST /api/enquiry` | **503** `delivery_not_configured` (expected) |
| `POST /api/gift-finder/recommend` | **200** rule-based; sample Adidas tee ₹945; budget applied |
| `GET /api/catalogue/search?q=bottle` | **200**; total 142 |
| Prod `/gifts` (+ filters) on `:3457` | **OK** after rebuild (was `__next_error__` before fix) |
| Browser homepage desktop + mobile 390×844 | **OK** |
| Browser catalogue / PDP / shortlist / brief prepare / Gift Finder / Company Stores | **OK** (see §2) |

**Automated vs manual:** lint/build/audit/API curls = automated. Buyer UI journeys = manual browser. No fabricated “all green E2E suite” — there is no committed Playwright/Cypress suite in `package.json`.

---

## Prioritized launch checklist

1. [ ] Owner: set verified `.env.local` public channels; re-test ConversionChannels  
2. [ ] Owner: approve Resend (or other) delivery + privacy copy before `MONKCRAFT_ENQUIRY_DELIVERY_ENABLED=true`  
3. [ ] Engineering: production media/data hosting plan (not sibling symlink)  
4. [ ] Product: keep Company Store labelled **demo** until auth/tenancy  
5. [ ] Merch: supply 108 missing product masters + approved packaging  
6. [ ] Legal: privacy / terms + footer contact email  
7. [ ] Engineering: Git checkpoint after this milestone (on request)  
8. [ ] Optional: SiteHeader hydration follow-up; budget-range parse polish; braces override strategy  

---

## Summary for the business owner

You can **demo** a real catalogue (4,257 SKUs), shortlist, gift finder, box/studio drafts, and a **prepared quotation** buyers can copy.  

You cannot yet honestly promise **inbox delivery**, **calendar booking**, **WhatsApp Business handoff**, or **live private employee stores** until those integrations are configured and built.

**Recommend:** controlled stakeholder demos now; production “launch” only after checklist items 1–4 at minimum.
