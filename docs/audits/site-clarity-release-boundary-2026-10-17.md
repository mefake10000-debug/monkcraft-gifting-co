# Site clarity release boundary and verification — 2026-10-17

## Customer-facing scope

This pass changes navigation, context, responsive layout, and the presentation of fields already present in the catalogue export. It does not rewrite, replace, delete, or synthesize product names, descriptions, SKUs, prices, catalogue images, or video assets.

Confirmed implementation details:

- Catalogue pagination creates browser history entries, so Back/Forward can return between page selections.
- Product quick-view focus returns to the exact button that opened it.
- Build a Box stays in a single-column layout until its summary sidebar is actually displayed at 1200 px.
- Source-provided country of origin, provenance, customization type, and dispatch timeline are retained as specifications where present; supplier URLs and import/sync metadata remain filtered.
- Source dispatch values are exposed as a specification only where an explicit dispatch-timeline specification is absent.
- Six products still have empty image arrays in the immutable source export; an exact manufacturer photo for MGC-1422 is provided through a separate runtime presentation overlay. The remaining five are clearly marked; no similar or generated photography is substituted.
- Existing source product records remain unchanged. Reviewed colour/design families and physical-type overrides are separate presentation metadata; they do not replace product names, descriptions, prices, specifications, SKUs, or image paths.
- Apparel size links appear only for official, verified brand guides (Columbia, Reebok, and UCB). Scott International's current site does not provide a working chart-download URL, so no Scott size-guide link is shown.
- Direct access to every internal `/ops/*` desk requires a signed session. Those routes send `noindex` metadata. The daily production automation cron is not part of this clarity release.

## Repository-only material

Automated QA, internal audit notes, research snippets, supplier provenance, review CSVs, and review plans belong in the repository for maintenance. `.vercelignore` excludes `tests` and `docs`. The deployment staging script retains only the five catalogue exports used at runtime (`products.json`, `gifting-segments.json`, `categories.json`, `brands.json`, and `taxonomy.json`) and checks for leakage before upload. Internal files remain in source control so later changes can be checked against the product-preservation boundary.

## Source integrity

The parity test compares all 4,318 source product records against runtime catalogue records, including identity, names, descriptions, summary, source image paths/order, SKU, source MOQ, unit price, GST basis, and quote-on-request state. Current media audit confirms all 22,055 referenced image files exist; 4,312 records have at least one source image and six have no image records. One separately documented exact image override now serves MGC-1422; the other five remain photo-unavailable.

The image-reviewed presentation metadata now covers 450 colour families and 36 design families (314 design options). Ambiguous groups, duplicate SKUs, and records with conflicting specifications remain separate. QA and review files stay in the repository and are excluded from the deployment package.

## Verification

- `npm test`: 146 passing.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm run catalogue:validate`: zero errors; six missing source-image warnings and eleven quote-on-request records are retained as source conditions. The exact MGC-1422 presentation override is validated separately.
- `npm run catalogue:colours:validate`: 450 reviewed families passed.
- `npm run catalogue:designs:validate`: 36 reviewed families passed.
- `npm run build`: passed.
- Local browser check: mobile homepage, catalogue, and Columbia apparel detail rendered at 390 × 844; catalogue pagination and browser Back were checked in the earlier release pass. A no-cookie direct request to `/ops/leads` redirects to `/ops` sign-in.

## Deliberately not inferred

Unmatched product photographs, unclear colour-family candidates, and unsupported size charts or hamper contents remain unresolved until exact source evidence is available. No external promises about delivery, availability, or product composition were added.
