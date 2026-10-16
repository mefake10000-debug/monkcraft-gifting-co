# Homepage brand marks

The homepage marquee includes the 128 logo marks supplied by HustleMad's
public brand-logo feed, plus Monkcraft and retained catalogue/requested marks
that are not in that feed. HustleMad images are hosted locally in
`public/brands/hustlemad/`; each links to that brand's matching catalogue
search. Monkcraft's own mark links to the homepage. The imported names, paths,
and order are recorded in `src/data/hustlemadBrandLogos.json`.

## Add a logo

1. Obtain the logo from the brand's official site or licensed supplier pack.
2. Save it here as `{brand-slug}-logo.svg`, `.png`, `.webp`, or `.jpg`.
3. Register the path in `src/data/partnerBrands.ts` and add its source page to
   `SOURCES.md`.
4. Run `npm test` to verify the logo exists and the scroller link works.

SVG is preferred. Do not use product photos, AI-created marks, or low-resolution
screenshots as logos. White-on-transparent wordmarks may use a black text
contrast variant when needed on the light scroller background; preserve other
brand colors.

See [SOURCES.md](./SOURCES.md) for the current source record.
