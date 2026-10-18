"use client";

import type {
  EnquiryApiResponse,
  EnquiryProductLine,
  EnquiryProgramme,
  EnquirySubmissionPayload,
} from "@/lib/enquiry/types";
import { readCampaignAttribution } from "@/lib/marketing/attribution";

export type ClientEnquiryInput = {
  name: string;
  company: string;
  email: string;
  phone?: string;
  summary: string;
  message?: string;
  source?: string;
  programme?: EnquiryProgramme;
  products?: EnquiryProductLine[];
  contactPreference?: "email" | "phone" | "whatsapp";
  whatsappUpdatesOptIn?: boolean;
  marketingEmailOptIn?: boolean;
  /** Stable id for this prepared enquiry — reuse on retry to prevent duplicates. */
  clientSubmissionId: string;
};

function newSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `mc${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export function createEnquirySubmissionId(): string {
  return newSubmissionId();
}

/**
 * POST a structured enquiry. Never treats network/HTTP failure as delivered.
 */
export async function submitEnquiryOnline(
  input: ClientEnquiryInput,
): Promise<{ status: number; body: EnquiryApiResponse }> {
  const payload: EnquirySubmissionPayload = {
    contact: {
      name: input.name.trim(),
      company: input.company.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || "",
    },
    programme: input.programme,
    products: input.products,
    contactPreference: input.contactPreference ?? "email",
    whatsappUpdatesOptIn: input.whatsappUpdatesOptIn === true,
    marketingEmailOptIn: input.marketingEmailOptIn === true,
    attribution: readCampaignAttribution(),
    summary: input.summary,
    message: input.message,
    source: input.source,
    clientSubmissionId: input.clientSubmissionId,
    website: "", // honeypot — must stay empty
  };

  let response: Response;
  try {
    response = await fetch("/api/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      status: 0,
      body: {
        ok: false,
        code: "delivery_failed",
        delivered: false,
        error:
          "Network error — the enquiry was not submitted. Check your connection and retry, or copy the summary.",
      },
    };
  }

  let body: EnquiryApiResponse;
  try {
    body = (await response.json()) as EnquiryApiResponse;
  } catch {
    body = {
      ok: false,
      code: "delivery_failed",
      delivered: false,
      error:
        "Unexpected server response — the enquiry was not confirmed. Copy the summary and try again.",
    };
  }

  // Receipt is distinct from downstream delivery or quote approval.
  if (body.received !== true) {
    body = { ...body, received: false, delivered: false, ok: false };
  }

  return { status: response.status, body };
}

/** Parse contact fields from a prepared summary text (best-effort). */
export function extractContactFromPrepText(prepText: string): {
  name: string;
  company: string;
  email: string;
  phone: string;
} {
  const pick = (label: string) => {
    const re = new RegExp(`^${label}:\\s*(.+)$`, "im");
    const match = prepText.match(re);
    const value = match?.[1]?.trim() ?? "";
    return value === "—" ? "" : value;
  };
  return {
    name: pick("Name"),
    company: pick("Company"),
    email: pick("Email"),
    phone: pick("Phone"),
  };
}
