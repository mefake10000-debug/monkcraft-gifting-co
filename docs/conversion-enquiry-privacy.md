# Conversion enquiry — privacy & server delivery

**Status:** Offline / handoff channels ready; online inbox delivery **disabled** until approved configuration.  
**Audience:** Product, engineering, and business owners activating live channels.

---

## Current behaviour (honest)

1. Visitors prepare a quotation / consultation summary (unified **My Gifting Brief**, homepage Consultation, Build a Box, etc.).
2. They review products / programme / contact, then can:
   - **Copy** the summary
   - **Submit quotation enquiry** online via `POST /api/enquiry` (succeeds only when server delivery is fully configured and the provider acknowledges accept)
   - Open a **mailto** draft (when enquiry email is configured)
   - Open a **booking schedule** (when booking URL is configured)
   - Open **WhatsApp** with a prefilled draft after reviewing the message (when a verified number is configured)
3. No screen claims the enquiry was “sent” or “delivered” unless the server returns `delivered: true` after provider confirmation.
4. Opening WhatsApp or an email app ≠ message delivered.

---

## Browser storage

| Data | Storage | Notes |
|------|---------|--------|
| Shortlist, box, Studio, company-store drafts | `localStorage` | Programme / product selections |
| Gifting brief programme fields | `localStorage` (`monkcraft-brief-v2`) | Occasion, budget, delivery notes, etc. |
| Contact (name, company, email, phone) | Written to brief **on prepare** | For recovery within the same browser; not synced across devices |
| Logo binary | Source draft storage only | Brief keeps metadata; re-attach file when emailing |

Do **not** put API keys or private CRM credentials in `NEXT_PUBLIC_*` or client storage.

---

## Public env activation (no secrets)

Copy `.env.example` → `.env.local` and set verified values only:

| Variable | Channel |
|----------|---------|
| `NEXT_PUBLIC_MONKCRAFT_ENQUIRY_EMAIL` | mailto “Request a Quote” |
| `NEXT_PUBLIC_MONKCRAFT_BOOKING_URL` | “Book a Consultation” (prefer Google Calendar appointment schedule HTTPS URL) |
| `NEXT_PUBLIC_MONKCRAFT_WHATSAPP_E164` | WhatsApp Business number, digits only (E.164 without `+`) |

Empty / invalid values keep the UI honest (“unavailable” / copy-only).

---

## Server delivery activation (approval required)

Online submit uses a Resend foundation via native `fetch` (no extra npm package). **All** of the following must be set in server env:

| Variable | Purpose |
|----------|---------|
| `MONKCRAFT_ENQUIRY_DELIVERY_ENABLED=true` | Explicit enable switch |
| `MONKCRAFT_ENQUIRY_PROVIDER=resend` | Only supported provider in this foundation |
| `MONKCRAFT_ENQUIRY_API_KEY` | Server-only provider secret |
| `MONKCRAFT_ENQUIRY_TO_EMAIL` | Inbox that receives structured enquiries |
| `MONKCRAFT_ENQUIRY_FROM_EMAIL` | Verified sender at the provider |

Without these, `POST /api/enquiry` validates and returns `503 delivery_not_configured` — it does **not** transmit customer data.

### Protections already in the boundary

1. **Server-side validation** — contact + summary required; honeypot field `website` must be empty.
2. **Rate limiting** — in-memory per IP / forwarded IP (single-process; add edge/WAF for production scale).
3. **Idempotency** — `clientSubmissionId` replays the prior response for ~30 minutes (reduces duplicate sends on double-click).
4. **Error handling** — clear retry / copy guidance; success UI only when `delivered: true`.
5. **Minimal logging** — enquiry bodies are not logged.

Frontend validation is **not** server protection.

---

## Approval checklist to go live

- [ ] Verified enquiry inbox (`MONKCRAFT_ENQUIRY_TO_EMAIL`)
- [ ] Approved provider + commercial terms (Resend foundation documented)
- [ ] Verified sender domain (`MONKCRAFT_ENQUIRY_FROM_EMAIL`)
- [ ] Server-only API key stored securely (not in git / not `NEXT_PUBLIC_*`)
- [ ] Privacy copy reviewed
- [ ] `MONKCRAFT_ENQUIRY_DELIVERY_ENABLED=true` only after a non-production test
- [ ] Public booking URL + WhatsApp number verified if those CTAs should appear live
