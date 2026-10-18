# Reviewed design families implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Group verified catalogue records that share the same product model but carry distinct artwork, while preserving each design's product record and selection data.

**Architecture:** Add a reviewed design-family overlay separate from the website export and existing colour-family data. Resolve families deterministically from stable product IDs, expose the variants to cards and product views, and show design thumbnails with each variant's own facts. A validation script rejects missing, duplicate, incomplete, mismatched, or image-less family members.

**Tech Stack:** Next.js App Router, TypeScript, JSON catalogue overlays, Node validation scripts.

**Spec:** This plan implements the user's request in this conversation.

## Global Constraints

- Source product IDs, names, prices, specifications, descriptions, images, and routes remain unchanged.
- Never merge based on title similarity alone; only curated, reviewed IDs may form a family.
- Each selected design retains its own description, images, SKU, price, availability, and specifications.
- Keep colour-family behaviour and the purple colour-count badge intact.
- Keep design choices visually distinct from colour swatches by using image thumbnails and design labels.

## Review Focus

- Missing or duplicate source IDs: validation fails before a family can be used.
- Same title but different artwork: each approved artwork remains a separate, labelled design choice.
- Similar titles but different price, core specifications, brand, or category: do not group.
- A design with no usable image: keep it outside the approved family.
- Search results matching one member: show one family card with the complete set of options.

## Audited pilot scope

Add six manually reviewed design families (31 records): Holi 750 ml sublimation bottles (MGC-0529–0534), Mindful 650 ml sublimation bottles (MGC-0535–0539), Yoga Vibes T-shirts (MGC-2281–2285), Mindful PixelPads (MGC-3971–3975), Yoga Vibes tote bags (MGC-3993–3997), and Yoga Vibes square acrylic coasters (MGC-3956–3960). MGC-0536 and MGC-0537 share a source title but have distinct, image-verified artwork; give them explicit disambiguating labels.

Do not group the generic acrylic coaster records MGC-0789–0792 as designs because their shapes and dimensions differ. Hold the Visionbook, mug, and pin-badge sets: current source images are generic, missing, or insufficient to confirm every advertised design.

### Task 1: Curated design-family data and validation

**Files:**
- Create: `src/data/catalogue/designFamilies.json`
- Create: `scripts/validate-design-families.mjs`
- Modify: `package.json`

- [x] Add reviewed IDs, family labels/codes, and unique per-design labels to JSON; add validation for IDs, duplicate membership, images, equal category/subcategory/brand/price, and consistent core specifications while allowing design-specific names and colours.
- [x] Add `catalogue:designs:validate`; it reports six valid families / 31 variants.

### Task 2: Catalogue resolution and family collapse

**Files:**
- Modify: `src/data/catalogue/types.ts`
- Modify: `src/data/catalogue/products.ts`
- Modify: `src/data/catalogue/query.ts`
- Modify: `src/data/catalogue/designVariants.ts`

- [x] Add design-family fields and a resolver; collapse approved design families once per catalogue result without changing the selected product record.
- [x] Review product resolution and validate the curated family data.

### Task 3: Card, quick view, and product detail selectors

**Files:**
- Modify: `src/components/catalogue/ProductCard.tsx`
- Modify: `src/components/catalogue/ProductGallery.tsx`
- Modify: `src/components/catalogue/ProductVariantExperience.tsx`
- Modify: `src/app/gifts/[slug]/page.tsx`
- Modify: `src/app/gifts/catalogue.css`

- [x] Render the approved design thumbnails in cards, quick views, and product details; switching updates the selected record in place, including image, description, code, price, and facts.
- [x] Review the final diff and re-run design-family validation.
