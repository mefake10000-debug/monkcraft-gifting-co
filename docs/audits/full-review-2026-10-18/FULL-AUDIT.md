# Monkcraft full website audit

**Review date:** 18 October 2026 (IST)  
**Scope:** customer-facing website, catalogue and product data, lead journey, Company Stores manager demo, Studio, responsive behavior, accessibility basics, SEO plumbing, media integrity, and release readiness.  
**Status:** This was the earlier audit pass. It is superseded by [the rerun and production release record](./RERUN-2026-10-18.md), which documents the follow-up fixes and live smoke checks.

## Executive summary

The site now has a clearer first choice: browse gifts (with Build a Box inside that catalogue journey), create a branded catalogue in Studio, or discuss a Company Store. The detailed product source export and original photography/video were preserved. Three independent review tracks covered landing/lead journey, catalogue/box/data, and Company Store/Studio; observed defects were fixed where they could be corrected without inventing business facts.

The main release blocker is operational: local enquiry storage is not configured. `GET /api/enquiry` reports storage unavailable, and a valid form submission returns a clear 503. Email and WhatsApp remain direct user-initiated fallbacks; this is not automated delivery. Production configuration and inbox receipt must be confirmed before treating online lead capture as live.

## Scores

Scores are practical review ratings, not a WCAG certification or measured analytics score. Higher means the user-facing experience is in better shape.

| Area | Rating | Evidence and remaining concern |
|---|---:|---|
| Navigation and information architecture | 8/10 | Three primary routes are clear; Build a Box starts from the catalogue and returns to the box review step. All main routes opened at four viewport sizes. More first-time user observation is still needed. |
| Desktop and responsive layout | 8/10 | 13 routes × 4 viewport sizes (390×844, 768×1024, 1024×768, 1440×1000): no document-width overflow or failed visible image requests. This is browser emulation, not physical-device QA. |
| Catalogue discovery and box builder | 8/10 | Pagination changes products and URL, focuses the first result, and browser Back restores the prior results. Box selection remains in the draft. Missing images are explicit. |
| Product data integrity | 9/10 | 4,318 unique SKUs/slugs; source descriptions and product facts parity checked. 4,312 source rows have images and 11 have no verified fixed price; these remain marked unavailable/quote-only. |
| Homepage clarity and content | 7/10 | Shorter opening message, distinct service choices, and one clear primary direction. Some lower-page content remains long and needs customer comprehension testing before further deletion. |
| Company Store manager demo | 8/10 | Manager demo is the main experience; employee preview sits within its presentation step. Original film and four walkthrough images remain visible. Step navigation now moves focus to the new heading. |
| Studio usability | 7/10 | Step state is announced, heading focus is managed, empty import feedback is inline, and product selection uses page scrolling on mobile. Complex modes still merit moderated usability testing. |
| Accessibility fundamentals | 7/10 | Keyboard pagination/focus, labels, accessible missing-image state, inline errors, reduced-motion-aware step focus, and active step semantics were inspected. No automated WCAG audit, screen-reader certification, or full contrast measurement was performed. |
| SEO technical plumbing | 7/10 | Canonical metadata, sitemap, and robots routes are present and return 200 locally. Search visibility, structured-data validation, indexing, and Search Console data were not available. |
| Performance and reliability | 6/10 | Production build succeeds and referenced local catalogue media resolves. No representative-device Core Web Vitals, load test, or production cache/CDN analysis was performed. |
| Conversion and lead operations | 5/10 | Short lead form and selection context improve intent capture; local durable storage is not configured, so online submission cannot complete. |
| Integrations and social proof | 4/10 | WhatsApp is a user-initiated handoff, not a verified provider integration. Official social URLs and analytics evidence are not configured/verified. |

## Customer journey map

```text
Homepage / campaign landing
  ├─ Browse gifts → search/filter/product detail → add to brief or box
  │    └─ Build a Box context → choose catalogue items → packaging/review → quote
  ├─ Studio → choose catalogue/branding mode → build preview → prepare brief
  └─ Company Stores → manager demo → define collection/credits/delivery → employee preview
       └─ Discuss programme

Any selected intent → concise contact details → optional programme selections
  ├─ Email handoff (user sends)
  ├─ WhatsApp handoff (user sends)
  └─ Website submission → currently blocked locally until durable storage is configured
       → then human sales review, quote, approval, order, fulfilment, customer care
```

The site must not imply that a quote is delivered, a WhatsApp message is sent, an employee order is live, or shipment tracking is integrated unless the corresponding service is configured and verified.

## Confirmed fixes and checks

- Simplified the homepage service hierarchy and grouped Catalogue with Build a Box.
- Kept the original homepage assets, product records, descriptions, and Company Store media.
- Added catalogue pagination to the box picker; live browser check verified URL/product/focus/scroll and Back behavior.
- Removed Customisation from catalogue filtering while retaining product customization facts in product details.
- Added visible missing-photo handling; exact-match imagery only, no generic substitutions.
- Kept source catalogues immutable and validated product data overlays.
- Fixed Company Store route-step focus and Studio step/focus/import/mobile-picker issues.
- Corrected the active logo audit so it checks only the actual homepage marquee; 55/55 linked assets resolve. The requested removed brands do not appear in the active list.
- Corrected the launch regression check so it respects storage readiness and never creates a synthetic valid lead when storage is enabled.
- Checked 13 customer routes at four widths: 52 route/viewport combinations; no document-level horizontal overflow, failed visible images, or missing expected page headings in the inspected browser.
- Local robots and sitemap routes return HTTP 200.

## Catalogue and media exceptions

- Six source records have no source image: `MGC-1422`, `MGC-2027`, `MGC-2041`, `MGC-4078`, `MGC-4255`, `MGC-4257`. The runtime exact-image overlay for `MGC-1422` should have its rights/provenance confirmed; the other five remain explicitly photo unavailable.
- Eleven source records have no verified fixed INR price and remain quote-only.
- Three seasonal décor records remain in `Other`; the taxonomy owner should confirm placement rather than guessing.
- Binge Kit contents remain unexpanded because the source material did not verify contents.
- A direct path integrity scan found all 22,055 referenced catalogue media files. Six products lack image records; these are separate from missing files.
- Source product titles, descriptions, SKUs, prices, specifications, MOQ, and image paths remain parity-checked. Presentation overlays do not rewrite those source facts.

## Prioritized open items

### Critical before online quote intake is called live

1. Apply/review the Supabase migrations and configure production server-only connection credentials. Configure and test durable enquiry storage, idempotency, and notification/retry paths. Confirm the enquiry appears once in the authorized sales system and that a customer confirmation is truthful.
2. Confirm the production Vercel environment is configured and run a controlled test enquiry with the business owner; local configuration currently reports storage unavailable.

### High priority

3. Confirm official contact address/telephone, WhatsApp destination, and official social profile URLs. Do not add guessed social destinations.
4. Source exact photos and usage permission for the five remaining missing-image SKUs; confirm rights/provenance for the MGC-1422 overlay.
5. Confirm whether the three seasonal décor products belong in a dedicated category.
6. Agree supported delivery regions, typical lead times, employee-address handling, and fulfilment commitments before adding operational promises to the site.

### Next improvement cycle

7. Run moderated first-visit sessions with people unfamiliar with Monkcraft; measure whether they can choose a service, find products, create a box, and start a quote without coaching.
8. Perform real iOS/Android Safari/Chrome checks, keyboard-only review, screen-reader review, and measured color-contrast audit.
9. Add consent-aware analytics and monitor campaign-to-lead completion; review Core Web Vitals and production search data.
10. Verify structured data and canonical/indexation in Search Console and a schema validator.

## Verification record

- `npm test`: 164/164 passed.
- `npm run lint`: passed.
- `npx tsc --noEmit --pretty false`: passed.
- `npm run build`: passed; 180 app routes generated.
- `npm run catalogue:validate`: 4,318 products, 0 errors; warnings reflect the six source photo gaps and 11 unpriced records.
- `npm run catalogue:descriptions:validate`: 22 reviewed summaries validated against 4,318 source records.
- `npm run catalogue:colours:validate`: 450 reviewed families passed.
- `npm run catalogue:designs:validate`: 36 reviewed families / 314 variants passed.
- `npm run brands:logos`: 55/55 active logo assets found.
- `npm run launch:regression`: 5/5 passed against local `127.0.0.1:3000`; storage-unconfigured fallback was confirmed.
- `git diff --check`: passed.
- Browser emulation: 52 responsive route/viewport checks plus targeted catalogue pagination and Company Store/Studio inspection.
- Local refresh smoke: HTTP 200 for `/`, `/gifts`, box-context catalogue, `/gifts/box`, `/gifts/brief`, `/studio`, `/company-stores`, employee showcase, representative product detail, `/robots.txt`, and `/sitemap.xml`.
- Production upload was attempted through the existing deploy script, but Vercel returned `Not authorized`. The CLI session has a signed-in account, but the linked team/project refused deployment. No successful deployment or post-deploy refresh is claimed; retry after restoring deploy permission for the linked `monkcraft1` project.

## Audit limits

This review uses the local repository, local dev server, browser viewport emulation, and configured CLI checks. It does not establish production inbox delivery, production data correctness, traffic/search performance, legal compliance, accessibility certification, shipping coverage, or customer satisfaction. The production release smoke check remains pending because the deployment was denied.
