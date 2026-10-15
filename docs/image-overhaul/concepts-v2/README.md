# Illustration / merchandising concepts V2 — FOR REVIEW

**Status:** V2 boards delivered for owner visual review · V1 rejected  
**Method:** Genuine Monkcraft catalogue packshots in art-directed white product tiles (swag.com-style presentation) + official logo composites  
**Not used:** AI-invented products · rembg floating cutouts (failed QC) · hero crops  

## V1 disposition

| Location | Status |
|----------|--------|
| `public/brand/illustration-concepts/v1-rejected/` | **REJECTED** — do not wire |
| `docs/image-overhaul/concepts-v1/REJECTED/` | Archive copies |

## V2 files

| # | File | Purpose | Aspect | Do | Don’t |
|---|------|---------|--------|----|-------|
| 01 | `concept-01-corporate-gifting-V2-FOR-REVIEW.jpg` | Style board — Corporate Gifting | 1600×1200 (4:3) | Curated kit + packshot tiles; official logo chip | Invent products; reuse hero |
| 02 | `concept-02-gift-ideas-category-V2-FOR-REVIEW.jpg` | Style board — Gift Ideas sample | 1200×900 (4:3) | Occasion-labelled; distinct from #01 | Same layout as #01; childish art |
| 03 | `concept-03-product-led-merch-V2-FOR-REVIEW.jpg` | Style board — product-led merch | 1600×1200 (4:3) | Sparse commercial grid; logo on blankable cap | Clutter; AI sludge cutouts |
| 04 | `concept-04-gifting-brief-story-V2-FOR-REVIEW.jpg` | Style board — Brief storytelling | 1600×900 (16:9) | Vector UI panel + genuine gift photo | Fake AI faces; gibberish UI text |
| — | `contact-sheet-v2.jpg` | Review contact sheet | — | Compare family coherence | Treat as site asset |

Canonical: `public/brand/illustration-concepts/v2/` · mirrors in this folder.

## Honest QC notes (owner)

**Improved vs V1:** No muddy AI hands/faces; no rembg mask sludge; official Monkcraft logo files; readable layout; genuine photography.

**Still not “hero-grade” illustration:** These are **merchandising boards** (product tiles on pastel grounds), not bespoke pictorial scenes. Some catalogue SKUs still show **manufacturer marks** (e.g. bottle, earbuds, gift-set lid copy) because photos are authentic export assets — do not pretend they are Monkcraft-branded factory marks.

**Recommended next tier (if owner wants premium pictorial art):** Brief an external commercial photographer / illustrator for painted or styled studio sets with blankable goods + print-proof Monkcraft logos. See production brief in `docs/monkcraft-image-overhaul-plan-v1.md`.

## Batch A (What We Do) wiring

Unique section arts (same method as V2):

| Service | Path |
|---------|------|
| Corporate Gifting | `/marketing/what-we-do/corporate-gifting-v2.jpg` |
| Custom Merchandise | `/marketing/what-we-do/custom-merchandise-v2.jpg` |
| Kits & Fulfilment | `/marketing/what-we-do/kits-fulfilment-v2.jpg` |
| Company Stores | `/marketing/what-we-do/company-stores-v2.jpg` |

Homepage hero `monkcraft-hero-v5.jpg` remains untouched and is no longer reused in What We Do.

Regenerate: `python3 scripts/compose-marketing-v2.py`
