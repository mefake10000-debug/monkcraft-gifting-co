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

## 5. Where the photos now live
The photos are stored on **Cloudinary** (a free image-hosting service; free plan, no card).

- Address of the photo library: `https://res.cloudinary.com/jvc1ihc6/image/upload`
- All **21,995** photos the website uses were uploaded. None failed. A check of 200 random photos found all 200 live, and a local copy of the site showed every photo on a catalogue page (163) and a product page (7) loading from Cloudinary.
- Cloudinary's free plan gives 25 "credits" a month. Storing the photos uses under 1. Visitors downloading photos use the rest at about 1 credit per 1 GB (roughly 800,000 photo downloads a month). Browsers keep photos for 30 days, so repeat visits don't count again. Nothing is ever charged on the free plan.

The upload tool is `scripts/upload-media-to-cloudinary.mjs`. It reads the Cloudinary login from a private file on the computer (not in the project) and is safe to run again.

## 6. What is still to do
| Step | Status |
|---|---|
| Code change written and tested on the branch `fix/product-images` | Done |
| Next.js security upgrade (16.4.0 to 16.4.3) | Done |
| Photos uploaded to Cloudinary and checked | Done |
| Tell Vercel where the photos are (the setting `MONKCRAFT_MEDIA_BASE_URL`, for Production and Preview) | Not started |
| Create `main` and `staging` branches and publish the fix to the **staging** test site | Not started |
| You check the staging site | You |
| You publish to the live site | You |

## 7. How to undo this
- The change lives on its own branch. Deleting the branch, or not publishing it, leaves the live site exactly as it is today.
- Clearing the `MONKCRAFT_MEDIA_BASE_URL` setting on Vercel makes the site go back to looking for photos on itself.
- When everything is finished, delete the private login file and the upload key in Cloudinary.
