# Monkcraft full website audit and improvement review

15 October 2026, India Standard Time. Audit only: application code, settings, and deployment were not changed. Documentation and local evidence were added.

## Verdict and scoring

**Overall: 5.5 / 10.** Monkcraft has a recognizable brand and useful tools, but its customer journey is less reliable than its presentation suggests. The main gaps are enquiry delivery, inconsistent information between tools, misleading recommendation explanations, mobile overlays, and unfinished operational content.

This is an expert heuristic assessment of the inspected version, not a Lighthouse score, conversion-rate measurement, accessibility certification, or comparison percentile. Scores indicate current experience quality; they are not predictions of sales uplift. Three specialist reviews covered journeys, architecture, and accessibility/consistency; the primary reviewer checked source, local browser behavior, and selected public HTTP endpoints. Thousands of agents were not run.

The three requested outcomes receive equal weight:

| Outcome | Score | Reason |
|---|---:|---|
| Premium brand experience | 7.0 | Strong approved hero, recognizable palette and typography; weaker poster typography, internal copy, and consistency below the hero. |
| Qualified enquiry conversion | 3.5 | Production status endpoint reports delivery unconfigured. Local visible fallback channels are also unconfigured. Prepared requests can carry stale or contradictory requirements. |
| Self-service planning | 6.0 | Real catalogue and useful Finder, Box, Studio, and Store demos; cross-tool synchronization and recovery need substantial work. |

Arithmetic: (7.0 + 3.5 + 6.0) / 3 = 5.5. Section scores below are diagnostic ratings, not another weighted formula.

### Section scorecard and specific improvement scope

| Section | Score / 10 | Preserve | Main improvement scope | Priority |
|---|---:|---|---|---|
| Homepage hero | 8.0 | Approved v5 artwork, concise headline, two clear discovery choices | Test buyer understanding of the offer; keep primary action visible on phones; preserve artwork. | P3 |
| Header and navigation | 5.5 | Four primary destinations, shared nav configuration | Fix tablet utility gap and phone menu overflow; reduce overlapping contact actions; expose tool purpose clearly. | P1 |
| Brands strip | 6.0 | Honest “Brands in our catalogue” label | Official logo assets are absent; curate/verify brand presentation without implying partnerships or customers. | P3 |
| What We Do | 4.5 | Relevant four service destinations | Replace image-bound copy with HTML; repair artwork's incomplete sentence; rewrite internal implementation commentary. | P2 |
| Gift Ideas | 5.5 | Occasion-led discovery | Correct broad Custom Merchandise link; simplify repeated CTAs; improve text readability and occasion mapping. | P2 |
| Journey explanation | 5.0 | Discover → Shape → Quote concept | Explain buyer outcome and actual handoff; remove deployment/setup language; make next action consistent. | P2 |
| Consultation and enquiry | 3.0 | Useful structured brief fields, honest delivery gating | Establish a reachable business channel, complete delivery and receipt verification, improve error navigation. | P1 |
| FAQ and footer | 4.5 | Realistic demo disclosures, accessible FAQ accordion structure | Replace raw routes with links; remove “not invented” commentary and legal/contact placeholders; add verified business information. | P2 |
| Catalogue | 6.5 | 4,257 real product records, filters, search, price sorting | Fix drawer layers/focus; curate first results and product families; improve metadata contrast, card sizes, and media completeness. | P1 |
| Product detail | 6.0 | Real images, clear GST wording, MOQ and customization data | Put main action near price before long specifications; contextualize stock freshness and estimate exclusions. | P2 |
| Shortlist and compare | 6.0 | Useful saved-selection and empty states | Preserve prices at handoff; clarify Save versus Compare; group variants and keep overlay interactions reliable. | P1/P2 |
| Gift Finder | 4.5 | Honest rule-based disclosure, catalogue-backed results | Fix negative preferences and quantity parsing; support explicit clearing; provide diverse recommendations and clearer taxonomy. | P1 |
| Build a Box | 5.5 | Correct separation of units per box from supplier MOQ | Fix linked brief lifecycle and contact path; carry canonical prices; make packaging limits and next steps clearer. | P1 |
| Studio branding | 6.5 | Conceptual-proof disclosure, real product selection, undo/redo controls | Complete keyboard tabs; simplify repeated guidance; handle persistence failures and verify PNG export with deployment media. | P2 |
| Studio catalogue | 6.0 | Honest browser Print → Save as PDF workflow | Fix Brief deep link; clear linked data on reset; reduce setup friction; verify multi-page exported layout. | P1/P2 |
| Company Stores | 6.5 | Clear demo status and useful employee empty state | Fix return-to-draft navigation and contrast-safe brand colors; guide configuration completion; keep live provisioning separate from demo. | P1/P2 |
| Mobile and accessibility | 4.5 | Labels, focus styling, reduced-motion helpers | Repair modal focus/layers/menu scrolling, contrast, tabs, field errors, video focus, and target consistency. | P1 |
| Architecture and maintainability | 5.5 | Typed models, separated modules, restrained dependency count | One reconciled programme model; reliable storage boundary; durable delivery identity; normalized catalogue assets/indexes. | P1/P2 |
| SEO and measurement | 3.5 | Individual product titles/descriptions | Proper missing-product state, canonicals, indexing policy, sitemap, share metadata, and funnel/vitals instrumentation. | P2 |

## Evidence, coverage, and limits

- Local source baseline: commit 6259a7cf422f79e66d78f9b6673c5e52ce4e2ad6. The working tree was clean at the resumed audit's start. Earlier uncommitted changes had become part of the current baseline; their history was not assumed.
- Browser inspected localhost:3000: homepage, catalogue, a bottle PDP, Finder inputs/results, Box packaging start, Brief, both Studio modes, Company Stores landing/configurator/employee preview, and Shortlist/Compare empty states.
- Responsive sampling: desktop 1440×1000; catalogue 390×844; short phone viewport 390×390; header at 1024×768. This is not every page at every breakpoint or a physical-device matrix.
- Local browser used synthetic, non-contact test values: onboarding, 100 recipients, ₹1,000, “no apparel.” Compare test item was removed; Finder draft was cleared. Finder propagation deliberately leaves stale Brief values, as documented below. No personal contact details were entered.
- Public read-only checks before production browser access was denied: GET /api/enquiry returned deliveryConfigured:false; /catalogue returned 308 to /gifts; /robots.txt and /sitemap.xml returned 404. These are HTTP observations, not a full production browser audit.
- Production browser access was denied by browser security policy, which reported user-declined permission. No alternate attempt was made after that denial. Production visual state, deployed commit identity, inbox receipt, and deployed cross-tool behavior remain unverified.
- A later attempt to remove the synthetic programme values from Brief was also denied for localhost. Further site interaction stopped. The Finder draft had already been cleared, but its propagated synthetic Brief values may remain in the audit browser. The temporary viewport override was subsequently reset without accessing the site.
- Lint passed; TypeScript no-emit check passed; catalogue validation passed with 0 errors and 108 image warnings; official partner-logo check reports no logo files. These checks do not validate all commercial facts.
- Specialist probes transpiled TypeScript in memory with synthetic storage. They reproduced stale linked drafts, conflicting Box requirements, retained Finder fields, and missing numeric prices. No live enquiry was submitted.
- No packages installed, load tests, customer email/WhatsApp messages, deployment, destructive resets, or remediation changes. A production build was not run against the active development server. No Lighthouse, field Web Vitals, real customer analytics, production inbox test, complete PDF/PNG export test, or screen-reader certification was completed.

### Evidence key

**B** = observed in local browser. **H** = observed public/local HTTP endpoint. **C** = current source confirms behavior. **T** = isolated synthetic probe. **R** = risk/opportunity whose full impact still needs runtime or user measurement.

**P1** = important conversion, data trust, privacy, or access problem; fix before driving substantial acquisition. **P2** = meaningful friction, robustness, or consistency problem. **P3** = polish/optimization. The register contains 14 P1 and 32 P2 findings. No current P0 catastrophe was established.

## Findings register

### Conversion and programme integrity

**A01 · P1 · H/B/C · A new buyer has no verified completion channel in the audited configuration.** Production GET /api/enquiry and local GET both return deliveryConfigured:false. Local Consultation explicitly reports email, booking, and WhatsApp unconfigured. Preparing text therefore stops short of contacting the business. Configure one verified destination and an available public fallback, then prove provider acknowledgement plus inbox receipt with an authorized test. Production fallback configuration beyond the status endpoint was not independently inspected. Sources: [delivery.ts:45](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/enquiry/delivery.ts:45), [contactConfig.ts:85](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/contactConfig.ts:85).

**A02 · P1 · C/T · Clearing a tool can leave its old configuration in the quotation.** Link a Box, branding, catalogue, or Store draft; reset that tool; reopen Brief. Refresh only synchronizes nonempty drafts, so old brief.sources entries can survive. An isolated catalogue probe cleared the draft but still found its title/company in quotation text. Make link/update/unlink explicit and reconcile a single quote snapshot. Preserve a reset recovery option. Sources: [briefWorkspace.ts:158](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/briefWorkspace.ts:158), [catalogueDraft.ts:129](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/studio/catalogueDraft.ts:129), [companyStore/draft.ts:199](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/companyStore/draft.ts:199).

**A03 · P1 · C/T · Updated Box requirements conflict with programme fields.** Sync Onboarding/₹1,000; change Box to Diwali/₹2,000; sync again. fill-empty leaves programme occasion/budget at the old values while replacing the linked Box. A seller receives conflicting instructions. Track which source owns each field, update owned values, and ask the buyer to resolve genuine manual conflicts. Sources: [box.ts:429](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/box.ts:429), [brief.ts:344](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/brief.ts:344).

**A04 · P1 · B/C/T · Clearing Finder requirements does not clear My Brief.** Enter a count/date/city, remove them or clear Finder, then open Brief. Empty values become undefined and merge-nonempty retains previous requirements. Browser cleanup also left the synthetic programme visible in the header. Support explicit clearing of Finder-owned fields while preserving unrelated manual entries. Source: [briefBridge.ts:61](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/giftFinder/briefBridge.ts:61).

**A05 · P1 · C · Shared-brief import drops linked configurations and can retain unrelated recipient data.** Encoding includes sources, but import copies programme/contact/products without incoming.sources. An incoming empty shortlist does not replace the receiver's shortlist. Thus “import over” is neither a full replace nor a reliable merge. Define replace/merge explicitly, import all supported sources, clear absent selections intentionally, and retain a recovery snapshot. Sources: [GiftingBrief.tsx:230](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/catalogue/GiftingBrief.tsx:230), [briefShare.ts:57](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/briefShare.ts:57).

**A06 · P1 · C/R · Share URLs carry contact details in reversible form.** The complete contact/programme payload becomes base64url in ?brief=. Copying/opening/forwarding exposes it to recipients, history, and URL logging; base64 is not confidentiality. This is confirmed behavior, not proof of an actual leak. Default to programme/selections without contact data and preview what is shared. Persistent sharing should use an opaque, revocable identifier with explicit expiry/access rules. Sources: [briefShare.ts:57](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/briefShare.ts:57), [GiftingBrief.tsx:210](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/catalogue/GiftingBrief.tsx:210).

**A07 · P1 · C/R · Retry and server deduplication can deliver duplicate enquiries.** Retry creates a new submission ID. Server deduplication is an in-process map checked before send and filled afterward, so simultaneous calls or separate instances can both send. There is no payload fingerprint/provider deduplication. No duplicate customer email was sent during this audit. Keep identity stable for an unchanged payload, use an atomic durable submission record and provider idempotency, and reconcile ambiguous outcomes. Sources: [ConversionChannels.tsx:193](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/conversion/ConversionChannels.tsx:193), [enquiry/route.ts:54](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/api/enquiry/route.ts:54), [idempotency.ts:14](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/enquiry/idempotency.ts:14).

**A08 · P2 · C/T · Shortlist → Box loses verified numeric prices.** Direct add carries amountInr; shortlist import only carries a price label. A synthetic ₹100 item becomes an unpriced line and subtotal:null. Resolve canonical product/pricing data at the handoff instead of parsing display strings. Sources: [BoxBuilder.tsx:392](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/box/BoxBuilder.tsx:392), [ProductCard.tsx:47](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/catalogue/ProductCard.tsx:47).

**A09 · P2 · C/R · The normal Box review path skips its contact form.** enterQuoteStep immediately sets prepText; contact inputs only render while prepText is empty. When online delivery becomes available, a fresh buyer can reach submit with no name/email and be sent elsewhere to edit. Reload changes the path because prepText is transient. Put contact in the shared final enquiry flow. Sources: [BoxBuilder.tsx:455](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/box/BoxBuilder.tsx:455), [BoxBuilder.tsx:1376](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/box/BoxBuilder.tsx:1376).

**A10 · P2 · B/C · Brief return links open the wrong destination.** “Open Studio catalogue” points to /studio, which defaults to the branding editor. “Review store draft” points to the marketing landing page. Use /studio?mode=catalogue and /company-stores/configure for existing drafts; preserve return context. Sources: [GiftingBrief.tsx:601](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/catalogue/GiftingBrief.tsx:601), [GiftingBrief.tsx:630](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/catalogue/GiftingBrief.tsx:630).

**A11 · P2 · C/R · Browser storage failures have no consistent recovery.** Draft reads catch exceptions, but many writes call localStorage.setItem directly. Storage restrictions or quota exhaustion, especially with logo data, can interrupt actions or invalidate “saved” status. Centralize persistence with explicit success/failure, usable in-memory state, export/retry, and quota tests. Sources: [shortlist.ts:87](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/shortlist.ts:87), [brandingDraft.ts:90](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/studio/brandingDraft.ts:90), [brief.ts:288](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/brief.ts:288).

### Finder reasoning and recommendation trust

**A12 · P1 · C/T · Quantity parsing changes the buyer's number.** The actual parseRecipientCount function returned 1 for “1,000”, 1 for “1k”, 5 for “-5”, and 1 for “1.5”; “100” returned 100. MOQ decisions therefore use a different count than the buyer intended. Accept validated positive whole counts, normalize supported Indian/international separators deliberately, and reject ambiguous shorthand rather than silently truncating it. Source: [recommend.ts:32](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/giftFinder/recommend.ts:32).

**A13 · P1 · B/C · Negative preferences become positive matches.** With onboarding, 100 recipients, ₹1,000 and the UI's suggested “no apparel” input, all 24 primary results were Apparel & Lifestyle and said “Matches a stated preference.” The tokenizer drops “no” and rewards “apparel.” This is a false explanation despite deterministic, non-AI execution. Add explicit exclusions with enforceable category controls; either parse supported negation safely or state unsupported free-text interpretation before recommending. Never describe an ignored exclusion as a preference match. Evidence: [captured DOM](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/finder-exclusion-dom.txt). Sources: [recommend.ts:110](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/giftFinder/recommend.ts:110), [recommend.ts:251](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/giftFinder/recommend.ts:251).

### Mobile, keyboard, and interaction behavior

**A14 · P1 · B/C · Filters declares a modal but leaves focus outside it.** After opening Filters, document.activeElement remained the background Filters button and modalContainsFocus was false. Source has Escape/body locking but no entry/trap/return focus or inert background. Use one accessible dialog/drawer behavior with contained focus and return to its trigger. Source: [CatalogueShell.tsx:200](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/catalogue/CatalogueShell.tsx:200). [W3C dialog guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) describes focus containment and background inertness.

**A15 · P1 · B/C · Comparison tray covers the mobile Filters drawer.** At 390×844, add a comparison item and open Filters: the tray stays above the drawer and covers its lower content. Drawer z-index is 50; tray is 60. Use layer tokens and suppress/inert unrelated floating utilities while a modal is open. Evidence: [overlap screenshot](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/mobile-filter-compare-overlap.png). Source: [catalogue.css:1432](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/gifts/catalogue.css:1432), [catalogue.css:4427](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/gifts/catalogue.css:4427).

**A16 · P1 · B/C · Phone navigation extends off-screen while scrolling is locked.** At a 390px-high viewport, the open menu bottom was 690.8px, overflow-y:visible, with body overflow:hidden. Lower links are clipped. Use available dvh, safe-area padding, internal scrolling and complete keyboard handling. Header implementations repeat this risk. Evidence: [menu screenshot](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/mobile-menu-short-viewport.png). Sources: [globals.css:739](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/globals.css:739), [globals.css:1146](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/globals.css:1146).

**A17 · P2 · B/C · Header utilities disappear from 900–1099px.** At 1024px the header shows primary navigation/My Brief, but no Menu, Search, Ask or Coffee chat. Menu hides at 900 while utilities appear at 1100. Preserve a compact utility menu until all desktop actions fit. Evidence: [tablet header](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/tablet-header.png). Source: [globals.css:642](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/globals.css:642), [globals.css:718](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/globals.css:718).

**A18 · P1 · C · Small catalogue metadata is too faint.** Calculated on white: MOQ olive/50% ≈2.66:1; quote text olive/58% ≈3.22:1; shared muted olive/68% ≈4.17:1. Important small text should use tested semantic colors; normal-text AA threshold is 4.5:1. This is a targeted contrast finding, not a whole-site certification. Sources: [catalogue.css:1132](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/gifts/catalogue.css:1132), [globals.css:28](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/globals.css:28). [W3C contrast explanation](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

**A19 · P1 · C/R · Store accent colors can make prices invisible.** Any valid hex, including white, is accepted; the accent is used as price text on white. Keep the decorative accent separate from an accessible foreground and validate previews. Sources: [StoreAdminShell.tsx:245](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/company-store/StoreAdminShell.tsx:245), [company-stores.css:986](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/company-stores/company-stores.css:986). White-on-white outcome is inferred from the CSS; a configured store with this color was not saved in the browser.

**A20 · P2 · C · Consultation field errors are not associated with their fields.** aria-invalid exists, but error spans lack aria-describedby linkage; no first-error focus/linked error summary. Connect messages by ID and move focus appropriately after failed validation. Source: [Consultation.tsx:419](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/Consultation.tsx:419).

**A21 · P2 · C · Studio tabs expose incomplete keyboard semantics.** Tab roles exist without controls/IDs, roving tabindex or arrow-key navigation. Implement complete tabs or use ordinary URL navigation semantics. Source: [StudioShell.tsx:140](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/studio/StudioShell.tsx:140).

**A22 · P2 · C · Video playback removes the focus target and section label.** Play is removed when playing, including the only titleId target; Close similarly removes itself. Keep a persistent heading and transfer/restore focus. Source: [BrandVideoBand.tsx:48](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/BrandVideoBand.tsx:48).

**A23 · P2 · C/R · Video has no caption/transcript interface.** The component has a source but no track or transcript prop. Add support and review actual audio to determine required captions/transcript. Audio was not listened to completely, so spoken-content exclusion is not asserted as a verified failure. Source: [BrandVideoBand.tsx:79](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/BrandVideoBand.tsx:79).

**A24 · P2 · C/R · Reveal effects can hide content after partial JavaScript failure.** The root marks content for hidden reveal before hydration. Reveal returns when IntersectionObserver is unavailable without revealing. A chunk failure can similarly leave hidden content. Enable hiding only after attaching the observer and fail open. The failure path is source-confirmed; blocked-chunk runtime testing remains. Sources: [layout.tsx:33](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/layout.tsx:33), [Reveal.tsx:49](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/Reveal.tsx:49).

**A25 · P2 · C · “In box” stays enabled but does nothing.** A pressed button deliberately returns on subsequent activation. Show a status plus Edit box, or make the repeat action meaningful. Source: [AddToBoxButton.tsx:54](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/box/AddToBoxButton.tsx:54).

**A26 · P2 · C · Product action targets conflict with the shared 44px policy.** Shortlist/compare use 32px minimums while shared tokens state 44px. Increase the interaction area without necessarily enlarging the visible glyph. This is a consistency/usability issue, not a claim that every 32px control violates WCAG. Sources: [globals.css:49](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/globals.css:49), [catalogue.css:1179](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/gifts/catalogue.css:1179).

### Placement, content, and discovery

**A27 · P2 · B/C/R · Product actions sit after a long specification block.** On the sampled desktop PDP at 1440×1000, the price is visible but the action row is below the viewport after specs/branding. Put one primary selection action beside price and MOQ; move detailed specs below. Consider a restrained mobile action bar that does not collide with trays. Conversion impact requires measurement. Evidence: [product screenshot](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/product-desktop.png). Source: [product page:164](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/gifts/[slug]/page.tsx:164).

**A28 · P2 · B/C · Marketing copy is baked into slide images.** What We Do/Gift Ideas use poster frames and minimal HTML. Their body text scales as pixels, cannot reflow with larger text, and is not fully represented by alt text. Separate approved imagery from real headings/body copy; keep art quality and verify mobile typography. Source: [WhatWeDo.tsx:93](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/WhatWeDo.tsx:93), [GiftIdeas.tsx:52](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/GiftIdeas.tsx:52).

**A29 · P2 · B · Corporate Gifting artwork has an incomplete sentence and visible patching.** Current image reads “your ideas together into a beautifully organized, joyful experience” after a blank/covered region; the verb is missing. Do not silently reuse the older report's exact “together together” or Gemini-watermark allegation: those exact artifacts were not verified in this current asset. Rebuild the text in HTML and review final imagery at full size. Evidence: [current artwork](/Users/nishantparihar/Desktop/monkcraft-gifting-co/public/marketing/what-we-do/corporate-gifting-v3.jpg), [service cards](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/home-service-posters.png).

**A30 · P2 · B/C · Customer copy exposes internal implementation/setup discussion.** Examples: “Slide art carries the story”; “No fake PDF engine”; “without invented claims”; environment configuration/.env.example instructions in the enquiry fallback. Prepared text also always says inbox routing is disconnected, even if configured later. Write buyer-facing outcomes and actual available actions; derive capability messages consistently. Sources: [WhatWeDo.tsx:73](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/WhatWeDo.tsx:73), [ConversionChannels.tsx:224](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/conversion/ConversionChannels.tsx:224), [brief.ts:748](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/brief.ts:748).

**A31 · P2 · B/C · Custom Merchandise unexpectedly narrows to drinkware.** The card describes apparel, drinkware and bags but links only to drinkware-barware. Client Appreciation and Events also converge on the same combined facet. Use an accurately named collection or a guided multi-category path; do not fabricate occasion assignments. Source: [giftCategories.ts:111](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/data/giftCategories.ts:111).

**A32 · P2 · B/C/R · Color variants dominate discovery and recommendations.** Initial catalogue rows contain many bottle colors; the Finder returned many adjacent T-shirt color variants. Sorting ties alphabetically favors near-duplicates rather than range. Group verified product families with swatches and diversify recommendation families before showing variants. This requires a reviewed family mapping, not name-guessing that merges different products. Sources: [recommend.ts:472](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/giftFinder/recommend.ts:472), [catalogue query](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/data/catalogue/query.ts).

**A33 · P2 · B/R · Occasion choices mix occasions, audiences, and value tiers.** “Premium gifting options,” “Leadership and CEO,” “Milestone moment,” “Employee recognition,” and “Workplace recognition” sit together. Buyers must interpret source taxonomy. Create distinct buyer-facing occasion/audience/style controls with explicit mappings to source tags. Preserve original source provenance. Evidence: [Finder screenshot](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/finder-desktop.png).

**A34 · P2 · C/T · Catalogue completeness limits discovery.** Of 4,257 unique records, 108 (2.5%) lack images, 2,094 (49.2%) lack occasion tags, and 637 lack MOQ. Lack of a tag is not proof that a product is unsuitable; lack of MOQ is not proof of MOQ=1. Build a reviewed enrichment queue and measurable completeness thresholds. Never generate false product photos/specifications. Source: [products.ts:331](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/data/catalogue/products.ts:331), [catalogue validator](/Users/nishantparihar/Desktop/monkcraft-gifting-co/scripts/catalogue-validate.mjs).

**A35 · P2 · B/C/R · Export-backed stock/dispatch appear current without freshness context.** The sampled bottle shows Stock Availability:50 and dispatch 3–5 working days, while stock-update-date attributes are deliberately hidden. These may be legitimate exported values, but live reservation/freshness is not established. Show as-of/source context or “availability to confirm”; avoid turning catalogue data into an implied current commitment. Sources: [products.ts:166](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/data/catalogue/products.ts:166), [product page:149](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/gifts/[slug]/page.tsx:149).

### Architecture, operations, and consistency

**A36 · P2 · C/T/R · Cold catalogue load does unnecessary global work.** Initializing products reads/parses about 19.4MB of JSON synchronously and builds related recommendations for the full catalogue. An isolated specialist module probe measured 1,295ms on first getAllProducts, then effectively 0ms warm. This is not production HTTP latency or a Web Vitals result. Normalize/index at import/build and calculate related items lazily or precompute them. Sources: [products.ts:267](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/data/catalogue/products.ts:267), [products.ts:393](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/data/catalogue/products.ts:393).

**A37 · P2 · C/R · Catalogue media deployment is not self-contained.** public/catalogue-media links to another workspace; Vercel config rewrites to a specific deployment hostname. Local images loaded successfully after settling, so a universal current image outage is not established. Set a durable owned asset origin/publication process; verify production samples and Studio cross-origin export. Sources: [vercel.json:6](/Users/nishantparihar/Desktop/monkcraft-gifting-co/vercel.json:6), [export README](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/data/catalogue/export/README.md).

**A38 · P2 · H/C · Search indexing and missing-product handling are incomplete.** Production sitemap.xml and robots.txt return 404. Missing slugs return ordinary “not found” content without notFound/noindex. No canonical, OG or product structured-data implementation was found. Add correct missing-resource semantics, canonical/faceted-query policy, a product sitemap, and verified share/product metadata. Missing robots.txt alone does not mean crawling is blocked. Next's streamed response may retain HTTP 200, so inspect status and noindex independently. Sources: [product page:77](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/gifts/[slug]/page.tsx:77), [layout.tsx:20](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/layout.tsx:20).

**A39 · P2 · C/R · Request bounds and spam protection are limited.** Enquiry limiting is process-local and follows full JSON parsing. The submitted honeypot is hard-coded empty rather than a bot-fillable form field. Finder normalizes several values, but the route lacks comprehensive bounded schema/request limiting. Use hosting body controls, trusted request identity, shared rate limits and bounded arrays/text. Do not claim all malformed requests crash: the engine already normalizes many types. Sources: [enquiry/route.ts:24](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/api/enquiry/route.ts:24), [rateLimit.ts:12](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/enquiry/rateLimit.ts:12), [Finder route:9](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/api/gift-finder/recommend/route.ts:9).

**A40 · P2 · C/R · Delivery requests lack application timeouts and reconciliation.** Client/provider fetches have no abort deadline. An accepted request with a lost response is not reconciled. Add bounded timeouts and durable status linked to the stable submission ID. Test slow/accepted-but-response-lost scenarios with a mocked provider. Sources: [submitClient.ts:59](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/enquiry/submitClient.ts:59), [delivery.ts:91](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/lib/enquiry/delivery.ts:91).

**A41 · P2 · C · Existing regression checks do not cover the risky journeys.** No committed browser/unit test suite was found. launch-regression assumes delivery is disabled and includes a valid enquiry POST, making it unsuitable as a general production check after activation. Split safe status/schema tests from mocked delivery and authorized live smoke tests. Cover source lifecycle, share import, quantities, exclusions, and overlays. Source: [launch-regression.mjs](/Users/nishantparihar/Desktop/monkcraft-gifting-co/scripts/launch-regression.mjs).

**A42 · P2 · C/R · Shared visuals and interactions are implemented repeatedly.** HeroNav/SiteHeader duplicate menu behavior; mc-btn, journey-btn and cs-btn independently define similar controls. Four surface stylesheets total roughly 10,014 lines. Size alone is not a defect, but observed breakpoint, layer and target drift shows the maintenance consequence. Establish shared primitives and documented surface variants. Sources: [globals.css:112](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/globals.css:112), [globals.css:274](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/globals.css:274), [company-stores.css:99](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/app/company-stores/company-stores.css:99).

**A43 · P2 · C/R · The repo lacks a measurable funnel and field-performance baseline.** No analytics event layer or useReportWebVitals integration was found. Production hosting analytics outside the repo were not inspected. Instrument anonymous steps and failure codes before evaluating redesign claims; exclude contact fields and share tokens. Track source → selection → programme → enquiry → acknowledgement, plus return/error behavior. Do not claim a particular conversion uplift without data.

**A44 · P2 · B/C · Box packaging is a style preference, not a priced packaging selection.** APPROVED_PACKAGING is empty; illustrated styles are disclosed as concepts. This is an honest capability boundary, not fabricated inventory. Offer explicit “help me choose packaging” and explain which costs remain unpriced. Populate verified packaging only when approved records exist. Source: [packaging.ts:10](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/data/catalogue/packaging.ts:10).

**A45 · P2 · B/C · Public trust/contact content is visibly unfinished.** Footer says legal pages and email will appear later, while forms autosave contact fields. Add owner-approved business identity, reachable contact and clear privacy/storage/share information. This is an experience/trust finding; this audit does not determine statutory compliance. Source: [SiteFooter.tsx:55](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/SiteFooter.tsx:55).

**A46 · P2 · C/R · Brand videos need delivery optimization and task-fit review.** Files are about 17MB (What We Do), 37MB (Brief explainer), and 7.6MB (Store). Playback mounts on user action, so these sizes are not evidence of all videos downloading on first load. Benchmark slow connections, choose suitable renditions/posters and consider shorter task-specific clips. Preserve the user's ability to proceed without watching. Source: [BrandVideoBand.tsx:79](/Users/nishantparihar/Desktop/monkcraft-gifting-co/src/components/BrandVideoBand.tsx:79).

## Hallucinations, misleading claims, and previous-audit corrections

| Item | Current conclusion |
|---|---|
| Finder recommends apparel for “no apparel” and calls it a preference match | Confirmed misleading reasoning, A13. Deterministic systems can still give false explanations. |
| Cleared/changed drafts reappear as current quotation requirements | Confirmed stale-information problem, A02–A04. It can look like the site invented requirements. |
| Shared brief faithfully reproduces a collaborator's proposal | Not reliable because sources are omitted on import, A05. |
| “Verified” catalogue data | Validator confirms structural completeness/positive prices, not current supplier stock, authorization, brand partnership, or commercial accuracy. Supplier verification remains separate. |
| Generative AI Finder/chat | No generative provider is active; code and UI explicitly disclose rule-based matching and no live AI chatbot. Do not score this as a hidden fake-AI claim. |
| Studio print proof / automated PDF engine | Conceptual PNG and browser Print → Save as PDF are honestly disclosed. Export controls exist, but complete export results were not verified here. |
| Company Store authentication/payment/order submission | Demo is explicitly disclosed; absence of a production commerce backend is a capability boundary, not a hidden live-store defect. |
| Brand strip | Label is “Brands in our catalogue,” not “customers” or “partners.” No fake testimonial claim was established. Official logo files remain missing. |
| Old MOQ-as-units-per-box P0 | Fixed in current source. Keep regression coverage; do not count as a current P0. |
| Old raw GST enum | Current sampled PDP shows “excl. GST”; fixed locally. |
| Old alias 404 | Redirects now exist; public /catalogue returned 308 to /gifts. Other aliases are source-confirmed, not all production-tested here. |
| Old identical PDP summary/description duplication | Current page deduplicates identical normalized strings. |
| Old “11 Sept 2026 is future” allegation in 15 Oct 2026 report | Incorrect: 11 September precedes 15 October. Do not repeat it. Stock freshness remains a separate issue, A35. |
| Old exact “together together”/Gemini-watermark allegation | Not re-established in the current inspected asset. Current incomplete/covered sentence is A29. |
| Old “no delivery implementation exists” | Stale. Resend delivery exists; configuration is currently disabled and reliability limitations remain. |

## Recommended customer journey and architecture

The best next version should reduce the amount of state a buyer must understand. Keep the approved brand and useful tools; make one programme own the commercial requirements.

1. **Discover:** Browse gifts or Help me choose. Company Store gets its separate proposal entry. Explain Studio as branding/catalogue creation rather than expecting first-time buyers to know the term.
2. **Select:** One primary action saves a product to the programme. Compare supports temporary evaluation; shortlist is the saved set. Group verified variants and show price basis/MOQ clearly.
3. **Shape:** Add quantities, packaging and branding to that same programme. Expose source ownership and conflicts. Each configuration has Included, Excluded or Needs review status, with remove/undo.
4. **Review:** Show recipients, units per box, total programme units, priced subtotal and explicit unpriced costs. No contradictory old sources; requested dates remain requests.
5. **Enquire:** A single contact/delivery step, then Submit enquiry when configured. Copy/share/export are secondary choices. Confirmation reflects actual acknowledgement; inbox receipt is operationally verified.

This is a proposed improvement direction, not implemented changes or an approved replacement for primary nav labels.

### Technical changes to support it

- **Programme state:** One versioned domain model for requirements, selections and linked configuration references. Distinguish manual fields from tool-owned values. Reconcile before rendering a quote or serializing a share. Make replace/merge/delete explicit and migrate old browser drafts with a recoverable copy.
- **Canonical product data:** Store IDs and structured quantity/pricing fields; resolve through the same catalogue boundary on every handoff. Do not infer price from labels or invent variants. Preserve tax basis and price provenance.
- **Persistence:** One storage adapter reporting save status/errors. Separate larger logo assets from small draft metadata; provide recovery. Server-saved programmes can follow later if cross-device collaboration is required.
- **Delivery:** A normalized enquiry contract, stable payload-bound submission identity, atomic durable status, provider idempotency, timeouts and an honest capability/status model. Keep credentials server-side.
- **Catalogue pipeline:** Validate/enrich records, publish media to a stable origin, generate search/facet/related indexes once, and track freshness. Avoid global per-product ranking on every cold process.
- **Design system:** Shared Button, Field, Dialog/Drawer, Tabs, ProductAction, Status, Breadcrumb and Navigation primitives. Centralize spacing, radii, typography, color, layers, targets and motion; use intentional variants for expressive marketing versus quieter tools.
- **Public interfaces:** No immediate route removal. Correct the two broken destination links. Any later programme/share API needs explicit authorization/access/expiry rules before replacing browser-only sharing. Maintain existing canonical URLs and add redirects only for deliberate changes.

### Consistency rules to adopt

| Area | Proposed rule |
|---|---|
| Brand | Preserve #662F90, #3F3F37, #F1F2F2; approved pastels, Fraunces and DM Sans; preserve hero v5 and logo geometry. |
| CTA hierarchy | One dominant next action per task state, one secondary path, utilities visually subordinate. Do not style every route as a primary pill. |
| Vocabulary | Use the same name for programme/brief, saved selection, compare, units/box, boxes, estimate and enquiry status everywhere. |
| Price | Structured INR + tax basis; separately disclose branding, packaging, shipping and unknown costs. “Unpriced” never means free. |
| Navigation | One responsive breakpoint policy and one menu behavior. Returning to a draft opens its actual editor/mode. |
| Layers | A modal always outranks/inerts trays and sticky controls. Modal content must scroll inside the available viewport. |
| Inputs | Consistent labels, optional/required indicators, examples, validation, error associations and save feedback. |
| Motion | Short feedback transitions with a purpose; preserve reduced-motion behavior; content visible if enhancement fails. Do not add animation simply to increase movement. |
| Empty states | Explain the missing item and provide one relevant action; hide unrelated actions until meaningful. |
| Claims | Verified supplier facts only; conceptual artwork/mockups and demos labelled once at the relevant decision point. Keep deployment instructions out of customer flows. |

## Prioritized roadmap and verification

### Milestone 1: Trustworthy enquiry and recommendations

Resolve A01–A07, A12–A13 and A45; fix the mobile blockers A14–A19 in the same release gate. Start with contact capability, state integrity and Finder reasoning before decorative changes. Delivery needs owner-supplied verified business configuration; content/privacy text needs owner review. No sales uplift estimate is attached.

Acceptance: a buyer can send one accurate programme through a working channel; retries cannot duplicate it; cleared sources are absent; shared/imported data matches the chosen replace/merge behavior; negative preferences and counts are honored; overlays remain keyboard-operable.

### Milestone 2: Reduce effort and restore consistency

Resolve handoff prices/contact/deep links, persistence recovery, action placement, copy and poster typography (A08–A11, A20–A33). Implement shared primitives incrementally. Keep the distinctive hero/type/palette. Make a small set of reviewed product families before attempting catalogue-wide variant grouping.

Acceptance: representative buyer journeys complete without detours, wrong tool modes, unexplained dead controls, contradictory save states or repeated contact entry. HTML copy reflows at larger text sizes and mobile widths.

### Milestone 3: Operational and discovery quality

Resolve A34–A44 and A46 through data enrichment, stable assets, cold-load work, delivery robustness, SEO and observability. Split safe checks from live-delivery tests. Add product freshness and capability publication rules.

Acceptance: production routes/images/exports are verified against a known version; sitemap/canonical/missing-page policy is correct; meaningful funnel events are recorded without personal data; performance targets are measured rather than guessed.

### Required test scenarios

| Area | Cases and expected behavior |
|---|---|
| Programme lifecycle | Link/update/reset each tool; refresh; reopen Brief; inspect final text. Deleted sources never return, edited fields agree, manual conflicts are visible. |
| Sharing | Fresh and populated receiver; empty shortlist; Box/Studio/Store configurations; replace versus merge; oversized/invalid token. Exact intended data survives; unrelated data does not silently remain; contact excluded by default. |
| Quantities/prices | 100, 1,000, 1,00,000; reject -5, 1.5 and unsupported shorthand. 150 boxes × 1 unit = 150 units; MOQ is an order floor. Direct add and shortlist import produce identical structured prices. |
| Finder | “no apparel,” conflicting preferences, no matches, ₹500 budget, unknown MOQ, quoted/unknown price. Exclusions are enforced and explanations reflect actual logic; diverse families precede color variants. |
| Enquiry | Configured/unconfigured channel, field errors, slow provider, timeout, concurrent same ID, lost response, retry, changed payload. Mock providers in automated tests; live receipt only in an authorized smoke test. |
| Mobile/keyboard | 320, 390, 768, 900, 1024, 1100 and 1440px; short landscape viewport; 200% zoom. Menu/drawer scroll, focus entry/trap/return, Escape and layers work with and without compare tray. |
| Accessibility | Contrast on actual backgrounds; meaningful labels/errors; complete tabs; video focus/captions; screen-reader sample. 44px internal target policy checked independently of WCAG exception rules. |
| Persistence/recovery | Storage denied/full, reload/back, multiple tabs, malformed old draft, failed chunk/IntersectionObserver. Clear recoverable save failure; visible content; no silent loss. |
| Media/exports | Representative production media, missing images, Studio PNG, multi-page catalogue PDF, logo bounds and cross-origin handling. Inspect actual output; controls existing is not sufficient. |
| SEO/performance | Missing slug status + noindex, query canonicals, sitemap/robots policy, OG, accurate structured data, cold/warm response and field Web Vitals. |

Use LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile as performance acceptance targets once measurement exists, not as current scores. See [Google Web Vitals guidance](https://web.dev/articles/vitals).

### Evidence index

- [Desktop hero](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/home-desktop.png)
- [Service intro and implementation copy](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/home-service-intro.png)
- [Service poster typography](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/home-service-posters.png)
- [Catalogue desktop sample](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/catalogue-desktop.png)
- [Mobile Filters/Compare collision](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/mobile-filter-compare-overlap.png)
- [Short viewport menu](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/mobile-menu-short-viewport.png)
- [Tablet header](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/tablet-header.png)
- [Product action placement](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/product-desktop.png)
- [Finder inputs](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/finder-desktop.png)
- [Finder false preference explanation](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/finder-exclusion-dom.txt)
- [Box start](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/box-desktop.png)
- [Studio](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/studio-desktop.png)
- [Catalogue builder](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/studio-catalogue.png)
- [Company Stores](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/company-stores-desktop.png)
- [Brief](/Users/nishantparihar/Desktop/monkcraft-gifting-co/docs/audits/full-review-2026-10-15/evidence/brief-desktop.png)

Screenshots are local review evidence. Some captures include initial image/reveal loading; loaded image checks succeeded and transient blank frames were not classified as permanent missing-image bugs. This audit establishes a broad actionable baseline, not proof that every possible bug has been found. Application remediation remains separate work.
