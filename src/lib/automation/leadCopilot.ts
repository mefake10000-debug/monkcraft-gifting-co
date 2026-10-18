import type { OperationsLeadRecord } from "@/lib/automation/store";

export const LEAD_COPILOT_SCHEMA = {
  type: "object",
  properties: {
    priority: { type: "string", enum: ["high", "normal", "low"] },
    opportunitySummary: { type: "string" },
    buyingSignals: { type: "array", items: { type: "string" } },
    unansweredQuestions: { type: "array", items: { type: "string" } },
    nextBestAction: { type: "string" },
    suggestedChannel: { type: "string", enum: ["email", "phone", "whatsapp", "internal"] },
    timingWindow: { type: "string", enum: ["today", "next_business_day", "within_3_days", "wait_for_reply"] },
    draftMessage: { type: "string" },
    rationale: { type: "string" },
    evidenceReferences: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
  },
  required: ["priority", "opportunitySummary", "buyingSignals", "unansweredQuestions", "nextBestAction", "suggestedChannel", "timingWindow", "draftMessage", "rationale", "evidenceReferences", "confidence"],
  additionalProperties: false,
} as const;

export type LeadCopilotRecommendation = {
  priority: "high" | "normal" | "low";
  opportunitySummary: string;
  buyingSignals: string[];
  unansweredQuestions: string[];
  nextBestAction: string;
  suggestedChannel: "email" | "phone" | "whatsapp" | "internal";
  timingWindow: "today" | "next_business_day" | "within_3_days" | "wait_for_reply";
  draftMessage: string;
  rationale: string;
  evidenceReferences: string[];
  confidence: "low" | "medium" | "high";
};

function boundedString(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function stringList(value: unknown, maximumItems: number, maximumLength: number) {
  return Array.isArray(value)
    ? value.slice(0, maximumItems).map((item) => boundedString(item, maximumLength)).filter(Boolean)
    : [];
}

export function validateLeadCopilotRecommendation(value: unknown): LeadCopilotRecommendation | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const enums = {
    priority: ["high", "normal", "low"],
    suggestedChannel: ["email", "phone", "whatsapp", "internal"],
    timingWindow: ["today", "next_business_day", "within_3_days", "wait_for_reply"],
    confidence: ["low", "medium", "high"],
  };
  if (!enums.priority.includes(input.priority as never)
    || !enums.suggestedChannel.includes(input.suggestedChannel as never)
    || !enums.timingWindow.includes(input.timingWindow as never)
    || !enums.confidence.includes(input.confidence as never)) return null;
  const recommendation: LeadCopilotRecommendation = {
    priority: input.priority as LeadCopilotRecommendation["priority"],
    opportunitySummary: boundedString(input.opportunitySummary, 700),
    buyingSignals: stringList(input.buyingSignals, 8, 240),
    unansweredQuestions: stringList(input.unansweredQuestions, 8, 240),
    nextBestAction: boundedString(input.nextBestAction, 500),
    suggestedChannel: input.suggestedChannel as LeadCopilotRecommendation["suggestedChannel"],
    timingWindow: input.timingWindow as LeadCopilotRecommendation["timingWindow"],
    draftMessage: boundedString(input.draftMessage, 2500),
    rationale: boundedString(input.rationale, 700),
    evidenceReferences: stringList(input.evidenceReferences, 10, 160),
    confidence: input.confidence as LeadCopilotRecommendation["confidence"],
  };
  if (!recommendation.opportunitySummary || !recommendation.nextBestAction || !recommendation.rationale) return null;
  return recommendation;
}

export function buildLeadCopilotContext(lead: OperationsLeadRecord) {
  const payload = lead.payload;
  const programme = payload.programme;
  return {
    requestId: lead.id,
    pipelineStage: lead.status,
    owner: lead.owner,
    currentNextAction: lead.next_action,
    currentFollowUpAt: lead.next_action_at,
    websiteBrief: {
      source: payload.source,
      contactName: payload.contact.name,
      company: payload.contact.company,
      contactPreference: payload.contactPreference,
      products: payload.products.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity })),
      occasion: programme?.occasion,
      recipientCount: programme?.recipientCount,
      budgetPerRecipient: programme?.budgetPerRecipient,
      branding: programme?.branding,
      deliveryDate: programme?.deliveryDate,
      deliveryLocation: programme?.deliveryLocation,
      notes: programme?.notes,
      message: payload.message,
    },
    interactions: (lead.interactions ?? []).map((entry) => ({
      id: entry.id, channel: entry.channel, direction: entry.direction,
      occurredAt: entry.occurred_at, outcome: entry.outcome, content: entry.content,
    })),
  };
}

export function getSuggestedFollowUpAt(window: LeadCopilotRecommendation["timingWindow"], now = new Date()) {
  if (window === "wait_for_reply") return null;
  // Work in fixed India Standard Time regardless of the server's timezone.
  const indiaNow = new Date(now.getTime() + 330 * 60_000);
  const due = new Date(Date.UTC(indiaNow.getUTCFullYear(), indiaNow.getUTCMonth(), indiaNow.getUTCDate()));
  const initialHour = indiaNow.getUTCHours();
  if (window === "today" && initialHour < 16) due.setUTCHours(Math.max(10, initialHour + 2), 0, 0, 0);
  else {
    due.setUTCDate(due.getUTCDate() + (window === "within_3_days" ? 2 : 1));
    due.setUTCHours(10, 0, 0, 0);
  }
  if (due.getUTCDay() === 6) due.setUTCDate(due.getUTCDate() + 2);
  if (due.getUTCDay() === 0) due.setUTCDate(due.getUTCDate() + 1);
  return new Date(due.getTime() - 330 * 60_000).toISOString();
}
