# Monkcraft product editorial workflow

## Product identity and category

- The source MGC/SKU is the canonical product ID. Keep it unchanged in editorial records and operational references.
- Each color-specific SKU remains an individual product. Color-family relationships are stored separately.
- Track category as the source category code and subcategory slug; display readable category and subcategory names separately.
- For a new product, record its category path and facts, then check the export and editorial records before assigning the next available MGC/SKU. Never derive an ID from category or color.

## Inspect before writing

1. Open every image for the product: master, angle, lifestyle, detail, and sequence. Record the filenames reviewed and the visual evidence. Do not infer a material, feature, color name, or construction from an ambiguous image.
2. Read the product title, source description, category, brand, specifications, attributes, and linked color records.
3. Complete `evidence-sheet-template.md` before drafting. Keep image observations separate from source-verified facts and note disagreements or missing evidence.
4. Draft only from the reviewed evidence. If images are missing or fields conflict, flag the record and leave the existing customer copy in place until resolved.

## Monkcraft description standard

- Keep the existing product identity and meaning. Refine wording with a light edit; do not invent a new product story.
- Lead with the item named in the heading: the frame, clock frame, miniature, or other product being sold. Describe its form and character first; mention the certificate, photo, or scene as supporting detail.
- Use a warm, considered, quietly premium voice. Keep sentences definite, clean, concise, and easy to picture.
- Describe visual details only when seen in the reviewed images. Use materials, dimensions, functions, and features only when verified in catalogue fields.
- Do not recommend an occasion, recipient, use case, or when/where to give the product. Avoid generic praise, price adjectives, SEO filler, and unsupported quality, sustainability, performance, stock, or delivery claims.
- Keep MGC/SKU, category labels, product names, and specifications out of rewritten prose unless needed to describe the product accurately. Existing structured fields remain the source of truth.

## Color-family process

- Run `npm run catalogue:colours:candidates` to emit a review-only report. It lists the shared name keywords, non-colour specifications, each colour, and each price. Matching is discovery assistance, never proof of a variant relationship.
- Compare candidates side by side: name keywords, brand, category path, all non-colour specifications, price and currency, and every product image. Confirm they are the same underlying product and differ only by colour. Reject groups with distinct artwork, construction, shape, size, or other meaningful differences, even when the source title matches.
- Create a family entry in `../colourFamilies.json` only after review. Keep each member's canonical MGC/SKU as its operational product ID. Give the family one stable `familyCode` in the `MGC-FAM-###` format; display it with the exact catalogue colour in brackets, such as `MGC-FAM-035 (Green)`. Assign the next unused family code; never renumber existing codes.
- Every family must have a unique family ID and family code, at least two distinct product IDs, one unique non-empty catalogue colour per product, matching name keywords/brand/category path/non-colour specifications/price/currency, and both `reviewed: true` and `imageReviewed: true`.
- Run `npm run catalogue:colours:validate` before review/publish. Any duplicate, missing color, mismatched record, or unresolved image/detail conflict blocks customer-facing grouping.
- Only reviewed family links produce colour counts or selectors. The count covers all verified colour choices; stock status is shown on the individual colour option. Candidate reports never publish, and omitted/unreviewed families remain individual products.

## Review and publishing

`product-descriptions.json` is the approved customer-facing description overlay, keyed by product ID. It does not alter the source product export or names. `factRefs` records textual catalogue evidence; image review is documented in the evidence sheet. `reviewed: true` means the description passed human editorial review, not that a validator generated or approved it.

Run:

- `npm run catalogue:descriptions:validate`
- `npm run catalogue:colours:validate`
- `npm test`
- `npm run build`

Human review remains required after automated checks. Approve a batch before it becomes customer-facing.
