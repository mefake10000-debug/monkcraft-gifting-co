# Gifting segmentation research

**Research date:** 2026-10-14  
**Catalog reviewed:** 4,257 products  
**Product sample:** 100 unique records, stratified by catalogue category and price-ordered within each category. See `gifting-segmentation-sample-100.csv`.  
**Web search:** Ten targeted DuckDuckGo queries × the first 10 organic result cards per query = 100 result cards captured in `gifting-web-search-audit.csv` on 2026-10-14. The file records each result title, canonical target URL, and a concise normalized transcription of its displayed snippet. These are discovery snippets, not 100 full-page reads. Twelve topic pages plus two search-engine documentation pages were opened and reviewed in full.

## What the research supports

1. **Separate recipient, occasion, season, product role, and price.** A single exclusive category would make a bottle or notebook hard to reuse across onboarding, conferences, and client gifting. The sidecar therefore assigns multiple segment IDs without changing the product's canonical category.
2. **Lead with useful, complementary components.** Research pages repeatedly describe practical items and coherent combinations. Bundle templates use distinct slots such as writing/planning, drinkware, carry, recognition, gourmet, and optional packaging; they do not pad a box with several items doing the same job.
3. **Treat relationships as a separate dimension.** Employee/peer, client, key-account, and leadership budgets are described differently in vendor material. The product data does not contain recipient seniority or relationship value, so “senior client” remains a review candidate. “Premium” source wording is captured as a supplier claim; price-only premium suggestions remain review candidates.
4. **Keep price transparent.** Vendor-published budgets vary widely by provider, occasion, and quantity. The site's price tiers use Monkcraft's actual listed INR unit prices, and bundle suggestions sum selected source prices only. No market markup, margin, tax, branding, or delivery cost is invented.
5. **Use specific festival evidence.** Diwali and Christmas have direct product-copy matches. The catalogue has no explicit Eid or Ganesh Chaturthi product descriptions, so those filters have no source-matched products. Generic candidates, where shown, are review-only and carry dietary/cultural-fit notes.
6. **Make event kits role-aware.** Conference research distinguishes delegates, speakers/VIPs, exhibitors and recognition recipients. The templates reflect distinct roles and keep event relevance visible as a signal.

## Product classification method

- Direct product text in titles, descriptions, short descriptions, or non-operational specifications creates a `source_match` assignment with the matched fields and a short evidence quote.
- The existing Awards & Trophies source category is accepted as direct evidence for Workplace Recognition.
- Premium/luxury wording plus a listed unit price of at least ₹1,500 is a source match, not an independent quality grade. Price-only products in the top decile of their category are `review_candidate`.
- Senior-client suggestions use explicit client-gifting text plus a top-quartile price within the source category; “senior” is not in the product data, so these remain `review_candidate`.
- Product-type suggestions for retirement, visiting-team welcome, Eid, Ganesh Chaturthi, company milestones, and event bundles are isolated in the review queue unless source text directly supports the tag.
- The 100-record sample is a reproducible audit sample, not a claim that a human has approved all assignments. The full catalog is processed by the same transparent rules.

## Local unit-price bands

`price-tiers.json` applies consistent filters to current product unit prices: up to ₹500, ₹500.01–₹1,500, ₹1,500.01–₹3,000, ₹3,000.01–₹5,000, and above ₹5,000. These are browse bands, not quality labels or market averages. The catalog has no cost/margin data, so markup is not calculated.

Supplier/editorial sources offered different planning examples rather than one reliable market standard. For example, Corpokit groups team tokens around ₹250–₹600, annual/festival employee gifts around ₹800–₹2,000, and onboarding/milestone/leadership kits around ₹2,500–₹6,000; Giftana gives its own under-₹700, ₹700–₹2,000, and ₹2,000+ Diwali tiers. These are cited as market examples only, not imported as fixed product prices or Monkcraft policy.

## Web search log

The saved card-level audit contains the first 10 organic DuckDuckGo results for each query. Queries 1–4 were fetched from DuckDuckGo directly; queries 5–10 were fetched through the Jina Reader text proxy after direct search requests were challenged/rate-limited. Results are a dated search snapshot; ranking and snippets can change.

1. `India corporate gifting price tiers bulk employee client gifts 2025 2026`
2. `Employee onboarding gift kits and practical corporate gifts India`
3. `Employee recognition service awards gifting budgets India`
4. `Retirement farewell service milestone gifts India`
5. `CEO executive senior client business gifting India`
6. `Client appreciation event conference visitor welcome kits India`
7. `India Diwali corporate gifting cultural dietary fit`
8. `Eid corporate gifting employees clients India`
9. `Ganesh Chaturthi corporate gifting India`
10. `Corporate hamper composition complementary products packaging budget tiers India`

Search snippets helped discover sources; they were not treated as authoritative pricing or product claims. Commercial vendor pages are useful for market patterns but are not independent consumer research. Conflicting tax/legal statements were excluded from these merchandising decisions.

## Full pages reviewed

- [Corporate Gifts for Employees & Office Gifts India 2026](https://corpokit.com/blog/corporate-gifts-for-employees-office-gifts-colleagues-india-2026) — Indian planning bands, occasion-first budgeting, useful daily items, subtle branding, multi-item curation.
- [Onboarding gifts / new employee welcome kit](https://corporategift.com/occasions/onboarding-gifts/) — Role-based kit structures: office accessories, bags, tech, apparel, treats; varied price choices.
- [Best Corporate Gift Ideas to Motivate & Appreciate Your Team](https://www.pluxee.in/blog/employee-gifts-in-india-2026-best-corporate-gift-ideas-to-motivate-and-appreciate-your-teams/) — Recipient preference, personalization, choice, sustainability and milestone framing.
- [Retirement Gift Ideas for Coworkers, Employees & Bosses](https://www.vantagecircle.com/en/blog/retirement-gift/) — Relationship level, tenure, group-vs-individual context, personalization and price tiers.
- [Conference & Event Gifts](https://www.showmaker.in/corporate-gifting-solutions/conference-event-gifts) — Differentiate delegate, speaker, VIP, exhibition and award-recipient kits; balance essentials and role.
- Premium Gift Ideas for CEOs and C-Suite Executives (source URL redacted) — Utility, restrained branding, recipient context and executive product types; supplier-marketing claims not used as facts.
- [Corporate Diwali Gifts Ideas for Clients & Employees](https://business.amazon.in/en/discover-more/blog/corporate-diwali-gift-ideas) — Diwali utility, personalization, curated hampers and recipient choice.
- [Best Diwali Corporate Gifts for Employees & Clients](https://www.giftanaindia.com/gift-hampers/diwali-corporate-gifts/) — Recipient-specific price bands, timing, food/dietary checks, and useful-plus-festive combinations.
- [Corporate Gifting: Best Corporate Gift Hampers India](https://bombaysweetshop.com/pages/corporate-gifting) — Practical occasion groupings: festive, client relations, corporate events, welcome kits, annual celebrations and recognition.
- [7 Unique Corporate Gift Ideas for Ganesh Chaturthi 2026](https://www.suspire.in/blogs/blog/7-unique-corporate-gift-ideas-for-ganesh-chaturthi-2026) — Festival-specific product evidence (diyas, candles, festive décor) and bulk-order caveats; not used to relabel generic products as Ganesh gifts.
- [Corporate Gifting Budget Guide for Employees & Clients](https://habbaa.com/blogs/news/corporate-gifting-budget-guide) — No universal budget; budget depends on recipient, occasion, relationship and presentation; fewer coherent items can beat filler.
- [Corporate Gifts for Employees, Clients & Business Partners](https://www.igp.com/corporate-gifts) — Recipient and occasion segmentation across employee appreciation, client gifts, onboarding, farewell, milestones, Diwali, New Year, Eid and Christmas.
- [Algolia Faceting documentation](https://www.algolia.com/doc/guides/managing-results/refine-results/faceting/) — Hierarchical facets and multi-value filter fields for site integration.
- [Typesense Search/Filter documentation](https://typesense.org/docs/30.0/api/search.html#facet-results) — String-array facets and explicit filters for search integration.
