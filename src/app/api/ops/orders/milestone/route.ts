import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { ORDER_MILESTONE_STAGES, type OrderMilestoneStage, type OrderMilestoneStatus } from "@/lib/automation/orderWorkflow";
import { updateOrderMilestone } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const milestoneStatuses = new Set(["Pending", "In progress", "Blocked", "Complete"]);
function safeUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : "invalid"; } catch { return "invalid"; }
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const orderId = typeof input.orderId === "string" ? input.orderId.trim() : "";
  const stage = input.stage;
  const status = input.status;
  const actor = typeof input.actor === "string" ? input.actor.trim().slice(0, 120) : "";
  const evidence = safeUrl(input.evidenceUrl);
  const rawDue = typeof input.dueAt === "string" ? input.dueAt.trim() : "";
  const dueAt = rawDue ? new Date(rawDue) : null;
  if (!uuidPattern.test(orderId) || typeof stage !== "string" || !(ORDER_MILESTONE_STAGES as readonly string[]).includes(stage) || typeof status !== "string" || !milestoneStatuses.has(status) || !actor || evidence === "invalid" || (rawDue && (!dueAt || Number.isNaN(dueAt.getTime())))) {
    return NextResponse.json({ ok: false, error: "Provide a valid stage, status, owner, and optional evidence URL/date." }, { status: 400 });
  }
  try {
    await updateOrderMilestone({
      orderId, stage: stage as OrderMilestoneStage, status: status as OrderMilestoneStatus,
      owner: typeof input.owner === "string" ? input.owner.trim().slice(0, 120) : "",
      dueAt: dueAt?.toISOString() ?? null, evidenceUrl: evidence, actor,
      notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 1000) : "",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Stage update failed. Check predecessor stages and required evidence." }, { status: 409 });
  }
}
