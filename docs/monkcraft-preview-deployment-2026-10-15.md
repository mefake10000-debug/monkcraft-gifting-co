# Monkcraft preview deployment plan

**Status:** Preview deployed and verified
**Date:** 2026-10-15

## Scope

- Deploy the current working tree to a Vercel **Preview** deployment only. Do not promote it or change the production alias or DNS.
- Keep enquiry delivery disabled, and retain the current demo labels for Company Stores and Studio.
- Keep Vercel Preview Protection in place. The project’s existing previews redirect unauthenticated requests to Vercel SSO.
- Do not copy the local 804 MB catalogue-media symlink into the deployment archive.

## Catalogue media

The product data (4,257 products) is in the repository, while `public/catalogue-media` is a local symlink excluded by `.vercelignore`. For this preview, `/catalogue-media/*` is rewritten to the existing ready production deployment `monkcraft-gifting-1et2e38j6-monkcraft1.vercel.app`, which already hosts the media paths. This keeps the preview archive small and avoids a new storage service or upload. The preview therefore depends on that media deployment remaining available; external object storage is still required for a durable independent production media strategy.

## Verification and release steps

1. Run unit tests, ESLint, TypeScript, and the optimized Next.js build.
2. Deploy with the Vercel CLI using the linked `monkcraft-gifting-co` project and Preview target; do not use `--prod`.
3. Confirm Vercel reports Ready and verify the preview URL and representative catalogue/media paths while signed in.
4. Report the preview URL, verification results, and the media-origin dependency. Production promotion remains a separate release decision.

## Current verification

- `npm test`: 10/10 pass.
- `npm run lint`: pass.
- `npx tsc --noEmit`: pass.
- `npm run build`: pass; 140 routes generated.
- Existing media origin: Vercel deployment `dpl_J8He3Wjn8UeEU8KtFaHGHc3Nura2`, Ready, target Production.
- The preview has Vercel authentication protection; unauthenticated requests redirect to Vercel SSO.
- Vercel Preview environment variables: none configured, so enquiry delivery credentials are absent.

## Deployment result

- Preview URL: https://monkcraft-gifting-k8c9q6aa9-monkcraft1.vercel.app
- Deployment ID: `dpl_9PD9LbiGHw7Nvj481bjb8QEWTQT5`
- Vercel state: **Ready**, target **Preview**, with `vercel_authentication` protection.
- Vercel remote build: pass; 140 routes generated.
- Authenticated `GET /gifts`: returned the rendered catalogue page.
- Authenticated representative `/catalogue-media/...webp`: returned **HTTP 200**, `image/webp` (17,438 bytes) through the media rewrite.
- Production aliases and DNS were not changed.
