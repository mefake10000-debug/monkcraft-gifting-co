# Catalogue brand logos (homepage marquee)

Drop **verified original brand logo files** here. Do not AI-generate, invent SVG wordmarks, or use product photos as logos.

## How to add logos (beginner)

1. Get the **official** logo file from the brand (or your licensed supplier pack) — SVG preferred, or PNG/WebP with a transparent background.
2. Rename it to match the brand’s **slug** below, for example: `portronics-logo.svg`
3. Put that file in this folder: `public/brands/`
4. Refresh the homepage. Matching brands switch from text name → real logo automatically. No code edit needed.
5. Check progress anytime: `node scripts/check-partner-brand-logos.mjs`

Accepted filenames per brand: `{slug}-logo.svg|png|webp` or `{slug}.svg|png|webp`.

## Inventory (2026-10-15)

| Metric | Count |
|--------|------:|
| Unique named brands in catalogue export | **170** |
| Products with no brand | 50 |
| Real partner logo files in this folder | **0** |
| Homepage strip candidates (top by product volume, excluding Monkcraft) | **20** |

Full brand list + product counts: `src/data/catalogue/export/brands.json`  
Homepage candidates + empty `logoSrc` slots: `src/data/partnerBrands.ts`

## Filename convention — top 20 homepage strip

| Brand | Drop this file into `public/brands/` |
|-------|--------------------------------------|
| Greys & Blues | `greys-blues-logo.svg` |
| Urban Gear | `urban-gear-logo.svg` |
| Scott | `scott-logo.svg` |
| Fuzo | `fuzo-logo.svg` |
| Oblique | `oblique-logo.svg` |
| Portronics | `portronics-logo.svg` |
| Fur jaden | `fur-jaden-logo.svg` |
| Power Plus | `power-plus-logo.svg` |
| Bioq | `bioq-logo.svg` |
| The Backbencher | `the-backbencher-logo.svg` |
| Swiss Military | `swiss-military-logo.svg` |
| Jack&Jones | `jack-jones-logo.svg` |
| ShopNooe | `shopnooe-logo.svg` |
| Offikraft | `offikraft-logo.svg` |
| Stolt | `stolt-logo.svg` |
| Hummel | `hummel-logo.svg` |
| Stellers | `stellers-logo.svg` |
| Ooge | `ooge-logo.svg` |
| Levis | `levis-logo.svg` |
| 3S | `3s-logo.svg` |

(`.png` or `.webp` also work if you use the same name with that extension.)

## Specs

- Height ~**64–80px** at 1× (supply @2× PNG/WebP if not SVG)
- Transparent background
- Official mark only (no mockups, no product shots)
- Do **not** put Monkcraft marks here — those live in `public/brand/`

## Behaviour

Until files exist, the homepage shows a **typography-only** scroll of real catalogue brand names (not fake logo shapes). When you add a matching file, the marquee picks it up automatically on the next load and shows the image with `alt` = brand name.

**You must supply:** verified logo files for the 20 homepage candidates above (and ideally the remaining **150** named catalogue brands if you want a fuller logo strip later).
