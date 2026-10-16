import type { NormalizedEnquiry } from "@/lib/enquiry/validateServer";

/**
 * Professional structured enquiry email (plain text + simple HTML).
 * Used only when an approved delivery provider is configured.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function productLines(enquiry: NormalizedEnquiry): string[] {
  if (enquiry.products.length === 0) return ["— none listed —"];
  return enquiry.products.map((item) => {
    const qty =
      item.quantity != null && String(item.quantity).trim()
        ? ` · qty ${item.quantity}`
        : "";
    const price = item.priceLabel?.trim()
      ? ` · ${item.priceLabel.trim()}`
      : "";
    const id = item.id ? ` (id: ${item.id})` : "";
    const cat = item.categoryName ? ` · ${item.categoryName}` : "";
    return `- ${item.name}${id}${qty}${price}${cat}`;
  });
}

export function buildEnquiryEmailSubject(enquiry: NormalizedEnquiry): string {
  const company = enquiry.contact.company || "Unknown company";
  const occasion = enquiry.programme.occasion?.trim();
  return occasion
    ? `Monkcraft quotation enquiry — ${company} — ${occasion}`
    : `Monkcraft quotation enquiry — ${company}`;
}

export function buildEnquiryEmailText(enquiry: NormalizedEnquiry): string {
  const p = enquiry.programme;
  const lines = [
    "Monkcraft quotation enquiry",
    "===========================",
    "",
    "Contact",
    `Name: ${enquiry.contact.name}`,
    `Company: ${enquiry.contact.company}`,
    `Email: ${enquiry.contact.email}`,
    `Phone: ${enquiry.contact.phone || "—"}`,
    `Source: ${enquiry.source}`,
    "",
    "Programme",
    `Occasion: ${p.occasion || "—"}`,
    `Audience: ${p.audience || "—"}`,
    `Recipients / quantity: ${p.recipientCount || "—"}`,
    `Budget per recipient/box: ${p.budgetPerRecipient || "—"}`,
    `Branding: ${p.branding || "—"}`,
    `Packaging: ${p.packagingPrefs || "—"}`,
    `Desired delivery date: ${p.deliveryDate || "—"}`,
    `Dispatch plan: ${p.dispatchType || "To be confirmed"}`,
    `Delivery location / notes: ${p.deliveryLocation || "—"}`,
    `Additional notes: ${p.notes || enquiry.message || "—"}`,
    "",
    "Products",
    ...productLines(enquiry),
    "",
    "Prepared customer summary",
    "-------------------------",
    enquiry.summary || enquiry.message || "—",
    "",
    "Internal note: Catalogue prices (if shown) are labels only — not a final quote.",
    "Desired dates are requests, not confirmed commitments.",
  ];
  return lines.join("\n");
}

export function buildEnquiryEmailHtml(enquiry: NormalizedEnquiry): string {
  const p = enquiry.programme;
  const products = productLines(enquiry)
    .map((line) => `<li>${escapeHtml(line.replace(/^- /, ""))}</li>`)
    .join("");
  const summary = escapeHtml(enquiry.summary || enquiry.message || "—").replace(
    /\n/g,
    "<br />",
  );

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Monkcraft quotation enquiry</title></head>
<body style="font-family:Georgia,serif;color:#3F3F37;line-height:1.5;max-width:640px;margin:0 auto;padding:24px;">
  <h1 style="font-size:22px;color:#662F90;">Monkcraft quotation enquiry</h1>
  <h2 style="font-size:16px;">Contact</h2>
  <p>
    <strong>${escapeHtml(enquiry.contact.name)}</strong><br />
    ${escapeHtml(enquiry.contact.company)}<br />
    <a href="mailto:${escapeHtml(enquiry.contact.email)}">${escapeHtml(enquiry.contact.email)}</a><br />
    Phone: ${escapeHtml(enquiry.contact.phone || "—")}<br />
    Source: ${escapeHtml(enquiry.source)}
  </p>
  <h2 style="font-size:16px;">Programme</h2>
  <ul>
    <li>Occasion: ${escapeHtml(p.occasion || "—")}</li>
    <li>Audience: ${escapeHtml(p.audience || "—")}</li>
    <li>Recipients / quantity: ${escapeHtml(p.recipientCount || "—")}</li>
    <li>Budget: ${escapeHtml(p.budgetPerRecipient || "—")}</li>
    <li>Branding: ${escapeHtml(p.branding || "—")}</li>
    <li>Packaging: ${escapeHtml(p.packagingPrefs || "—")}</li>
    <li>Desired delivery date: ${escapeHtml(p.deliveryDate || "—")}</li>
    <li>Dispatch plan: ${escapeHtml(p.dispatchType || "To be confirmed")}</li>
    <li>Delivery location: ${escapeHtml(p.deliveryLocation || "—")}</li>
    <li>Notes: ${escapeHtml(p.notes || enquiry.message || "—")}</li>
  </ul>
  <h2 style="font-size:16px;">Products</h2>
  <ul>${products}</ul>
  <h2 style="font-size:16px;">Prepared customer summary</h2>
  <p style="white-space:pre-wrap;background:#F1F2F2;padding:16px;border-radius:12px;">${summary}</p>
  <p style="font-size:13px;color:#666;">Catalogue prices (if shown) are labels only — not a final quote. Desired dates are requests, not confirmed commitments.</p>
</body>
</html>`;
}
