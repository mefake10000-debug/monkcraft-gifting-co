import { NextResponse } from "next/server";
import {
  deliverEnquiry,
  getEnquiryDeliveryConfig,
} from "@/lib/enquiry/delivery";
import {
  getIdempotentEnquiry,
  setIdempotentEnquiry,
} from "@/lib/enquiry/idempotency";
import { checkEnquiryRateLimit } from "@/lib/enquiry/rateLimit";
import type { EnquiryApiResponse } from "@/lib/enquiry/types";
import { validateEnquiryPayload } from "@/lib/enquiry/validateServer";

/**
 * Enquiry delivery API.
 *
 * Validates shape, applies spam/rate/idempotency guards, then attempts
 * server-side delivery only when an approved provider is fully configured.
 * Never claims success without provider acknowledgement.
 *
 * See docs/conversion-enquiry-privacy.md
 */

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function json(body: EnquiryApiResponse, status: number) {
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      {
        ok: false,
        code: "invalid_json",
        delivered: false,
        error: "Request body must be JSON.",
      },
      400,
    );
  }

  // Replay known submission ids before rate-limit so honest retries / double-clicks
  // do not burn the budget.
  if (body && typeof body === "object") {
    const maybeId = (body as { clientSubmissionId?: unknown }).clientSubmissionId;
    if (typeof maybeId === "string" && maybeId.trim()) {
      const prior = getIdempotentEnquiry(maybeId.trim());
      if (prior) {
        return json(prior.response, prior.status);
      }
    }
  }

  const rate = checkEnquiryRateLimit(clientKey(request));
  if (!rate.allowed) {
    return json(
      {
        ok: false,
        code: "rate_limited",
        delivered: false,
        error:
          "Too many enquiry attempts from this network. Please wait and try again, or copy your summary.",
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      429,
    );
  }

  const validated = validateEnquiryPayload(body);
  if (!validated.ok) {
    if (validated.code === "spam_rejected") {
      // Quiet rejection — do not reveal honeypot details.
      return json(
        {
          ok: false,
          code: "spam_rejected",
          delivered: false,
          error: "Unable to accept this submission.",
        },
        400,
      );
    }
    return json(
      {
        ok: false,
        code: "validation_failed",
        delivered: false,
        error: validated.error,
        fieldErrors: validated.fieldErrors,
      },
      400,
    );
  }

  const { payload } = validated;

  // Intentionally do not log enquiry contents (contact + programme details).
  const delivery = await deliverEnquiry(payload);

  if (delivery.delivered) {
    const response: EnquiryApiResponse = {
      ok: true,
      code: "delivered",
      delivered: true,
    };
    if (payload.clientSubmissionId) {
      setIdempotentEnquiry(payload.clientSubmissionId, response, 200);
    }
    return json(response, 200);
  }

  const status =
    delivery.code === "delivery_not_configured"
      ? 503
      : delivery.code === "provider_error"
        ? 502
        : 500;

  const response: EnquiryApiResponse = {
    ok: false,
    code: delivery.code,
    delivered: false,
    error: delivery.error,
    deliveryConfigured: getEnquiryDeliveryConfig().configured,
  };

  // Cache provider failures for the same id so double-clicks do not hammer a
  // broken provider. Do NOT cache delivery_not_configured — once an approved
  // provider is activated, the same honest clientSubmissionId must be able to
  // deliver instead of replaying a stale 503 for ~30 minutes.
  if (
    payload.clientSubmissionId &&
    delivery.code !== "delivery_not_configured"
  ) {
    setIdempotentEnquiry(payload.clientSubmissionId, response, status);
  }

  return json(response, status);
}

export async function GET() {
  const config = getEnquiryDeliveryConfig();
  return NextResponse.json({
    ok: false,
    code: config.configured ? "ready" : "delivery_not_configured",
    deliveryConfigured: config.configured,
    provider: config.provider,
    // Never expose which specific secrets are missing in production detail —
    // only a boolean readiness signal for honest UI.
    message: config.configured
      ? "POST a validated enquiry body. Delivery is enabled for this environment."
      : "POST a validated enquiry body. Delivery remains disabled until an approved provider is fully configured.",
  });
}
