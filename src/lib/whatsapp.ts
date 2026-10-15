/**
 * WhatsApp handoff helpers. Never invent a business number.
 * Opening WhatsApp ≠ message sent or delivered — the customer always reviews.
 */

import { getContactChannels, normalizeWhatsAppE164 } from "@/lib/contactConfig";

const MAX_PREFILL_CHARS = 1200;

export type WhatsAppPrefillInput = {
  occasion?: string;
  productLines?: Array<{ name: string; id?: string; quantity?: number | string }>;
  quantity?: string;
  budget?: string;
  branding?: string;
  notes?: string;
  company?: string;
};

export function buildWhatsAppPrefillMessage(input: WhatsAppPrefillInput): string {
  const products =
    input.productLines && input.productLines.length > 0
      ? input.productLines
          .slice(0, 8)
          .map((line) => {
            const qty =
              line.quantity != null && String(line.quantity).trim()
                ? ` ×${line.quantity}`
                : "";
            const id = line.id ? ` (${line.id})` : "";
            return `${line.name}${id}${qty}`;
          })
          .join("; ")
      : "";

  const parts = [
    "Hi Monkcraft — I'd like help with a corporate gifting programme.",
    input.company?.trim() ? `Company: ${input.company.trim()}` : "",
    input.occasion?.trim() ? `Occasion: ${input.occasion.trim()}` : "",
    products ? `Products: ${products}` : "",
    input.quantity?.trim() ? `Quantity: ${input.quantity.trim()}` : "",
    input.budget?.trim() ? `Budget: ${input.budget.trim()}` : "",
    input.branding?.trim() ? `Branding: ${input.branding.trim()}` : "",
    input.notes?.trim() ? `Notes: ${input.notes.trim()}` : "",
  ].filter(Boolean);

  let message = parts.join("\n");
  if (message.length > MAX_PREFILL_CHARS) {
    message = `${message.slice(0, MAX_PREFILL_CHARS - 1)}…`;
  }
  return message;
}

/** Build a wa.me URL. Returns null when no verified number is configured. */
export function buildWhatsAppHref(
  message?: string,
  e164 = getContactChannels().whatsappE164,
): string | null {
  const number = normalizeWhatsAppE164(e164);
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  const text = message?.trim();
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function whatsappConfigured(): boolean {
  return Boolean(getContactChannels().whatsappE164);
}
