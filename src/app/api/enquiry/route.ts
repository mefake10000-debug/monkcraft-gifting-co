import { NextResponse } from "next/server";
import { checkEnquiryRateLimit } from "@/lib/enquiry/rateLimit";
import type { EnquiryApiResponse } from "@/lib/enquiry/types";
import { validateEnquiryPayload } from "@/lib/enquiry/validateServer";
import { findSalesTriageRunForQuoteRequest, isQuoteStorageConfigured, persistQuoteRequest } from "@/lib/automation/store";
import { isNotionAgentFeedbackSyncConfigured, isNotionLeadSyncConfigured, syncOneNotionAgentRun, syncOneNotionLead } from "@/lib/automation/notion";
import { prepareQuoteSupplierChecks } from "@/lib/automation/supplierChecks";

/**
 * Quote request intake API.
 *
 * Validates shape, applies spam/rate guards, then persists the request and
 * outbox event atomically. Notion sync is best-effort and independently retryable.
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

  // No enquiry contents are logged. The database RPC stores the request and
  // integration outbox event as one transaction, with durable idempotency.
  const stored = await persistQuoteRequest(payload);
  if (!stored.ok) {
    const status = stored.code === "storage_not_configured" ? 503 : stored.code === "submission_conflict" ? 409 : 502;
    return json({
      ok: false,
      code: stored.code,
      delivered: false,
      received: false,
      error: stored.code === "storage_not_configured"
        ? "Quote requests are not connected yet. Please use the email or WhatsApp option, or try again later."
        : stored.code === "submission_conflict"
          ? "This submission ID was already used for a different brief. Refresh the page and submit again."
          : "We could not safely save your quote request. Nothing was confirmed received; please retry or use another contact option.",
    }, status);
  }

  let notionSyncStatus = stored.notionSyncStatus;
  let supplierCheckStatus: "prepared" | "needs_mapping" | "pending" | "failed" = "pending";
  let supplierCheckCount = 0;
  const supplierPreparation = await prepareQuoteSupplierChecks(stored.requestId);
  if (supplierPreparation.status === "prepared") {
    supplierCheckCount = supplierPreparation.checkCount;
    supplierCheckStatus = supplierPreparation.mappingExceptions > 0 ? "needs_mapping" : "prepared";
  } else if (supplierPreparation.status === "failed") {
    supplierCheckStatus = "failed";
  }

  if (isNotionLeadSyncConfigured()) {
    const syncResult = await syncOneNotionLead(stored.requestId);
    if (syncResult === "synced") notionSyncStatus = "synced";
  }

  // The sales-triage row is created by the quote-request insert trigger. Try
  // syncing it now for a current Notion control room, but never gate receipt on
  // Notion; the protected cron retries failures later.
  if (isNotionAgentFeedbackSyncConfigured()) {
    try {
      const runId = await findSalesTriageRunForQuoteRequest(stored.requestId);
      if (runId) await syncOneNotionAgentRun(runId);
    } catch { /* The durable request and proposal remain available for retry. */ }
  }

  const response: EnquiryApiResponse = {
    ok: true,
    code: "received",
    delivered: false,
    received: true,
    requestId: stored.requestId,
    notionSyncStatus,
    supplierCheckStatus,
    supplierCheckCount,
  };
  return json(response, 200);
}

export async function GET() {
  const storageConfigured = isQuoteStorageConfigured();
  const notionConfigured = isNotionLeadSyncConfigured();
  return NextResponse.json({
    ok: storageConfigured,
    code: storageConfigured ? "ready" : "storage_not_configured",
    storageConfigured,
    notionConfigured,
    message: storageConfigured
      ? "Quote requests are stored durably. Notion sync may be pending until the workspace integration is configured."
      : "Quote request storage is disabled until the server database is configured.",
  });
}
