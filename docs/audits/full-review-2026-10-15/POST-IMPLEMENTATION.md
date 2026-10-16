# Monkcraft live audit — 16 October 2026

## Live check score: 7.0 / 10

This is a structured expert review of the implementation and the local production build, not a Lighthouse score, accessibility certification, load test, conversion measurement, or guarantee that every third-party service is configured. Category scores are equally weighted: (7.7 + 7.5 + 7.1 + 7.2 + 4.8 + 7.7 + 7.0) / 7 = 7.0.

| Audit area | Score / 10 | Current assessment |
| --- | ---: | --- |
| Visual design and brand consistency | 7.7 | Original homepage hero preserved; new “What we do” film cover verified locally. Real catalogue photos restored for 102 products and only verified brand logo art is used. Six product photos remain missing. |
| Navigation and search | 7.5 | Catalogs is the primary label. Search and direct call are compact header icons; cart and saved gifts remain distinct. Same-description colour variants can share a card. |
| Desktop and mobile usability | 7.1 | Responsive header, catalogue actions and box flow have been checked locally. Broader device/browser and assistive-technology testing remains necessary. |
| Customer journey and content clarity | 7.2 | “How it works” explains selection, customization and quote; cart collects priced products for verification and approval. Studio PDF exposes a single price instead of reseller markup. Hamper contents are explicit when source data confirms them and flagged when not. |
| Integrations and delivery | 4.8 | Supplied email and WhatsApp contact links are live. Automated form-to-email delivery and online payment are not configured; payment follows an approved quote. Studio and Company Stores remain demo experiences. |
| Web development and deployment | 7.7 | Production build, TypeScript, lint, 32 behavior tests, 5 API regressions and catalogue validation pass. Large media archive still makes deployment slow. |
| Web application interactions | 7.0 | Cart and saved gifts are separate; box selection, MOQ checks, realistic packaging photos and honest unpriced options work in checked flows. The brand film play/close interaction was checked in the local production build. |

## Production checks

Deployment target: [monkcraft-gifting-co.vercel.app](https://monkcraft-gifting-co.vercel.app). Vercel Deployment Protection is enabled, so authenticated CLI checks are required; an anonymous browser check cannot certify public availability.

| Path | Live response |
| --- | ---: |
| `/` | 200 |
| `/gifts` | 200 |
| `/gifts/box` | 200 |
| `/studio` | 200 |
| `/company-stores` | 200 |
| `/robots.txt` | 200 |
| `/sitemap.xml` | 200 |
| `/gifts/no-such-product` | 404 |

Checks run locally: `npm run lint`, `npx tsc --noEmit`, `npm test` (32 passed), `npm run catalogue:validate` (0 errors, 6 missing-photo warnings), `npm run launch:regression` (5/5), and `npm run build` (143 generated routes). Desktop browser inspection confirmed the restored homepage animation and the new “What we do” cover and play control. Earlier mobile inspection covered the catalogue and Build a Box at 390 px.

## Important remaining work

1. Configure and verify the enquiry sender, delivery provider and inbox before enabling automated form delivery. Until then, the site must not claim that a form was emailed or a quote submitted; use the explicit email/WhatsApp handoff.
2. Add or approve images for the remaining six catalogue products with no verified image: MGC-1422, MGC-2027, MGC-2041, MGC-4078, MGC-4255 and MGC-4257. They sort after photographed products within their category. The export has 4,257 unique products and 4,251 with images. Brand strip uses 17 verified image marks; other brands are omitted until original art is sourced.
3. Enrich hamper composition from authoritative supplier data. Two Rarejoy sets now list exact included items, but many other bundles still lack a verified component list. Their product pages clearly state that the contents must be confirmed before order approval.
4. Run keyboard-only and screen-reader journeys, real-device browser checks, and a performance/accessibility scan (including Core Web Vitals) before treating this as a complete certification.
5. Reduce deployment transfer size or move catalogue media to a dedicated image host/CDN. The deployment archive is roughly 777 MB compressed.
6. Company Stores and Studio are demos; confirm operational scope and label any remaining demo-only actions before selling those services as self-serve.

SEO plan: retain the new unique catalogue/product metadata and structured product data; next create editorial landing pages for “corporate gifts India”, “employee onboarding kits”, “Diwali corporate gifts”, “branded merchandise” and “company stores” with genuine product examples, supplier constraints and FAQs. Verify indexing and queries in Search Console, track enquiry/cart-start conversion, and prioritize pages using real impressions rather than adding thin keyword variants. Deployment Protection currently limits anonymous crawlability, so the public indexing strategy depends on an intentional access decision.
