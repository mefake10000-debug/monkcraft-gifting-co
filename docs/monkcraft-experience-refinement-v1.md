# Monkcraft Experience Refinement v1

**Date:** 2026-10-15  
**Role:** Lead Product Design / Creative Direction / UX Engineering  
**Scope:** Platform-wide visual + journey refinement of the existing site  
**Constraint:** No invented merch/prices/testimonials; preserve hero v5 + category classifier; no major deps/deploy  

---

## 1. Before / after assessment

### Before
- Strong brand tokens existed, but **SiteHeader CSS lived only in `catalogue.css`**, so Company Stores rendered an unstyled sticky header.
- Primary nav was crowded (Gift Finder + My Brief duplicated as link + CTA).
- HeroNav and SiteHeader used **separate link lists** (drift risk).
- Section display type peaked at ~4rem — premium but occasionally oversized vs content density.
- Tool surfaces (Studio / Stores / Finder) were functionally honest but felt like parallel design systems (`.cs-btn`, one-off crumbs, header orphan).
- Homepage journey stopped at Gift Ideas → Consultation without a clear “how discovery becomes a brief” path.

### After
- Shared chrome: **site header + breadcrumbs + empty/loading/banner primitives in `globals.css`**.
- Unified IA: **Gifts · Build a Box · Studio · Company Stores · Contact** + Brief CTA; Gift Finder / My Brief as mobile utilities + footer/catalogue links.
- Homepage: clearer What We Do CTAs to real routes, Gift Ideas consistency, new **How it works** strip, restrained type scale.
- Breadcrumbs across catalogue tools, PDP (uses `filterCategorySlug`), Studio, Company Stores.
- Studio / Stores copy reinforces conceptual / demo limits; conversion honesty preserved.

---

## 2. Pages / features reviewed

| Surface | Routes | Status |
|---------|--------|--------|
| Homepage | `/` | Refined |
| Global nav | HeroNav + SiteHeader | Unified |
| Catalogue | `/gifts`, `/gifts/[slug]` | Refined chrome + crumbs + empty CTAs |
| Shortlist / Brief / Box / Finder | `/gifts/*` tools | Shared breadcrumbs + IA |
| Studio | `/studio` | Honesty copy + crumbs + type |
| Company Stores | landing, configure, preview | Header fixed; demo labelling kept |
| Consultation / FAQ / Footer | homepage + shared | Footer IA aligned |

---

## 3. Design-system improvements

- Tokens already solid (`--mc-*`); extended shared primitives:
  - `.mc-btn` variants (+ block)
  - `.mc-banner`, `.mc-empty`, `.mc-loading`, `.mc-breadcrumbs`
  - `.mc-surface-card`, `.mc-page-shell`, `.mc-tool-chrome`
- **Site header** moved to `globals.css` (all surfaces).
- Section display scale: `clamp(2rem, 4.2vw, 3.15rem)`.
- Company Store buttons aligned to shared button metrics/transitions.
- `src/lib/nav.ts` single source for primary / utility nav + active matching.

---

## 4. Nav / journey improvements

- Desktop primary matches brief: Gifts, Build a Box, Studio, Company Stores, Contact.
- My Gifting Brief remains the **single primary CTA** (no duplicate nav item on desktop).
- Shortlist appears in nav only when items exist.
- What We Do CTAs: catalogue / Studio / box / Company Stores (no dead “talk” as only action on featured).
- Homepage **JourneyStrip**: Discover → Shape → Brief with honest localStorage note.
- Breadcrumbs: Home → … on gifts tools, PDP category via `filterCategorySlug`, Studio, Company Stores.

---

## 5. Functionality problems found / fixed

| Issue | Fix |
|-------|-----|
| Company Stores `SiteHeader` unstyled (no catalogue.css) | Header CSS in globals |
| Homepage `ConversionChannels` used `.journey-btn` only defined in catalogue.css | `.journey-btn` (+ error/preview) hoisted to `globals.css` |
| Nav IA drift Hero vs Site | Shared `nav.ts` |
| Duplicate Brief in nav + CTA | Brief CTA only on desktop; utility on mobile |
| PDP category crumb without encode / empty slug risk | Encode + omit crumb if no slug |
| Catalogue empty actions weak | Gift Finder + consultation via `.mc-btn` |
| Catalogue filter pending felt stuck | `catalogue-shell--loading` + `aria-busy` while transitions run |

No catalogue classifier / `filterCategorySlug` / `productType` logic changed.

---

## 6. Incomplete / misleading features remaining (honest)

- Online enquiry delivery still `delivery_not_configured` until env/provider approved.
- Booking / WhatsApp CTAs gated on public env.
- Company Stores = **local demo** (no auth, payments, tenancy).
- Build a Box packaging = pending (`APPROVED_PACKAGING` empty).
- Studio PNG / browser PDF = conceptual, not print proof.
- Gift Finder = rule-based, not generative AI (already disclosed).
- Partner logo marquee correctly empty.

---

## 7. Missing assets

See `docs/monkcraft-visual-assets-needed.md` — still open:

- ~108 products without images  
- Approved packaging photography / SKUs  
- Verified partner logos  
- Optional Company Store scene art  
- Legal pages / public contact email  

What We Do still crops approved hero art for service media (honest; dedicated service photography would elevate).

---

## 8. Desktop / mobile verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass |
| `npm run build` | Pass (Next.js 16.4.0) |
| Browser smoke | Pass on production `next start` at `http://127.0.0.1:3456` |
| Desktop (`/gifts`, `/studio`, `/company-stores`) | Styled SiteHeader; lean IA; breadcrumbs; Studio honesty copy |
| Mobile (homepage) | Menu + stacked hero CTAs; approved hero v5 preserved |
| Follow-up from audit | `.journey-btn` hoisted to globals (homepage ConversionChannels) |
| Not fully click-through | Box packaging wizard, Studio logo upload+PNG, Store configure→cart |

---

## 9. Files changed (summary)

- `src/lib/nav.ts` (new)
- `src/components/Breadcrumbs.tsx`, `JourneyStrip.tsx` (new)
- `SiteHeader.tsx`, `HeroNav.tsx`, `WhatWeDo.tsx`, `GiftIdeas.tsx`, `SiteFooter.tsx`, `CatalogueIntro.tsx`, `CatalogueEmpty.tsx`
- `StudioShell.tsx`, `StoreAdminShell.tsx`
- Journey pages under `src/app/gifts/*`, `company-stores/*`, `page.tsx`
- `globals.css`, `catalogue.css`, `studio.css`, `company-stores.css`
- This document

---

## 10. Items requiring owner approval

1. Live enquiry / booking / WhatsApp channel values (`.env`).
2. Whether to commission dedicated What We Do / packaging photography.
3. Production Company Store (auth, payments, isolation).
4. Legal pages + public contact email for footer.
5. Any dependency / deploy / packaging-SKU catalogue work.
6. Optional: restore Gift Finder as desktop primary (currently mobile/footer/catalogue only).

---

## Prioritized backlog (post-refinement)

| Priority | Item |
|----------|------|
| P1 | Configure conversion env for real handoff |
| P1 | Packaging SKU data for Build a Box |
| P2 | Dedicated service imagery for What We Do |
| P2 | Further migrate `.cs-btn` / journey buttons fully onto `.mc-btn` classes in markup |
| P3 | Partner logos when verified |
