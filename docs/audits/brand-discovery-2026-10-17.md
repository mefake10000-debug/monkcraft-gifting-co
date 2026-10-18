# Brand logo and catalogue discovery check — 17 October 2026

## What changed

- Added the official Scott International and NOOE logo files without replacing
  any existing brand marks.
- Kept the existing Ooge logo and taught the logo check to recognize `.jpg` and
  `.jpeg` files.
- Changed homepage brand marks to use the catalogue's exact brand filter. This
  opens the brand's products directly instead of treating the brand name as a
  fuzzy text search.

## Product records already in the catalogue

These products are present with their existing IDs, images, descriptions,
specifications, and prices. I did not import duplicates from retail sites.

| Catalogue brand | Active product records | Examples already on the site |
| --- | ---: | --- |
| Greys & Blues | 75 | MGC-2909 AquaArmor Raincoat; MGC-2889, MGC-2891, MGC-2886 and MGC-2893 Round Neck Sports Jerseys |
| Scott | 187 | MGC-2989 Silver Jacket; MGC-2990, MGC-2991 and MGC-2992 Spectra Jackets; MGC-2997 Varsity Jacket |
| ShopNooe | 51 | MGC-0450 Bento Jot 2 Layer; MGC-0452 Bento Jot 3 Layer; MGC-0446 Bento Jot Dossier; MGC-0443 Dossier Mini; MGC-0442 Full Refill Pack |
| Ooge | 37 | MGC-1002 Beat 10 Earphones; MGC-1013 Blast Elite 80; MGC-1008 Blast Max; MGC-1011 Blast Pro; MGC-1012 Blast X |

The active counts reflect the site's current curation rules. The Greys & Blues
list already follows the requested restriction to jerseys and the raincoat.
The homepage logo links now use `brand=` filters so the catalogue can return the
full active brand set, including listings whose names do not repeat the brand.

## Source review and limits

- [NOOE official store](https://nooe.co/) lists products and colour choices;
  several of its current items, including Bento Jot and Hybrid sets, are already
  represented in the local product export.
- [Ooge official store](https://ooge.in/) has its own current catalogue. The
  current Monkcraft Ooge records remain the supplier-export records; retail
  prices were not copied into them.
- [Scott International](https://www.scottinternational.com/) publishes apparel
  ranges and catalogues, while the current Monkcraft Scott records retain their
  original catalogue data.
- Greys & Blues appears in a third-party supplier brand directory (source URL
  redacted), but I could not verify a brand-owned product site or official logo asset.
  Its products remain discoverable through the exact brand filter; no logo was
  fabricated.

## Colour handling

Existing reviewed colour families remain unchanged. I did not infer colour
variants from similar names: the ShopNooe source rows do not carry explicit
colour fields for several Bento Jot entries, and some images differ in included
pen or bundle details. Those rows need explicit source confirmation before
being grouped as colour options.
