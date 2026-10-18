export const AGENT_RUN_DECISIONS = ["Approved", "Rejected", "Completed", "Failed"] as const;
export type AgentRunDecision = typeof AGENT_RUN_DECISIONS[number];

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export function validateAgentRunReview(value: unknown):
  | { ok: true; value: { id: string; reviewer: string; status: AgentRunDecision; humanCorrection: string; correctionReason: string; outcome: string } }
  | { ok: false; error: string } {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const id = clean(input.id, 36);
  const reviewer = clean(input.reviewer, 120);
  const status = input.status;
  const humanCorrection = clean(input.humanCorrection, 2000);
  const correctionReason = clean(input.correctionReason, 1000);
  const outcome = clean(input.outcome, 2000);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !reviewer) {
    return { ok: false, error: "Choose an agent run and enter your name for the review record." };
  }
  if (!AGENT_RUN_DECISIONS.includes(status as AgentRunDecision)) return { ok: false, error: "Choose Approved, Rejected, Completed, or Failed." };
  if (status === "Rejected" && (humanCorrection.length < 3 || correctionReason.length < 3)) {
    return { ok: false, error: "A rejected run needs a specific correction and reason." };
  }
  if (["Approved", "Completed", "Failed"].includes(status as string) && outcome.length < 3) {
    return { ok: false, error: "Record the review outcome." };
  }
  return { ok: true, value: { id, reviewer, status: status as AgentRunDecision, humanCorrection, correctionReason, outcome } };
}
