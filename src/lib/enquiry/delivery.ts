import {
  buildEnquiryEmailHtml,
  buildEnquiryEmailSubject,
  buildEnquiryEmailText,
} from "@/lib/enquiry/emailDocument";
import type { NormalizedEnquiry } from "@/lib/enquiry/validateServer";
import { looksLikeEmail } from "@/lib/contactConfig";

/**
 * Server-side enquiry delivery boundary.
 *
 * Live sending requires ALL of:
 * - MONKCRAFT_ENQUIRY_DELIVERY_ENABLED=true
 * - MONKCRAFT_ENQUIRY_PROVIDER=resend
 * - MONKCRAFT_ENQUIRY_API_KEY (server-only)
 * - MONKCRAFT_ENQUIRY_TO_EMAIL
 * - MONKCRAFT_ENQUIRY_FROM_EMAIL
 *
 * Without that set, deliverEnquiry never transmits customer data.
 * Do not enable without business approval of provider + destination.
 */

export type DeliveryConfigStatus = {
  configured: boolean;
  provider: string | null;
  missing: string[];
};

export type DeliveryResult =
  | {
      delivered: true;
      provider: string;
      providerMessageId?: string;
    }
  | {
      delivered: false;
      code: "delivery_not_configured" | "delivery_failed" | "provider_error";
      error: string;
    };

function trimEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function getEnquiryDeliveryConfig(): DeliveryConfigStatus {
  const enabled = trimEnv("MONKCRAFT_ENQUIRY_DELIVERY_ENABLED").toLowerCase();
  const provider = trimEnv("MONKCRAFT_ENQUIRY_PROVIDER").toLowerCase() || null;
  const apiKey = trimEnv("MONKCRAFT_ENQUIRY_API_KEY");
  const toEmail = trimEnv("MONKCRAFT_ENQUIRY_TO_EMAIL");
  const fromEmail = trimEnv("MONKCRAFT_ENQUIRY_FROM_EMAIL");

  const missing: string[] = [];
  if (enabled !== "true") missing.push("MONKCRAFT_ENQUIRY_DELIVERY_ENABLED=true");
  if (!provider) missing.push("MONKCRAFT_ENQUIRY_PROVIDER");
  else if (provider !== "resend") {
    missing.push("MONKCRAFT_ENQUIRY_PROVIDER=resend (only supported foundation)");
  }
  if (!apiKey) missing.push("MONKCRAFT_ENQUIRY_API_KEY");
  if (!toEmail || !looksLikeEmail(toEmail)) {
    missing.push("MONKCRAFT_ENQUIRY_TO_EMAIL (valid inbox)");
  }
  if (!fromEmail || !looksLikeEmail(fromEmail)) {
    missing.push("MONKCRAFT_ENQUIRY_FROM_EMAIL (verified sender)");
  }

  return {
    configured: missing.length === 0,
    provider: missing.length === 0 ? provider : null,
    missing,
  };
}

export function isEnquiryDeliveryConfigured(): boolean {
  return getEnquiryDeliveryConfig().configured;
}

async function deliverViaResend(
  enquiry: NormalizedEnquiry,
): Promise<DeliveryResult> {
  const apiKey = trimEnv("MONKCRAFT_ENQUIRY_API_KEY");
  const toEmail = trimEnv("MONKCRAFT_ENQUIRY_TO_EMAIL");
  const fromEmail = trimEnv("MONKCRAFT_ENQUIRY_FROM_EMAIL");
  const replyTo = enquiry.contact.email;

  const subject = buildEnquiryEmailSubject(enquiry);
  const text = buildEnquiryEmailText(enquiry);
  const html = buildEnquiryEmailHtml(enquiry);

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: replyTo,
        subject,
        text,
        html,
      }),
    });
  } catch {
    return {
      delivered: false,
      code: "delivery_failed",
      error:
        "Could not reach the email provider. Your summary was not delivered — copy it and try again later, or use email / WhatsApp.",
    };
  }

  if (!response.ok) {
    // Do not log response body (may echo addresses). Status only.
    void response.status;
    return {
      delivered: false,
      code: "provider_error",
      error:
        "The email provider rejected the enquiry. Nothing was confirmed delivered — keep your summary and retry or use another channel.",
    };
  }

  let providerMessageId: string | undefined;
  try {
    const data = (await response.json()) as { id?: string };
    if (typeof data.id === "string") providerMessageId = data.id;
  } catch {
    // Provider accepted the HTTP request; id is optional for our success gate.
  }

  return {
    delivered: true,
    provider: "resend",
    providerMessageId,
  };
}

/**
 * Attempt delivery. Returns delivered:true ONLY after provider acknowledgement.
 */
export async function deliverEnquiry(
  enquiry: NormalizedEnquiry,
): Promise<DeliveryResult> {
  const config = getEnquiryDeliveryConfig();
  if (!config.configured) {
    return {
      delivered: false,
      code: "delivery_not_configured",
      error:
        "Online enquiry delivery is not connected. Copy your prepared summary and share it with Monkcraft, or ask the team to configure an approved server-side provider.",
    };
  }

  if (config.provider === "resend") {
    return deliverViaResend(enquiry);
  }

  return {
    delivered: false,
    code: "delivery_not_configured",
    error: "No approved delivery provider is active.",
  };
}
