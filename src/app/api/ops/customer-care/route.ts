import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { listCustomerCareTasks, updateCustomerCareTask } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const taskTypes = new Set(["Delivery check-in", "Issue follow-up", "Feedback request"]);
const statuses = new Set(["Open", "Draft ready", "Needs review", "Waiting on customer", "Escalated", "Resolved", "Dismissed"]);
const channels = new Set(["Email", "Phone", "WhatsApp"]);

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, serverTime: new Date().toISOString(), tasks: await listCustomerCareTasks() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Customer-care tasks are unavailable. Confirm database setup and apply the customer-care migration." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const taskId = typeof input.taskId === "string" && uuidPattern.test(input.taskId) ? input.taskId : null;
  const orderId = typeof input.orderId === "string" && uuidPattern.test(input.orderId) ? input.orderId : null;
  const taskType = typeof input.taskType === "string" ? input.taskType : null;
  const title = typeof input.title === "string" ? input.title.trim().slice(0, 300) : "";
  const status = typeof input.status === "string" ? input.status : "";
  const contactChannel = typeof input.contactChannel === "string" && channels.has(input.contactChannel) ? input.contactChannel : null;
  const actor = typeof input.actor === "string" ? input.actor.trim().slice(0, 120) : "";
  const rawDue = typeof input.dueAt === "string" ? input.dueAt.trim() : "";
  const dueAt = rawDue ? new Date(rawDue) : null;
  const draftMessage = typeof input.draftMessage === "string" ? input.draftMessage.trim().slice(0, 4000) : "";
  const outcome = typeof input.outcome === "string" ? input.outcome.trim().slice(0, 2000) : "";
  if ((input.taskId !== null && input.taskId !== undefined && !taskId) || (!taskId && (!orderId || !taskType || !taskTypes.has(taskType) || !title)) || !statuses.has(status) || !actor || (input.contactChannel && !contactChannel) || (rawDue && (!dueAt || Number.isNaN(dueAt.getTime())))) {
    return NextResponse.json({ ok: false, error: "Provide a valid task, status, order and audit name." }, { status: 400 });
  }
  try {
    await updateCustomerCareTask({
      taskId, orderId, taskType, title: title || null, status,
      owner: typeof input.owner === "string" ? input.owner.trim().slice(0, 120) : "",
      dueAt: dueAt?.toISOString() ?? null, contactChannel,
      draftMessage, outcome, actor,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Customer-care update failed. Add a message draft for Draft ready and a resolution note for Resolved." }, { status: 409 });
  }
}
