# Monkcraft — Complete Website Deep Audit

**Date:** 15 Oct 2026 (IST)  
**Live site audited:** https://monkcraft-gifting-co.vercel.app/  
**Status:** READ-ONLY — no code edits, installs, deploys, or deletions performed for remediation.

---

## 1. Project verification

| Check | Result |
|--------|--------|
| Cursor rules | `.cursor/rules/monkcraft-core.mdc`, `monkcraft-visual.mdc`, `AGENTS.md` reviewed |
| Local branch | `preview/safe-vercel-v1` |
| Local HEAD | `186360628461721181f49a841a83c6b88f99b6c5` — *Lock Vercel framework to Next.js for Preview deploys.* |
| Production alias | Resolves to deployment **`dpl_28v2iuYvf9HmMWkjLskcUgbu38pV`** |
| Production URL | https://monkcraft-gifting-md78u5usp-monkcraft1.vercel.app (aliased to `monkcraft-gifting-co.vercel.app`) |
| Git commit on Vercel | **Not available** — production was uploaded via Vercel CLI (`--archive=tgz`), so no `gitSource` SHA is attached |
| Local vs deployed match | **Partial mismatch** — local working tree still has **uncommitted** BrandVideoBand / video re-encodes / PDF layout CSS that may or may not match the archive that was uploaded; treat source-line causes below as *correlated* to live behaviour, not byte-identical proof |
| Uncommitted work | Preserved (not stashed/discarded) |
| Playwright | Repo has no committed Playwright suite; live checks used **cursor-ide-browser** + **`vercel curl --scope monkcraft1`**. No packages installed. |

**Evidence folder:** `docs/audits/deep-audit-2026-10-15/evidence/` (+ raw captures in `tmp-audit/`).

---

## 2. Executive verdict

The site is **usable for discovery and quotation prep**, with mostly honest demo disclaimers. It is **not yet premium-trustworthy for kit maths or tax display**.

Highest confirmed live defect:

> **Build a Box treats supplier MOQ as quantity-per-box**, so 150 boxes with one notebook each become **7,500 units** and an inflated estimate.

---

## 3. Confirmed live defects

| ID | Page / component | What’s wrong | Evidence | Severity | Likely cause | Recommended correction | Verify |
|----|------------------|--------------|----------|----------|--------------|------------------------|--------|
| **D01** | `/gifts/box` · Products + Review | MOQ used as qty/box. Bloom Visionbook MOQ 50 + 150 boxes → **50/box · 7500 total · ₹18,37,500** | `evidence/box-moq-7500-products.png`, `evidence/box-review-moq-7500.png`; live a11y | **P0** | `AddToBoxButton` passes `minQuantity` into `addToBox(..., min)`; `setBoxProductQuantity` clamps to MOQ | Seed qty/box at **1** (or user choice). Keep MOQ as **order-floor across the programme**, shown separately. Never clamp per-box qty to MOQ | Add product MOQ=50, boxes=150, expect **1/box · 150 total** (or explicit user qty) |
| **D02** | PDP `/gifts/bloom-visionbook-a5-100-pages` | Price shows raw enum **`GST GST_EXCL`** / `+GST GST_EXCL` | `evidence/pdp-gst-excl.png` | **P1** | `product-detail` renders `GST {gstBasis}` literally | Map `GST_EXCL` → “excl. GST” (and peers); never show enum tokens | Open any fixed-price PDP |
| **D03** | Alias URLs | **404:** `/catalogue`, `/build-a-box`, `/gift-finder`, `/brief` | `tmp-audit/*.hdr` HTTP/2 404 | **P2** | No redirects; only canonical `/gifts`, `/gifts/box`, `/gifts/find`, `/gifts/brief` | Add redirects or remove stale marketing links if any | Hit each alias |
| **D04** | `/gifts/brief` | “Still needed… add a box” while Linked configs shows a live box (`1 product · 150 boxes`) | `evidence/brief-still-needed-contradiction.png` | **P1** | Missing-checklist uses `brief.sources.box`, not live `monkcraft-box-v1` draft | Auto-link live box draft, or copy that matches sources | Open Brief with box in localStorage |
| **D05** | Brief vs Box | Brief says packaging noted; Box says “Packaging to be confirmed” | Live copy comparison | **P2** | Pending packaging treated as present | Same status vocabulary everywhere | Box pending packaging → Brief |
| **D06** | Box from PDP | Packaging step skipped; packaging stays pending through Quote | Box header through step 5 | **P2** | Add-from-catalogue jumps to products | Soft-require packaging before Quote, or start on Packaging | Add to box from PDP |
| **D07** | PDP | Summary/description duplicated | PDP screenshot + a11y | **P3** | Both `summary` and `description` rendered when identical | Dedupe when equal | Open Bloom Visionbook |
| **D08** | PDP specs | “Stock Update Date: 11 Sept **2026**” (future relative to audit day) | PDP screenshot | **P3** | Catalogue export date field | Validate / format dates; hide nonsense | Spot-check PDPs |
| **D09** | Homepage marketing slides | PDF slide assets include baked titles **plus** prior HTML duplication (mitigated on current build by CTA-only cards); slides still show “together together” typo & Gemini watermark in artwork | Visual review of `*-v3.jpg` on live homepage | **P2** (asset) | Source PDF / generation artifacts | Replace slide art or crop text; remove watermark | Homepage What we do + Gift ideas |

Severity: **P0** blocks trustworthy quoting · **P1** trust/clarity · **P2** friction · **P3** polish.

---

## 4. Customer journeys (live)

| # | Journey | Result |
|---|---------|--------|
| 1 | Home → Gift Ideas → Catalogue → Product → Brief/Quote | Works via `/gifts?occasion=…` and `/gifts/brief` |
| 2 | Catalogue → Product → Box → Brief | Works on `/gifts` (not `/catalogue`) |
| 3 | Build a Box full flow | Flow works; **D01/D06** inside |
| 4 | Studio → logo → Undo/Redo | Controls **present**; undo/redo disabled until history |
| 5 | Catalogue Builder / PDF | `/studio?mode=catalogue`; Preview honestly says **browser Print → Save as PDF** (no fake PDF engine) |
| 6 | Company Stores → configure → preview → enquire | Works; demo banners honest; empty preview until merch selected |
| 7 | Gift Finder → recommendations → Brief | Works; honest “rule-based — not generative AI” |

**Unnecessary clicks / confusion (design, not always hard bugs):**

- Multiple parallel quote entry points: hero Find My Gifts, Get a Quote, My Brief, homepage Enquire, Brief Prepare.
- Gift Ideas cards: two CTAs each (“Browse catalogue” / “Ask us to curate”) without a single primary.
- Box is a 5-step wizard; packaging often unfinished (D06) while Quote remains reachable.

---

## 5. Known risk reproduction

| Risk | Verdict |
|------|---------|
| MOQ as qty-per-box | **CONFIRMED** (D01) |
| Studio undo/redo broken | **Not confirmed broken** — UI present; deeper history edge cases not exhaustively fuzzed |
| Brief state vs live drafts | **CONFIRMED** contradiction (D04/D05) |
| Incorrect GST wording | **CONFIRMED** (D02) |
| Duplicated PDP description | **CONFIRMED** (D07) |
| Fake AI / fake PDF claims | **No major fake claims found** on live copy for Finder/Studio/CS |

---

## 6. Visual / responsive notes

**Preserved:** Homepage hero `monkcraft-hero-v5.jpg` present on production.

**Brand system:** Fraunces + DM Sans, Royal Purple / Black Olive / Anti-Flash observed on tools pages.

**Issues observed:**

- Marketing PDF posters: text-in-image + Gemini watermark (D09); repetitive slide vocabulary across cards.
- Catalogue grid: dense; filter drawer UX previously left sticky issues (earlier fix in source — not re-broken in this pass).
- Mobile: hamburger Menu on small widths; full multi-breakpoint matrix (375 / 430 / 768 / 1280 / 1440 / 1920) was **sampled**, not exhaustively screenshot-catalogued for every page at every size. Treat layout regressions as **partial coverage**.

---

## 7. What is working well (honest positives)

- Primary nav is lean (4 destinations + quote CTA).
- Enquiry delivery correctly gated (no accidental live email when unset).
- Gift Finder discloses rule-based matching.
- Company Store demo labelling is clear.
- Real catalogue prices/images load on `/gifts` in this deployment.

---

## 8. Recovery plan (coordinated — **do not implement until approved**)

### Phase A — Trust blockers (1–3 days)
1. Fix **D01** MOQ vs qty-per-box (unit tests for 150 boxes × 1 unit).
2. Fix **D02** GST label mapping.
3. Fix **D04/D05** Brief ↔ Box source sync / copy.
4. Soft-gate Quote until packaging chosen or explicitly skipped (**D06**).

### Phase B — Journey simplification (3–7 days)
5. One primary CTA per major page; demote secondary actions.
6. Unified “My Brief” as the only quote hub (hero/nav/footer agree).
7. Redirect legacy aliases (**D03**).
8. Dedupe PDP fields (**D07**); date hygiene (**D08**).

### Phase C — Visual premium pass (1–2 weeks)
9. Replace/crop PDF slide assets (remove watermark & typos) (**D09**).
10. Preserve hero v5; tighten Gift Ideas / What we do rhythm without reintroducing HTML+PDF text clash.
11. Studio: guided empty states + clearer primary action; keep honest Print-PDF until a real PDF library is approved.
12. Full Playwright journey suite at 375 / 768 / 1280 / 1440 (install only after approval).

### Success criteria
- Buyer always knows the **one next step**.
- Kit maths match intent (units/box ≠ supplier MOQ).
- No raw enum tokens in UI.
- Brief never contradicts live drafts.
- Zero fake “AI PDF / live store / live email” claims.

---

## 9. STOP

**No remediation implemented.** Awaiting your approval of Phase A (minimum) or the full recovery plan before any changes.
