import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { createOrderFromAcceptedQuote, listOperationsOrders } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const result = await listOperationsOrders();
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Orders are unavailable. Confirm database configuration and apply fulfilment migrations." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const requestId = typeof input.requestId === "string" ? input.requestId.trim() : "";
  const orderCode = typeof input.orderCode === "string" ? input.orderCode.trim() : "";
  const quoteVersion = typeof input.quoteVersion === "string" ? input.quoteVersion.trim() : "";
  const approvalReference = typeof input.approvalReference === "string" ? input.approvalReference.trim() : "";
  const actor = typeof input.actor === "string" ? input.actor.trim() : "";
  const customerApprovedAt = typeof input.customerApprovedAt === "string" ? new Date(input.customerApprovedAt) : null;
  const promisedDeliveryDate = typeof input.promisedDeliveryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.promisedDeliveryDate) ? input.promisedDeliveryDate : null;
  if (!uuidPattern.test(requestId) || !/^[A-Za-z0-9][A-Za-z0-9_-]{2,59}$/.test(orderCode) || !quoteVersion || quoteVersion.length > 80 || !approvalReference || approvalReference.length > 500 || !actor || !customerApprovedAt || Number.isNaN(customerApprovedAt.getTime()) || customerApprovedAt.getTime() > Date.now()) {
    return NextResponse.json({ ok: false, error: "A Won lead, order code, quote version, customer approval time, approval reference, and staff name are required." }, { status: 400 });
  }
  try {
    const rows = await createOrderFromAcceptedQuote({
      requestId, orderCode, quoteVersion, customerApprovedAt: customerApprovedAt.toISOString(), approvalReference,
      customerPoReference: typeof input.customerPoReference === "string" ? input.customerPoReference.trim().slice(0, 120) : "",
      promisedDeliveryDate, actor: actor.slice(0, 120),
    });
    const order = rows[0];
    if (!order) return NextResponse.json({ ok: false, error: "Order was not created." }, { status: 409 });
    return NextResponse.json({ ok: true, orderId: order.id, orderCode: order.order_code, status: order.status });
  } catch {
    return NextResponse.json({ ok: false, error: "Order creation failed. Verify the lead is Won and no order already exists." }, { status: 409 });
  }
}
