# Monkcraft bulk-buyer journey specification

## Goal

Make it obvious how a business buyer selects products, requests a bulk quote, and optionally configures those products into a gift kit. Keep one concise review-and-contact flow across both paths.

## Buyer rules

- This is a quote-request experience, not an online payment checkout or confirmed order.
- A buyer may quote standard products without building a box.
- A standard product line starts at 5 units, or a higher verified supplier MOQ.
- A built gift programme starts at 25 complete kits. Each selected gift defaults to 1 unit per kit; show per-kit quantity and programme total separately. Validate supplier MOQ against total programme units.
- Packaging is optional for a product-only quote. Kit packaging prices remain “confirmed in quote”; buyers can choose a style or ask the Monkcraft team to recommend it.
- The public contact handoff uses info@monkcraft.in and WhatsApp +91 7483221188. Online email delivery remains disabled until a verified sender and delivery provider are configured. No UI may claim a message was sent until delivery is acknowledged.
- “Book a call” opens the configured Google Calendar appointment URL. Never invent a URL or imply an appointment was booked by the website.
- Catalogue downloads that require GST qualification must not claim legal taxpayer verification without a live approved verification source. Format checks and registry checks are distinct. Do not email or retain customer data without configured delivery and clear notice.
- Preserve the current brand palette/type, mobile-first clarity, product imagery, existing catalogue selections, and recoverable browser drafts.

## Success criteria

1. From any product card or detail page, a business buyer can add a product to one visible quote list, change quantity, navigate away, return, and continue to a quote without entering Build a Box.
2. Standard product quantities cannot be requested below 5 or a higher supplier MOQ. The error is visible and does not silently change typed values.
3. Build a Box keeps 25 kits minimum and defaults to 1 unit per product per kit, with correct total calculations. Product MOQ is checked against total programme quantity, never conflated with units per kit.
4. The quote summary includes products, quantities, packaging choice/status, dispatch locations/type, contact, occasion and optional budget/branding where supplied. Missing optional details do not block a quote.
5. One compact review step presents the quote summary and available handoffs. Product-only and kit requests share the same final contact experience.
6. Email and WhatsApp links use the supplied public contact details. Form-based email delivery remains honestly gated until the sender and provider are configured.
7. Phone widths 320–430px and desktop/tablet widths 768–1440px have no horizontal overflow, obscured text, conflicting sticky controls, or dense multi-step navigation.
8. GST format validation is never described as registry verification. Catalogue-email automation must fail honestly when provider/inbox/GST lookup configuration is absent.

## Configuration blockers

Production currently has no Vercel environment variables. Live delivery needs a verified enquiry inbox, verified sender, Resend API key, and explicit delivery enable flag. Live WhatsApp needs the business number. Booking needs the public Google Calendar appointment URL. True GST registration-status verification needs a chosen authorized registry/API provider and credentials. Keep these features correctly gated until supplied; build and test the integration boundaries now.
