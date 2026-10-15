# My Gifting Brief — Explainer Film Pre-Production

**Title:** My Gifting Brief  
**Status:** PRE-PRODUCTION — awaiting owner approval  
**Duration target (final later):** ~70–75 seconds (0:00–1:15)  
**Tone:** Premium, warm, conversational brand film (not a software tutorial)  

**Story:** Recurring adult HR manager (Meera) planning welcome gifts for 150 employees — continuous animated world through 8 scenes.

**Gate:** Do **not** render the final 1080p / website cut / captions / VO+music until the owner approves:

1. Animatic (8 scene boards)  
2. Visual styleframes  
3. Product references  

This is a **separate** film from the What We Do brand film. Character lessons may be reused; files live here only.

---

## How to review the animatic

With the Next.js app running, open:

`/videos/gifting-brief/preprod/animatic/index.html`

Or open that file directly in a browser from disk. Use **Play animatic** to advance boards on the 0:00–1:15 VO timeline. Every board is labeled **ANIMATIC NOT FINAL**.

---

## Package locations

| Deliverable | Path |
|-------------|------|
| This brief + docs | `docs/brand-film/gifting-brief/` |
| Approval gate | `docs/brand-film/gifting-brief/APPROVAL.md` |
| Pre-prod media | `public/videos/gifting-brief/preprod/` |
| Timed animatic viewer | `public/videos/gifting-brief/preprod/animatic/index.html` |
| Character sheets | `public/videos/gifting-brief/preprod/characters/` |
| Styleframes | `public/videos/gifting-brief/preprod/styleframes/` |
| Scene boards | `public/videos/gifting-brief/preprod/animatic/` |
| Product + logo refs | `public/videos/gifting-brief/preprod/product-refs/` |
| Product contact sheet | `public/videos/gifting-brief/preprod/product-refs/product-reference-contact-sheet.jpg` |
| Poster concept (real logo) | `public/videos/gifting-brief/preprod/poster/poster-thumbnail-real-logo.jpg` |
| Shot list + VO timing | `docs/brand-film/gifting-brief/shot-list.md` |
| Product reference sheet | `docs/brand-film/gifting-brief/product-references.md` |
| Character bible | `docs/brand-film/gifting-brief/character-bible.md` |
| Style notes | `docs/brand-film/gifting-brief/visual-style.md` |
| VO script | `docs/brand-film/gifting-brief/vo-script.md` |

**Logo honesty:** Scene 08 board + poster use a **real** composite of `public/brand/Monkcraft-Black-Horizontal.png`. Scene 08 plate without logo is kept as `scene-08-board-plate.jpg`. Do not use AI-approximated Monkcraft wordmarks in final.

---

## Agnes API status

At pre-production time:

- `AGNES_API_KEY` — **MISSING**
- `AGNES_API_TOKEN` — **MISSING**
- `APIHUB_AGNES_API_KEY` — **MISSING**

Image boards were generated with Cursor `GenerateImage` (labeled ANIMATIC / STYLEFRAME / CONCEPT). No Agnes VO, music, or video draft clips were created.

### How to enable Agnes for Phase 2

1. Get an API key from [apihub.agnes-ai.com](https://apihub.agnes-ai.com).  
2. In the project root, add to a local env file that is **not** committed (e.g. `.env.local`):

```bash
AGNES_API_KEY=your_key_here
```

(or `AGNES_API_TOKEN` / `APIHUB_AGNES_API_KEY` — any one is enough)

3. Export in the shell before generation:

```bash
export AGNES_API_KEY=your_key_here
```

4. Confirm with the Agnes skill smoke test (no video by default):

```bash
python ~/.agents/skills/agnes-ai-generation/scripts/agnes_api.py smoke-test
```

Never paste the key into chat or commit it to git.

---

## What Phase 2 will produce (only after approval)

- Final 1920×1080 MP4  
- Website-friendly compressed cut  
- Captions for muted playback  
- Professional VO (conversational Indian English) + music + sound design  
- Final thumbnail (not “CONCEPT”)  

Reply using the exact text in `APPROVAL.md`.
