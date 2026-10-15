# Monkcraft Visual Assets Needed

**Status:** Inventory for a future photo / illustration pass  
**Date:** 2026-10-15  
**Rule:** Do not invent, generate, or download substitute imagery. Use only approved Monkcraft assets.

This list reflects **actual gaps** in the current platform. Layouts already tolerate missing assets with honest empty states. Presentation improvements (contain frames, PDP gallery, category cards) are image-ready — they do not fabricate photography.

---

## 1. Already in place (do not replace)

| Asset | Path | Specs (verified) | Placement |
|-------|------|------------------|-----------|
| Approved homepage hero | `public/hero/monkcraft-hero-v5.jpg` | **2560×1440** JPEG | `/` hero full-bleed / stacked media |
| Legacy hero archive | `public/hero/monkcraft-hero-v3.jpg`, `v4` | Archive only | Do **not** use as production hero |
| Official brand marks | `public/brand/Monkcraft-*.png` | Horizontal ~544×145; logomark 144×84; square 144×144 | Nav, footer, print |
| Occasion category tiles | `public/categories/*.jpg` (6 files) | **1200×900** (4:3) JPEG | Homepage Gift Ideas (`giftCategories`) |
| Catalogue product media | `public/catalogue-media` → symlink `../../monkcraft/website-export/media` | ~22k webp/jpg under `products/` | Cards, PDP, Finder, Box, Studio, Company Store |
| Packaging concept SVGs | `public/catalogue-media/packaging/illustrations/*.svg` | ViewBox ~800×600 | Build a Box conceptual strip only (not selectable SKUs) |
| Design reference boards | `docs/design-references/*.png` | Offline Behance direction | Art direction only — never ship as site merch |

**Category tile map (wired):**

| Homepage id | File | Aspect |
|-------------|------|--------|
| `employee-onboarding` | `employee-onboarding.jpg` | 4:3 |
| `client-appreciation` | `client-appreciation.jpg` | 4:3 |
| `festive-gifting` | `festive-gifting.jpg` | 4:3 |
| `events-conferences` | `events-conferences.jpg` | 4:3 |
| `rewards-recognition` | `rewards-recognition.jpg` | 4:3 |
| `custom-merchandise` | `custom-merchandise.jpg` | 4:3 |

Legacy hero files (`monkcraft-hero-v3.jpg`, `v4`) may remain for archive; **v5 is the production hero**.

---

## 2. Product photography (catalogue)

| Need | Evidence | Placement | Recommended specs | Proposed filename pattern |
|------|----------|-----------|-------------------|---------------------------|
| Master images for **108** products currently without images | Catalogue data report: `withImages` 4149 / `withoutImages` 108 of 4257 | Product cards, PDP gallery, shortlist, Gift Finder, Box, Studio picker, Company Store preview | Square master **1600×1600** (min **1200×1200**), sRGB JPEG/WebP, clean light background preferred for `object-fit: contain` cards | `{sku}/0-master-{hash}.webp` (match export) |
| Additional angles where only one image exists | Export supports `ANGLE` / `LIFESTYLE` / `SEQUENCE` roles; ~3888 folders already multi-angle on disk | PDP thumbnail gallery (keyboard + touch) | Same square masters; 2–4 angles when available | `{sku}/1-angle-…webp` |
| Consistent lighting / crop pass on uneven masters | Visual quality varies across export | All discovery surfaces | Keep product fully in frame with ~8–12% padding for contain presentation | Replace in place; do not rename orphans |

**UI readiness:** Cards and PDP use padded `contain` frames + soft fallback gradients when `src` is missing. No fabricated placeholders. No fake 360 viewer.

**Type:** Product photography (not editorial illustration).

---

## 3. Packaging (Build a Box)

| Need | Evidence | Placement | Recommended specs | Type |
|------|----------|-----------|-------------------|------|
| Approved packaging SKUs with photos + names | `APPROVED_PACKAGING` is empty; platform audit P2-5 | `/gifts/box` packaging step cards (image slot ready) | **4:3** or square **1400×1050 / 1400×1400**; one hero angle per option | Product photography |
| Optional richer packaging style art | Concept SVGs already shown as non-selectable reference | Pending panel only | Prefer real photos over SVG when SKUs ship | Photo preferred |

Until approved, UI keeps honest “pending confirmation” copy — do not invent packaging lines or prices.

**Concept SVGs in use (indicative only):** `rigid-gift-box.svg`, `kraft-paper-pack.svg`, `reusable-tote.svg`.  
**Unused (available later):** `state-open.svg`, `state-closed.svg`, `state-wrapped.svg` — packaging-state diagrams; do not present as product photos.

---

## 4. Marketing / trust (optional, verified only)

| Need | Placement | Specs | Type | Notes |
|------|-----------|-------|------|-------|
| Verified client / partner logos | Homepage brand marquee (`BrandLogoMarquee`) | SVG or PNG, height **64–80px** (@2x), transparent | Logo | Marquee stays **hidden** until real logos are supplied |
| Verified testimonials (optional) | Homepage only if content is real | Portrait **400×400** optional | Photo | Never invent quotes |
| Studio mockup scene improvements | `/studio` branding canvas | Product-aligned masters only | Product photo | Conceptual watermark remains until print proofing exists |
| Company Store demo hero / empty shelf art | `/company-stores` landing aside | Soft scene **1600×1000** | Editorial illustration or scene photo | Optional; pastel blocks currently work |

---

## 5. Illustration (future, separate approval)

Not required to ship current UI. If commissioned later:

| Subject | Page / component | Aspect | Format | Type |
|---------|------------------|--------|--------|------|
| Original Monkcraft character / merchandise vignettes | What We Do, Gift Ideas accents | 16:9 or 4:3 | WebP/PNG | Editorial illustration |
| Occasion scene upgrades (only if category tiles are retired) | Gift Ideas cards | **1200×900** (4:3) | JPEG/WebP | Photo or editorial — match current crop |

- Must not copy Hustlemad Behance characters or layouts
- Prefer high-quality 3D / pictorial direction per design system
- Do **not** crop `monkcraft-hero-v5.jpg` into unrelated sections

---

## 6. Prioritized production manifest

| Priority | Page / component | Subject | IDs | Dimensions / aspect | Format | Proposed filename | Type |
|----------|------------------|---------|-----|---------------------|--------|-------------------|------|
| **P0** | Catalogue card / PDP / Finder / Box / Studio / Store | Master photo for products with no image | 108 SKUs from catalogue audit `withoutImages` | 1600×1600 (min 1200×1200), 1:1 | WebP (+ archival JPEG) | `{sku}/0-master-{hash}.webp` | Product photography |
| **P1** | `/gifts/box` packaging cards | Verified packaging SKUs + hero photo | Future `APPROVED_PACKAGING[].id` | 1400×1050 (4:3) or 1400×1400 | WebP/JPEG | `packaging/{slug}/0-master.webp` | Product photography |
| **P2** | PDP `ProductGallery` | Extra angles for high-traffic SKUs | Top sellers / hero categories | 1600×1600, 1:1 | WebP | `{sku}/1-angle-….webp` | Product photography |
| **P3** | Homepage `BrandLogoMarquee` | Verified partner logos | Partner brand ids when supplied | Height 64–80px @1x | SVG/PNG | `public/brands/{partner}-logo.svg` | Logo |
| **P4** | Marketing bands | Original Monkcraft editorial vignettes | N/A | 1600×1000 (16:10) typical | WebP/PNG | `public/marketing/{slug}.webp` | Editorial illustration |

---

## 7. Delivery checklist for photographers

- [ ] Filename / SKU mapping matches export IDs (no renamed orphans)
- [ ] Transparent or neutral background preferred for merch masters
- [ ] No lifestyle stock; no competitor branding in frame
- [ ] Alt text source: product name + colour/material when known
- [ ] Provide both web-optimized WebP and archival masters where possible
- [ ] Do not regenerate or replace approved homepage hero (`monkcraft-hero-v5.jpg`) without explicit approval
- [ ] Category tiles: keep **4:3** if replacing; preserve filename → `giftCategories` id mapping

---

## 8. Integration status (this milestone)

| Surface | Status |
|---------|--------|
| Homepage hero v5 | Preserved |
| Gift Ideas 6 category images | Wired + consistent 4:3 cards |
| Catalogue / PDP gallery | Contain frames; multi-angle thumbs; keyboard/touch; loading fade |
| Build a Box | Concept SVGs labeled honestly; packaging photo slot ready |
| Studio | Real product images; conceptual mockup badge retained |
| Company Store | Product frames use contain (aligned with catalogue) |
| Partner logos / testimonials | Still blocked on verified assets |

---

## Document control

| Field | Value |
|-------|--------|
| Version | 1.1 |
| Type | Asset dependency inventory + prioritized shoot manifest |
| Related | `docs/monkcraft-catalogue-data-audit-v1.md`, `docs/monkcraft-platform-audit-v1.md`, `docs/monkcraft-design-system-v1.md`, `docs/monkcraft-reference-direction.md` |
| Notes | Merged with Step 42 baseline inventory; expanded with verified dimensions, packaging SVG inventory, and prioritized filename patterns. Do not fabricate missing images. |
