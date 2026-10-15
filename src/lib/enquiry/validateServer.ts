import { looksLikeEmail } from "@/lib/contactConfig";
import type {
  EnquiryProductLine,
  EnquiryProgramme,
  EnquirySubmissionPayload,
} from "@/lib/enquiry/types";

export type ServerValidationResult =
  | { ok: true; payload: NormalizedEnquiry }
  | {
      ok: false;
      code: "validation_failed" | "spam_rejected";
      error: string;
      fieldErrors?: Record<string, string>;
    };

export type NormalizedEnquiry = {
  contact: {
    name: string;
    company: string;
    email: string;
    phone: string;
  };
  programme: EnquiryProgramme;
  products: EnquiryProductLine[];
  summary: string;
  message: string;
  source: string;
  clientSubmissionId: string;
};

function asTrimmedString(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function asOptionalString(value: unknown, max: number): string {
  return asTrimmedString(value, max);
}

function normalizeProducts(value: unknown): EnquiryProductLine[] {
  if (!Array.isArray(value)) return [];
  const lines: EnquiryProductLine[] = [];
  for (const raw of value.slice(0, 80)) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const name = asTrimmedString(item.name, 200);
    if (!name) continue;
    lines.push({
      id: asOptionalString(item.id, 80) || undefined,
      slug: asOptionalString(item.slug, 160) || undefined,
      name,
      quantity:
        typeof item.quantity === "number"
          ? item.quantity
          : asOptionalString(item.quantity, 40) || undefined,
      priceLabel: asOptionalString(item.priceLabel, 80) || undefined,
      categoryName: asOptionalString(item.categoryName, 120) || undefined,
    });
  }
  return lines;
}

function normalizeProgramme(value: unknown): EnquiryProgramme {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  return {
    occasion: asOptionalString(raw.occasion, 200) || undefined,
    audience: asOptionalString(raw.audience, 200) || undefined,
    recipientCount: asOptionalString(raw.recipientCount, 80) || undefined,
    budgetPerRecipient:
      asOptionalString(raw.budgetPerRecipient, 120) || undefined,
    branding: asOptionalString(raw.branding, 400) || undefined,
    packagingPrefs: asOptionalString(raw.packagingPrefs, 400) || undefined,
    deliveryDate: asOptionalString(raw.deliveryDate, 160) || undefined,
    deliveryLocation: asOptionalString(raw.deliveryLocation, 400) || undefined,
    notes: asOptionalString(raw.notes, 2000) || undefined,
  };
}

/**
 * Validate and normalize a raw JSON body. Never trusts client-only checks.
 */
export function validateEnquiryPayload(
  body: unknown,
): ServerValidationResult {
  if (!body || typeof body !== "object") {
    return {
      ok: false,
      code: "validation_failed",
      error: "Enquiry body is required.",
      fieldErrors: { form: "Enquiry body is required." },
    };
  }

  const raw = body as EnquirySubmissionPayload & Record<string, unknown>;

  // Honeypot — pretend success-shaped rejection without revealing the trap.
  const honeypot = asTrimmedString(raw.website, 200);
  if (honeypot) {
    return {
      ok: false,
      code: "spam_rejected",
      error: "Unable to accept this submission.",
    };
  }

  const contactRaw =
    raw.contact && typeof raw.contact === "object"
      ? (raw.contact as Record<string, unknown>)
      : {
          name: raw.name,
          company: raw.company,
          email: raw.email,
          phone: raw.phone,
        };

  const name = asTrimmedString(contactRaw.name, 120);
  const company = asTrimmedString(contactRaw.company, 160);
  const email = asTrimmedString(contactRaw.email, 254);
  const phone = asTrimmedString(contactRaw.phone, 40);
  const summary = asTrimmedString(raw.summary, 12000);
  const message = asTrimmedString(raw.message, 4000);
  const source = asTrimmedString(raw.source, 80) || "unknown";
  const clientSubmissionId = asTrimmedString(raw.clientSubmissionId, 80);
  const programme = normalizeProgramme(raw.programme);
  const products = normalizeProducts(raw.products);

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Name is required.";
  if (!company) fieldErrors.company = "Company is required.";
  if (!email) fieldErrors.email = "Work email is required.";
  else if (!looksLikeEmail(email)) fieldErrors.email = "Work email is invalid.";
  if (!summary && !message) {
    fieldErrors.summary = "Add a prepared summary or message.";
  }
  if (clientSubmissionId && !/^[A-Za-z0-9_-]{8,80}$/.test(clientSubmissionId)) {
    fieldErrors.clientSubmissionId = "Invalid submission id.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      code: "validation_failed",
      error: "Fix the highlighted fields.",
      fieldErrors,
    };
  }

  return {
    ok: true,
    payload: {
      contact: { name, company, email, phone },
      programme,
      products,
      summary,
      message,
      source,
      clientSubmissionId,
    },
  };
}
