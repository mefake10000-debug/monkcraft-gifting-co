# Conversion enquiry — privacy & durable quote requests

**Status:** Durable quote request flow implemented; online capture stays disabled until the server database is configured.
**Audience:** Product, engineering, and business owners activating live channels.

## Current behaviour

1. Visitors prepare a quotation brief using the catalogue, shortlist, homepage consultation, Build a Box, or related experiences.
2. Product and programme drafts remain in browser storage until the customer explicitly submits the prepared quote request.
3. **Submit quote request** posts the structured contact, preference, product IDs/quantities, programme details, source, and summary to `POST /api/enquiry`.
4. The API validates the request and saves it through the protected database RPC. A durable request ID is assigned in the same transaction that writes a Notion sync event.
5. The UI says **Quote request saved** only after the database confirms storage. This does not mean a quote, price, stock hold, order, or delivery is confirmed.
6. Notion is a team control room; if its API is unavailable, the durable database request stays safe and Notion sync retries separately. Opening WhatsApp or email ≠ message delivered.

## Browser storage

| Data | Storage | Notes |
|------|---------|--------|
| Shortlist, box, Studio, company-store drafts | `localStorage` | Programme / product selections |
| Gifting brief programme fields | `localStorage` (`monkcraft-brief-v2`) | Occasion, budget, delivery notes, etc. |
| Contact (name, company, email, phone) | Written to brief on prepare | Remains in that browser; no server record until explicit submission |
| WhatsApp quote preference | Submitted only with quote-specific consent checkbox | Consent does not imply marketing consent |
| Email marketing permission | Separate, optional checkbox; false unless explicitly selected | Saved only with an explicitly submitted quote request; an unchecked box does not revoke prior permission |
| Campaign attribution | Current tab's `sessionStorage` | First and last touch use allowlisted UTM values, landing path, and referrer hostname; joined to a lead only on explicit quote submission |
| Logo binary | Source draft storage only | Brief keeps metadata; re-attach file when emailing |

Do **not** put API keys or private CRM credentials in `NEXT_PUBLIC_*` or client storage.

Staff-triggered `/ops/content` AI drafts may send the campaign channel, objective, audience description, brief, and keyword themes to the configured OpenAI API. Do not put customer, supplier, or other personal data into those campaign fields. Content and model usage are stored in the protected operations database and synced to the staff Notion calendar when configured. Drafting is optional and disabled without a server-side `OPENAI_API_KEY`; the app does not publish the generated content.

When an authorized staff member requests lead coaching, the server sends that lead's submitted quote brief and staff-logged interactions to the configured OpenAI API with `store: false`. The structured coaching result and the source interaction IDs are retained in the protected operations database and synced to Agent Review & Decisions in Notion when configured. Paste only relevant business conversation content; do not paste credentials, payment details, or unrelated sensitive personal data. Coaching is disabled without `OPENAI_API_KEY`; generated drafts are never sent automatically.

## Public handoff configuration

Copy `.env.example` → `.env.local` and set verified values only:

| Variable | Channel |
|----------|---------|
| `NEXT_PUBLIC_MONKCRAFT_ENQUIRY_EMAIL` | mailto quote draft |
| `NEXT_PUBLIC_MONKCRAFT_BOOKING_URL` | Consultation schedule |
| `NEXT_PUBLIC_MONKCRAFT_WHATSAPP_E164` | WhatsApp Business number, digits only |

## Durable storage and Notion activation

Apply all fourteen ordered migrations in `supabase/migrations/` to the Moncraft Supabase project. Configure the required server variables from `.env.example`:

- `MONKCRAFT_SUPABASE_URL`
- `MONKCRAFT_SUPABASE_SERVICE_ROLE_KEY`
- `MONKCRAFT_NOTION_TOKEN`
- `MONKCRAFT_NOTION_LEADS_DATA_SOURCE_ID`
- `MONKCRAFT_NOTION_SUPPLIER_CHECKS_DATA_SOURCE_ID`
- `MONKCRAFT_NOTION_QUOTES_ORDERS_DATA_SOURCE_ID`
- `MONKCRAFT_NOTION_CONTENT_DATA_SOURCE_ID` (when enabling Notion content sync)
- `MONKCRAFT_NOTION_AGENT_FEEDBACK_DATA_SOURCE_ID` (when enabling agent decision sync; the board needs a `Run ID` rich-text property)
- `CRON_SECRET`

Never set the service role key or Notion token as `NEXT_PUBLIC_*`. Notion setup, board creation, and the retry model are documented in `docs/automation/moncraft-website-notion-foundation.md`.

## Protections

1. **Server-side validation** — contact and summary required; honeypot field `website` must be empty.
2. **Rate limiting** — in-memory per forwarded IP; add edge/WAF protection for production scale.
3. **Durable idempotency** — database unique client submission ID returns the existing request for identical retries and rejects changed content under the same ID.
4. **Retryable sync** — quote request and outbox event are committed atomically. Notion is synchronized separately and retried by a protected cron route.
5. **Access control** — quote tables use RLS with no anon/authenticated policies; only the server service role can access them.
6. **Minimal logging** — request bodies and personal details are not logged.

Frontend validation is **not** server protection. Rate limits and RLS do not replace an approved privacy notice, access review, retention schedule, and deletion process.

## Go-live checklist

- [ ] All fourteen Supabase migrations applied and backup/retention policy selected
- [ ] Notion parent page shared with an internal integration; seven boards created once
- [ ] Server-only database and Notion secrets added to local and Vercel environments
- [ ] `CRON_SECRET` set; cron receives authorized requests
- [ ] Duplicate submission and temporary Notion outage recovery verified in a controlled environment
- [ ] Notion membership restricted to staff who need contact and quote data
- [ ] Privacy notice and deletion/subject-request process reviewed
- [ ] Marketing email permission wording, withdrawal process, and unsubscribe controls reviewed before connecting any campaign sender
- [ ] Public booking URL and WhatsApp handoff number verified

The consent register at `/ops/marketing` supports staff-recorded withdrawals with an evidence reference. No marketing email sender is connected. Add a working unsubscribe route and suppression check before any marketing send; this code does not by itself establish legal compliance.
