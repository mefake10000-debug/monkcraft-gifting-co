import { NextResponse } from "next/server";
import { generateLeadCopilotRecommendation, leadCopilotAiConfigured } from "@/lib/automation/leadCopilotAgent";
import { getSuggestedFollowUpAt } from "@/lib/automation/leadCopilot";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { createLeadCopilotRun, listOperationsLeads } from "@/lib/automation/store";
import { isNotionAgentFeedbackSyncConfigured, syncOneNotionAgentRun } from "@/lib/automation/notion";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!leadCopilotAiConfigured()) return NextResponse.json({ ok: false, error: "AI coaching is not configured. Add the server-side OpenAI API key to enable it." }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const requestId = body && typeof body === "object" && typeof (body as Record<string, unknown>).requestId === "string"
    ? ((body as Record<string, unknown>).requestId as string).trim() : "";
  if (!uuidPattern.test(requestId)) return NextResponse.json({ ok: false, error: "Provide a valid lead request ID." }, { status: 400 });

  try {
    const lead = (await listOperationsLeads()).find((item) => item.id === requestId);
    if (!lead) return NextResponse.json({ ok: false, error: "Lead not found." }, { status: 404 });
    const generated = await generateLeadCopilotRecommendation(lead);
    const followUpAt = getSuggestedFollowUpAt(generated.recommendation.timingWindow);
    const runs = await createLeadCopilotRun({
      requestId,
      interactionIds: (lead.interactions ?? []).map((entry) => entry.id),
      proposedAction: { ...generated.recommendation, suggestedFollowUpAt: followUpAt, usage: generated.usage },
      model: generated.model,
    });
    const run = runs[0];
    if (!run) throw new Error("lead_copilot_run_not_saved");
    let notionSyncStatus: "synced" | "failed" | "empty" | "not_configured" = "not_configured";
    if (isNotionAgentFeedbackSyncConfigured()) {
      try { notionSyncStatus = await syncOneNotionAgentRun(run.id); }
      catch { notionSyncStatus = "failed"; }
    }
    return NextResponse.json({
      ok: true, run: { id: run.id, status: run.status, createdAt: run.created_at },
      recommendation: generated.recommendation, suggestedFollowUpAt: followUpAt, notionSyncStatus,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "lead_copilot_not_configured") {
      return NextResponse.json({ ok: false, error: "AI coaching is not configured. Add the server-side OpenAI API key to enable it." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "Could not prepare lead coaching. Confirm database and AI configuration, then retry." }, { status: 503 });
  }
}
