# Runtime audit evidence

Phase A audit artifacts only. Application fixes require separate owner approval.

The 2026-10-15 audit targets `https://monkcraft-gifting-co.vercel.app/` directly. Vercel deployment `dpl_28v2iuYvf9HmMWkjLskcUgbu38pV` reports SHA `186360628461721181f49a841a83c6b88f99b6c5`, branch `preview/safe-vercel-v1`, CLI source and `gitDirty: 1`. A clean checkout of the recorded SHA is not an exact deployment reconstruction.

Synthetic test browser contexts are separate from the owner's browser. Enquiry-delivery POSTs and external customer-contact navigations are blocked by audit instrumentation. Only read-only lookup/recommendation calls and browser-local draft preparation are exercised.
