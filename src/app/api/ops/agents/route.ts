import { NextResponse } from "next/server";
import { validateAgentRunReview } from "@/lib/automation/agentFeedback";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { isNotionAgentFeedbackSyncConfigured, syncOneNotionAgentRun } from "@/lib/automation/notion";
import { listAgentRuns, reviewAgentRun } from "@/lib/automation/store";

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, runs: await listAgentRuns() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Agent review records are unavailable. Confirm database setup and apply the agent-feedback migration." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const review = validateAgentRunReview(body);
  if (!review.ok) return NextResponse.json({ ok: false, error: review.error }, { status: 400 });
  try {
    const runs = await reviewAgentRun(review.value);
    const run = runs[0];
    if (run && isNotionAgentFeedbackSyncConfigured()) await syncOneNotionAgentRun(run.id);
    return NextResponse.json({ ok: true, run });
  } catch {
    return NextResponse.json({ ok: false, error: "The agent run could not be reviewed. It may already have a human decision or the migration may not be applied." }, { status: 409 });
  }
}
