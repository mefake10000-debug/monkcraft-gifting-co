# Product photos fix — what happened and what we changed

*Written for the business owner. No technical knowledge needed.*

## 1. What customers saw
Product pictures on monkcraft.in did not appear (blank boxes). The rest of the site worked.

## 2. Why it happened
- The website has about **22,000 product photos (850 MB)**.
- Those photos were kept on one person's computer, **not in the website's code storage (GitHub)**. This was on purpose, because the folder is very large.
- When the site was last published, only the code went up. The photos were never uploaded, so the website had nothing to show.

Nothing was deleted and nobody did anything wrong. The photos were simply never part of what gets published.

## 3. What we recovered
Your friend sent a zip file (`Archive.zip`). We checked it against the product list:

| Check | Result |
|---|---|
| Photos the website expects | 22,251 |
| Found in the zip, or already inside the website's code | **22,251 (all of them)** |
| Damaged photos | 0 |

So **every product can have its photos back**. Six products (listed below) never had photos in the product list. They show "Photo unavailable", as they always did.

Products without photos in the product list: MGC-2027 Techie Pouch (Grey), MGC-2041 Trvl Spa Toiletry Pouch, MGC-4078 Custom-Made Affirmation Cards, MGC-4255 Certificate With Frame CF 04, MGC-4257 KN Trophies (KN-816). A sixth, MGC-1422 Karbon Backpack 14L Blue, has its photo added separately and is fine.

## 4. What changed in the website's code
1. **One new setting, `MONKCRAFT_MEDIA_BASE_URL`**: the web address of the place where the photos are stored. If it is empty, the site works exactly as before (useful on a developer's computer).
2. **A small "image loader"** (`src/lib/imageLoader.ts`): photos from the storage place are shown directly. This matters because Vercel's free plan only allows **5,000 picture-resizing jobs a month**, and this catalogue would use that up quickly, which would break pictures again.
3. **Tests** (`tests/media-host.test.cjs`) that check the above.

No product information, prices or pages were changed.

## 5. What is still to do (status: waiting for a decision)
| Step | Status |
|---|---|
| Code change written and tested on the branch `fix/product-images` | Done |
| Choose where to store the photos | **Needs your decision** (see section 6) |
| Upload the 21,994 photos to that place | Not started |
| Set the setting on Vercel and publish to the **staging** test site | Not started |
| You check the staging site | You |
| You publish to the live site | You |

## 6. The decision: where to store the photos
Vercel Blob (the choice you made) has a catch we found in Vercel's own price page: the free plan allows only **2,000 uploads per month**, and we need to upload 21,994. If the limit is passed, Blob is **switched off for 30 days**, which would take the photos down again. So the free plan cannot hold these photos.

| Option | Cost | Notes |
|---|---|---|
| **A. Vercel Pro plan + Blob** | about US$20 a month | Uploading and storing these photos costs well under US$1 of that. Also removes the picture-resizing limit, and the Hobby plan is meant for personal, non-commercial projects only, so a business site belongs on Pro. |
| **B. Cloudflare R2 (free)** | free up to 10 GB | Needs a new Cloudflare account (they may ask for a card). Photos load free of charge. A bit more setup. |

Our recommendation: **A** if you are happy to pay, otherwise **B**.

## 7. How to undo this
- The change lives on its own branch. Deleting the branch, or not publishing it, leaves the live site exactly as it is today.
- Clearing the `MONKCRAFT_MEDIA_BASE_URL` setting on Vercel makes the site go back to looking for photos on itself.
