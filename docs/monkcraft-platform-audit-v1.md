# Monkcraft Platform Audit v1

**Date:** 2026-10-15  
**Scope:** Full platform reliability, connected journeys, data integrity, security/privacy, technical health  
**Method:** Code-path verification + `npm run lint` / `npm run build` + browser smoke tests on localhost  
**Constraint:** No deploy, no dependency upgrades, no invented catalogue data or live integrations  

---

## Launch readiness

**Not ready for production launch as a fully connected conversion platform.**

**Ready for controlled demo / stakeholder review** of discovery → shortlist/box/studio → prepared quotation copy, provided operators understand that inbox delivery, WhatsApp/booking channels, and Company Store auth/fulfilment are not live.

Evidence below.

---

## 1. Inventory of actual working features

Classification key:  
1 = Fully working and verified · 2 = Partially implemented · 3 = Frontend preview only · 4 = Blocked by missing real data/integration · 5 = Missing or broken

| Area | Routes / APIs | Class | Notes |
|------|---------------|-------|--------|
| Homepage | `/` | **1** | Approved hero `monkcraft-hero-v5.jpg`, What We Do, Gift Ideas, Consultation, FAQ, footer. Partner marquee correctly empty. |
| Catalogue discovery | `/gifts`, `/gifts/[slug]` | **1** | Search, facets, sort, pagination over **4,257** export-backed products. Shared product source. |
| Shortlist | `/gifts/shortlist` + `localStorage` | **1** | Persist, qty, remove; header count; feeds brief. |
| Build a Box | `/gifts/box` | **2** | Multi-step flow works locally; packaging often “to be confirmed” (no approved packaging catalogue); quote is copy/prep only. |
| Studio branding | `/studio?mode=customize` | **2** | Logo position/resize + PNG export with mockup watermark. Conceptual only — not a print proof. |
| White-label catalogue | `/studio?mode=catalogue` | **2** | Builder + browser Print → Save as PDF (no PDF library). Local draft only. |
| Unified brief / quotation | `/gifts/brief` | **2** | Workspace merges shortlist + linked sources; prepares text; **no online delivery**. |
| Smart Gift Finder | `/gifts/find`, `POST /api/gift-finder/recommend` | **1** (after fix) | Rule-based, export-backed. Honest “not generative AI”. Draft persistence. |
| Company Stores | `/company-stores`, `/configure`, `/preview` | **3** | Honest demo configurator + employee preview. **No auth, payments, inventory, or private store isolation.** |
| Consultation form | `#enquire` on homepage | **2** | Prepares enquiry; channels gated on env; API refuses delivery. |
| Conversion channels | `ConversionChannels`, contactConfig | **4** | Mailto / booking / WhatsApp only when `NEXT_PUBLIC_*` set. **No `.env.local` present** → copy-only. |
| Enquiry API | `POST /api/enquiry` | **4** | Validates; always `503 delivery_not_configured`. By design. |
| Catalogue search API | `GET /api/catalogue/search` | **1** | Used by Studio pickers. |
| Generative AI finder | `aiBoundary.ts` | **5** | Explicitly inactive; adapter returns null. |

### Shared state (browser `localStorage`)

| Key / domain | Module |
|--------------|--------|
| Shortlist v2 | `src/lib/shortlist.ts` |
| Box draft | `src/lib/box.ts` |
| Brief v2 (+ v1 migrate) | `src/lib/brief.ts` |
| Gift Finder | `src/lib/giftFinder/draft.ts` |
| Studio branding / catalogue | `src/lib/studio/*Draft.ts` |
| Company store + order preview | `src/lib/companyStore/*` |

Drafts survive refresh in the same browser. Not synced across devices. Logo binaries stay in source drafts; brief stores metadata only.

---

## 2. E2E journeys tested

| Journey | Result | Evidence |
|---------|--------|----------|
| **A Gift Discovery** Homepage → Catalogue → Details → Shortlist → Brief | **Pass (prep only)** | Browser: homepage, `/gifts` (products render), brief showed 2 shortlisted + prices. Quotation = prepared text / copy — not submitted. |
| **B Build a Box** | **Pass to prep (partial packaging)** | Code + prior local draft observed (`Build a Box (1)` in nav). Packaging may be pending. Quote via ConversionChannels. |
| **C Studio** Product → Logo → Export | **Pass (conceptual)** | `/studio` + search API 200; export path is canvas PNG with watermark. |
| **D White-label catalogue** | **Pass (browser PDF)** | Print document path implemented; no server PDF. |
| **E Company Stores** | **Pass as demo** | Landing + configurator/preview routes exist; banners state no live auth/orders. |
| **F Smart Gift Finder** | **Pass after P0 fix** | Initially crashed on `/gifts/find` (`useSyncExternalStore` unstable snapshot). After stable snapshot caching: form loads, API returns rule-based matches with verified prices. |
| **G Business conversion** | **Blocked for live handoff** | Enquiry API returns `delivery_not_configured`. Booking/WhatsApp/email unavailable without env. Copy path works. |

**Browser verification performed:** yes — Cursor browser on `localhost:3000` (homepage, Gift Finder crash+recovery, catalogue, brief hydration, company stores landing).  
**Not fully click-through exercised in this pass:** every Box packaging step, Studio logo file upload, full Company Store configure→preview cart, PDF print dialog.

---

## 3. Issues by severity

### P0 — Critical (fixed or launch-blocking)

| ID | Issue | Status |
|----|--------|--------|
| P0-1 | `/gifts/find` runtime crash: `useSyncExternalStore` getSnapshot returned new object every read (`readGiftFinderDraft` / empty snapshot / shortlist ids) | **Fixed** — cached snapshots + stable empty constants |
| P0-2 | Online enquiry delivery absent | **Launch blocker** — intentional until approved provider |

### P1 — High

| ID | Issue | Status |
|----|--------|--------|
| P1-1 | Conversion channels unconfigured (no `.env.local`) — Request a Quote / Book / WhatsApp unavailable | Needs business values |
| P1-2 | Company Stores presented as product but only local demo — must stay clearly labelled (currently honest in UI) | OK if messaging preserved |
| P1-3 | Brief `productIds` could diverge from live shortlist when unioning on refresh | **Fixed** — `unionProductIds: false` when mirroring shortlist |
| P1-4 | ~2,094 / 4,257 products lack occasion segment matches — occasion filters under-cover half the catalogue | Data quality; not deleted |
| P1-5 | 108 products have no images | Data gap; UI shows empty state |

### P2 — Medium

| ID | Issue |
|----|--------|
| P2-1 | Catalogue page can be slow under full export load (observed multi-second `/gifts` compiles in dev) |
| P2-2 | Budget range strings (e.g. `₹200–300`) parse to first number only — workable but coarse |
| P2-3 | Brief first paint shows “Loading…” until client hydrate (normal CSR; error state now surfaces if load fails) |
| P2-4 | Duplicate CTA patterns (My Brief in nav + header pill) — usable, slightly noisy |
| P2-5 | Approved packaging list empty → box packaging often “to be confirmed” |
| P2-6 | npm audit: **5 high** in `braces` via `eslint-config-next` toolchain — not runtime Next; `audit fix --force` would downgrade eslint-config-next (breaking) — **do not force** |

### P3 — Low

Cosmetic/animation polish, artwork gaps, reserved Company Store video placeholder (honest empty).

---

## 4. Safe corrections implemented

| Change | Why |
|--------|-----|
| `src/lib/giftFinder/draft.ts` — cached draft snapshot + `EMPTY_GIFT_FINDER_SNAPSHOT` | Stop Gift Finder crash / infinite re-render |
| `src/lib/shortlist.ts` — cached `readShortlistIds` + `EMPTY_SHORTLIST_IDS` | Stable external-store snapshot for finder |
| `src/components/gift-finder/SmartGiftFinder.tsx` — use stable empty snapshots | Wire-up for above |
| `src/lib/briefWorkspace.ts` — mirror shortlist with `unionProductIds: false` | Removals stay in sync with live shortlist |
| `src/components/catalogue/GiftingBrief.tsx` — show error (not infinite Loading) if workspace fails | Usability / recovery |

No genuine product records deleted or rewritten. Approved homepage hero preserved.

---

## 5. Issues needing business decisions / approval

1. **Verified contact channels:** `NEXT_PUBLIC_MONKCRAFT_ENQUIRY_EMAIL`, `BOOKING_URL`, `WHATSAPP_E164` (see `.env.example` and `docs/conversion-enquiry-privacy.md`).
2. **Server-side enquiry delivery** provider, spam controls, privacy disclosure, rate limits — do not activate without approval.
3. **Company Store production:** auth, multi-tenant isolation, payments, inventory, fulfilment SLAs.
4. **Approved packaging SKUs** for Build a Box.
5. **Legal pages** and public contact email in footer.
6. **Partner logos** for marquee (keep empty until real).
7. **Whether to ship** with copy-only conversion vs wait for live inbox.
8. **Dependency strategy** for `braces` / eslint toolchain (avoid `--force`).

---

## 6. Product-data findings

| Metric | Value |
|--------|--------|
| Source | Sibling `../monkcraft/website-export/data/products.json` (schema **2.0.0**) |
| Media | `public/catalogue-media` → symlink to export media |
| Record count | **4,257** |
| Unique slugs / SKUs | 4,257 / 4,257 (no duplicates) |
| Native `id` field in export | Absent — app uses `sku` (fallback slug) as `Product.id` |
| Images | 4,149 with ≥1 image; **108 without** |
| Prices | Fixed INR from export; min 6 / max 35,999; zero-price count 0 in sample audit |
| Occasion segments | **2,163** slugs with ≥1 source-matched segment |
| Shared consumers | Catalogue, Box, Studio search API, Shortlist snapshots, Gift Finder recommend |

Prices/shipping/availability are never invented as “verified fulfilment” beyond export fields. Studio display markup is labelled as markup. Gift Finder budgets only treat verified fixed prices as in-budget.

See also: `docs/monkcraft-catalogue-data-audit-v1.md` if present for deeper data notes.

---

## 7. Security and performance findings

### Security / privacy

| Topic | Finding |
|-------|---------|
| Logo uploads | Client-side; size/type limits; SVG as image data URL (not injected as markup). Stored in `localStorage` — capacity / XSS-via-SVG risk is browser-local; treat as untrusted for any future server upload. |
| Enquiry API | No delivery; does not log enquiry body. Validation server-side for shape only. |
| Secrets | No API keys in client code. Future keys must **not** use `NEXT_PUBLIC_*`. |
| Company Store | **Not secure private commerce** — local draft only; correctly disclosed. |
| Env | `.env.example` documents public channel vars; no `.env.local` in workspace. |
| HTML | No `dangerouslySetInnerHTML` usage found in app sources for these flows. |

### Performance

| Topic | Finding |
|-------|---------|
| Catalogue | Full products.json loaded into memory on server; acceptable for demo scale; watch cold starts / large JSON. |
| Images | Served via symlink; Next/Image used on surfaces. |
| Gift Finder API | Rule-based over full set; returned matches quickly in smoke test. |
| Dev | Occasional slow recompiles on `/gifts` / studio during concurrent agent work. |

### npm audit

- **5 high** severity via `braces` ← `micromatch` ← `fast-glob` ← `@next/eslint-plugin-next` ← `eslint-config-next`
- Safe options: wait for upstream eslint-config-next patch; or carefully pin a patched `braces` overrides **after** testing (needs approval). **Do not** `npm audit fix --force`.

---

## 8. Production integration blockers

1. Enquiry / CRM / form provider + destination inbox  
2. WhatsApp Business number + booking schedule URL  
3. Privacy policy / legal pages  
4. Company Store identity provider and tenancy  
5. Payments / fulfilment / inventory systems  
6. Spam protection + rate limiting on any public POST  
7. Hosting of website-export data/media for non-local deploys (`MONKCRAFT_EXPORT_DATA`, media symlink/CDN)  
8. Monitoring / error reporting (none configured)

---

## 9. Modified files (this audit pass)

- `src/lib/giftFinder/draft.ts`
- `src/lib/shortlist.ts`
- `src/components/gift-finder/SmartGiftFinder.tsx`
- `src/lib/briefWorkspace.ts`
- `src/components/catalogue/GiftingBrief.tsx`
- `docs/monkcraft-platform-audit-v1.md` (this file)

Other uncommitted platform work (Studio, Company Stores, homepage, catalogue, etc.) existed in the tree from prior agents and was inspected, not redesigned.

---

## 10. Test results

| Check | Result |
|-------|--------|
| `npm run lint` | **Pass** (exit 0) after Gift Finder / Consultation stabilisation |
| `npm run build` | **Pass** — TypeScript OK; routes generated for homepage, gifts, studio, company-stores, APIs |
| `POST /api/enquiry` | **503** `delivery_not_configured` (expected) |
| `POST /api/gift-finder/recommend` | **200** rule-based matches with fixed pricing |
| `GET /api/catalogue/search?q=notebook` | **200** (197 matches in smoke) |
| Browser homepage | Hero + CTAs OK |
| Browser `/gifts/find` | Crash → **fixed** → form usable |
| Browser `/gifts` | Product grid OK |
| Browser `/gifts/brief` | Hydrates with shortlist + linked box/studio |
| Browser `/company-stores` | Landing honest about demo |

---

## Summary recommendation

Ship **internally / for demos** with clear operator notes: copy-based handoff, Company Store demo-only, Studio mockups not print proofs.

Do **not** market as “live online quotation submission” or “secure private company stores” until P0-2 channels and store provisioning are approved and built.

**Suggested next checkpoint (approval required):** configure verified env channels → re-test ConversionChannels → decide enquiry provider → then Git commit milestone.
