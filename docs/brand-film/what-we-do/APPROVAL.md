# Approval Status

## Done

- [x] Owner APPROVE Phase 2 to proceed (with animatic/product upgrade request)
- [x] Major animatic V2 rebuild (boards + viewer)
- [x] Stronger real SKU set + contact sheet
- [x] Character ensemble refresh (adult professional)
- [x] Styleframes: materials macro + sketch→3D

## Phase 2 status

- [x] Fallback 1080p brand film with VO (`public/videos/monkcraft-what-we-do-brand-film.mp4`)
- [x] Poster JPG
- [ ] Agnes-native motion segments (upgrade path when key available)
- [ ] Captions / muted / stems
- [ ] Homepage wiring (intentionally not done)

**Agnes status:** keys still **MISSING** — used advanced stills fallback (same class as gifting-brief explainer).

### Exact key setup for video render

1. Create a key at https://apihub.agnes-ai.com  
2. In project root (untracked), e.g. `.env.local`:

```bash
AGNES_API_KEY=your_key_here
```

3. Export in the terminal for this session:

```bash
export AGNES_API_KEY=your_key_here
```

4. Verify (no video by default):

```bash
python ~/.agents/skills/agnes-ai-generation/scripts/agnes_api.py smoke-test
```

5. Reply: `AGNES KEY READY — continue Phase 2 video`

Never paste the key into chat or commit it.

## Needs owner eye next

1. Open revised animatic: `/videos/what-we-do/preprod/animatic/index.html`  
2. Confirm V2 SKUs (see `product-references.md` + contact sheet)  
3. Note any scene still weak  
4. Provide Agnes key when ready for motion render  
