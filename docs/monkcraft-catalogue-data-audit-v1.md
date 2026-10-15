# Monkcraft Catalogue Data Audit v1

**Status:** Complete — stop for review  
**Date:** 2026-10-15  
**Scope:** Product-data foundation for 4,000+ SKU corporate gifting catalogue  
**Constraints respected:** No product deletion/overwrite/invention; no DB or paid search; no destructive migrations; no redesign/image generation; no new npm dependencies

---

## 1) Actual verified product count

| Metric | Value |
|--------|------:|
| **Products in website-export** | **4,257** |
| Unique SKUs | 4,257 |
| Unique slugs | 4,257 |
| Duplicate SKUs / slugs | 0 |
| Products with ≥1 image on disk | 4,149 |
| Products without images | 108 |
| Products with verified positive INR price | 4,257 |
| Products with MOQ (`minimumOrderQuantity` > 0) | 3,620 |
| IN_STOCK / OUT | 3,877 / 380 |
| Source-match occasion memberships (rows) | 3,277 |
| Export marks needing review | 792 |

**Canonical identity in the app:** `product.id` === **SKU** (stable, unique). Deep links use `slug`.

---

## 2) Real data sources

| Source | Path / location | Role |
|--------|-----------------|------|
| **Primary inventory** | `../monkcraft/website-export/data/products.json` (schema **2.0.0**) | Full product master (~19 MB) |
| Categories / taxonomy | `categories.json`, `subcategories.json`, `taxonomy.json` | 11 categories, 40 subcategories |
| Gifting occasions | `gifting-segments.json` (+ assignment CSVs) | Occasion membership; **public UI uses `source_match` only** |
| Quality / review | `quality-report.json`, `review-needed.csv` | Field coverage + review flags |
| Provenance (internal) | `internal-provenance.json` | Source URLs / legacy keys — **do not publish** |
| Media | `../monkcraft/website-export/media` → served as `/catalogue-media` | Real product photography |
| App loader | `src/data/catalogue/products.ts` via `exportPath.ts` | Maps export → canonical `Product` |

**Resolution order for export data:** `MONKCRAFT_EXPORT_DATA` → `src/data/catalogue/export/` → sibling `../monkcraft/website-export/data`.

There is **no** Postgres / Algolia / paid search in this stack. Catalogue is file-backed JSON loaded once per process and filtered in memory with pagination.

---

## 3) Genuine vs demo / unverified

| Class | Verdict |
|-------|---------|
| Product titles, SKUs, categories, prices, specs, images | **Genuine export** from existing Monkcraft catalogue pipeline — not demo placeholders |
| Availability / MOQ / dispatch | Present where export has them; 637 rows lack MOQ/dispatch/GST basis |
| Descriptions | All present; **~923** use a shared corporate-gifting boilerplate sentence — real records, but marketing-templated |
| Variants / sizes / colourways as structured variants | **Empty for all 4,257** — colours/materials live in free-text specs when present |
| Occasion tags in the storefront | **Verified source matches only**; review-candidate inferences are **not** exposed as public facets |
| Homepage gift-idea cards | Marketing IA with honest deep-links into export categories/occasions |
| Packaging category (29 SKUs) | Export notes these were moved from Gift Sets by title/description heuristics in the export pipeline — still real products |

**Nothing in the live loader invents SKUs, prices, inventory, or testimonials.**

---

## 4) Existing catalogue data quality

### Strengths
- Full schema 2.0.0 export with stable SKUs/slugs
- Strong image coverage (21,892 image records; MASTER/ANGLE/LIFESTYLE roles)
- Complete category + subcategory classification
- Honest occasion segmentation with explicit membership statuses
- All products currently have positive fixed INR prices in export

### Gaps / risks
| Issue | Impact |
|-------|--------|
| **No top-level `id` in export** | App uses SKU as id (correct); must not renumber |
| **MOQ field mismatch (fixed this pass)** | Loader previously read `availability.moq`; export has `minimumOrderQuantity` → MOQ was always missing in UI |
| 108 products without images | Detail/cards show empty state |
| 0 structured variants | Size/colour as purchasable options not modelable yet |
| `createdAt` / `updatedAt` absent on products | “Newest” sort has little signal |
| 792 review-needed rows | Mostly GST/MOQ/dispatch, images, or brand name |
| Templated descriptions | Lower SEO/content quality; do not auto-rewrite without approval |
| Material labels highly fragmented (215 unique) | Filter works; curation/normalization later |

---

## 5) Shared product model (implemented)

Canonical type: `src/data/catalogue/types.ts` → `Product`.

| Field | Status |
|-------|--------|
| Stable id (SKU), SKU, slug, name | Implemented |
| Category / subcategory + source labels | Implemented |
| Description / summary | Implemented |
| Multi-image + role + sortOrder | Implemented |
| Variations | Optional/empty — export has none; not invented |
| Colours / materials | From specs when present |
| Branding / personalization | From Customization Type (normalized DTF/UV) |
| MOQ / dispatch / availability | Mapped from export |
| Price or quotation status | Fixed if amount > 0; else `quote` (never treat as ₹0) |
| Occasion associations | Source-match segment ids only |
| Keywords | Derived from verified fields for search |
| Source + schema meta | `ProductSourceMeta` |

**Shared interface:** import from `src/data/catalogue/index.ts` (or existing sibling modules). Consumers already on this source:

- Catalogue `/gifts`, detail `/gifts/[slug]`
- Shortlist / Gifting Brief
- Build a Box
- Studio + Company Stores (via `/api/catalogue/search`)
- Smart Gift Finder (`verifiedUnitPriceInr` shared)

No duplicate hard-coded product arrays for inventory.

---

## 6) Category taxonomy recommendations

### Product types (merchandise) — export categories preserved

| Buyer group | Export category slugs |
|-------------|------------------------|
| Apparel & lifestyle | `apparel-lifestyle` |
| Drinkware & barware | `drinkware-barware` |
| Bags & travel | `bags-travel` |
| Tech & gadgets | `tech-gadgets` |
| Desk & writing | `executive-writing`, `office-stationery` |
| Hampers & curated sets | `hampers-gifting` |
| Awards & recognition | `awards-trophies` |
| Wellness & eco | `wellness-organic`, `eco-friendly` |
| Packaging | `packaging` |

Config: `src/data/catalogue/taxonomy.ts` (`PRODUCT_TYPE_GROUPS`).

### Gifting occasions (journeys) — not product types

Public facets = segments with `sourceMatchedProductCount > 0` only.

Recommended buyer groups (`OCCASION_GROUPS`): onboarding, rewards & recognition, client/events, festive/seasonal, leadership/premium, milestones & farewells.

**Rule:** do not duplicate products across occasions; keep many-to-many mappings in `gifting-segments.json`. Preserve source category labels on each product for traceability.

---

## 7) Bulk import / update capabilities

| Capability | Status |
|------------|--------|
| Validate JSON / CSV (preview) | **`npm run catalogue:validate`** |
| Read-only quality snapshot | **`npm run catalogue:report`** |
| XLSX native parse | **Not available** — export to CSV/JSON first (adding `xlsx` needs approval) |
| Auto-import into live catalogue | **Blocked by design** — requires explicit approval |
| Destructive mass overwrite | **Stop and request approval** |

**Safe update strategy (proposed, not auto-run):**
1. Match rows by **SKU** (stable id).
2. Emit field-level diff preview + missing-field report.
3. Update only approved fields; leave unknowns unknown.
4. Never invent prices; map missing/non-positive → quotation status.
5. Keep slug stable unless explicitly remapped with redirect plan.

---

## 8) Search / performance improvements (this pass)

| Improvement | Detail |
|-------------|--------|
| Keyword search | Name, summary, description, SKU, brand, category, customization, colours, materials, attributes |
| Facets | Product type (category), occasion, customisation, **colour**, **material** |
| Budget min/max | URL + UI; **excludes** quote/unknown/non-positive prices |
| Sort | Recommended, name, price, newest (newest weak until dates exist) |
| Pagination | 24/page catalogue; API supports `page` + `limit` (≤48) |
| Counts | Result total from filtered set; facet counts from catalogue |
| Empty states | Existing `CatalogueEmpty` preserved |

**Scale note:** 4,257 in-memory is fine. Before ~15–20k SKUs or multi-region latency needs, evaluate (with approval) SQLite/FTS or a hosted search — **not** introduced now.

---

## 9) Missing data and integration blockers

| Blocker | Owner / next step |
|---------|-------------------|
| Structured size/colour variants | Business + export pipeline |
| Authoritative `updatedAt` / price history for “newest” | Export |
| 108 missing product images | Media ops — do not generate fillers |
| 637 missing MOQ/dispatch/GST | Merchandising data cleanup |
| Occasion review-candidates | Human review before public use |
| Templated descriptions | Content rewrite approval |
| Authenticated catalogue admin | See architecture proposal below — **approval required** |
| Email/CRM quotation backend | Separate integration track |
| Paid search / DB | Approval required if scaling demands it |

### Catalogue management / admin (proposal only — not built)

- **Do not** ship a public unsecured admin.
- Preferred v1: CLI + validated JSON/CSV workflows in-repo (`catalogue:validate` / future `catalogue:diff`).
- If UI admin is needed later: Next.js route behind auth (Clerk/Auth.js or reverse-proxy basic auth) + **read-only** previews first; writes only to a staging export folder; promote via reviewed PR/deploy. Requires auth provider + secret storage approval.
- No unauthenticated write APIs.

### Image data architecture

| Concern | Model |
|---------|-------|
| Main image | First after sort: `role=MASTER` / `sortOrder` |
| Multi-angle | `ANGLE` (+ optional `LIFESTYLE`) |
| Order | `sortOrder` from export |
| Alt text | Export alt or `"{title} — image N"` |
| Future 360 | `role: SEQUENCE` reserved — no assets invented |
| Public URL | `/catalogue-media/...` via symlink |

---

## 10) Files modified and tests performed

### Files touched / added
- `src/data/catalogue/types.ts` — canonical model
- `src/data/catalogue/products.ts` — MOQ fix, images, colours/materials, quote honesty, cache clear
- `src/data/catalogue/exportPath.ts` — multi-path resolution + schema sniff
- `src/data/catalogue/query.ts` / `queryParams.ts` — budget, colour, material, richer search
- `src/data/catalogue/facets.ts` — colour/material facets
- `src/data/catalogue/taxonomy.ts` — **new** product-type / occasion IA
- `src/data/catalogue/index.ts` — **new** shared public API
- `src/app/api/catalogue/search/route.ts` — shared filter engine + pagination
- `src/app/gifts/page.tsx`, `CatalogueShell.tsx`, `catalogue.css` — budget/colour/material UX
- `src/app/gifts/[slug]/page.tsx` — dispatch timeline when known
- `src/lib/giftFinder/recommend.ts` — shared `verifiedUnitPriceInr`
- `scripts/catalogue-validate.mjs`, `scripts/catalogue-data-report.mjs` — **new**
- `package.json` — `catalogue:validate`, `catalogue:report`
- `docs/monkcraft-catalogue-data-audit-v1.md` — this report

### Tests performed
- `npm run catalogue:report` → 4,257 products, 0 duplicate SKUs
- `npm run catalogue:validate` → 0 errors; 108 image warnings
- `npm run lint` → **pass** (exit 0)
- `npm run build` → **pass** (Next.js 16.4.0 Turbopack; TypeScript OK)
- Confirmed MOQ mapping applies to **3,620** products after loader fix
- Confirmed primary images resolve on disk (0 missing of 4,149 with images)

### Explicitly not done (awaiting approval)
- Destructive re-import / mass overwrite of `products.json`
- Database, paid search, cloud media migration
- New npm dependencies (e.g. XLSX parser)
- Public admin UI
- Inventing/filling missing images, variants, or occasion tags

---

## Recommendation / checkpoint

1. **Approve** this data foundation as the catalogue source of truth.  
2. Git checkpoint after review.  
3. Optionally approve: symlink `src/data/catalogue/export` → website-export data for portable deploys; human review queue for 792 review-needed rows; content pass on templated descriptions.  
4. Defer Postgres/search until measured pain beyond ~10–15k SKUs or multi-instance cache invalidation needs.

**STOP for review.**
