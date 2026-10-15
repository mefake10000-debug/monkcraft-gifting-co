# Monkcraft Image Overhaul Plan v1

**Status:** V2 FOR REVIEW · Batch A (What We Do) wired with v2 merchandising boards · V1 REJECTED  
**Date:** 2026-10-15  
**Hard stops:** Homepage hero `public/hero/monkcraft-hero-v5.jpg` is FINAL (do not replace, crop-substitute, regenerate, or overwrite). Never delete originals without approval. Do not clobber concurrent video preprod under `public/videos/`.

### Pipeline update (owner response)

| Gate | Result |
|------|--------|
| V1 concepts | **REJECTED** (aesthetics) → archived `public/brand/illustration-concepts/v1-rejected/` — never wire |
| V2 concepts | **FOR REVIEW** — genuine packshot tiles + official logos (`public/brand/illustration-concepts/v2/`) |
| Batch A What We Do | **Wired** — unique `/marketing/what-we-do/*-v2.jpg`; hero no longer cropped into section |
| Category tiles / other batches | **Not started** — wait for V2 visual approval |
| Honest QC | V2 is **merchandising-board quality** (swag.com product clarity), not bespoke pictorial illustration. Manufacturer marks on some catalogue photos remain. External illustrator recommended for next tier. |

---

## Imagery direction (owner-confirmed)

| Layer | Primary benchmark | Secondary | Never |
|-------|-------------------|-----------|-------|
| **Merchandise & marketing imagery** (category cards, What We Do art, product-led stills, brief storytelling, storefront scenes) | **[swag.com](https://swag.com)** — clean commercial product focus, readable merch, soft studio light, professional gifting e‑commerce language | Monkcraft palette / type / official logo files | Copy Swag or Hustlemad artwork |
| **UI colour / editorial energy** | Monkcraft design system | Behance Hustlemad 2023 — pastels, type energy, section rhythm only | Behance character / mascot / collage layout language dominating asset briefs |
| **Selectable catalogue SKUs** | Genuine Monkcraft product photos from export | — | Invented / AI product photos, fake prices |

Full priority text also persisted in `docs/monkcraft-reference-direction.md` §1 and reinforced in `.cursor/rules/monkcraft-visual.mdc` (Imagery).

---

## Illustration / photography style system (for approval)

**Family name:** Monkcraft Commercial Merch (swag.com-informed)

| Attribute | Spec |
|-----------|------|
| Feel | Premium creative-commercial; mature adult pictorial (not childish cartoon) |
| Product focus | SKU-readable merchandise as hero; soft contact shadows; generous negative space |
| Backgrounds | Clean soft studio: anti-flash / mist lilac / sage mint / powder blue / buttercream blocks — geometric pedestals OK if restrained |
| Palette | Royal Purple `#662F90` accent + documented pastels; Black Olive for apparel/deep goods; avoid neon collage |
| Branding in art | Composite real logo from `public/brand/` — do not rely on AI letterforms for “monkcraft” wordmarks |
| Human storytelling | Occasional adult professional figures (hands or ¾ figure) interacting with real-looking kits — not floating Behance mascots |
| Hand-sketch | Optional thin construction lines / soft graphite accents on packaging or workspace scenes only — never childish doodles |
| Catalogue / PDP / Box picks | Photography only from genuine export; gaps listed below — no generative fillers |

---

## Phase 1 inventory summary

### Totals

| Metric | Count / note |
|--------|----------------|
| Surfaces inspected | Homepage, Gift Ideas, What We Do, Journey (no art), Consultation/FAQ/Footer (logos only), Catalogue/PDP/Shortlist/Finder, Build a Box, Gifting Brief, Studio, Company Stores |
| Marketing / UI image files under `public/` (excl. videos + catalogue-media) | 22 (8 brand logos, 3 hero archives+live, 6 category tiles, 5 default Next/Vercel SVGs unused in brand UI) |
| Repeated / low-differentiation marketing uses found | **Hero reused 5×** on homepage (1 hero + 4 What We Do crops); **6 category tiles** are near-identical merch family (same black polo/hoodie/bottle grammar; festive↔rewards ahash ~84%) |
| Distinct marketing replacements required (post-approval) | **~11–14** unique arts: 4 What We Do service arts + 6 occasion category tiles + optional Journey/Company Store scene (0–2) + optional Brief workspace still |
| Legitimate reuses | Official brand marks (nav/footer); catalogue product masters across cards/PDP/Finder/Box/Studio/Store; packaging concept SVGs labeled non-selectable |
| Category coverage (homepage Gift Ideas) | 6/6 wired at 1200×900; **replace for uniqueness**, not for missing files |
| Missing genuine product photos | **108** SKUs without images (catalogue data audit) — photography ops, not illustration |
| Missing packaging product photos | `APPROVED_PACKAGING` empty — concept SVGs only |
| Partner logos / testimonials | None — marquee correctly hidden |
| Tech integration needs | Wire new paths in `WhatWeDo.tsx`, `giftCategories.ts`; Next/Image sizes already OK; WebP conversion pass; do not change hero path |

### Disposition legend

- **RETAIN** — keep file and usage as-is  
- **REPLACE** — produce unique approved asset; keep old file until swap approved  
- **REMOVE-FROM-USAGE** — stop referencing in UI (file may archive; no delete without approval)  
- **GAP** — no asset yet; honest empty / pending state stays until real photo

---

## Master inventory table

| Page | Section | Current image path | Quality issue | Replacement concept | Genuine product refs if applicable | Dimensions/aspect | Unique filename | Production status | Approval status |
|------|---------|-------------------|---------------|---------------------|------------------------------------|-------------------|-----------------|-------------------|-----------------|
| `/` | Hero full-bleed | `/hero/monkcraft-hero-v5.jpg` | None — approved benchmark | **None — LOCKED** | N/A | 2560×1440 (16:9) | *(keep)* `monkcraft-hero-v5.jpg` | Live | **Approved — do not touch** |
| `/` | Hero archive | `/hero/monkcraft-hero-v3.jpg`, `v4` | Legacy; not in production hero | Leave archived; never promote | N/A | v3 1280×720; v4 2560×1440 | *(keep)* | Archive | N/A |
| `/` | What We Do — Corporate Gifting feature | Same `monkcraft-hero-v5.jpg` crop `58% 42%` | **Repeated hero**; crop distortion of full scene; not service-specific | Dedicated kit / programme composition (swag.com still-life clarity) — Concept 01 | Bottle, notebook, apparel, gift box from export when available | 1600×1200 (4:3) or 1600×1000 | `public/marketing/what-we-do/corporate-gifting-v1.webp` | Concept pending | **Awaiting** |
| `/` | What We Do — Custom Merch tile | Hero crop `48% 35%` | Repeated hero crop | Distinct apparel + print/embroidery studio still | Tee/hoodie/cap masters | 1200×900 (4:3) | `public/marketing/what-we-do/custom-merchandise-v1.webp` | Not started | Awaiting |
| `/` | What We Do — Kits & Fulfilment tile | Hero crop `72% 55%` | Repeated hero crop | Open gift box + multi-item kit packing | Kit set / box packaging photos when approved | 1200×900 | `public/marketing/what-we-do/kits-fulfilment-v1.webp` | Not started | Awaiting |
| `/` | What We Do — Company Stores band | Hero crop `85% 40%` | Repeated hero crop | Clean branded storefront merch shelf (swag store clarity) | Apparel + drinkware masters | 1600×1000 | `public/marketing/what-we-do/company-stores-v1.webp` | Not started | Awaiting |
| `/` | Gift Ideas — Employee Onboarding | `/categories/employee-onboarding.jpg` | Generic AI merch family; overlapping subjects with other tiles; AI logo/text risk on bottles | Occasion-distinct welcome kit (hands + box) — Concept 02 family | MGC kit / bottle / notebook when listed | 1200×900 | `public/categories/employee-onboarding-v2.webp` *(keep v1 jpg until swap)* | Concept sample | Awaiting |
| `/` | Gift Ideas — Client Appreciation | `/categories/client-appreciation.jpg` | Near-same pedestal merch language as events/custom | Distinct premium client gift assortment (fewer items, clearer hero SKU) | Tumbler, journal, tech | 1200×900 | `public/categories/client-appreciation-v2.webp` | Not started | Awaiting |
| `/` | Gift Ideas — Festive Gifting | `/categories/festive-gifting.jpg` | Highly similar to rewards (ahash ~84%); weak festive signal | Festive colour cue + gift wrap / diya-safe merch (no invented ritual claims) | Apparel + hamper set photos | 1200×900 | `public/categories/festive-gifting-v2.webp` | Not started | Awaiting |
| `/` | Gift Ideas — Events & Conferences | `/categories/events-conferences.jpg` | Overlaps client-appreciation / custom merch | Event giveaway clarity: bottle + tote + lanyard-free badge area | Bottle, backpack, tee | 1200×900 | `public/categories/events-conferences-v2.webp` | Not started | Awaiting |
| `/` | Gift Ideas — Rewards & Recognition | `/categories/rewards-recognition.jpg` | Near-duplicate of festive; thin merch set | Recognition-forward: apparel + award-adjacent desk item (no fake trophy SKU) | Polo, hoodie | 1200×900 | `public/categories/rewards-recognition-v2.webp` | Not started | Awaiting |
| `/` | Gift Ideas — Custom Merchandise | `/categories/custom-merchandise.jpg` | Same family as client/events; crowded | Studio merch line-up with clear logo placement zones | Cap, bottle, tote, tee | 1200×900 | `public/categories/custom-merchandise-v2.webp` | Not started | Awaiting |
| `/` | Brand marquee | *(none)* | Correctly empty | Verified partner logos only when supplied | Partner files | 64–80px height | `public/brands/{partner}-logo.svg` | Blocked | N/A |
| `/` | Journey strip | *(none)* | Text-only — OK | Optional later: 3 tiny step icons (not required for v1 batch) | — | 160×160 | optional | Deferred | — |
| `/` | Consultation / FAQ | *(none)* | OK | No marketing art required | — | — | — | Retain | — |
| Global | Nav / Footer logos | `/brand/Monkcraft-*-Horizontal.png` | Official — retain | Retain; composite into concepts only | Official brand files | As shipped | *(keep)* | Live | Retain |
| `/gifts` + PDP + shortlist + finder | Product cards / gallery | `/catalogue-media/products/…` | Uneven lighting/crop; **108** missing | Photo ops: masters for gaps; quality pass — **not AI** | Export SKUs | 1600×1600 | `{sku}/0-master-*.webp` | Gap list known | Ops |
| `/gifts/box` | Packaging options | *(empty slots)* | No approved packaging SKUs | Real packaging photos when SKUs approved | Future `APPROVED_PACKAGING` | 1400×1050 | `packaging/{slug}/0-master.webp` | GAP | Blocked |
| `/gifts/box` | Packaging concepts strip | `/catalogue-media/packaging/illustrations/*.svg` | Honest indicative SVGs — OK | Prefer photos when SKUs live; keep SVGs labeled conceptual | — | ~800×600 viewBox | *(keep)* | Live (honest) | Retain until photos |
| `/gifts/brief` | Brief workspace | Product thumbs from shortlist only | No dedicated storytelling art | Concept 04 — human + brief workspace (marketing only) | Shortlist uses real thumbs | 1600×1000 | `public/marketing/brief/gifting-brief-story-v1.webp` | Concept pending | Awaiting |
| `/studio` | Product picker / canvas | Catalogue `imageSrc` | Same as catalogue gaps | Genuine photos only | Export | 1:1 | *(catalogue)* | Live | Retain |
| `/company-stores` | Landing | Soft CSS tiles only | No dedicated merch scene | Optional storefront hero (after What We Do batch) | Catalogue | 1600×1000 | `public/marketing/company-stores/landing-scene-v1.webp` | Deferred | Awaiting |
| `/company-stores/*` | Employee / admin grids | Catalogue / upload logo | Gaps = empty states | Same photo ops | Export | 1:1 | *(catalogue)* | Live | Retain |
| Default Next assets | `public/{next,vercel,globe,file,window}.svg` | Unused in Monkcraft UI | Leave; do not use as brand art | — | — | — | Ignore | — |
| Video preprod | `public/videos/**` | Concurrent agent | **Do not modify** in this overhaul | Out of scope | — | — | — | Hands off | — |

---

## Concept pack

### V1 — REJECTED
`public/brand/illustration-concepts/v1-rejected/` — poor AI aesthetics; do not use.

### V2 — FOR REVIEW
`public/brand/illustration-concepts/v2/` · briefs: `docs/image-overhaul/concepts-v2/README.md`

| # | Role | Path | Notes |
|---|------|------|-------|
| 01 | Corporate Gifting | `concept-01-corporate-gifting-V2-FOR-REVIEW.jpg` | Gift-set hero + packshot tiles |
| 02 | Gift Ideas sample | `concept-02-gift-ideas-category-V2-FOR-REVIEW.jpg` | Distinct apparel/essentials grid |
| 03 | Product-led merch | `concept-03-product-led-merch-V2-FOR-REVIEW.jpg` | Sparse commercial bento |
| 04 | Gifting Brief story | `concept-04-gifting-brief-story-V2-FOR-REVIEW.jpg` | Vector brief UI + genuine photo |
| — | Contact sheet | `contact-sheet-v2.jpg` | Review aid |

**Method:** `scripts/compose-marketing-v2.py` — genuine catalogue photos in white ecommerce tiles; official logo chips; cap logomark composite. Not AI-invented SKUs.

### Batch A — What We Do (wired)

| Service | Path |
|---------|------|
| Corporate Gifting | `/marketing/what-we-do/corporate-gifting-v2.jpg` |
| Custom Merchandise | `/marketing/what-we-do/custom-merchandise-v2.jpg` |
| Kits & Fulfilment | `/marketing/what-we-do/kits-fulfilment-v2.jpg` |
| Company Stores | `/marketing/what-we-do/company-stores-v2.jpg` |

Component: `src/components/WhatWeDo.tsx` (no hero reuse).

---

## Proposed production batches

1. **Batch A — What We Do (4 arts)** — **DONE (v2 boards wired)**; hero section unchanged.  
2. **Batch B — Gift Ideas (6 arts)** — pending V2 visual approval.  
3. **Batch C — Optional marketing** — Brief story still; Company Store landing scene.  
4. **Batch D — Photo ops (parallel)** — 108 missing masters + packaging SKUs; never generative.

---

## What needs owner approval to proceed

1. **Visual review of V2** concepts + Batch A What We Do boards (keep / revise / commission external).  
2. Permission to start **Batch B** (Gift Ideas 6 category tiles) using the same method — or pause for illustrator.  
3. Confirmation that current category JPGs may remain on disk until swap (no deletes).  
4. Optional: brief external illustrator for pictorial tier (see concepts-v2 README QC notes).

### External production brief (if V2 merchandising boards are insufficient)

| Deliverable | Spec |
|-------------|------|
| What We Do ×4 + Gift Ideas ×6 | Styled studio photography or premium commercial illustration |
| Aspect | WWD featured 1600×1200; tiles 1200×900; band 1600×1000 |
| Product | Blankable or Monkcraft-print-ready goods; **no** competitor wordmarks in frame |
| Logo | Composite from `public/brand/` print files only |
| Style | swag.com product clarity + Monkcraft purple/pastels; mature, neat, trustworthy |
| Out of scope | Homepage hero v5; inventing SKUs/prices; copying Swag/Hustlemad art |

---

## Document control

| Field | Value |
|-------|--------|
| Version | 1.1 |
| Related | `docs/monkcraft-reference-direction.md`, `docs/monkcraft-visual-assets-needed.md`, `docs/image-overhaul/concepts-v2/README.md` |
| Next gate | Owner visual review of V2 + Batch A → then Batch B or external illustrator |
