import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { isLeadPipelineStatus } from "@/lib/automation/leadPipeline";
import { updateOperationsLead } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const requestId = typeof payload.requestId === "string" ? payload.requestId.trim() : "";
  const status = payload.status;
  const actor = typeof payload.actor === "string" ? payload.actor.trim().slice(0, 120) : "";
  const owner = typeof payload.owner === "string" ? payload.owner.trim().slice(0, 120) : "";
  const nextAction = typeof payload.nextAction === "string" ? payload.nextAction.trim().slice(0, 300) : "";
  const note = typeof payload.note === "string" ? payload.note.trim().slice(0, 1000) : "";
  const rawDue = typeof payload.nextActionAt === "string" ? payload.nextActionAt.trim() : "";
  const due = rawDue ? new Date(rawDue) : null;
  if (!uuidPattern.test(requestId) || !isLeadPipelineStatus(status) || !actor || (rawDue && (!due || Number.isNaN(due.getTime()))) || (rawDue && !nextAction)) {
    return NextResponse.json({ ok: false, error: "Provide a valid lead, pipeline stage, owner, and follow-up action/date." }, { status: 400 });
  }
  try {
    const rows = await updateOperationsLead({
      requestId, status, actor, owner, nextAction,
      nextActionAt: due?.toISOString() ?? null, note,
    });
    const lead = rows[0];
    if (!lead) return NextResponse.json({ ok: false, error: "Lead was not updated." }, { status: 404 });
    return NextResponse.json({ ok: true, lead: { id: lead.id, status: lead.status, notionSyncStatus: lead.notion_sync_status } });
  } catch {
    return NextResponse.json({ ok: false, error: "Lead update failed. Verify the sales pipeline migration and retry." }, { status: 503 });
  }
}
