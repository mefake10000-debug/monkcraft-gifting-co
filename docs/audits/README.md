# Runtime audit evidence

Audit reports and follow-up remediation are indexed below. The 16 October 2026 full review includes the current issue register, scorecard, journey map, and fixes made from the explicit implementation request.

- [Full audit and prioritized improvement plan — 16 October 2026](full-review-2026-10-16/REPORT.md)
- [Catalogue and launch-gate follow-up — 17 October 2026](full-review-2026-10-16/FOLLOW-UP-2026-10-17.md)
- [Post-implementation live audit — 16 October 2026](full-review-2026-10-15/POST-IMPLEMENTATION.md)
- [Initial full review — 15 October 2026](full-review-2026-10-15/REPORT.md)
- [Deep audit — 15 October 2026](deep-audit-2026-10-15/REPORT.md)

The 16 October 2026 report was updated after a Playwright route and viewport pass: nine primary routes were checked at 390×844, 768×1024, 1024×768, and 1440×1000; no horizontal document overflow or browser errors were found. Catalogue pagination was verified to show and focus the first result after Next on mobile and desktop. The current runtime catalogue has six missing product photos; the older source-export quality report still records 108 and must not be used as the current count. Exact supplier imagery remains pending approved files or usage permission. No official social URLs could be verified.

The 2026-10-15 audit targets `https://monkcraft-gifting-co.vercel.app/` directly. Vercel deployment `dpl_28v2iuYvf9HmMWkjLskcUgbu38pV` reports SHA `186360628461721181f49a841a83c6b88f99b6c5`, branch `preview/safe-vercel-v1`, CLI source and `gitDirty: 1`. A clean checkout of the recorded SHA is not an exact deployment reconstruction.

Synthetic test browser contexts are separate from the owner's browser. Enquiry-delivery POSTs and external customer-contact navigations are blocked by audit instrumentation. Only read-only lookup/recommendation calls and browser-local draft preparation are exercised.
