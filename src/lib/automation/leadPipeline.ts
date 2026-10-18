export const LEAD_PIPELINE_STATUSES = [
  "New", "Qualified", "Draft ready", "Contacted", "Replied", "Discovery", "Quote request", "Won", "Lost",
] as const;

export type LeadPipelineStatus = (typeof LEAD_PIPELINE_STATUSES)[number];

export function isLeadPipelineStatus(value: unknown): value is LeadPipelineStatus {
  return typeof value === "string" && (LEAD_PIPELINE_STATUSES as readonly string[]).includes(value);
}

export const INITIAL_LEAD_STATUS: LeadPipelineStatus = "Quote request";
