# Experience refinement implementation ledger

Approved spec: the user's “A cleaner, more sophisticated Monkcraft experience” plan in this chat.

- Preserve existing user changes: deleted hero v3/v4 and modified vercel.json. Hero v5 remains unchanged.
- Execute in existing preview/safe-vercel-v1 checkout; no deployment or package installation.
- Initial regression run: 6/6 tests failed for the intended missing behavior (contextual facets, cleared source, updated Box fields, structured shortlist price, safe browsing return).
- Sequence: navigation/state → filters/catalogue → product/action feedback → shared chrome/handoffs → validation/review.
- Ruling: use existing Next route handlers for read-only filter previews; no new dependencies.
- Completed navigation restoration, contextual catalogue filters, staged mobile sheet, product/card actions, comparison selection, and shared Box/Studio/Store browsing handoffs.
- Browser regression: five Box additions stayed on the filtered catalogue; a product opened from filtered page 2 and returned to page 2; mobile filter drafts cancelled without URL changes and three groups applied with one action; comparison tray stayed beneath the filter dialog; short-screen menu scrolled; 375/390/768/1024/1100/1440px layouts had no horizontal overflow.
- Review fix: clearing a mobile sheet after an invalid budget now resets its local inputs and allows Show results again. Reproduced failing state, then verified the corrected state in the browser.
- Removed the remaining global smooth-scroll rules and suppressed the intentional pre-hydration class warning from the motion script. Fresh browser load had no hydration errors.
- Verification: 10/10 Node tests, ESLint, TypeScript, catalogue validation, and production build passed. Catalogue validation still reports 108 source products without images. Actual 200% browser zoom was not exercised; responsive widths were checked.
