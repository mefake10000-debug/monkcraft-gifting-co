# MONKCRAFT DESIGN SYSTEM V1

**Status:** Approved documentation baseline  
**Company:** Monkcraft Gifting Co  
**Purpose:** Define the visual and brand system for the Monkcraft corporate gifting website before implementation.  
**Scope:** Documentation only. This file does not ship fonts, illustration assets, spacing tokens, or production CSS.

**Primary creative reference:** Hustlemad Website Re-Design (Corporate Gifting) 2023 on Behance (see `docs/design-references/`).  
**Intent:** Build an original Monkcraft identity with similarly polished, colourful, playful, illustration-led direction — not a copy of Hustlemad layouts, characters, or copy.

---

## 1. Brand identity summary

Monkcraft Gifting Co is a premium, India-focused corporate gifting platform. The brand should feel:

- colourful, playful, and premium
- clean, modern, and easy to navigate
- soft and rounded, with intentional art direction
- trustworthy for bulk ordering, personalization, and employee gifting stores

**Official identity anchors**

| Role | Token | HEX |
|------|--------|-----|
| Primary brand colour | Royal Purple | `#662F90` |
| Primary text / neutral anchor | Black Olive | `#3F3F37` |
| Core neutral | Anti-Flash White | `#F1F2F2` |

These three colours remain the official core brand palette. They must not be redefined or replaced.

**Website-specific palette extension (approved)**

Previous brand guidelines restricted palette expansion. For the website visual system only, a set of soft supporting colours is now approved (see Section 2). This is a deliberate, documented extension for backgrounds, illustrations, and marketing compositions. It does **not** change the official core colours or the broader brand-mark rules.

**What the brand must avoid**

- generic AI artwork
- stock lifestyle photography as the main visual language
- repetitive SaaS templates
- dull corporate stationery aesthetics
- childish low-quality cartoon styling
- inventing prices, product specs, inventory, testimonials, or business claims

---

## 2. Exact colour palette with HEX values and usage recommendations

### 2.1 Official brand colours (preserve exactly)

| Name | HEX | Recommended usage |
|------|-----|-------------------|
| **Royal Purple** | `#662F90` | Primary brand identity colour. Use for key brand moments, primary accents, selected CTAs, active states, and identity-forward marketing highlights. Remains the primary identity anchor. |
| **Black Olive** | `#3F3F37` | Primary text colour and neutral UI anchor. Prefer for body text, headlines on light surfaces, icons that need strong readability, and grounding UI chrome (e.g. strong buttons when purple is not required). |
| **Anti-Flash White** | `#F1F2F2` | Core light neutral for page canvases, large content areas, and calm breathing space between colourful sections. |

### 2.2 Approved website supporting colours

These colours are approved **specifically as a website visual-system extension** for soft pastel backgrounds, illustrated compositions, and marketing section colour-blocking. They support Royal Purple; they do not replace it.

| Name | HEX | Recommended usage |
|------|-----|-------------------|
| **Mist Lilac** | `#EDE3F5` | Soft purple-tinted section backgrounds; calm marketing bands that echo brand purple without competing with it. |
| **Sage Mint** | `#DCEDE6` | Fresh, uplifting section backgrounds; contact / support / “helpful” moments. |
| **Powder Blue** | `#E2F0F6` | Light sky-toned page or FAQ-style section backgrounds; catalogue ambient canvas when a tinted neutral is preferred over pure white. |
| **Warm Apricot** | `#F7E1D2` | Warm peach section fills; invitation / story / soft CTA environments. |
| **Buttercream** | `#F6EDCC` | Soft yellow service or highlight sections; cheerful but restrained colour blocks. |
| **Dusty Rose** | `#F2DDE2` | Gentle rose accents for testimonials, quotes, or secondary marketing bands. |

### 2.3 Colour usage principles

- Prefer soft pastel section backgrounds with **carefully controlled saturated accents** (Royal Purple and selective illustration colour).
- Sections may use different supporting colour themes while remaining coherent with Royal Purple + Black Olive + Anti-Flash White.
- Avoid dull grey-heavy layouts and overusing dark backgrounds.
- Use colour blocking intentionally (reference boards show clear section colour changes rather than noisy gradients everywhere).
- Product cards and discovery UI should stay cleaner: prefer Anti-Flash White / light neutrals with Black Olive text and restrained purple accents.
- **Accessibility note:** Contrast between text and background combinations must be verified before implementation. This document does **not** claim that any pairing meets WCAG or other accessibility standards without testing.

### 2.4 Pending colour decisions

- Exact button fill variants (purple vs Black Olive primary) per surface
- Hover / focus / disabled colour states
- Border and divider colours
- Dark-section rules (if any) and white-logo contexts beyond general logo guidance

---

## 3. Typography system

### 3.1 Approved website typefaces

**Fraunces** and **DM Sans** are the approved website typography direction.

Personality goal: playful, expressive, chunky editorial serif headlines (aligned with the Hustlemad Behance reference screenshots), paired with a clean sans for UI and reading. Keep the website sophisticated, premium, friendly, and readable.

| Role | Typeface | Status | Notes |
|------|----------|--------|-------|
| Hero headlines | **Fraunces ExtraBold / Black** | Approved website direction | Primary hero display voice — chunky, expressive editorial serif. |
| Section headings | **Fraunces Bold** | Approved website direction | Confident section titles across marketing pages. |
| Editorial accents | **Fraunces Italic** | Approved website direction | Occasional expressive accents only — not the default for all headlines. |
| Body text & product descriptions | **DM Sans Regular** | Approved website direction | Readable long-form and product copy. |
| Navigation, buttons & labels | **DM Sans Medium / Semibold** | Approved website direction | UI chrome with clear hierarchy and tap/click clarity. |
| Catalogue, Design Studio & Company Store UI | **DM Sans** | Approved website direction | Interface typeface for discovery and tool surfaces; keep friendly and highly readable. |

### 3.2 Previous brand-guideline specifications (superseded for website)

The following fonts were previously documented for website use and remain recorded as **historical brand-guideline / earlier V1 specifications**. They are **superseded** by Fraunces and DM Sans for the website:

| Previous role | Previous typeface | Status |
|---------------|-------------------|--------|
| Display headings | League Spartan Extra Bold | Previous specification — not the approved website direction |
| Editorial headline accents | Libre Baskerville Italic | Previous specification — not the approved website direction |
| Navigation & UI (proposed) | League Spartan regular / medium | Previous proposal — superseded; do not implement for website |

Preserve League Spartan and Libre Baskerville in brand history / guideline context as needed elsewhere; do **not** use them as the website type system going forward.

### 3.3 Hierarchy principles

- Hero and section headlines use Fraunces for a playful, chunky editorial serif personality.
- Use Fraunces Italic sparingly for expressive editorial moments.
- Body, product descriptions, navigation, buttons, labels, and tool interfaces use DM Sans for clarity.
- Maintain clear hierarchy: hero (Fraunces ExtraBold/Black) → section heading (Fraunces Bold) → optional italic accent → body (DM Sans Regular) → nav / buttons / labels (DM Sans Medium/Semibold).
- Overall tone: sophisticated, premium, friendly, and readable — never cold, generic, or hard to scan.
- Avoid cold, overly technical, or generic default stacks as the brand voice.

### 3.4 Explicitly not defined in V1

Do **not** invent the following until design decisions are approved:

- final font sizes (desktop / tablet / mobile)
- line heights and letter-spacing scales
- paragraph measure / max-width rules
- button label size and weight matrix
- exact Fraunces axis / optical-size settings (if used)

**Fonts must not be substituted or installed as part of creating or updating this documentation.** Font packaging and loading are a later implementation step after approval.

---

## 4. Logo usage rules

- Existing Monkcraft logo **geometry, colours, proportions, and orientation must not be modified**.
- Use **approved black logo variants** on light backgrounds.
- Use **approved white logo variants** on sufficiently dark backgrounds.
- Royal Purple remains the primary identity colour for brand moments around the logo; do not recolour the logo artwork outside approved variants.
- Clear space, minimum size, and lockup variants: **pending** (document once measured from approved logo files).
- Do not place the logo on busy illustration areas that reduce legibility.
- Do not invent new logo marks, wordmarks, or alternate geometries.

---

## 5. Illustration and visual composition rules

### 5.1 Art direction

Inspired by the Hustlemad reference (especially `docs/design-references/`), Monkcraft compositions should use:

- original Monkcraft artwork with sophisticated, colourful, playful **3D / cartoon** illustration direction
- soft pastel compositions with carefully controlled saturated accents
- bold editorial typography
- intentional floating objects
- expressive character illustrations (Monkcraft-owned, when approved)
- thoughtful graphic layering
- generous whitespace

Reference boards demonstrate: meditative / gesturing 3D characters, floating gift objects, speech-bubble callouts, highlighter accents, colour-blocked product tiles, and section-as-mini-poster storytelling. Monkcraft must create **original** equivalents — not reuse Hustlemad characters, props, or layouts.

### 5.2 Decorative language (allowed when intentional)

- playful blobs and soft shapes
- floating illustrated objects / icons
- 3D or cartoon-style character and object treatment where suitable
- light graphic accents (e.g. underlines, speech-bubble moments) used sparingly

Decorative artwork must feel high quality and purposeful. Prefer clarity when decoration hurts usability.

### 5.3 Product imagery (hard rules)

- Actual product displays must use **real Monkcraft product photos only**.
- Never fabricate product photos, prices, specifications, or inventory.
- Product sections may be visually rich, but product clarity comes first.
- Product cards should stay **cleaner** than marketing sections.

### 5.4 Illustration asset policy

- Custom illustrations must be **approved separately**.
- Do not generate or download illustration assets as part of implementing from this document alone.
- Until approved assets exist, build layouts so illustrations can be added cleanly later, and clearly label placeholders vs production-ready assets.

---

## 6. Design principles by surface

### 6.1 Landing (marketing)

- More expressive and illustration-led than tool surfaces.
- Strong illustrated hero with minimal, powerful copy.
- Clean brand / logo presentation.
- Simple “what we do” storytelling.
- Category / gift-idea discovery entry points.
- FAQ, testimonials (only with verified content), and a strong CTA for **Book a Call** / personalized gifting support.
- Each section should feel intentionally art-directed, like a mini poster, with generous whitespace.

### 6.2 Catalogue

- Clean, consistent, **discovery-first** interface.
- Visually designed but restrained background system (supporting pastels allowed; avoid clutter).
- Strong filters and category navigation.
- Prefer a neat product grid (e.g. three products per row on suitable desktop widths — exact breakpoints pending).
- Consistent card sizing; product detail interactions remain readable.
- Prioritize search, scanning, occasion / quantity / budget / customization discovery paths.

### 6.3 Studio / Catalogue Builder

- Professional, intuitive, and visually consistent with the brand.
- More tool-like than the marketing homepage.
- Still aligned with Monkcraft colour and type language.
- Must feel polished and trustworthy for building catalogues / packs.

### 6.4 Company Store

- Premium, clean, modern.
- Friendly and easy for employee use.
- Branded, but **not overly playful**.
- Emphasize clarity of browsing, selecting, and ordering.

### 6.5 Shared UI principles (all surfaces)

- Rounded components
- Restrained motion (presence and hierarchy, not noise)
- Readable layouts and responsive behaviour
- Soft, refined interaction states (exact shadow / radius / motion tokens pending)
- Never sacrifice usability for decorative artwork

---

## 7. Accessibility and responsive design considerations

### 7.1 Accessibility (requirements to verify, not yet certified)

- Prefer accessible colour contrast for text, icons, and interactive controls. **Test combinations** involving Royal Purple, Black Olive, Anti-Flash White, and each supporting pastel before shipping.
- Do not rely on colour alone to convey meaning (filters, errors, selected states need text or icon cues).
- Maintain visible focus states for keyboard users (**pending** token definition).
- Ensure tap targets and form fields are usable on mobile (**pending** sizing decisions).
- Decorative illustrations must not obscure essential content or reduce text contrast.
- Motion should be restrained; respect reduced-motion preferences when implementing (**pending** implementation detail).

This V1 document does **not** claim WCAG conformance for any specific colour pair or component.

### 7.2 Responsive design considerations

- Marketing heroes and illustration compositions must adapt from desktop to mobile without crushing copy or CTAs (reference homepage shows stacked mobile hero patterns).
- Catalogue: sidebar / filters and product grids must collapse gracefully; discovery must remain first-class on small screens.
- Studio and Company Store: prioritize task completion and readability over decorative density on mobile.
- Exact breakpoints, grid columns, and card dimensions are **pending design decisions** (do not invent a spacing or breakpoint scale in this document).

---

## 8. Open decisions to resolve before implementation

Resolve and approve the following before building production UI:

1. **Typography details** — final sizes, weights per role, and line heights for Fraunces (hero / section / italic accents) and DM Sans (body / nav / buttons / Catalogue / Design Studio / Company Store); confirm ExtraBold vs Black for heroes at real breakpoints.
2. **Font loading** — licensed sources, self-host vs CDN, fallback stacks (no install during documentation).
3. **Spacing scale** — page margins, section padding, card gaps (not defined in V1).
4. **Radius and shadow tokens** — rounded component values and soft shadow elevation (not defined in V1).
5. **Motion tokens** — duration, easing, which elements animate; reduced-motion behaviour.
6. **Component states** — hover, focus, active, disabled, error for buttons, inputs, filters, cards.
7. **Logo clear space / minimum size** — measured rules from approved logo files in `public/brand/` (or equivalent).
8. **Illustration commission / approval** — Monkcraft character set, floating objects, section art; placeholder policy until then.
9. **Product card content model** — which fields show (name, price visibility rules, badges); image aspect ratio; grid density per breakpoint.
10. **CTA colour policy** — when to use Royal Purple vs Black Olive for primary buttons.
11. **Accessibility verification** — contrast audit for text/UI on all approved backgrounds; interactive component audit.
12. **Content authenticity** — verified testimonials, client logos, and product data only; no invented claims.
13. **Reference vs production** — confirm which layout patterns from `docs/design-references/` are inspiration-only vs adapted into Monkcraft wireframes.

---

## Reference materials

| Path | Role |
|------|------|
| `.cursor/rules/monkcraft-core.mdc` | Business, trust, and development safeguards |
| `.cursor/rules/monkcraft-visual.mdc` | Visual direction and page-level intent |
| `docs/design-references/reference-01-colourful-art.png` | Colourful collage / illustration mood |
| `docs/design-references/reference-02-homepage.png` | Homepage hero and marketing tone |
| `docs/design-references/reference-03-catalogue.png` | Catalogue / discovery UI patterns |
| `docs/design-references/reference-04-sections.png` | Multi-section marketing compositions |

---

## Document control

| Field | Value |
|-------|--------|
| Version | V1 |
| Type | Design system documentation |
| Implementation | Not started from this file alone |
| Next step | Stakeholder approval, then resolve Section 8 open decisions |
