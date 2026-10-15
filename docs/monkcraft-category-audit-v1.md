# Monkcraft Category & Product-Type Audit v1

**Status:** Complete — stop for review  
**Date:** 2026-10-15  
**Scope:** Fix hallucinated / polluted product categories (esp. Drinkware showing candles) without destructive export overwrites  
**Constraints respected:** No invented products/prices; no SKU deletion; no export file overwrite; no new npm deps; no deploy

---

## 1) Root causes (evidence-based)

| Cause | Evidence | Impact |
|-------|----------|--------|
| **A. Noisy export categories (primary)** | `drinkware-barware` → subcategory `coffee` (114 SKUs) is ~99% non-drinkware: candles, plants, air fryers, steamers, lunch boxes, magnets, string lights, etc. Subcategory `barware` is ~84% polluted (lunch bags, speakers, cookware). | Catalogue `?category=drinkware-barware` showed candles and kitchen appliances as if they were bottles/mugs. |
| **B. Filters trusted export labels blindly** | `filterProducts` matched `product.categorySlug` from export with no type check. | Any pollution in the export flowed straight into UI results. |
| **C. Gift Finder used the same export slug** | `recommend.ts` `categoryHit` used `product.categorySlug`. | Selecting “Drinkware” could surface non-drinkware SKUs parked under that export bucket. |
| **D. Not generative AI hallucination** | Gift Finder / recognition scoring are **deterministic** (rule-based). `workplace-recognition` occasion (126 SKUs) is mostly awards/apparel/tech — no candles. | “Recognition AI” symptoms were polluted **type** buckets + occasion browse mixing types, not a generative model inventing SKUs. |
| **E. Occasion ≠ type confusion (IA)** | Homepage Gift Ideas correctly deep-link **occasions** (onboarding, festive, etc.). Occasions are many-to-many `source_match` lists and intentionally span apparel + drinkware + bags. | Buyers browsing an occasion see mixed merchandise types — expected. The bug was type filters lying. |

**Not the primary cause:** Homepage Gift Ideas occasion URLs; source_match occasion lists for workplace-recognition; relevance scorer inventing membership (it only re-ranks).

---

## 2) Data distribution (export labels — before)

Universe: **4,257** products from `../monkcraft/website-export/data/products.json` (schema 2.0.0).

| Export category slug | Count | Notes |
|---------------------|------:|-------|
| apparel-lifestyle | 938 | Generally clean |
| bags-travel | 806 | Generally clean |
| hampers-gifting | 673 | Mixed gift sets (expected) |
| **drinkware-barware** | **460** | **Coffee + Barware heavily polluted** |
| executive-writing | 456 | Mostly pens/notebooks |
| office-stationery | 379 | Some mug/tech desk combos |
| tech-gadgets | 364 | Mostly clean |
| awards-trophies | 83 | Mostly clean |
| wellness-organic | 36 | Small |
| eco-friendly | 33 | Small |
| packaging | 29 | Small |

### Drinkware subcategory pollution (title keyword audit)

| Subcategory | SKUs | Approx. non-drinkware |
|-------------|-----:|----------------------:|
| bottles | 124 | ~0% |
| mugs | 166 | ~11% (mostly cups / edge cases) |
| tumblers | 19 | ~5% |
| barware | 37 | **~84%** |
| coffee | 114 | **~99%** |

### Top mismatch examples (export Drinkware)

| SKU | Title | Export sub | Issue |
|-----|-------|------------|-------|
| MGC-0805 | Beeswax Candle Set of 2- Yellow | Coffee | Candle in drinkware |
| MGC-0916 | Eat Better Golden Lid Candle | Coffee | Candle in drinkware |
| MGC-0827 | Eat Better Lotus Diya | Coffee | Diya in drinkware |
| MGC-0833 | Air Purifying Syngonium Plant… | Coffee | Plant in drinkware |
| MGC-0911 | Xech Eon Digital Clock Speaker | Coffee | Tech in drinkware |
| MGC-0840 | KENT Classic Hot Air Fryer | Coffee | Appliance in drinkware |
| MGC-0777 | Glasafe Desk Munch Combo Lunch Bag | Barware | Bag in drinkware |

---

## 3) Definite product-TYPE taxonomy (separated from occasion)

**Product TYPE** = physical merchandise group (filterable).  
**Occasion** = gifting use-case from `gifting-segments.json` `source_match` only — unchanged.

| Type id | Filter slug (`?category=`) | Grounded in export |
|---------|---------------------------|--------------------|
| apparel | apparel-lifestyle | yes |
| drinkware | drinkware-barware | yes (cleaned) |
| bags | bags-travel | yes |
| tech | tech-gadgets | yes |
| desk-writing | executive-writing / office-stationery | yes (split preserved) |
| hampers | hampers-gifting | yes |
| recognition | awards-trophies | yes |
| wellness-eco | wellness-organic / eco-friendly | yes (split preserved) |
| packaging | packaging | yes |
| **other** | **other** | ambiguous / kitchen-home / non-merch |

Implementation: `src/data/catalogue/productType.ts` (deterministic classifier).  
Overlay fields on each `Product`: `filterCategorySlug`, `filterCategoryName`, `productTypeId`, `productTypeConfidence`, `productTypeRuleId`.  
Export `categorySlug` / `categoryName` remain as **provenance** (not overwritten on disk).

---

## 4) Classifier rules applied (summary)

Full rules live in `productType.ts`. Documented behaviour:

1. **Keyword overrides export** when title evidence is strong (candles → other; backpacks stay bags even if “Bottle Green” colourway).
2. **Trusted subcategories** inherit export type without a title keyword: e.g. drinkware `bottles|mugs|tumblers` only — **not** `coffee` or `barware`.
3. **Noisy drinkware subs** (`coffee`, `barware`) without a confirming drinkware keyword → **other** (or remapped type if keywords say bags/tech/wellness).
4. **Bags before drinkware** in rule order to avoid colour/false-positive bleed.
5. **Kitchen appliances / lunch boxes / plants / candles** → other or wellness (plants), never drinkware primary.
6. **Weak / ambiguous** → `other` facet; excluded from strict type filters for major categories.
7. **IDs, slugs, shortlists, deep links preserved** — only filter/display layer changes.

Re-run audit anytime:

```bash
node scripts/category-type-audit.mjs
```

---

## 5) Per-category counts — before vs after

| Category slug | Before (export) | After (filter) | Delta |
|---------------|----------------:|---------------:|------:|
| apparel-lifestyle | 938 | 950 | +12 |
| bags-travel | 806 | 833 | +27 |
| hampers-gifting | 673 | 584 | −89 |
| drinkware-barware | **460** | **382** | **−78** |
| executive-writing | 456 | 446 | −10 |
| office-stationery | 379 | 269 | −110 |
| tech-gadgets | 364 | 403 | +39 |
| awards-trophies | 83 | 74 | −9 |
| wellness-organic | 36 | 74 | +38 |
| eco-friendly | 33 | 24 | −9 |
| packaging | 29 | 44 | +15 |
| **other** | 0 | **174** | +174 |
| **Total** | **4257** | **4257** | 0 |

**Remapped SKUs:** 452 (export category ≠ filter category). Largest flows:

| Remap | Count |
|-------|------:|
| drinkware-barware → other | 121 |
| office-stationery → drinkware-barware | 45 |
| office-stationery → tech-gadgets | 40 |
| hampers-gifting → wellness-organic | 31 |
| hampers-gifting → packaging | 24 |
| hampers-gifting → drinkware-barware | 22 |

---

## 6) Runtime fixes

| Surface | Change |
|---------|--------|
| Catalogue `?category=` | Filters on `filterCategorySlug` (strict type) |
| Category facet counts | Count classifier types; add **Other** |
| Subcategory facets | Built from classified products (empty Coffee under Drinkware) |
| Relevance sort | Demotes `other` / low-confidence in occasion browse |
| Gift Finder category match | Uses `filterCategorySlug` |
| Gift Finder cards / PDP / ProductCard | Show filter type label |
| Related products | Same filter type pool |
| Homepage Gift Ideas | Unchanged URLs — occasions stay occasions; Custom Merchandise → `apparel-lifestyle` (type) remains honest |
| Export JSON | **Not modified** |

---

## 7) Verification (smoke)

| Check | Result |
|-------|--------|
| Candles in drinkware filter | **0** (MGC-0805, MGC-0916 → `other`) |
| `queryCatalogue({category: drinkware-barware})` | **382** products; primary results are coasters/mugs/bottles |
| Gift Finder `categorySlugs: [drinkware-barware]` | 24 matches, **0 candles** |
| Tech / apparel / bags primary samples | Chargers/tees/luggage — no obvious cross-type pollution on page 1 |

---

## 8) Remaining ambiguous SKUs (human review)

**174 products in `other`** — intentionally excluded from strict major-type views. Includes:

- Kitchen appliances formerly under Drinkware → Coffee (air fryers, kettles, OTG, vacuum cleaners, trimmers)
- Lunch boxes / bento (incl. BENTO JOT desk companions)
- Candles / diyas
- Ambiguous Glasafe “combo” titles without clear type words
- Misc home items (dinner sets, stress balls, air purifiers)

**Recommended human actions:**

1. **Export cleanup (upstream):** Re-tag Drinkware → Coffee / Barware in the website-export pipeline so provenance matches reality. App overlay can then shrink.
2. **Optional new type:** `home-kitchen` if Monkcraft wants appliances as a first-class filter (currently Other).
3. **Review office-stationery remaps:** 45 mugs correctly moved to drinkware; confirm desk lamp+tumbler combos stay desk (rules already special-case some).
4. **Hamper ↔ packaging edge cases:** ~24 “Gift Box” titles still remap; spot-check Diwali gift boxes vs empty packaging SKUs.
5. **Do not** treat occasion lists as product types — keep TYPE and OCCASION separate in all future IA.

---

## 9) Files changed

| File | Role |
|------|------|
| `src/data/catalogue/productType.ts` | **New** — classifier + type taxonomy |
| `src/data/catalogue/types.ts` | Overlay fields on `Product` |
| `src/data/catalogue/products.ts` | Apply classifier at load; related-by-type |
| `src/data/catalogue/query.ts` | Filter/score by filter type |
| `src/data/catalogue/facets.ts` | Facet counts + Other + subcats from types |
| `src/data/catalogue/taxonomy.ts` | Docs: type vs occasion |
| `src/data/catalogue/index.ts` | Re-exports |
| `src/lib/giftFinder/recommend.ts` | Category hit + demote other |
| `src/lib/giftFinder/types.ts` | Card uses filter type |
| `src/components/catalogue/ProductCard.tsx` | Display filter type |
| `src/app/gifts/[slug]/page.tsx` | Breadcrumb/type use filter |
| `scripts/category-type-audit.mjs` | Read-only audit runner |
| `docs/monkcraft-category-audit-v1.md` | This report |

---

## 10) Lint / build

See agent final report for `npm run lint` and `npm run build` results from this pass.
