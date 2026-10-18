import { NextResponse } from "next/server";
import { buildSupplierAvailabilityTemplate } from "@/lib/automation/whatsapp";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import {
  claimSupplierCheckWhatsAppSend,
  completeSupplierCheckWhatsAppSend,
  failSupplierCheckWhatsAppSend,
} from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function whatsAppConfig() {
  const accessToken = process.env.MONKCRAFT_WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.MONKCRAFT_WHATSAPP_PHONE_NUMBER_ID?.trim();
  const graphVersion = process.env.MONKCRAFT_WHATSAPP_GRAPH_API_VERSION?.trim();
  const templateName = process.env.MONKCRAFT_SUPPLIER_AVAILABILITY_TEMPLATE?.trim();
  const language = process.env.MONKCRAFT_SUPPLIER_TEMPLATE_LANGUAGE?.trim() || "en";
  if (!accessToken || !phoneNumberId || !/^\d+$/.test(phoneNumberId) || !/^v\d+\.\d+$/.test(graphVersion || "") || !templateName) return null;
  return { accessToken, phoneNumberId, graphVersion, templateName, language };
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const config = whatsAppConfig();
  if (!config) return NextResponse.json({ ok: false, code: "whatsapp_not_configured" }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const checkId = typeof payload.checkId === "string" ? payload.checkId.trim() : "";
  const actor = typeof payload.actor === "string" ? payload.actor.trim().slice(0, 120) : "operations";
  if (!uuidPattern.test(checkId)) return NextResponse.json({ ok: false, error: "A valid supplier check ID is required." }, { status: 400 });

  let claim;
  try { claim = await claimSupplierCheckWhatsAppSend(checkId, actor); }
  catch { return NextResponse.json({ ok: false, error: "Supplier check is not approved, mapped, active, and opted in." }, { status: 409 }); }
  const job = claim[0];
  if (!job) return NextResponse.json({ ok: false, error: "Supplier check is not ready to send." }, { status: 409 });

  let message: ReturnType<typeof buildSupplierAvailabilityTemplate>;
  try {
    message = buildSupplierAvailabilityTemplate({
      phone: job.supplier_phone,
      templateName: config.templateName,
      language: config.language,
      checkReference: job.check_reference,
      requestReference: job.request_reference,
      products: job.products_summary,
      totalUnits: job.total_units,
      requestedDeliveryDate: job.requested_delivery_date,
    });
  } catch {
    await failSupplierCheckWhatsAppSend(checkId, "invalid_template_data").catch(() => undefined);
    return NextResponse.json({ ok: false, error: "Supplier check data is incomplete; it was sent to manual review." }, { status: 409 });
  }

  let response: Response;
  try {
    response = await fetch(`https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    await failSupplierCheckWhatsAppSend(checkId, "network_outcome_unknown").catch(() => undefined);
    return NextResponse.json({ ok: false, error: "Message outcome is unknown. Check the WhatsApp account before any retry." }, { status: 502 });
  }

  const providerBody = await response.json().catch(() => null) as { messages?: Array<{ id?: unknown }> } | null;
  const providerMessageId = providerBody?.messages?.[0]?.id;
  if (!response.ok || typeof providerMessageId !== "string") {
    await failSupplierCheckWhatsAppSend(checkId, `meta_http_${response.status}`).catch(() => undefined);
    return NextResponse.json({ ok: false, error: "WhatsApp did not confirm the template send. Check the supplier check before retrying." }, { status: 502 });
  }

  try {
    await completeSupplierCheckWhatsAppSend(checkId, providerMessageId);
  } catch {
    // The provider may have accepted the send; the database state remains Sending
    // so an operator reconciles the provider message ID before attempting again.
    return NextResponse.json({ ok: false, code: "manual_reconciliation_required" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, checkId, status: "Sent" });
}
