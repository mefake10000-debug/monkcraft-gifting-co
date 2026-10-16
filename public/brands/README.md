# Catalogue brand marks

The homepage scroller includes every named brand in the 169-brand catalogue.
Brands with a locally verified logo use that asset; brands without one appear
as plain-text names until an official mark is collected. Each entry links to
that brand's products. Plain text is never presented as a logo.

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
