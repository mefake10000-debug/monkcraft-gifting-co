import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { updateFulfillmentShipment } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const shipmentStatuses = new Set(["Preparing", "Dispatched", "In transit", "Delivered", "Exception", "Returned"]);
function safeUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : "invalid"; } catch { return "invalid"; }
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const shipmentId = typeof input.shipmentId === "string" ? input.shipmentId.trim() : "";
  const status = typeof input.status === "string" ? input.status : "";
  const actor = typeof input.actor === "string" ? input.actor.trim().slice(0, 120) : "";
  const proof = safeUrl(input.proofOfDeliveryUrl);
  const rawDeliveredAt = typeof input.deliveredAt === "string" ? input.deliveredAt.trim() : "";
  const deliveredAt = rawDeliveredAt ? new Date(rawDeliveredAt) : null;
  if (!uuidPattern.test(shipmentId) || !shipmentStatuses.has(status) || !actor || proof === "invalid" || (rawDeliveredAt && (!deliveredAt || Number.isNaN(deliveredAt.getTime())))) {
    return NextResponse.json({ ok: false, error: "Provide a valid shipment, status, and staff name." }, { status: 400 });
  }
  try {
    await updateFulfillmentShipment({
      shipmentId, status, actor,
      carrier: typeof input.carrier === "string" ? input.carrier.trim().slice(0, 120) : "",
      trackingReference: typeof input.trackingReference === "string" ? input.trackingReference.trim().slice(0, 200) : "",
      dispatchedAt: status === "Dispatched" ? new Date().toISOString() : null,
      deliveredAt: deliveredAt?.toISOString() ?? null,
      proofOfDeliveryUrl: proof,
      exceptionNotes: typeof input.exceptionNotes === "string" ? input.exceptionNotes.trim().slice(0, 1000) : "",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Shipment update failed. Check the allowed transition, dispatch gate, and delivery proof." }, { status: 409 });
  }
}
