/**
 * Structured quotation enquiry payload (client → server).
 * Keep contact + programme fields explicit for validation and email formatting.
 */

export type EnquiryProductLine = {
  id?: string;
  slug?: string;
  name: string;
  quantity?: number | string;
  priceLabel?: string;
  categoryName?: string;
};

export type EnquiryProgramme = {
  occasion?: string;
  audience?: string;
  recipientCount?: string;
  budgetPerRecipient?: string;
  branding?: string;
  packagingPrefs?: string;
  deliveryDate?: string;
  dispatchType?: "single-city" | "multi-point" | "international" | "unsure";
  deliveryLocation?: string;
  notes?: string;
};

export type EnquiryContactPayload = {
  name: string;
  company: string;
  email: string;
  phone?: string;
};

export type EnquiryContactPreference = "email" | "phone" | "whatsapp";

export type EnquiryAttributionTouch = {
  source: string;
  medium: string;
  campaign?: string;
  term?: string;
  content?: string;
  landingPath: string;
  referrerHost?: string;
  recordedAt: string;
};

export type EnquiryAttribution = { firstTouch: EnquiryAttributionTouch; lastTouch: EnquiryAttributionTouch };

export type EnquirySubmissionPayload = {
  contact: EnquiryContactPayload;
  programme?: EnquiryProgramme;
  products?: EnquiryProductLine[];
  /** Full prepared summary text (also used when structured fields are sparse). */
  summary: string;
  /** Short free-form message if any. */
  message?: string;
  /** Journey origin, e.g. gifts-brief | homepage-consultation | box | company-store */
  source?: string;
  contactPreference?: EnquiryContactPreference;
  whatsappUpdatesOptIn?: boolean;
  /** Separate optional marketing permission; never inferred from quote submission or WhatsApp consent. */
  marketingEmailOptIn?: boolean;
  attribution?: EnquiryAttribution;
  /**
   * Client-generated idempotency key (UUID). Replays within the window
   * return the prior response without re-attempting delivery.
   */
  clientSubmissionId?: string;
  /** Honeypot — must be empty. Bots that fill it are rejected quietly. */
  website?: string;
};

export type EnquiryDeliveryCode =
  | "delivered"
  | "delivery_not_configured"
  | "delivery_failed"
  | "validation_failed"
  | "invalid_json"
  | "rate_limited"
  | "duplicate_in_flight"
  | "spam_rejected"
  | "provider_error";

export type EnquiryApiResponse = {
  ok: boolean;
  code: EnquiryDeliveryCode | string;
  error?: string;
  delivered: boolean;
  fieldErrors?: Record<string, string>;
  /** Present when a prior identical submission was already accepted/rejected. */
  duplicate?: boolean;
  retryAfterSeconds?: number;
  deliveryConfigured?: boolean;
  received?: boolean;
  requestId?: string;
  notionSyncStatus?: "pending" | "synced" | "failed";
  supplierCheckStatus?: "prepared" | "needs_mapping" | "pending" | "failed";
  supplierCheckCount?: number;
};
