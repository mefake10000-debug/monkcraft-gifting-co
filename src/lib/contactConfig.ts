/**
 * Central Monkcraft conversion-channel configuration.
 *
 * Values come ONLY from public env vars. Empty / unset means the channel is
 * unavailable — never invent an email, WhatsApp number, or booking URL.
 *
 * Set in `.env.local` (see `.env.example`):
 * - NEXT_PUBLIC_MONKCRAFT_ENQUIRY_EMAIL
 * - NEXT_PUBLIC_MONKCRAFT_BOOKING_URL
 * - NEXT_PUBLIC_MONKCRAFT_WHATSAPP_E164  (digits only, country code, no +)
 */

export type ContactChannels = {
  enquiryEmail: string | null;
  bookingUrl: string | null;
  whatsappE164: string | null;
  hasEnquiryEmail: boolean;
  hasBookingUrl: boolean;
  hasWhatsApp: boolean;
  /** True when any live handoff channel is configured. */
  hasLiveChannel: boolean;
};

function trimOrNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Basic email shape check — not a substitute for server validation. */
export function looksLikeEmail(value: string): boolean {
  const v = value.trim();
  if (!v || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Accept only digit strings suitable for wa.me (E.164 without +). */
export function normalizeWhatsAppE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  // Reasonable intl length: country code + national number
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

/**
 * Accept a verified https booking URL. Prefer Google Calendar appointment
 * schedules; other https hosts are allowed only when you set them deliberately
 * in env (never invent availability or slots in-app).
 */
export function isPlausibleBookingUrl(raw: string | null | undefined): string | null {
  const value = trimOrNull(raw ?? undefined);
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    // Block obviously placeholder hosts
    const host = url.hostname.toLowerCase();
    if (
      host === "example.com" ||
      host === "localhost" ||
      host.endsWith(".example") ||
      host === "127.0.0.1"
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function getContactChannels(): ContactChannels {
  const enquiryEmailRaw = trimOrNull(process.env.NEXT_PUBLIC_MONKCRAFT_ENQUIRY_EMAIL);
  const enquiryEmail =
    enquiryEmailRaw && looksLikeEmail(enquiryEmailRaw) ? enquiryEmailRaw : null;

  const bookingUrl = isPlausibleBookingUrl(
    process.env.NEXT_PUBLIC_MONKCRAFT_BOOKING_URL,
  );

  const whatsappE164 = normalizeWhatsAppE164(
    process.env.NEXT_PUBLIC_MONKCRAFT_WHATSAPP_E164,
  );

  return {
    enquiryEmail,
    bookingUrl,
    whatsappE164,
    hasEnquiryEmail: Boolean(enquiryEmail),
    hasBookingUrl: Boolean(bookingUrl),
    hasWhatsApp: Boolean(whatsappE164),
    hasLiveChannel: Boolean(enquiryEmail || bookingUrl || whatsappE164),
  };
}

export function bookingCtaLabel(channels = getContactChannels()): string {
  return channels.hasBookingUrl ? "Book a Call" : "Request a Quote";
}

export function bookingCtaHref(channels = getContactChannels()): string {
  return channels.bookingUrl ?? "/#enquire";
}

export function heroConsultCtaLabel(channels = getContactChannels()): string {
  return channels.hasBookingUrl
    ? "Book a Gifting Consultation"
    : "Talk to Monkcraft";
}

export function heroConsultCtaHref(channels = getContactChannels()): string {
  return channels.bookingUrl ?? "#enquire";
}
