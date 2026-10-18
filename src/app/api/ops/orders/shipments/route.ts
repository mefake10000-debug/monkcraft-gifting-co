import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { createFulfillmentShipment } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const orderId = typeof input.orderId === "string" ? input.orderId.trim() : "";
  const shipmentCode = typeof input.shipmentCode === "string" ? input.shipmentCode.trim() : "";
  const destination = typeof input.destination === "string" ? input.destination.trim() : "";
  const actor = typeof input.actor === "string" ? input.actor.trim().slice(0, 120) : "";
  if (!uuidPattern.test(orderId) || !/^[A-Za-z0-9][A-Za-z0-9_-]{2,59}$/.test(shipmentCode) || !destination || destination.length > 500 || !actor) {
    return NextResponse.json({ ok: false, error: "Order, shipment code, destination, and staff name are required." }, { status: 400 });
  }
  try {
    await createFulfillmentShipment({
      orderId, shipmentCode, destination,
      carrier: typeof input.carrier === "string" ? input.carrier.trim().slice(0, 120) : "",
      trackingReference: typeof input.trackingReference === "string" ? input.trackingReference.trim().slice(0, 200) : "",
      actor,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Shipment could not be created. Confirm the order passed quality check." }, { status: 409 });
  }
}
