export const ORDER_MILESTONE_STAGES = ["Procurement", "Customization", "Quality check", "Dispatch", "Delivered"] as const;
export type OrderMilestoneStage = (typeof ORDER_MILESTONE_STAGES)[number];
export type OrderMilestoneStatus = "Pending" | "In progress" | "Blocked" | "Complete";

export const ORDER_WORKFLOW_STATUSES = ["Procurement", "Customization", "Quality check", "Dispatch", "Delivered", "Closed", "On hold", "Cancelled"] as const;

export function canCompleteOrderStage(stage: OrderMilestoneStage, completedStages: readonly string[], hasDeliveryProof = false) {
  const stageIndex = ORDER_MILESTONE_STAGES.indexOf(stage);
  const previousStagesComplete = ORDER_MILESTONE_STAGES.slice(0, stageIndex).every((previous) => completedStages.includes(previous));
  if (!previousStagesComplete) return false;
  if (stage === "Delivered" && !hasDeliveryProof) return false;
  return true;
}
