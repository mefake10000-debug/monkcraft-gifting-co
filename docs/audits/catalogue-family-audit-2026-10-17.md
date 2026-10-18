# Catalogue product-family review method

## Purpose

Find products that may be the same base item with a different colour, artwork, size, shape, or number. The report is a review queue only; it never changes catalogue data or approves a group automatically.

## Run the review

```sh
npm run catalogue:families:review
npm run catalogue:families:review -- --brand Monkcraft
```

The first command scans the active catalogue; the second narrows the queue to Monkcraft while that brand is being cleaned up.

Each suggested cluster must be checked against the source title, exact price and tax basis, category and subcategory, product specifications, and every available product image. Similar wording alone is not enough. A price mismatch, a meaningful specification conflict, an unclear source image, or a mismatched product type keeps the records separate until resolved.

## Approval sequence

1. Confirm the records describe the same base model.
2. Confirm every shared fact and exact price; identify only the field that is meant to vary.
3. Inspect the images and assign a concise, source-grounded option label.
4. Add the existing product IDs to one reviewed family record. Keep each record's own name, SKU, price, stock, specifications, and images.
5. Run `npm run catalogue:designs:validate` and `npm run catalogue:colours:validate` before publishing.

Use colour families only when the product is the same and only its colour changes. Use design families for artwork or meaningful configuration choices. Families with size, shape, or number choices set `optionLabel` so the catalogue says “options” with an accurate descriptor rather than calling every variation a design. If the source Color field is blank but the source title and image clearly confirm the colour, record a reasoned, product-ID keyed override in `src/data/catalogue/colourLabelOverrides.json`; never infer the label from a similar product.

## Confirmed additions in this review

- Added the missing Sparkle coaster to the reviewed 4-inch coaster group after checking its 9 × 9 cm specification, acrylic-with-foam material, ₹155 price, category placement, and product image.
- Added three Diwali artwork variants to the ₹195, 9 cm acrylic coaster group. Their source dimensions, material, category, price, and photos match that coaster model.
- Added four acrylic coaster shape/size records as one family. The photos show the same coaster type, all four prices are ₹195, and each option label states the source-listed shape and size.
- Added the A5 framed certificate to the ₹365 certificate family. Its photo shows the same framed certificate product type, and its material, category, and exact price match the two A4 frame options.
- Grouped numeric trophies by the source-listed number within their exact price tiers: 5 and 10 at ₹1,155; 15, 20, and 25 at ₹1,495. The two price tiers stay separate.
- Grouped the 4 × 4 cm and 6 × 6 cm lapel pin records into separate families. Each pair has the same price, material, category, and product images; the source titles distinguish standard and magnetic backing.
- Made the selector wording specific: frame records say “size and frame options”, trophies say “number options”, and the new coaster group says “shape and size options”.
- Added Sky Blue as a reviewed colour label for the basic nylon lanyard only because the source title states it and the image confirms it; joined it to the existing seven verified colour choices.
- Completed three partial families after checking source titles, exact prices/specifications, and the product photos: Scott AWG Solid Polo (MGC-2563–2573, including MGC-2566), Scott Spark Polo (MGC-2618–2620), and American Tourister Trot 3.0 STY 02 32L backpack (MGC-1284–1286). Source product records and photos remain unchanged; source title wording is used for the two multi-tone display labels.
- Completed apparel families that had source-verified colours hanging outside the selector: Scott AWG Giza Black (MGC-2610), Scott Cotton Crop Top White (MGC-2535), Scott Shimmer Black with Turquoise Blue Tipping (MGC-2554), and the nine confirmed Scott AWG Green Polo New colourways. The duplicate Scott SKU MGC-2587 remains out of the selector.
- Completed eight image-reviewed apparel families from Columbia, Greys & Blues, Reebok, and UCB, including all confirmed Joy Peak II, Easy tee, DES-Jacq, Jet-Setter, Reebok Waffle, Reebok Cotton-Lycra, and UCB polo colourways. Source spelling differences are recorded as family-specific exceptions; source text itself is unchanged.
- Completed Monkcraft canvas tote and Snapdot badge families that had verified designs left out, and added five image-reviewed design families for canvas totes, Earth Day fridge magnets, PixelPads, FlexiMats, and Holi PixelPads. Six previously dangling tote designs and four badge designs now appear alongside the other options.
- Corrected physical-type classification where “Plant a Tree” is artwork text on a tote or PixelPad. The product remains under its actual tote or stationery browse path.
- Catalogue cards now keep colour/design choices inside the currently filtered product set, so selecting another swatch cannot escape an active colour or budget filter.

## Current checks

- 36 reviewed design families covering 314 product records.
- 450 reviewed colour families validated against the 4,318-record source export, including the lanyard's explicit title-based Sky Blue label and the newly completed apparel options. This count was refreshed on 2026-10-17.
- The review command still reports unmatched candidate clusters. Those are deliberately left ungrouped until the full evidence and images are reviewed; some clusters contain conflicting dimensions, incomplete images, or different models.
- Five products remain without exact product photos: MGC-2027, MGC-2041, MGC-4078, MGC-4255, and MGC-4257. MGC-1422 has an exact manufacturer photo in a runtime-only image overlay; the original source record remains unchanged.
- Source dispatch values containing the literal `$undefined` are omitted from public specifications. Source exports remain unchanged; confirmed dispatch timelines continue to display.
- All 22,055 image paths referenced by the source catalogue resolve to a local media file; six source records contain no image entries. One of those, MGC-1422, is covered by an exact, separately tracked runtime image overlay.
- Hamper descriptions stay as supplied. The MGC-3516 Binge Kit image is not reliable evidence of its complete contents, and no itemized source list was found in the catalogue export; do not add named contents until Monkcraft confirms them.
