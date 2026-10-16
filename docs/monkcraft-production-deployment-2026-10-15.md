# Monkcraft production deployment

**Status:** Deployed and verified
**Date:** 2026-10-15

## Release

- Production alias: https://monkcraft-gifting-co.vercel.app
- Deployment: https://monkcraft-gifting-jxlw0llo4-monkcraft1.vercel.app
- Deployment ID: `dpl_5yZNeZ4eF3KJzqngmUss6i1vtRoS`
- Vercel state: **Ready**, target **Production**; alias assigned to the release.
- Vercel production build: pass; TypeScript passed and all 140 routes were generated.

## Post-deploy checks

- Authenticated `GET /gifts`: returned the rendered catalogue page.
- Authenticated representative `/catalogue-media/...webp`: returned **HTTP 200**, `image/webp` (17,438 bytes) through the media rewrite.
- Vercel Production environment variables: none configured; enquiry delivery credentials are absent.
- Company Stores and Studio remain demo surfaces in the deployed build.
- The catalogue media rewrite depends on the existing deployment `monkcraft-gifting-1et2e38j6-monkcraft1.vercel.app`; standalone object-storage migration remains future work.
- No DNS or environment-variable changes were made.
