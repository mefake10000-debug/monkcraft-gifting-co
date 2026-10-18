# Catalogue Clarity Master Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Monkcraft website easier to navigate and act on from the first visit through sales follow-up by simplifying the homepage, connecting catalogue discovery and box building, preserving verified product facts, and clarifying quote intake and Company Store / Studio journeys.

**Architecture:** Keep the existing routes, product export and original media. Refine presentation and CTA hierarchy, remove the customization facet from customer filtering, make legacy customization-filter URLs harmless, simplify quote questions while preserving selected details, and improve page hierarchy. Validate each substantive change with a regression test before updating production.

**Tech Stack:** Next.js 16.4 App Router, React 19, TypeScript, Node test runner, CSS, existing catalogue JSON overlays.

**Spec:** `/Users/nishantparihar/.codex/attachments/c005fb28-ea2c-4ac2-8cf7-a410b3e7e4bd/goal-objective.md` and `/Users/nishantparihar/.codex/attachments/463bdbd5-5740-4910-8f5c-81bf66de6f3c/Pasted text.txt`.

## Global Constraints

- Preserve existing product titles, descriptions, SKUs, prices, specifications, images, and video assets.
- Do not claim product contents, size guidance, delivery guarantees, integrations, or customer proof without verified evidence.
- Keep the Catalogue and Build a Box in one discovery journey; packaging remains the distinct box step.
- Remove Gift Finder from primary navigation and retain existing route slugs.
- Keep Company Store film and four original walkthrough images visible.
- Internal research and audit artifacts remain excluded from production uploads.
- Follow the lead from source/landing page through discovery, brief, explicit contact handoff, team follow-up, quote and outcome; distinguish configured automation from manual work.

## Review Focus

- A legacy `branding` URL parameter must not keep applying a filter after Customisation is removed from the UI.
- A removed filter must not erase source branding details from product descriptions/specifications.
- Missing product photos and uncertain hamper contents must remain truthful and easy to identify.
- Catalogue filters and product actions must still work in the Build a Box context.
- Company Stores must have a clear page heading and direct demo entry point without hiding the original media.

---

### Task 1: Catalogue filter and product-detail clarity

**Files:** `src/components/catalogue/CatalogueFilters.tsx`, `src/components/catalogue/CatalogueShell.tsx`, `src/app/gifts/page.tsx`, `src/data/catalogue/query.ts`, `src/data/catalogue/queryParams.ts`, `src/app/api/catalogue/search/route.ts`, `tests/experience.test.cjs`.

- [x] Add regression coverage that the customer filter groups exclude Customisation, legacy `branding=` parameters do not alter product results or count as active filters, and branding options remain accessible on product details.
- [x] Run the targeted test and observe the expected failure.
- [x] Remove branding from filter definitions, facet responses, query application, query serialization, and API search. Keep the query type compatibility field only if required to safely parse older stored states, but normalize it to empty and do not expose it as a customer filter.
- [x] Run the targeted test and full test suite.

### Task 2: Product family and category audit

**Files:** `src/data/catalogue/colourFamilies.json`, `src/data/catalogue/designFamilies.json`, `src/data/catalogue/categoryOverrides.json`, relevant validators/tests, `docs/audits/`.

- [x] Generate read-only colour and product-family candidate reports and compare with existing approved family membership.
- [x] Inspect remaining unmatched candidates against exact source names, prices, specifications, and images. Add only groups supported by all available evidence; otherwise record the ambiguity in the audit.
- [x] Add a regression for each approved grouping and confirm a single verified colour is not stranded outside an otherwise matching family.
- [x] Run colour, design, category, SKU, and source-integrity validators.

### Task 3: Company Store entry point and Studio clarity

**Files:** `src/app/company-stores/page.tsx`, `src/app/company-stores/company-stores.css`, Studio surfaces only where audit evidence identifies a concrete usability defect, `tests/company-stores-landing.test.cjs`, `tests/studio-copy.test.cjs`.

- [x] Add tests for one page-level H1 and a visible early “Open company demo” link to `#company-demo`; preserve the video and all four images before the manager demo.
- [x] Run the targeted tests and observe the expected heading/link failures.
- [x] Add concise opening copy and a visible demo jump link with responsive focus/scroll behavior. Keep the manager proposal flow and avoid adding a separate employee-demo section.
- [x] Make only evidence-backed Studio simplifications; preserve its modes, routes, and catalogue selection behavior.
- [x] Run the relevant tests and inspect desktop/mobile layouts.

### Task 4: Homepage and full lead journey

**Files:** `src/app/page.tsx`, `src/components/WhatWeDo.tsx`, `src/components/Consultation.tsx`, relevant homepage CSS and tests, `docs/audits/`.

- [x] Keep the existing landing film, fallback poster, brand marks, and service images unchanged; shorten the first-screen copy and make the primary route clear.
- [x] Present Catalogue and Build a Box as one service choice, retaining the same images and direct entry points into the catalogue's box flow; keep Studio and Company Stores as distinct choices.
- [x] Make the homepage enquiry easier to complete: essential contact fields first, optional planning details as selections, optional notes, and retain catalogue/box selections in the prepared handoff.
- [x] Document the actual acquisition, attribution, lead intake, manual/automated follow-up, quote/order, and retention journey; list any unconfigured operational stages as gaps without claiming they work.
- [x] Add regression coverage before implementation and run targeted tests.

### Task 5: Release audit and deployment

**Files:** `docs/audits/full-review-2026-10-16/FOLLOW-UP-2026-10-17.md` and any new review-only audit note.

- [x] Record implemented fixes, remaining data limitations, full lead-journey map, and the evidence used in `docs/audits/full-review-2026-10-18/FULL-AUDIT.md`.
- [x] Run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, catalogue validators, and `git diff --check`.
- [ ] Deploy the QA-approved workspace to the already linked production project using `scripts/vercel-prod-deploy.sh`.
- [ ] Refresh Company Stores, Catalogue box mode, representative product detail, and key media on production; verify the same local routes return and render correctly.

Release deployment and production refresh are intentionally unchecked until their results are recorded after this audit.
