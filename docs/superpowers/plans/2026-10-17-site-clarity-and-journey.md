# Site clarity and journey cleanup

## Guardrails
- Preserve catalogue records, product descriptions, prices/specifications, product imagery, videos, and brand assets. Do not delete or rewrite these source materials.
- Change only navigation, page structure, explanatory/context copy outside product descriptions, layout, and feature flows.
- Keep QA files and tests in development/docs; never render them on customer-facing routes.
- Preserve existing typefaces and typography system.

## Workstreams
1. Homepage and navigation: remove Gift Finder from primary nav and remove the homepage How It Works/JourneyStrip section; keep the Finder reachable through secondary navigation. Keep the home discovery path short through Catalogue, Build a Box, and service links; omit the separate occasion-card grid per the user's instruction that it adds unnecessary browsing.
2. Catalogue and Build a Box: connect product selection to the existing box draft and make packaging the key additional choice; remove redundant steps only where the flow supports it without changing product facts.
3. Studio: refine visual hierarchy and reduce explanatory copy without changing typography or preview assets.
4. Company Stores: make the manager-facing configurator/demo clear and compact, with employee preview nested as a presentation step.
5. Catalogue audit: review product grouping, variants, images, sizes, and hamper contents against exact source facts and images. Add or repair only image-reviewed colour/design/subcategory presentation metadata where the source confirms a like-for-like option. Preserve every source product record and its name, description, SKU, price, specification, and image; record uncertain/missing facts internally and do not guess.
6. Verification/review: run focused existing checks, inspect changed files, and perform an independent review. Keep all test artifacts internal.

## Acceptance
- Existing product data and media are unchanged by this work.
- Gift Finder no longer appears in desktop primary navigation.
- Homepage no longer renders the How It Works section.
- The primary discovery flow is understandable without reading long explanatory blocks.
- Existing QA and audit content is not rendered on public pages.
- Repository-only test suites, internal reports, and review work are excluded from the Vercel deployment package.
- Catalogue issues are reported with evidence and not silently “corrected” by guessing.
