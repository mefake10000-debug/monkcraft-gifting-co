# Bulk Buyer Quote Journey Implementation Plan

> **For agentic workers:** Follow the implementation tasks below in order. Each task has a testable outcome and must preserve unrelated local work.

**Goal:** Give corporate buyers one simple path from selecting products (with or without a gift box) to reviewing and sending a trustworthy bulk quote request.

**Architecture:** Reuse the existing local shortlist and Box draft as the two selection modes, then reconcile them into a single quote snapshot and contact handoff. Keep channel delivery server-side and configuration-gated; treat catalogue GST verification as a separate provider boundary, not a client-side format check.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, existing CSS, localStorage drafts, current enquiry API and Node test runner.

**Spec:** `docs/implementation/bulk-buyer-journey-spec-2026-10-15.md`

## Global Constraints

- Quote request is not an online payment checkout or confirmed order.
- Product-only quote requests must not require Build a Box.
- Standard product quantity minimum is 25 units or a higher verified supplier MOQ.
- A built gift programme has a 25-kit minimum and 5 units per selected product per kit; supplier MOQ is checked against the programme total.
- Packaging can be left for Monkcraft to recommend and cannot silently block a quote.
- Email, WhatsApp, online delivery, and booking links must use verified configuration; never invent values or claim delivery without acknowledgement.
- GST format validation must not be called taxpayer verification. Do not collect/export customer data without clear purpose, notice, and a configured recipient.
- Preserve the Monkcraft palette, type, product photography, existing draft data, and user’s prior local changes.
- No new dependency without necessity; no online payment or inventory claim.

## Review Focus

- Supplier MOQ higher than 25: direct quote quantity starts at supplier MOQ; Box totals must show any remaining shortfall.
- In-progress quantity editing: blank/under-min input remains editable until blur/continue, then validation explains the minimum.
- Product-only buyer with no occasion/budget: can reach review and use the configured channel without building a box.
- Product-only and Box requests share the same dispatch and handoff fields and do not omit long product lists on WhatsApp/email.
- Missing production config: review still offers a clear copy fallback and never reports a send/booking as complete.

## Task 1: Make the standard product list a clear quote path

**Files:** `src/components/catalogue/ProductCard.tsx`, `src/components/catalogue/ShortlistView.tsx`, `src/components/SiteHeader.tsx`, `src/lib/shortlist.ts`, `src/data/catalogue/types.ts`, `src/lib/briefWorkspace.ts`, `src/components/catalogue/GiftingBrief.tsx`, `tests/experience.test.cjs`.

- [ ] Add tests proving a new standard quote line starts at `max(25, supplier MOQ)`; an existing selection persists and is editable; an empty occasion does not block a product-only quote; a product-only quote proceeds without a Box source.
- [ ] Use buyer language (“Add to quote”, “Quote list”, “Request a quote”) while retaining Box as a clearly optional path. Keep compare separate.
- [ ] Bring selected products and quantities into the quote review directly, without requiring company/occasion/budget fields that are not needed to start a bulk quote; mark optional context as optional.
- [ ] Ensure header selection count leads to the quote list and remains available on mobile.
- [ ] Run the focused tests, then `npm test`.

## Task 2: Simplify Build a Box and correct quantity handling

**Files:** `src/data/catalogue/boxTypes.ts`, `src/components/box/BoxBuilder.tsx`, `src/lib/box.ts`, `src/components/box/AddToBoxButton.tsx`, `src/app/gifts/catalogue.css`, `tests/experience.test.cjs`.

- [ ] Add tests proving `25 kits × 5 per product per kit = 125 programme units`, supplier MOQ is evaluated against programme total, packaging can be intentionally deferred, and blank/too-small quantity input is not silently reset while typing.
- [ ] Reduce the visible flow to three plain-language phases: choose gifts; set kit size and packaging; review and request a quote. Keep the data model migration-safe for existing local drafts.
- [ ] Default complete kits to 25 and each selected line to 5 units per kit; separate supplier MOQ from per-kit quantity and show any supplier shortfall plainly.
- [ ] Allow the buyer to request a box recommendation at review; do not force a speculative packaging choice.
- [ ] Run focused tests, then `npm test`.

## Task 3: Unify review, dispatch and final contact handoff

**Files:** `src/components/catalogue/GiftingBrief.tsx`, `src/components/box/BoxBuilder.tsx`, `src/components/conversion/ConversionChannels.tsx`, `src/lib/brief.ts`, `src/lib/box.ts`, `src/lib/enquiry/types.ts`, `src/lib/whatsapp.ts`, `tests/experience.test.cjs`.

- [ ] Add tests asserting that quote summaries and every handoff include all selected product lines, total quantities, box/package status, dispatch type/destination, and only supplied contact fields.
- [ ] Present one compact review panel and one dominant “Request a quote” action; collapse unrelated Studio/Store setup unless populated.
- [ ] Make Email and WhatsApp selection path-aware: require the channel’s needed contact only, not a work email for a WhatsApp handoff. Keep the copy fallback usable.
- [ ] Do not truncate silently. If a channel imposes a payload limit, state what is omitted and provide a complete alternate share path.
- [ ] Run tests and verify online delivery remains honestly gated when server configuration is absent.

## Task 4: Make integrations and catalogue access honest and ready

**Files:** `src/lib/contactConfig.ts`, `src/lib/enquiry/delivery.ts`, `src/app/api/enquiry/route.ts`, `src/components/catalogue/CatalogueBuilder.tsx`, `src/components/conversion/ConversionChannels.tsx`, `src/lib/enquiry/types.ts`, `src/app/api/catalogue-access/route.ts` (only if a genuine downloadable asset and approved verification provider are supplied), `.env.example`, `docs/conversion-enquiry-privacy.md`, `tests/experience.test.cjs`.

- [ ] Test booking links are HTTPS and absent values do not render fake booking; expose a direct “Book a call” action when a Google Calendar appointment schedule URL is configured.
- [ ] Catalogue access may claim “GST verified” only after a server-side lookup to an approved provider. A GSTIN syntax/check-digit pass may only say “format valid.”
- [ ] Keep request/download email delivery behind verified inbox/sender/API credentials and an explicit feature switch. Test the unconfigured response and never log customer GSTIN/contact.
- [ ] If the actual downloadable catalogue asset or provider credentials are unavailable, ship the safe request boundary and record those specific activation inputs; do not fabricate a PDF, GST verification, or successful delivery.

## Task 5: Responsive quality pass and production deployment

**Files:** relevant touched pages/components/styles; `scripts/launch-regression.mjs` if its expected delivery state changes; add browser checks only to existing tooling.

- [ ] Test mobile 320, 375, 390, 430px and desktop 768, 1024, 1440px for no horizontal overflow, overlapping controls/text, sticky coverage, and all critical states.
- [ ] Browser-check ordinary product → quote without Box, Build a Box → deferred packaging → quote, configured/unconfigured email/WhatsApp/booking, and restored drafts.
- [ ] Run `npm test`, `npm run lint`, `npm run catalogue:validate`, and `npm run build`.
- [ ] Deploy only after the full regression pass; verify the production alias and the actual deployed quote journey.

## External activation inputs (do not guess)

Production Vercel currently has no environment variables. Before live email/WhatsApp/Google Calendar delivery can work, set the documented verified inbox/sender and Resend key + enable flag, the WhatsApp Business E.164 number, and the Google Calendar appointment schedule URL. True GST registration verification requires the owner's selected approved lookup service and credentials, plus the actual catalogue file or asset to deliver. These are configuration inputs, not code defaults.

## Implementation status — 15 Oct 2026

- Product-only quote path is implemented: “Add to quote” → “Quote list” → review, with no Box, occasion, or budget requirement. New quantity defaults to 25 or the higher product MOQ; quantity entry is editable before the minimum is enforced on blur.
- Build a Box retains the accepted Products → Customize → Packaging → Review → Quote order, with 25 kits and 5 units per product per kit. “Recommend packaging” remains a valid deferred choice.
- Product and Box quotes carry the same dispatch choice (single-city, multiple delivery points, international, or to be confirmed). Phone-only contact is accepted for manual WhatsApp; online inbox delivery still requires an email address.
- Long WhatsApp previews now disclose omitted product lines and shortening; the complete quote remains available through the copy action.
- Verification completed: `npm test` (22 passing), `npm run lint`, `npm run catalogue:validate` (0 errors; 108 existing no-image warnings), `npm run build`; browser checks passed at widths 320, 375, 390, 768, and 1440 px with no horizontal overflow. Product-only quote and Box routes loaded without browser errors.
- Production deployment was issued and the alias returned HTTP 200 for home, catalogue, and quote routes. `/api/enquiry` confirms delivery remains unconfigured.
- Still requires owner-supplied activation inputs: verified enquiry inbox/sender and Resend credentials, WhatsApp Business number, Google Calendar appointment schedule URL, an approved GST lookup provider and credentials, and the actual catalogue asset. No GST verification, email delivery, WhatsApp send, booking, or catalogue download is represented as live until these are configured.
- Homepage brand strip now includes all 169 named catalogue brands: verified local marks where available, and plain black text labels for brands whose official mark has not been collected. White wordmarks that were unreadable on the light strip have contrast-safe black lettering variants.
- The updated “What we do” source is copied from `/Users/nishantparihar/Desktop/new updated what we do .mp4`; it is a 65-second portrait cut. Its matching poster is generated from the source video. The What We Do player keeps the full 9:16 frame on desktop and mobile without cropping. A distinct landscape export is needed for a true full-width 16:9 desktop cut.
