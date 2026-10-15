# Baked catalogue export (Preview / Vercel)

Real Monkcraft `website-export` JSON copied for single-repo deploys.

| File | Role |
|------|------|
| `products.json` | Product catalogue (source of truth for SKUs / prices) |
| `gifting-segments.json` | Occasion / segment mappings |
| `categories.json` | Facet category labels |
| `brands.json`, `taxonomy.json`, `subcategories.json` | Supporting taxonomy |

**Not included:** `internal-provenance.json`, review CSVs, or product media.

Media is served from `/catalogue-media/...` (local symlink to sibling export, or files uploaded with a CLI Preview deploy). Do not invent prices or SKUs beyond this export.
