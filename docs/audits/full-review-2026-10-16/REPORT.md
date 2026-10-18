# Monkcraft website audit and prioritized improvement plan

**Date:** 16 October 2026 (IST)  
**Scope:** current repository and the 16 October browser verification across the principal customer journeys.
**Goal:** make qualified corporate gifting enquiries easy to prepare and reliably deliver.

## Executive assessment

**Current assessed experience: 7.0/10.** This carries forward the 16 October post-implementation score, which reviewed the local production build and checked selected deployment routes. It is a heuristic score, not a conversion measurement, Lighthouse result, accessibility certification, or proof that the protected production deployment is publicly crawlable. The earlier 15 October review scored 5.5/10 before a set of catalogue, navigation, and quote-flow improvements; it should not be treated as the current score.

Monkcraft has a substantial foundation: a real product catalogue, occasion-led browsing, Gift Finder, Build a Box, favourites/shortlist, Studio previews, Company Store demos, a prepared gifting brief, and email/WhatsApp contact handoffs. The central customer journey is coherent: **discover → select → shape the programme → prepare a brief → contact Monkcraft**. The largest remaining business risk is that an online enquiry form is not configured to deliver to the team. The site correctly avoids claiming delivery succeeded, while direct email and WhatsApp links can still hand the buyer off.

### Scorecard

| Area | Score / 10 | Evidence and main gap |
|---|---:|---|
| Development and maintainability | 7.7 | Typed modules and route boundaries; large media/deployment archive remains costly to transfer. |
| Visual design and brand consistency | 7.7 | Distinctive brand system and original hero; some content artwork and catalogue media still need curation. |
| Navigation and information architecture | 7.5 | Four primary service destinations; quote hub was represented by a cart icon without an explicit accessible name. This audit clarifies that label. |
| Responsive usability | 7.5 | Nine principal routes return at 390×844, 768×1024, 1024×768, and 1440×1000 with no document-width overflow; browser emulation only. |
| Customer journey and content clarity | 7.2 | Discovery-to-quote path exists; clarify the difference between a prepared brief, a sent enquiry, and an approved order. |
| Application interactions | 7.0 | Useful selection and planning tools; catalogue, brief, box, Studio, and store state need continued cross-tool regression checks. |
| Integrations and delivery | 4.8 | Public email/WhatsApp handoffs exist; automated form-to-inbox delivery and payment are not configured. |
| SEO and measurement | 6.0* | Homepage canonical/share metadata and Organization JSON-LD are in place; sitemap and robots return 200. Social profiles, analytics, Search Console evidence, and public crawlability remain unverified. |
| Accessibility assurance | 6.2* | Pagination focus behavior and missing-photo labels are verified; no axe scan or screen-reader certification was run. |

\*Diagnostic estimates added for this report, not components of the prior 7.0 arithmetic score.

## Issue register

Effort: **S** small, **M** medium, **L** large. P1 should be addressed before scaling paid acquisition; P2 improves clarity, resilience, or organic discovery; P3 is polish.

| Priority | Finding and evidence | Impact | Recommended action | Effort |
|---|---|---|---|---|
| P1 | Automated enquiry delivery is off in the audited configuration. The status API reports delivery unconfigured; the app gates success claims and exposes direct contact handoffs. | A buyer may prepare a quote without creating a team-visible lead. | Configure an approved provider, verified sender, destination inbox, and delivery acknowledgement; run an authorized end-to-end receipt check before promoting online submission. Keep the truthful email/WhatsApp fallback until verified. | M |
| P1 | Quote brief, Box, Finder, Studio, and Store drafts have historically shown sync/clear conflicts in isolated probes in the prior audit. | Stale or conflicting requirements can reach sales and lead to an inaccurate quote. | Keep one canonical programme snapshot; reconcile source-owned values on update and unlink/reset; test update, clear, import, and recovery paths. | L |
| P1 | Delivery operations are not represented as a verified self-serve transaction; payment follows an approved quote, and Studio/Company Stores remain demos. | Visitors could mistake planning tools for live ordering or private commerce. | Keep demo and quote disclosures beside relevant actions; publish confirmed service scope, lead times, delivery coverage, and order steps only after business verification. | M |
| P2 | Header quote hub used a bag icon and screen-reader text “Cart,” although it opens the quote brief when empty. | Buyers and assistive-technology users may not understand the destination. | Clarify the control name as “My Gifting Brief” when empty and “Quote selections” when populated. Implemented in this audit. | S |
| P2 | Root metadata lacked explicit canonical and social share metadata; product pages already have unique metadata and Product JSON-LD. | Homepage links may render inconsistently on social platforms and duplicate URL variants are less explicit. | Add a homepage canonical, Open Graph/Twitter metadata, and minimal Organization JSON-LD. Implemented in this audit; production rendering still needs deployment verification. | S |
| P2 | No official social URLs are configured or could be reliably verified from the supplied project context. | Adding guessed profiles risks linking customers to the wrong company. | Add profile links after the exact official URLs are supplied and confirmed; use accessible platform labels and `rel="noopener noreferrer"` for new tabs. | S |
| P2 | Product-media directory is about 808 MB; five runtime products still lack verified photos. | Slower deploys and five visibly incomplete catalogue cards. | Source exact approved product imagery for the remaining five SKUs; assess CDN migration separately. | M/L |
| P2 | Responsive route matrix has browser-emulation coverage but no physical devices, axe scan, screen-reader pass, or Core Web Vitals field data. | Device-specific and assistive-technology issues may remain. | Complete physical-device/accessibility/performance review before claiming certification. | M |
| P2 | No production funnel analytics or Search Console evidence was available in the reviewed materials. | Marketing cannot prioritize channels or content from observed buyer behavior. | Add consent-aware analytics for catalogue search, product selection, brief start, WhatsApp/email handoff, and enquiry completion; connect Search Console and review query/impression data. | M |
| P3 | Catalogue has many products, and same-description variants may compete in a grid; some editorial content is embedded in artwork. | Discovery can feel dense and important copy is less accessible/searchable. | Curate category entry points, group near-duplicate variants where appropriate, and keep essential service copy as HTML text rather than image text. | M |

## Customer journey map

| Buyer intent | Best starting point | Current path | Audit direction |
|---|---|---|---|
| “I know what I need” | Homepage service card or Catalogs | Catalogue → filters/search → product → shortlist/brief | Keep catalogue search and filters prominent; show pricing/MOQ and customization constraints before the buyer commits. |
| “I know the occasion, not the product” | Gift Ideas or Gift Finder | Occasion → recommendations → product/shortlist → brief | Preserve occasion-first entry; make budget, quantity, and branding assumptions visible in recommendations. |
| “I need a coordinated kit” | Build a Box | Occasion/quantity → packaging → products → review → brief | Explain per-box quantities separately from supplier MOQ; make packaging state and all estimate caveats consistent in Box and Brief. |
| “I need branded merchandise” | Studio | Product → logo/preview → save or add to brief → contact | Keep preview labelled as a concept, and make the next quote action explicit. |
| “I need a private company store” | Company Stores | Service explanation → sample configuration/preview → enquiry | Clearly distinguish demo configuration from an active, authenticated, order-taking store. |
| “I want help now” | Header contact tools or footer | Call, email, or prefilled WhatsApp; online form only if delivery configured | Keep WhatsApp available in the existing contact menu and footer; verify inbox delivery before presenting an online form as submitted. |

## Roadmap

1. **Close conversion and trust gaps:** configure and verify enquiry delivery; regression-test brief reconciliation and reset/import behavior; publish no unverified operational claims.
2. **Reduce friction:** validate the quote CTA and contact handoffs on mobile; run the full route matrix; resolve high-severity keyboard, focus, contrast, and overflow issues.
3. **Build measurable acquisition:** connect analytics and Search Console; write substantive landing pages for corporate gifts, onboarding kits, festive gifting, branded merchandise, and company stores using verified product/operational details.
4. **Improve quality and speed:** source missing product photography, curate variants, and reduce deployment media weight; use field Core Web Vitals to prioritize.

## Changes made in this audit

- Added homepage canonical, Open Graph and Twitter card metadata, plus minimal Organization structured data.
- Renamed the header quote control for screen readers to describe the quote brief/selections it opens.
- Social links were not fabricated. WhatsApp, email, and phone handoffs already exist; the key remaining integration gap is verified automated enquiry delivery.
- Catalogue pagination now scrolls to the first result and moves keyboard focus to that product after a page/filter transition; empty results retain the results-heading fallback.
- Products without verified photos now show an accessible “Photo unavailable” marker. They remain after photographed items in the default category sort.

## Product photo follow-up

The current runtime catalogue has 4,257 records; the immutable source export has six empty image records. A separate runtime presentation overlay supplies one exact manufacturer image for MGC-1422; five products still have no verified photo. The archive contains 22,145 image files (about 808 MB); its 145 unlinked files and 18 unlinked product folders contain no exact match for these SKUs. Similar products were not substituted. The manufacturer listing and blue 14L image were verified for MGC-1422 and added without changing the source product record. Exact photos or approved artwork are still needed for the remaining five:

| SKU | Product | Status |
|---|---|---|
| MGC-1422 | Urban Gear Karbon Anti-Theft Backpack, 14L, Blue | Exact 1024×1024 manufacturer image recovered in a runtime-only overlay; source export remains unchanged |
| MGC-2027 | Urban Gear Techie Pouch Travel Digital Organizer, Grey | Exact image absent; supplier source page recorded, image use needs approval |
| MGC-2041 | Urban Gear TRVL SPA Travel Toiletry Pouch | Exact image absent; supplier source page recorded, image use needs approval |
| MGC-4078 | Custom-Made Affirmation Cards | Exact image/artwork absent; approved product artwork needed |
| MGC-4255 | Certificate With Frame CF-04 | Exact image absent; supplier photo needed |
| MGC-4257 | KN Trophies KN-816 | Exact image absent; supplier photo needed |

## Verification and limits

Next.js 16.4 local navigation and accessibility guidance was reviewed before the catalogue interaction fix. Lint, TypeScript, tests, catalogue validation, and production build pass for the workspace. Playwright checked `/`, `/gifts`, Gift Finder, Build a Box, Brief, Studio, Company Stores, Favourites, and Compare at all four requested viewport sizes; each returned 200, had no horizontal document overflow, and produced no page/console errors. Visible catalogue images loaded. Pagination Next changed the URL/products, returned scroll to the first result, and focused that result on desktop and mobile. Production deployment `dpl_GW7VtfktstzWxQBq6jRGnopynR3L` is READY and aliased to `https://monkcraft-gifting-co.vercel.app`; authenticated smoke requests returned 200 for the principal routes, sitemap, robots, and representative media. Vercel authentication protection remains enabled, so these checks do not establish public crawlability. Responsive checks are browser-emulated, not physical-device checks. The public Monkcraft site could not be fetched during this check and web search did not verify official social profiles. No successful inbox receipt or accessibility certification is claimed.
