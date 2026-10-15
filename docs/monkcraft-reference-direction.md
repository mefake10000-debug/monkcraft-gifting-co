# Monkcraft Reference Direction

**Status:** Active design & product direction for implementation  
**Audience:** Agents and humans building Monkcraft surfaces  
**Last updated:** 2026-10-15

---

## 0. Behance → Monkcraft (what we apply)

Art direction only from the Hustlemad 2023 Behance redesign. Translated into Monkcraft — never a clone.

| Behance principle | Monkcraft translation |
|-------------------|------------------------|
| Chunky editorial display type | **Fraunces** ExtraBold/Bold for hero + section headlines |
| Clean UI / reading type | **DM Sans** for nav, body, buttons, catalogue & tools |
| Soft pastel colour blocks turning “pages” | Section backgrounds: buttercream → anti-flash → sage mint → powder blue → olive footer; accents in Royal Purple |
| Merchandise-led storytelling | Real Monkcraft product / approved scene photos; padded **contain** frames; **swag.com-quality** product presentation (see §1 Imagery split) |
| Poster-like / asymmetric section rhythm | What We Do stage + Gift Ideas bento (not equal SaaS card grids) |
| Generous whitespace + soft radii | Breathable section padding; rounded surfaces (`--mc-radius-*`) |
| Premium playful corporate gifting | Mature colour + type energy — no childish doodles/emoji art |
| Discovery-first catalogue personality | Filter rail + product grid as merchandise experience (swag.com presentation + UX patterns; Behance for UI colour energy only) |

**Explicitly not copied:** Hustlemad characters, illustrations, megaphone/mascot props, exact layouts, neon scribble treatments, copy, logos, or any proprietary assets.

---

## 1. Reference priority (strict)

| Priority | Source | Role |
|----------|--------|------|
| **1 — Merchandise & marketing imagery** | [swag.com](https://swag.com) | **Primary** benchmark for product photography presentation, merchandise compositions, category cards, storefront clarity, clean commercial product focus, and professional gifting e‑commerce imagery language. Also: category organisation, discovery, personalisation, Build a Box / consultation / company-store *patterns*. Never copy Swag artwork or brand. |
| **2 — Colour / editorial energy** | [Hustlemad Website Re-Design (Corporate Gifting) 2023](https://www.behance.net/gallery/203933419/Hustlemad-Website-Re-Design-%28Corporate-Gifting%29-2023) + local screenshots in `docs/design-references/` | **Secondary** — typography energy, pastel colour blocking, section rhythm, premium playful UI feel. Do **not** let Behance character, mascot, or collage layout language dominate asset briefs. |
| **3 — Business / category** | [hustlemad.com](https://www.hustlemad.com/) | Corporate gifting service language, kits, customisation, fulfilment, B2B enquiry framing for Indian buyers |

**Imagery split (mandatory)**

- **Merchandise and marketing imagery** (category tiles, What We Do art, product-led compositions, brief storytelling stills, storefront scenes): prioritize **swag.com-quality product presentation** — clean commercial focus, readable SKUs, soft studio light, professional gifting e‑commerce language — while **brand colours and type stay Monkcraft** (Royal Purple `#662F90`, Fraunces / DM Sans, official logo files).
- **UI colour / type / section energy:** Behance Hustlemad principles remain useful; they must not override merchandise presentation toward character-led collage.
- Approved homepage hero (`monkcraft-hero-v5.jpg`) stays final — do not replace, crop into other sections as a substitute for unique art, or regenerate.

**Rules**

- Never copy Hustlemad or Swag.com layouts, illustrations, characters, copy, or proprietary assets.
- Reinterpret principles into an **original Monkcraft** identity using the design system and official brand assets.
- Local files in `docs/design-references/` are offline colour/editorial references only — not a substitute for swag.com merchandise presentation quality.
- Catalogue / PDP / Build-a-Box selectable products: genuine Monkcraft product photos only; never invent SKUs or prices.

---

## 2. Design audit snapshot (homepage baseline)

### Matches desired direction

- Approved full-bleed hero (`monkcraft-hero-v5.jpg`) with merchandise-led art and a clear left type pocket
- Soft pastel supporting colours from the design system
- Expressive display headline ambition (pending Fraunces load)
- Brand logo marquee that stays hidden until real logos exist
- What We Do starts with numbered, colour-blocked storytelling

### Weak / generic risk

- Equal pastel service cards can read as a SaaS feature grid if repeated down the page
- System / Georgia font fallbacks undercut Behance-level editorial type
- Dead anchors (`#gifts`, `#studio`, etc.) break conversion trust
- No category discovery, enquiry path, FAQ, or footer → journey stops after “What We Do”
- Section rhythm is thin: hero → (gap) → one card grid → end

### Preserve

- Hero artwork, composition, and CTAs as quality benchmark
- Empty marquee behaviour
- Official purple / olive / anti-flash + documented pastels
- Honesty rules: no fake logos, testimonials, prices, or product grids

---

## 3. Visual principles (extract & apply)

1. **Expressive, oversized typography** — Fraunces for display; confident scale; DM Sans for UI and reading.
2. **Bold editorial hierarchy** — One clear job per section; eyebrow → headline → lede → action.
3. **Colourful, composed layouts** — Intentional colour blocks (buttercream, lilac, mint, powder blue, apricot, dusty rose) with purple accents; not grey SaaS chrome.
4. **Merchandise-led visuals** — Real Monkcraft product/scene imagery first; no stock lifestyle filler.
5. **Sophisticated playfulness** — Premium clay / pictorial energy without childish SVG doodles or emoji decoration.
6. **Asymmetry & rhythm** — Vary section structure (bento, featured band, horizontal discovery, split enquiry). Avoid repeating the same four equal cards.
7. **Section transitions** — Background and type shifts should feel like turning a page in one art-directed book.
8. **Confident CTAs** — High-contrast buttons; every primary CTA lands on a real destination on the page or a declared next step.
9. **Whitespace with intent** — Breathable, not sparse-empty or cramped.
10. **One brand memory** — Royal Purple + Fraunces + merchandise art should read as Monkcraft even without the nav.

---

## 4. Anti-patterns (do not ship)

- Generic SaaS card grids, pill-stat strips, and template hero overlays
- Childish cartoons, primitive SVG “illustrations”, random floating emojis
- Invented product photos, partner logos, testimonials, prices, or case metrics
- Dead CTAs presented as working integrations
- Dummy legal pages or fake catalogue inventory
- Aimless float animations; motion that ignores `prefers-reduced-motion`
- Reskinning Hustlemad / Swag.com layouts or copying their art

---

## 5. Interaction & journey expectations

**Homepage V1 journey**

1. Hero → understand Monkcraft + choose Explore or Consult  
2. (Optional) Brand strip when logos exist  
3. What We Do → services in a distinctive composition  
4. Gift ideas / categories → occasion-led discovery (not a fake 4,000-SKU grid)  
5. Enquiry / consultation → honest form or clear handoff  
6. FAQ → reduce B2B friction  
7. Footer → orientation + contact path  

**Functional honesty**

- Anticipate catalogue scale (clear category language, room for filters later) without pretending the catalogue exists.
- Forms must not claim “sent” unless a real channel exists; prefer copy-ready enquiry or configured `mailto` / booking URL.
- Studio / Company Store links may scroll to relevant homepage explanations until those apps ship.

**Motion**

- Use motion for hierarchy and presence (hover lift, accordion, menu) — not decorative orbiting objects.
- Respect `prefers-reduced-motion`.

---

## 6. Acceptance criteria (homepage milestone)

- [x] Approved hero preserved as visual benchmark  
- [x] Fraunces + DM Sans loaded and used for display / UI  
- [x] Brand marquee remains hidden without verified logos  
- [x] What We Do is distinctive (not a repeated equal-card template for the whole page)  
- [x] Category discovery is visually engaging and conversion-linked  
- [x] Consultation / enquiry path is clear and honest  
- [x] FAQ is useful for corporate buyers  
- [x] Footer + mobile navigation work  
- [x] Desktop and mobile layouts reviewed in browser when available  
- [x] `npm run lint` and `npm run build` pass  
- [x] No fabricated assets, testimonials, or dead “working” claims  

---

## 7. Asset & business dependencies

| Need | Blocks |
|------|--------|
| Verified client logos | Brand marquee content |
| Genuine testimonials | Testimonials section |
| Business email / WhatsApp / booking URL | True send / schedule integrations |
| Dedicated product / category photography | Richer category & catalogue surfaces |
| Live catalogue / Studio / Company Store apps | Deep links beyond homepage anchors |

Until these exist, ship the honest polished shell and call out the dependency.

---

## Related docs

- `docs/monkcraft-design-system-v1.md` — tokens, type, colour  
- `docs/hero-artwork-brief-v1.md` — hero art brief  
- `docs/monkcraft-image-overhaul-plan-v1.md` — image inventory + replacement batches (swag.com-primary merch imagery)  
- `.cursor/rules/monkcraft-visual.mdc` — always-on visual rule (points here for reference priority)  
- `.cursor/rules/monkcraft-core.mdc` — business & engineering safeguards  
