import type { NormalizedEnquiry } from "@/lib/enquiry/validateServer";
import type { LeadPipelineStatus } from "@/lib/automation/leadPipeline";
import type { OrderMilestoneStage, OrderMilestoneStatus } from "@/lib/automation/orderWorkflow";
import type { QuoteAdjustment, QuoteLine } from "@/lib/automation/quoteWorkflow";
import { buildVyaparEntryPack } from "@/lib/automation/financePack";
import { buildOperationsExceptions, type OperationsException } from "@/lib/automation/exceptions";

type StoredQuoteRequest = {
  id: string;
  notion_sync_status: "pending" | "synced" | "failed";
  notion_page_id: string | null;
};

export type SupplierCheckRecord = {
  id: string;
  request_id: string;
  supplier_id: string | null;
  supplier_name: string | null;
  supplier_category: string | null;
  product_lines: Array<{ id?: string; name: string; quantity?: string | number }>;
  total_units: number;
  status: string;
  availability: string;
  quoted_unit_price: number | null;
  moq: number | null;
  lead_time: string | null;
  reply_text: string | null;
  supplier_reply_reviewed_by?: string | null;
  supplier_reply_reviewed_at?: string | null;
  supplier_reply_review_notes?: string | null;
  created_at?: string;
};

export type QuoteReadinessCheck = {
  request_id: string; supplier_id: string | null; product_lines: Array<{ id?: string }>;
  status: string; availability: string; supplier_reply_reviewed_at: string | null;
};

export type SupplierDirectoryRecord = {
  id: string; supplier_code: string; display_name: string; category: string; contact_name: string | null;
  phone_e164: string | null; email: string | null; whatsapp_opt_in: boolean;
  whatsapp_opt_in_recorded_at: string | null; whatsapp_opt_in_evidence_reference: string | null;
  active: boolean; created_at: string; updated_at: string; notion_page_id: string | null;
  notion_sync_status: "pending" | "synced" | "failed"; notion_synced_at: string | null;
  notion_attempts: number; notion_last_error: string | null;
};

export type SupplierProductMappingRecord = {
  product_id: string; supplier_id: string; category: string | null; verified_by: string | null;
  verified_at: string | null; active: boolean; supplier_name: string;
};

export type SupplierWhatsAppSendClaim = {
  check_id: string;
  request_id: string;
  supplier_phone: string;
  check_reference: string;
  request_reference: string;
  products_summary: string;
  total_units: number;
  requested_delivery_date: string;
};

export type OperationsLeadRecord = {
  id: string;
  status: LeadPipelineStatus;
  owner: string | null;
  next_action: string | null;
  next_action_at: string | null;
  notion_sync_status: "pending" | "synced" | "failed";
  created_at: string;
  payload: NormalizedEnquiry;
  activity?: Array<{
    id: string; event_type: string; previous_status: string | null; new_status: string;
    note: string | null; actor: string; occurred_at: string;
  }>;
  interactions?: LeadInteractionRecord[];
};

export type LeadInteractionRecord = {
  id: string;
  quote_request_id: string;
  channel: "email" | "whatsapp" | "linkedin" | "phone" | "meeting" | "internal";
  direction: "inbound" | "outbound" | "internal_note";
  content: string;
  outcome: string | null;
  actor: string;
  occurred_at: string;
};

export type OperationsOrderRecord = {
  id: string; order_code: string; quote_request_id: string; status: string;
  accepted_quote_version: string | null; customer_approved_at: string;
  customer_approval_reference: string | null; customer_po_reference: string | null;
  promised_delivery_date: string | null; created_at: string;
  company: string; contact: string;
  milestones: Array<{ id: string; stage: OrderMilestoneStage; status: OrderMilestoneStatus; owner: string | null; due_at: string | null; completed_at: string | null; evidence_url: string | null; notes: string | null }>;
  shipments: Array<{ id: string; shipment_code: string; destination: string; carrier: string | null; tracking_reference: string | null; status: string; dispatched_at: string | null; delivered_at: string | null; proof_of_delivery_url: string | null; exception_notes: string | null }>;
  activity: Array<{ id: string; event_type: string; stage: string | null; previous_status: string | null; new_status: string | null; actor: string; occurred_at: string; details: Record<string, unknown> }>;
};

export type OperationsQuoteRecord = {
  id: string; quote_request_id: string; version: number;
  status: "Draft" | "Changes requested" | "Approval requested" | "Approved" | "Sent" | "Accepted" | "Declined" | "Superseded";
  snapshot: { lines: QuoteLine[]; adjustments: QuoteAdjustment[]; subtotalPaise: number; totalPaise: number };
  subtotal_paise: number; total_paise: number; terms: string; valid_until: string | null; created_by: string;
  created_at: string; updated_at: string; approved_by: string | null; approved_at: string | null;
  sent_at: string | null; sent_evidence_reference: string | null; buyer_decision_at: string | null;
  buyer_decision_reference: string | null;
  notion_sync_status: "pending" | "synced" | "failed";
  notion_last_error: string | null;
  events: Array<{ id: string; event_type: string; previous_status: string | null; new_status: string; actor: string; evidence_reference: string | null; note: string | null; occurred_at: string }>;
};

export type OrderEligibleLead = { id: string; company: string; contact: string; status: "Won" };

export type FinanceRecord = {
  id: string; order_id: string | null; quote_request_id: string | null;
  document_type: string; vyapar_reference: string | null; expected_amount: number | null;
  recorded_amount: number | null; status: string; entered_by: string | null;
  document_date: string | null; notes: string | null; created_at: string; updated_at: string;
  order_code: string | null; company: string;
  events: Array<{ id: string; event_type: string; actor: string; occurred_at: string; before_record: Record<string, unknown> | null; after_record: Record<string, unknown> }>;
};

export type FinanceEligibleOrder = { id: string; order_code: string; quote_request_id: string; accepted_quote_version: string | null; status: string; company: string };

export type OperationsAnalytics = {
  enquiriesLast30Days: number;
  leadPipeline: Array<{ status: string; count: number }>;
  leadSources: Array<{ source: string; count: number }>;
  supplierPerformance: Array<{ supplier: string; sent: number; replied: number; responseRate: number | null; avgResponseHours: number | null; mappingExceptions: number }>;
  fulfillment: { activeOrders: number; overdueMilestones: number; atRiskOrders: Array<{ orderCode: string; status: string; promisedDeliveryDate: string | null; incompleteMilestones: number; overdueMilestones: number }> };
  finance: { byStatus: Array<{ status: string; count: number }>; exceptionAmountGap: number };
  marketing: { activeEmailOptIns: number; campaigns: Array<{ source: string; medium: string; campaign: string; requests: number; won: number; orders: number }> };
};

export type MarketingPermissionRecord = {
  id: string; normalized_email: string; channel: "email"; status: "active" | "revoked";
  latest_request_id: string; wording_version: string; consented_at: string; revoked_at: string | null;
  events: Array<{ id: string; event_type: string; evidence_reference: string | null; actor: string; source: string | null; occurred_at: string }>;
};

export type CustomerCareTask = {
  id: string; order_id: string; quote_request_id: string; task_type: string; title: string; status: string;
  owner: string | null; due_at: string | null; contact_channel: string | null; draft_message: string | null;
  outcome: string | null; notion_sync_status: "pending" | "synced" | "failed"; created_at: string; updated_at: string;
  order_code: string; company: string; contact: string; email: string | null; phone: string | null;
  original_contact_preference: string | null; quote_whatsapp_opt_in: boolean;
  activity: Array<{ id: string; event_type: string; previous_status: string | null; new_status: string; actor: string; occurred_at: string; details: Record<string, unknown> }>;
};

export type MarketingContentRecord = {
  id: string; channel: string; campaign: string; objective: string; audience: string; brief: string;
  status: string; content: import("@/lib/automation/marketingContent").MarketingDraftContent;
  keyword_suggestions: string[]; image_brief: string; owner: string; created_by: string; model: string | null;
  usage: Record<string, unknown>; publish_at: string | null; approved_by: string | null; approved_at: string | null;
  published_url: string | null; published_at: string | null; notion_page_id: string | null;
  notion_sync_status: "pending" | "synced" | "failed"; notion_synced_at: string | null; notion_attempts: number;
  notion_last_error: string | null; created_at: string; updated_at: string;
  events: Array<{ id: string; event_type: string; previous_status: string | null; new_status: string; actor: string; note: string | null; reference: string | null; occurred_at: string }>;
};

export type AgentRunRecord = {
  id: string; agent_key: string; trigger_name: string; quote_request_id: string | null; order_id: string | null;
  content_item_id: string | null; input_reference: string | null; proposed_action: Record<string, unknown>;
  status: string; human_correction: string | null; correction_reason: string | null; reviewer: string | null;
  outcome: string | null; created_at: string; reviewed_at: string | null; updated_at: string;
  notion_page_id: string | null; notion_sync_status: "pending" | "synced" | "failed"; notion_synced_at: string | null;
  notion_attempts: number; notion_last_error: string | null;
  events: Array<{ id: string; event_type: string; previous_status: string; new_status: string; before_feedback: Record<string, unknown>; after_feedback: Record<string, unknown>; actor: string; occurred_at: string }>;
};

export type QuotePersistenceResult =
  | { ok: true; requestId: string; notionSyncStatus: StoredQuoteRequest["notion_sync_status"] }
  | { ok: false; code: "storage_not_configured" | "storage_failed" | "submission_conflict" };

function getDatabaseConfig() {
  const baseUrl = process.env.MONKCRAFT_SUPABASE_URL?.trim().replace(/\/$/, "");
  const serviceKey = process.env.MONKCRAFT_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!baseUrl || !serviceKey) return null;
  return { baseUrl, serviceKey };
}

export function isQuoteStorageConfigured() {
  return Boolean(getDatabaseConfig());
}

async function databaseRequest<T>(path: string, body: unknown): Promise<T> {
  const config = getDatabaseConfig();
  if (!config) throw new Error("storage_not_configured");
  const response = await fetch(`${config.baseUrl}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const responseBody = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const message = responseBody && typeof responseBody === "object" && "message" in responseBody
      ? String((responseBody as { message: unknown }).message)
      : "";
    if (message.includes("quote_supplier_checks_not_ready")) throw new Error("quote_supplier_checks_not_ready");
    if (response.status === 409 || message.includes("submission id reused with different payload")) {
      throw new Error("submission_conflict");
    }
    throw new Error("storage_failed");
  }
  return responseBody as T;
}

export async function listSupplierChecksForOperations(): Promise<SupplierCheckRecord[]> {
  const config = getDatabaseConfig();
  if (!config) throw new Error("storage_not_configured");
  const params = new URLSearchParams({
    select: "id,request_id,supplier_id,supplier_name,supplier_category,product_lines,total_units,status,availability,quoted_unit_price,moq,lead_time,reply_text,supplier_reply_reviewed_by,supplier_reply_reviewed_at,supplier_reply_review_notes,created_at",
    order: "created_at.desc",
    limit: "200",
  });
  const response = await fetch(`${config.baseUrl}/rest/v1/supplier_checks?${params.toString()}`, {
    method: "GET",
    headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("storage_failed");
  const rows = await response.json().catch(() => null) as unknown;
  if (!Array.isArray(rows)) throw new Error("storage_failed");
  return rows as SupplierCheckRecord[];
}

export async function listQuoteReadinessChecks(requestIds: string[]): Promise<QuoteReadinessCheck[]> {
  const uniqueIds = [...new Set(requestIds)].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const batches = await Promise.all(Array.from({ length: Math.ceil(uniqueIds.length / 80) }, async (_, batchIndex) => {
    const ids = uniqueIds.slice(batchIndex * 80, (batchIndex + 1) * 80);
    return databaseGet<QuoteReadinessCheck[]>(`supplier_checks?${new URLSearchParams({
      select: "request_id,supplier_id,product_lines,status,availability,supplier_reply_reviewed_at",
      request_id: `in.(${ids.join(",")})`, order: "created_at.asc", limit: "2000",
    }).toString()}`);
  }));
  return batches.flat();
}

export async function listSupplierDirectoryForOperations() {
  const [suppliers, rawMappings] = await Promise.all([
    databaseGet<SupplierDirectoryRecord[]>(`supplier_directory?${new URLSearchParams({
      select: "id,supplier_code,display_name,category,contact_name,phone_e164,email,whatsapp_opt_in,whatsapp_opt_in_recorded_at,whatsapp_opt_in_evidence_reference,active,created_at,updated_at,notion_page_id,notion_sync_status,notion_synced_at,notion_attempts,notion_last_error",
      order: "display_name.asc", limit: "1000",
    }).toString()}`),
    databaseGet<Array<Omit<SupplierProductMappingRecord, "supplier_name">>>(`product_supplier_mappings?${new URLSearchParams({
      select: "product_id,supplier_id,category,verified_by,verified_at,active", order: "product_id.asc", limit: "10000",
    }).toString()}`),
  ]);
  const names = new Map(suppliers.map((supplier) => [supplier.id, supplier.display_name]));
  const mappings = rawMappings.map((mapping) => ({ ...mapping, supplier_name: names.get(mapping.supplier_id) ?? "Unknown supplier" }));
  return { suppliers, mappings };
}

export async function saveSupplierDirectoryRecord(input: {
  id: string | null; supplierCode: string; displayName: string; category: string; contactName: string;
  phoneE164: string; email: string; whatsappOptIn: boolean; whatsappOptInEvidenceReference: string; active: boolean; actor: string;
}) {
  return databaseRequest<SupplierDirectoryRecord[]>("rpc/save_supplier_directory_record", {
    p_supplier_id: input.id, p_supplier_code: input.supplierCode, p_display_name: input.displayName,
    p_category: input.category, p_contact_name: input.contactName || null, p_phone_e164: input.phoneE164 || null,
    p_email: input.email || null, p_whatsapp_opt_in: input.whatsappOptIn,
    p_opt_in_evidence_reference: input.whatsappOptInEvidenceReference || null, p_active: input.active, p_actor: input.actor,
  });
}

export async function saveSupplierProductMapping(input: {
  productId: string; supplierId: string; category: string; verifiedBy: string; actor: string;
}) {
  return databaseRequest<Array<{ product_id: string; supplier_id: string; active: boolean }>>("rpc/save_product_supplier_mapping", {
    p_product_id: input.productId, p_supplier_id: input.supplierId, p_category: input.category || null,
    p_verified_by: input.verifiedBy, p_actor: input.actor,
  });
}

export async function deactivateSupplierProductMapping(productId: string, actor: string) {
  return databaseRequest<Array<{ product_id: string; supplier_id: string; active: boolean }>>("rpc/deactivate_product_supplier_mapping", { p_product_id: productId, p_actor: actor });
}

export async function claimSupplierDirectoryNotionSync(supplierId?: string) {
  return databaseRequest<SupplierDirectoryRecord[]>("rpc/claim_supplier_directory_notion_sync", { p_supplier_id: supplierId ?? null });
}

export async function finishSupplierDirectoryNotionSync(supplierId: string, claimedUpdatedAt: string, notionPageId?: string, error?: string) {
  return databaseRequest<unknown>("rpc/finish_supplier_directory_notion_sync", {
    p_supplier_id: supplierId, p_claimed_updated_at: claimedUpdatedAt,
    p_notion_page_id: notionPageId ?? null, p_error: error?.slice(0, 400) ?? null,
  });
}

export async function listProductMappingsForSupplier(supplierId: string) {
  return databaseGet<Array<{ product_id: string; active: boolean }>>(`product_supplier_mappings?${new URLSearchParams({
    select: "product_id,active", supplier_id: `eq.${supplierId}`, order: "product_id.asc", limit: "1000",
  }).toString()}`);
}

async function databaseGet<T>(path: string): Promise<T> {
  const config = getDatabaseConfig();
  if (!config) throw new Error("storage_not_configured");
  const response = await fetch(`${config.baseUrl}/rest/v1/${path}`, {
    method: "GET",
    headers: { apikey: config.serviceKey, Authorization: `Bearer ${config.serviceKey}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("storage_failed");
  return await response.json() as T;
}

export async function listOperationsLeads(): Promise<OperationsLeadRecord[]> {
  const params = new URLSearchParams({
    select: "id,status,owner,next_action,next_action_at,notion_sync_status,created_at,payload",
    order: "created_at.desc",
    limit: "200",
  });
  const leads = await databaseGet<OperationsLeadRecord[]>(`quote_requests?${params.toString()}`);
  if (!leads.length) return leads;
  const ids = leads.map((lead) => lead.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!ids.length) return leads;
  type ActivityEvent = {
    id: string; quote_request_id: string; event_type: string; previous_status: string | null;
    new_status: string; note: string | null; actor: string; occurred_at: string;
  };
  const [eventBatches, interactionBatches] = await Promise.all([
    Promise.all(Array.from({ length: Math.ceil(ids.length / 80) }, async (_, batchIndex) => {
    const batchIds = ids.slice(batchIndex * 80, (batchIndex + 1) * 80);
    const eventsParams = new URLSearchParams({
      select: "id,quote_request_id,event_type,previous_status,new_status,note,actor,occurred_at",
      quote_request_id: `in.(${batchIds.join(",")})`,
      order: "occurred_at.desc",
      limit: "1000",
    });
    return databaseGet<ActivityEvent[]>(`lead_activity_events?${eventsParams.toString()}`);
    })),
    Promise.all(Array.from({ length: Math.ceil(ids.length / 80) }, async (_, batchIndex) => {
      const batchIds = ids.slice(batchIndex * 80, (batchIndex + 1) * 80);
      const params = new URLSearchParams({
        select: "id,quote_request_id,channel,direction,content,outcome,actor,occurred_at",
        quote_request_id: `in.(${batchIds.join(",")})`, order: "occurred_at.desc", limit: "2000",
      });
      return databaseGet<LeadInteractionRecord[]>(`lead_interactions?${params.toString()}`);
    })),
  ]);
  const events = eventBatches.flat();
  const byRequest = new Map<string, NonNullable<OperationsLeadRecord["activity"]>>();
  for (const event of events) {
    const list = byRequest.get(event.quote_request_id) ?? [];
    if (list.length < 5) list.push(event);
    byRequest.set(event.quote_request_id, list);
  }
  const interactionsByRequest = new Map<string, LeadInteractionRecord[]>();
  for (const interaction of interactionBatches.flat()) {
    const list = interactionsByRequest.get(interaction.quote_request_id) ?? [];
    if (list.length < 30) list.push(interaction);
    interactionsByRequest.set(interaction.quote_request_id, list);
  }
  return leads.map((lead) => ({ ...lead, activity: byRequest.get(lead.id) ?? [], interactions: interactionsByRequest.get(lead.id) ?? [] }));
}

export async function saveLeadInteraction(input: Omit<LeadInteractionRecord, "id" | "occurred_at"> & { occurred_at?: string }) {
  return databaseRequest<LeadInteractionRecord[]>("lead_interactions", input);
}

export async function createLeadCopilotRun(input: {
  requestId: string; interactionIds: string[]; proposedAction: Record<string, unknown>; model: string;
}) {
  return databaseRequest<Array<{ id: string; status: string; created_at: string }>>("agent_runs", {
    agent_key: "sales", trigger_name: "lead_conversion_copilot", quote_request_id: input.requestId,
    input_reference: JSON.stringify({ requestId: input.requestId, interactionIds: input.interactionIds }),
    proposed_action: { ...input.proposedAction, model: input.model, humanReviewRequired: true }, status: "Needs review",
  });
}

export async function updateOperationsLead(input: {
  requestId: string; status: LeadPipelineStatus; owner: string; nextAction: string;
  nextActionAt: string | null; note: string; actor: string;
}) {
  return databaseRequest<OperationsLeadRecord[]>("rpc/update_quote_request_pipeline", {
    p_request_id: input.requestId,
    p_status: input.status,
    p_owner: input.owner,
    p_next_action: input.nextAction,
    p_next_action_at: input.nextActionAt,
    p_note: input.note,
    p_actor: input.actor,
  });
}

export async function listOperationsQuoteDesk() {
  const [leads, quotes, events] = await Promise.all([
    listOperationsLeads(),
    databaseGet<Array<Omit<OperationsQuoteRecord, "events">>>(`quote_versions?${new URLSearchParams({
      select: "id,quote_request_id,version,status,snapshot,subtotal_paise,total_paise,terms,valid_until,created_by,created_at,updated_at,approved_by,approved_at,sent_at,sent_evidence_reference,buyer_decision_at,buyer_decision_reference,notion_sync_status,notion_last_error",
      order: "created_at.desc", limit: "1000",
    }).toString()}`),
    databaseGet<Array<OperationsQuoteRecord["events"][number] & { quote_version_id: string }>>(`quote_version_events?${new URLSearchParams({
      select: "id,quote_version_id,event_type,previous_status,new_status,actor,evidence_reference,note,occurred_at",
      order: "occurred_at.desc", limit: "3000",
    }).toString()}`),
  ]);
  const leadById = new Map(leads.map((lead) => [lead.id, lead]));
  const eventByQuote = new Map<string, OperationsQuoteRecord["events"]>();
  for (const event of events) {
    const history = eventByQuote.get(event.quote_version_id) ?? [];
    if (history.length < 20) history.push(event);
    eventByQuote.set(event.quote_version_id, history);
  }
  return {
    leads: leads.filter((lead) => !["Lost", "Won"].includes(lead.status)),
    quotes: quotes.map((quote) => ({ ...quote, lead: leadById.get(quote.quote_request_id) ?? null, events: eventByQuote.get(quote.id) ?? [] })),
  };
}

export async function saveOperationsQuoteDraft(input: {
  requestId: string; quoteId: string | null; snapshot: { lines: QuoteLine[]; adjustments: QuoteAdjustment[]; subtotalPaise: number; totalPaise: number };
  terms: string; validUntil: string | null; actor: string;
}) {
  return databaseRequest<OperationsQuoteRecord[]>("rpc/save_quote_draft", {
    p_quote_request_id: input.requestId, p_quote_version_id: input.quoteId, p_snapshot: input.snapshot,
    p_terms: input.terms, p_valid_until: input.validUntil, p_actor: input.actor,
  });
}

export async function transitionOperationsQuote(input: {
  quoteId: string; action: string; actor: string; evidenceReference: string; note: string;
}) {
  return databaseRequest<OperationsQuoteRecord[]>("rpc/transition_quote_version", {
    p_quote_version_id: input.quoteId, p_action: input.action, p_actor: input.actor,
    p_evidence_reference: input.evidenceReference || null, p_note: input.note || null,
  });
}

export async function claimQuoteVersionNotionSync(quoteVersionId?: string) {
  return databaseRequest<Array<{
    id: string; quote_request_id: string; version: number; status: string; snapshot: OperationsQuoteRecord["snapshot"];
    subtotal_paise: number; total_paise: number; terms: string; valid_until: string | null; updated_at: string;
    approved_by: string | null; sent_evidence_reference: string | null; buyer_decision_reference: string | null;
    notion_page_id: string | null; notion_attempts: number;
  }>>("rpc/claim_quote_version_notion_sync", { p_quote_version_id: quoteVersionId ?? null });
}

export async function finishQuoteVersionNotionSync(quoteVersionId: string, claimedUpdatedAt: string, notionPageId?: string, error?: string) {
  return databaseRequest<unknown>("rpc/finish_quote_version_notion_sync", {
    p_quote_version_id: quoteVersionId, p_claimed_updated_at: claimedUpdatedAt,
    p_notion_page_id: notionPageId ?? null, p_error: error?.slice(0, 400) ?? null,
  });
}

export async function getQuoteRequestPayload(requestId: string) {
  const rows = await databaseGet<Array<{ id: string; payload: NormalizedEnquiry }>>(`quote_requests?${new URLSearchParams({
    select: "id,payload", id: `eq.${requestId}`, limit: "1",
  }).toString()}`);
  return rows[0] ?? null;
}

export async function listOperationsOrders() {
  const orderParams = new URLSearchParams({
    select: "id,order_code,quote_request_id,status,accepted_quote_version,customer_approved_at,customer_approval_reference,customer_po_reference,promised_delivery_date,created_at",
    order: "created_at.desc",
    limit: "200",
  });
  const orders = await databaseGet<Array<Omit<OperationsOrderRecord, "company" | "contact" | "milestones" | "shipments" | "activity">>>(`orders?${orderParams.toString()}`);
  const wonParams = new URLSearchParams({ select: "id,status,payload", status: "eq.Won", order: "created_at.desc", limit: "100" });
  const [requestBatches, wonRequests] = await Promise.all([
    Promise.all(Array.from({ length: Math.ceil(orders.length / 80) }, async (_, batchIndex) => {
      const quoteIds = orders.slice(batchIndex * 80, (batchIndex + 1) * 80).map((order) => order.quote_request_id);
      const requestParams = new URLSearchParams({ select: "id,payload", id: `in.(${quoteIds.join(",")})`, limit: "100" });
      return databaseGet<Array<{ id: string; payload: NormalizedEnquiry }>>(`quote_requests?${requestParams.toString()}`);
    })),
    databaseGet<Array<{ id: string; status: "Won"; payload: NormalizedEnquiry }>>(`quote_requests?${wonParams.toString()}`),
  ]);
  const requests = requestBatches.flat();
  const orderIds = orders.map((order) => order.id).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const inFilter = `in.(${orderIds.join(",")})`;
  const [milestones, shipments, events] = orderIds.length ? await Promise.all([
    databaseGet<Array<OperationsOrderRecord["milestones"][number] & { order_id: string }>>(`order_milestones?${new URLSearchParams({ select: "id,order_id,stage,status,owner,due_at,completed_at,evidence_url,notes", order: "created_at.asc", order_id: inFilter }).toString()}`),
    databaseGet<Array<OperationsOrderRecord["shipments"][number] & { order_id: string }>>(`fulfillment_shipments?${new URLSearchParams({ select: "id,order_id,shipment_code,destination,carrier,tracking_reference,status,dispatched_at,delivered_at,proof_of_delivery_url,exception_notes", order: "created_at.asc", order_id: inFilter }).toString()}`),
    databaseGet<Array<OperationsOrderRecord["activity"][number] & { order_id: string }>>(`order_activity_events?${new URLSearchParams({ select: "id,order_id,event_type,stage,previous_status,new_status,actor,occurred_at,details", order: "occurred_at.desc", order_id: inFilter, limit: "1000" }).toString()}`),
  ]) : [[], [], []];
  const requestById = new Map(requests.map((request) => [request.id, request.payload]));
  const milestonesByOrder = new Map<string, OperationsOrderRecord["milestones"]>();
  for (const milestone of milestones) {
    const list = milestonesByOrder.get(milestone.order_id) ?? [];
    list.push(milestone);
    milestonesByOrder.set(milestone.order_id, list);
  }
  const shipmentsByOrder = new Map<string, OperationsOrderRecord["shipments"]>();
  for (const shipment of shipments) {
    const list = shipmentsByOrder.get(shipment.order_id) ?? [];
    list.push(shipment);
    shipmentsByOrder.set(shipment.order_id, list);
  }
  const activityByOrder = new Map<string, OperationsOrderRecord["activity"]>();
  for (const event of events) {
    const list = activityByOrder.get(event.order_id) ?? [];
    if (list.length < 8) list.push(event);
    activityByOrder.set(event.order_id, list);
  }
  const fullOrders = orders.map((order) => {
    const payload = requestById.get(order.quote_request_id);
    return {
      ...order,
      company: payload?.contact.company || "Company not provided",
      contact: payload?.contact.name || "Contact not provided",
      milestones: milestonesByOrder.get(order.id) ?? [],
      shipments: shipmentsByOrder.get(order.id) ?? [],
      activity: activityByOrder.get(order.id) ?? [],
    } satisfies OperationsOrderRecord;
  });
  const existingQuoteIds = new Set(orders.map((order) => order.quote_request_id));
  const eligibleLeads = wonRequests.filter((request) => !existingQuoteIds.has(request.id)).map((request) => ({
    id: request.id, company: request.payload.contact.company, contact: request.payload.contact.name, status: "Won" as const,
  }));
  return { orders: fullOrders, eligibleLeads };
}

export async function createOrderFromAcceptedQuote(input: {
  requestId: string; orderCode: string; quoteVersion: string; customerApprovedAt: string;
  approvalReference: string; customerPoReference: string; promisedDeliveryDate: string | null; actor: string;
}) {
  return databaseRequest<Array<{ id: string; order_code: string; status: string }>>("rpc/create_order_from_accepted_quote", {
    p_quote_request_id: input.requestId,
    p_order_code: input.orderCode,
    p_quote_version: input.quoteVersion,
    p_customer_approved_at: input.customerApprovedAt,
    p_customer_approval_reference: input.approvalReference,
    p_customer_po_reference: input.customerPoReference,
    p_promised_delivery_date: input.promisedDeliveryDate,
    p_actor: input.actor,
  });
}

export async function updateOrderMilestone(input: {
  orderId: string; stage: OrderMilestoneStage; status: OrderMilestoneStatus; owner: string;
  dueAt: string | null; evidenceUrl: string; notes: string; actor: string;
}) {
  return databaseRequest<unknown>("rpc/update_order_milestone", {
    p_order_id: input.orderId, p_stage: input.stage, p_status: input.status,
    p_owner: input.owner, p_due_at: input.dueAt, p_evidence_url: input.evidenceUrl,
    p_notes: input.notes, p_actor: input.actor,
  });
}

export async function createFulfillmentShipment(input: {
  orderId: string; shipmentCode: string; destination: string; carrier: string; trackingReference: string; actor: string;
}) {
  return databaseRequest<unknown>("rpc/create_fulfillment_shipment", {
    p_order_id: input.orderId, p_shipment_code: input.shipmentCode, p_destination: input.destination,
    p_carrier: input.carrier, p_tracking_reference: input.trackingReference, p_actor: input.actor,
  });
}

export async function updateFulfillmentShipment(input: {
  shipmentId: string; status: string; carrier: string; trackingReference: string;
  dispatchedAt: string | null; deliveredAt: string | null; proofOfDeliveryUrl: string;
  exceptionNotes: string; actor: string;
}) {
  return databaseRequest<unknown>("rpc/update_fulfillment_shipment", {
    p_shipment_id: input.shipmentId, p_status: input.status, p_carrier: input.carrier,
    p_tracking_reference: input.trackingReference, p_dispatched_at: input.dispatchedAt,
    p_delivered_at: input.deliveredAt, p_proof_of_delivery_url: input.proofOfDeliveryUrl,
    p_exception_notes: input.exceptionNotes, p_actor: input.actor,
  });
}

export async function claimOrderNotionSync(orderId?: string) {
  return databaseRequest<Array<{
    order_id: string; order_code: string; quote_request_id: string; order_status: string;
    accepted_quote_version: string | null; customer_approved_at: string;
    customer_approval_reference: string; customer_po_reference: string | null;
    promised_delivery_date: string | null; ops_updated_at: string; notion_attempts: number;
    request_payload: NormalizedEnquiry;
  }>>("rpc/claim_order_notion_sync", { p_order_id: orderId ?? null });
}

export async function finishOrderNotionSync(orderId: string, claimedOpsUpdatedAt: string, notionPageId?: string, error?: string) {
  return databaseRequest<unknown>("rpc/finish_order_notion_sync", {
    p_order_id: orderId, p_claimed_ops_updated_at: claimedOpsUpdatedAt,
    p_notion_page_id: notionPageId ?? null, p_error: error?.slice(0, 400) ?? null,
  });
}

export async function listFinanceRecords() {
  const [records, orders, events] = await Promise.all([
    databaseGet<Array<Omit<FinanceRecord, "order_code" | "company" | "events">>>(`vyapar_reconciliation?${new URLSearchParams({
      select: "id,order_id,quote_request_id,document_type,vyapar_reference,expected_amount,recorded_amount,status,entered_by,document_date,notes,created_at,updated_at",
      order: "updated_at.desc", limit: "500",
    }).toString()}`),
    databaseGet<Array<{ id: string; order_code: string; quote_request_id: string; accepted_quote_version: string | null; status: string }>>(`orders?${new URLSearchParams({
      select: "id,order_code,quote_request_id,accepted_quote_version,status", order: "created_at.desc", limit: "300",
    }).toString()}`),
    databaseGet<Array<{ id: string; reconciliation_id: string; event_type: string; actor: string; occurred_at: string; before_record: Record<string, unknown> | null; after_record: Record<string, unknown> }>>(`vyapar_reconciliation_events?${new URLSearchParams({
      select: "id,reconciliation_id,event_type,actor,occurred_at,before_record,after_record", order: "occurred_at.desc", limit: "2000",
    }).toString()}`),
  ]);
  const quoteIds = [...new Set([...records.map((record) => record.quote_request_id), ...orders.map((order) => order.quote_request_id)].filter((id): id is string => Boolean(id)))];
  const quoteRequests = quoteIds.length ? await databaseGet<Array<{ id: string; payload: NormalizedEnquiry }>>(`quote_requests?${new URLSearchParams({
    select: "id,payload", id: `in.(${quoteIds.join(",")})`, limit: "500",
  }).toString()}`) : [];
  const companyByQuote = new Map(quoteRequests.map((request) => [request.id, request.payload.contact.company]));
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const eventsByRecord = new Map<string, FinanceRecord["events"]>();
  for (const event of events) {
    const history = eventsByRecord.get(event.reconciliation_id) ?? [];
    if (history.length < 20) history.push(event);
    eventsByRecord.set(event.reconciliation_id, history);
  }
  const hydratedRecords: FinanceRecord[] = records.map((record) => {
    const order = record.order_id ? orderById.get(record.order_id) : undefined;
    const quoteRequestId = record.quote_request_id ?? order?.quote_request_id;
    return { ...record, order_code: order?.order_code ?? null, company: quoteRequestId ? companyByQuote.get(quoteRequestId) ?? "Company not provided" : "Company not provided", events: eventsByRecord.get(record.id) ?? [] };
  });
  const eligibleOrders: FinanceEligibleOrder[] = orders.map((order) => ({
    ...order, company: companyByQuote.get(order.quote_request_id) ?? "Company not provided",
  }));
  return { records: hydratedRecords, orders: eligibleOrders };
}

export async function saveFinanceRecord(input: {
  id: string | null; orderId: string; documentType: string; vyaparReference: string;
  expectedAmount: number | null; recordedAmount: number | null; status: string;
  enteredBy: string; documentDate: string | null; notes: string; actor: string; clientSubmissionId: string | null;
}) {
  return databaseRequest<unknown>("rpc/record_vyapar_reconciliation", {
    p_reconciliation_id: input.id, p_order_id: input.orderId, p_quote_request_id: null,
    p_document_type: input.documentType, p_vyapar_reference: input.vyaparReference,
    p_expected_amount: input.expectedAmount, p_recorded_amount: input.recordedAmount,
    p_status: input.status, p_entered_by: input.enteredBy, p_document_date: input.documentDate,
    p_notes: input.notes, p_actor: input.actor, p_client_submission_id: input.clientSubmissionId,
  });
}

export async function getVyaparEntryPack(orderId: string) {
  const orderRows = await databaseGet<Array<{
    id: string; order_code: string; quote_request_id: string; accepted_quote_version: string | null;
    customer_approval_reference: string | null; customer_po_reference: string | null; promised_delivery_date: string | null;
  }>>(`orders?${new URLSearchParams({
    select: "id,order_code,quote_request_id,accepted_quote_version,customer_approval_reference,customer_po_reference,promised_delivery_date",
    id: `eq.${orderId}`, limit: "1",
  }).toString()}`);
  const order = orderRows[0];
  const versionMatch = order?.accepted_quote_version?.match(/^v?([1-9][0-9]*)$/i);
  if (!order || !versionMatch || !order.customer_approval_reference) throw new Error("entry_pack_not_found");
  const version = Number(versionMatch[1]);
  if (!Number.isSafeInteger(version)) throw new Error("entry_pack_not_found");
  const [quotes, requests] = await Promise.all([
    databaseGet<Array<{ id: string; version: number; status: string; snapshot: OperationsQuoteRecord["snapshot"]; subtotal_paise: number; total_paise: number; terms: string }>>(`quote_versions?${new URLSearchParams({
      select: "id,version,status,snapshot,subtotal_paise,total_paise,terms",
      quote_request_id: `eq.${order.quote_request_id}`, version: `eq.${version}`, status: "eq.Accepted", limit: "1",
    }).toString()}`),
    databaseGet<Array<{ payload: NormalizedEnquiry }>>(`quote_requests?${new URLSearchParams({
      select: "payload", id: `eq.${order.quote_request_id}`, limit: "1",
    }).toString()}`),
  ]);
  const quote = quotes[0];
  const enquiry = requests[0]?.payload;
  if (!quote || !enquiry || quote.version !== version || quote.status !== "Accepted") throw new Error("entry_pack_not_found");
  return buildVyaparEntryPack({
    exportedAt: new Date().toISOString(),
    order: {
      orderCode: order.order_code, requestId: order.quote_request_id,
      acceptedQuoteVersion: `v${version}`, approvalReference: order.customer_approval_reference,
      customerPoReference: order.customer_po_reference, promisedDeliveryDate: order.promised_delivery_date,
    },
    customer: {
      company: enquiry.contact.company, contact: enquiry.contact.name,
      email: enquiry.contact.email, phone: enquiry.contact.phone,
      deliveryLocation: enquiry.programme.deliveryLocation || "",
    },
    quote: {
      version, subtotalPaise: quote.subtotal_paise, totalPaise: quote.total_paise,
      terms: quote.terms, lines: quote.snapshot.lines, adjustments: quote.snapshot.adjustments,
    },
  });
}

export async function getOperationsAnalytics(): Promise<OperationsAnalytics> {
  const [requests, supplierMetrics, suppliers, fulfillment, reconciliation, campaigns, consentSummary] = await Promise.all([
    databaseGet<Array<{ request_date: string; source: string; status: string; request_count: number | string }>>(`business_funnel_daily?${new URLSearchParams({ select: "request_date,source,status,request_count", order: "request_date.desc", limit: "1000" }).toString()}`),
    databaseGet<Array<{ supplier_id: string | null; checks_sent: number | string; checks_replied: number | string; mapping_exceptions: number | string; avg_response_hours: number | string | null }>>(`supplier_response_metrics?${new URLSearchParams({ select: "supplier_id,checks_sent,checks_replied,mapping_exceptions,avg_response_hours", limit: "1000" }).toString()}`),
    databaseGet<Array<{ id: string; display_name: string }>>(`supplier_directory?${new URLSearchParams({ select: "id,display_name", limit: "1000" }).toString()}`),
    databaseGet<Array<{ order_id: string; order_code: string; order_status: string; promised_delivery_date: string | null; incomplete_milestones: number | string; overdue_milestones: number | string }>>(`fulfillment_health?${new URLSearchParams({ select: "order_id,order_code,order_status,promised_delivery_date,incomplete_milestones,overdue_milestones", order: "promised_delivery_date.asc.nullslast", limit: "1000" }).toString()}`),
    databaseGet<Array<{ status: string; expected_amount: number | string | null; recorded_amount: number | string | null }>>(`vyapar_reconciliation?${new URLSearchParams({ select: "status,expected_amount,recorded_amount", limit: "5000" }).toString()}`),
    databaseGet<Array<{ source: string; medium: string; campaign: string; request_count: number | string; won_count: number | string; order_count: number | string }>>(`marketing_campaign_performance?${new URLSearchParams({ select: "source,medium,campaign,request_count,won_count,order_count", order: "request_count.desc", limit: "200" }).toString()}`),
    databaseGet<Array<{ status: string; contact_count: number | string }>>(`marketing_consent_summary?${new URLSearchParams({ select: "status,contact_count" }).toString()}`),
  ]);
  const countBy = <T extends string>(values: T[]) => [...values.reduce((counts, value) => counts.set(value, (counts.get(value) ?? 0) + 1), new Map<T, number>())]
    .map(([name, count]) => ({ status: name, count } as { status: T; count: number }))
    .sort((a, b) => b.count - a.count);
  const now = Date.now();
  const cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const recentRequests = requests.filter((request) => request.request_date >= cutoff);
  const enquiriesLast30Days = recentRequests.reduce((sum, request) => sum + (Number(request.request_count) || 0), 0);
  const weightedCounts = (key: "status" | "source") => {
    const counts = new Map<string, number>();
    for (const request of recentRequests) counts.set(request[key] || "Unknown", (counts.get(request[key] || "Unknown") ?? 0) + (Number(request.request_count) || 0));
    return [...counts].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);
  };
  const pipeline = weightedCounts("status");
  const sourceCounts = weightedCounts("source");
  const supplierNames = new Map(suppliers.map((supplier) => [supplier.id, supplier.display_name]));
  const supplierPerformance = supplierMetrics.map((row) => {
    const sent = Number(row.checks_sent) || 0;
    const replied = Number(row.checks_replied) || 0;
    const rawHours = row.avg_response_hours === null ? null : Number(row.avg_response_hours);
    return {
      supplier: row.supplier_id ? supplierNames.get(row.supplier_id) ?? "Unknown supplier" : "Unmapped products",
      sent, replied, responseRate: sent ? Math.round((replied / sent) * 100) : null,
      avgResponseHours: rawHours !== null && Number.isFinite(rawHours) ? Math.round(rawHours * 10) / 10 : null,
      mappingExceptions: Number(row.mapping_exceptions) || 0,
    };
  }).sort((a, b) => b.sent - a.sent);
  const atRiskOrders = fulfillment.filter((row) => !["Delivered", "Closed", "Cancelled"].includes(row.order_status) && (
    Number(row.overdue_milestones) > 0 || (row.promised_delivery_date && new Date(`${row.promised_delivery_date}T23:59:59`).getTime() < now)
  )).map((row) => ({
    orderCode: row.order_code, status: row.order_status, promisedDeliveryDate: row.promised_delivery_date,
    incompleteMilestones: Number(row.incomplete_milestones) || 0, overdueMilestones: Number(row.overdue_milestones) || 0,
  }));
  const financeCounts = countBy(reconciliation.map((record) => record.status));
  const mismatchAmount = reconciliation.filter((record) => ["Mismatch", "Needs review"].includes(record.status))
    .reduce((sum, record) => sum + Math.abs((Number(record.expected_amount) || 0) - (Number(record.recorded_amount) || 0)), 0);
  return {
    enquiriesLast30Days, leadPipeline: pipeline, leadSources: sourceCounts.map(({ status, count }) => ({ source: status, count })),
    supplierPerformance,
    fulfillment: {
      activeOrders: fulfillment.filter((order) => !["Delivered", "Closed", "Cancelled"].includes(order.order_status)).length,
      overdueMilestones: fulfillment.reduce((sum, order) => sum + (Number(order.overdue_milestones) || 0), 0),
      atRiskOrders,
    },
    finance: { byStatus: financeCounts, exceptionAmountGap: mismatchAmount },
    marketing: {
      activeEmailOptIns: Number(consentSummary.find((row) => row.status === "active")?.contact_count) || 0,
      campaigns: campaigns.map((row) => ({ source: row.source, medium: row.medium, campaign: row.campaign,
        requests: Number(row.request_count) || 0, won: Number(row.won_count) || 0, orders: Number(row.order_count) || 0 })),
    },
  };
}

export async function listOperationsExceptions(): Promise<OperationsException[]> {
  const query = (resource: string, select: string, limit = "1000") => databaseGet<Array<Record<string, unknown>>>(`${resource}?${new URLSearchParams({ select, order: "updated_at.desc", limit }).toString()}`);
  const [leads, supplierChecks, supplierDirectory, milestones, shipments, orders, finance, care, outbox, quotes, content] = await Promise.all([
    query("quote_requests", "id,status,owner,next_action,next_action_at,notion_sync_status,created_at,updated_at", "1000"),
    query("supplier_checks", "id,request_id,supplier_name,status,availability,notion_sync_status,notion_sync_error,whatsapp_send_error,created_at,updated_at", "1000"),
    query("supplier_directory", "id,supplier_code,display_name,notion_sync_status,notion_last_error,updated_at", "1000"),
    query("order_milestones", "id,order_id,stage,status,owner,due_at,updated_at", "2000"),
    query("fulfillment_shipments", "id,order_id,shipment_code,status,exception_notes,updated_at", "1000"),
    query("orders", "id,order_code,status,promised_delivery_date,notion_sync_status,notion_sync_error,ops_updated_at,updated_at", "1000"),
    query("vyapar_reconciliation", "id,order_id,document_type,status,notes,updated_at", "2000"),
    query("customer_care_tasks", "id,title,status,owner,due_at,notion_sync_status,notion_sync_error,updated_at", "1000"),
    query("automation_outbox", "id,event_type,status,attempts,last_error,created_at", "2000"),
    query("quote_versions", "id,quote_request_id,version,status,notion_sync_status,notion_last_error,updated_at", "1000"),
    query("marketing_content_items", "id,channel,campaign,status,owner,notion_sync_status,notion_last_error,updated_at", "1000"),
  ]);

  const ordersById = new Map(orders.map((row) => [String(row.id), String(row.order_code || "Order")]));
  const syncRecords: Array<{ kind: string; id: string; label: string; status: string; error: string | null; updated_at: string; href: string }> = [];
  const addSync = (kind: string, row: Record<string, unknown>, errorField: string, label: string, href: string, timestampField = "updated_at") => {
    if (typeof row.id !== "string" || typeof row.notion_sync_status !== "string") return;
    syncRecords.push({ kind, id: row.id, label, status: row.notion_sync_status,
      error: typeof row[errorField] === "string" ? row[errorField] as string : null,
      updated_at: String(row[timestampField] || row.updated_at || ""), href });
  };
  for (const row of leads) addSync("lead", row, "notion_last_error", `Lead ${String(row.id).slice(0, 8)}`, "/ops/leads");
  for (const row of supplierChecks) {
    addSync("supplier check", row, "notion_sync_error", `Supplier check ${String(row.id).slice(0, 8)}`, "/ops");
  }
  for (const row of supplierDirectory) addSync("supplier", row, "notion_last_error", String(row.display_name || row.supplier_code || "Supplier"), "/ops/suppliers");
  for (const row of orders) addSync("order", row, "notion_sync_error", String(row.order_code || "Order"), "/ops/orders", "ops_updated_at");
  for (const row of care) addSync("customer care", row, "notion_sync_error", String(row.title || "Care task"), "/ops/customer-care");
  for (const row of quotes) addSync("quote", row, "notion_last_error", `Quote ${String(row.id).slice(0, 8)}`, "/ops/quotes");
  for (const row of content) addSync("content", row, "notion_last_error", String(row.campaign || row.channel || "Content"), "/ops/content");

  return buildOperationsExceptions({
    leads: leads.map((row) => ({ id: String(row.id), status: String(row.status || ""), owner: typeof row.owner === "string" ? row.owner : null,
      next_action: typeof row.next_action === "string" ? row.next_action : null, next_action_at: typeof row.next_action_at === "string" ? row.next_action_at : null, created_at: String(row.created_at || "") })),
    orders: orders.map((row) => ({ id: String(row.id), order_code: String(row.order_code || "Order"), status: String(row.status || ""), promised_delivery_date: typeof row.promised_delivery_date === "string" ? row.promised_delivery_date : null })),
    syncRecords,
    supplierChecks: supplierChecks.map((row) => ({ id: String(row.id), request_id: String(row.request_id), supplier_name: typeof row.supplier_name === "string" ? row.supplier_name : null,
      status: String(row.status || ""), availability: String(row.availability || "Unknown"), whatsapp_send_error: typeof row.whatsapp_send_error === "string" ? row.whatsapp_send_error : null, created_at: String(row.created_at || "") })),
    milestones: milestones.map((row) => ({ id: String(row.id), order_id: String(row.order_id), order_code: ordersById.get(String(row.order_id)) || "Order",
      stage: String(row.stage || "Stage"), status: String(row.status || ""), owner: typeof row.owner === "string" ? row.owner : null, due_at: typeof row.due_at === "string" ? row.due_at : null })),
    shipments: shipments.map((row) => ({ id: String(row.id), order_id: String(row.order_id), order_code: ordersById.get(String(row.order_id)) || "Order",
      shipment_code: String(row.shipment_code || "Shipment"), status: String(row.status || ""), exception_notes: typeof row.exception_notes === "string" ? row.exception_notes : null, updated_at: String(row.updated_at || "") })),
    finance: finance.map((row) => ({ id: String(row.id), order_code: ordersById.get(String(row.order_id)) || null,
      document_type: String(row.document_type || "Document"), status: String(row.status || ""), notes: typeof row.notes === "string" ? row.notes : null, updated_at: String(row.updated_at || "") })),
    customerCare: care.map((row) => ({ id: String(row.id), title: String(row.title || "Customer-care task"), status: String(row.status || ""),
      owner: typeof row.owner === "string" ? row.owner : null, due_at: typeof row.due_at === "string" ? row.due_at : null, updated_at: String(row.updated_at || "") })),
    outbox: outbox.map((row) => ({ id: String(row.id), event_type: String(row.event_type || "automation event"), status: String(row.status || ""),
      attempts: Number(row.attempts) || 0, last_error: typeof row.last_error === "string" ? row.last_error : null, created_at: String(row.created_at || "") })),
  });
}

export async function listMarketingPermissions(): Promise<MarketingPermissionRecord[]> {
  const [permissions, events] = await Promise.all([
    databaseGet<Array<Omit<MarketingPermissionRecord, "events">>>(`customer_marketing_permissions?${new URLSearchParams({
      select: "id,normalized_email,channel,status,latest_request_id,wording_version,consented_at,revoked_at",
      order: "updated_at.desc", limit: "1000",
    }).toString()}`),
    databaseGet<Array<MarketingPermissionRecord["events"][number] & { permission_id: string }>>(`customer_marketing_permission_events?${new URLSearchParams({
      select: "id,permission_id,event_type,evidence_reference,actor,source,occurred_at", order: "occurred_at.desc", limit: "3000",
    }).toString()}`),
  ]);
  const byPermission = new Map<string, MarketingPermissionRecord["events"]>();
  for (const event of events) {
    const history = byPermission.get(event.permission_id) ?? [];
    if (history.length < 30) history.push(event);
    byPermission.set(event.permission_id, history);
  }
  return permissions.map((permission) => ({ ...permission, events: byPermission.get(permission.id) ?? [] }));
}

export async function revokeMarketingPermission(permissionId: string, evidenceReference: string, actor: string) {
  return databaseRequest<unknown>("rpc/revoke_customer_marketing_permission", {
    p_permission_id: permissionId, p_evidence_reference: evidenceReference, p_actor: actor,
  });
}

export async function listCustomerCareTasks(): Promise<CustomerCareTask[]> {
  const [tasks, orders] = await Promise.all([
    databaseGet<Array<Omit<CustomerCareTask, "order_code" | "company" | "contact" | "email" | "phone" | "original_contact_preference" | "quote_whatsapp_opt_in" | "activity">>>(`customer_care_tasks?${new URLSearchParams({
      select: "id,order_id,quote_request_id,task_type,title,status,owner,due_at,contact_channel,draft_message,outcome,notion_sync_status,created_at,updated_at",
      order: "due_at.asc.nullslast,created_at.desc", limit: "500",
    }).toString()}`),
    databaseGet<Array<{ id: string; order_code: string }>>(`orders?${new URLSearchParams({ select: "id,order_code", limit: "500" }).toString()}`),
  ]);
  if (!tasks.length) return [];
  const quoteIds = [...new Set(tasks.map((task) => task.quote_request_id))];
  const taskIds = tasks.map((task) => task.id);
  const [requests, events] = await Promise.all([
    databaseGet<Array<{ id: string; payload: NormalizedEnquiry }>>(`quote_requests?${new URLSearchParams({ select: "id,payload", id: `in.(${quoteIds.join(",")})`, limit: "500" }).toString()}`),
    databaseGet<Array<CustomerCareTask["activity"][number] & { task_id: string }>>(`customer_care_events?${new URLSearchParams({
      select: "id,task_id,event_type,previous_status,new_status,actor,occurred_at,details", task_id: `in.(${taskIds.join(",")})`, order: "occurred_at.desc", limit: "2000",
    }).toString()}`),
  ]);
  const orderCodes = new Map(orders.map((order) => [order.id, order.order_code]));
  const requestPayloads = new Map(requests.map((request) => [request.id, request.payload]));
  const activityByTask = new Map<string, CustomerCareTask["activity"]>();
  for (const event of events) {
    const history = activityByTask.get(event.task_id) ?? [];
    if (history.length < 20) history.push(event);
    activityByTask.set(event.task_id, history);
  }
  return tasks.map((task) => {
    const payload = requestPayloads.get(task.quote_request_id);
    return {
      ...task, order_code: orderCodes.get(task.order_id) ?? "Order not found",
      company: payload?.contact.company ?? "Company not provided", contact: payload?.contact.name ?? "Contact not provided",
      email: payload?.contact.email ?? null, phone: payload?.contact.phone ?? null,
      original_contact_preference: payload?.contactPreference ?? null,
      quote_whatsapp_opt_in: payload?.whatsappUpdatesOptIn === true,
      activity: activityByTask.get(task.id) ?? [],
    };
  });
}

export async function updateCustomerCareTask(input: {
  taskId: string | null; orderId: string | null; taskType: string | null; title: string | null;
  status: string; owner: string; dueAt: string | null; contactChannel: string | null;
  draftMessage: string; outcome: string; actor: string;
}) {
  return databaseRequest<unknown>("rpc/update_customer_care_task", {
    p_task_id: input.taskId, p_order_id: input.orderId, p_task_type: input.taskType, p_title: input.title,
    p_status: input.status, p_owner: input.owner, p_due_at: input.dueAt, p_contact_channel: input.contactChannel,
    p_draft_message: input.draftMessage, p_outcome: input.outcome, p_actor: input.actor,
  });
}

export async function claimCustomerCareNotionSync(taskId?: string) {
  return databaseRequest<Array<{
    task_id: string; task_type: string; title: string; task_status: string; owner: string | null; due_at: string | null;
    contact_channel: string | null; draft_message: string | null; outcome: string | null; updated_at: string;
    order_id: string; order_code: string; quote_request_id: string; request_payload: NormalizedEnquiry; notion_attempts: number;
  }>>("rpc/claim_customer_care_notion_sync", { p_task_id: taskId ?? null });
}

export async function finishCustomerCareNotionSync(taskId: string, claimedUpdatedAt: string, notionPageId?: string, error?: string) {
  return databaseRequest<unknown>("rpc/finish_customer_care_notion_sync", {
    p_task_id: taskId, p_claimed_updated_at: claimedUpdatedAt, p_notion_page_id: notionPageId ?? null,
    p_error: error?.slice(0, 400) ?? null,
  });
}

export async function persistQuoteRequest(enquiry: NormalizedEnquiry): Promise<QuotePersistenceResult> {
  if (!getDatabaseConfig()) return { ok: false, code: "storage_not_configured" };
  try {
    const rows = await databaseRequest<StoredQuoteRequest[]>("rpc/submit_quote_request", {
      p_client_submission_id: enquiry.clientSubmissionId || null,
      p_payload: enquiry,
    });
    const record = Array.isArray(rows) ? rows[0] : rows;
    if (!record || typeof record.id !== "string") return { ok: false, code: "storage_failed" };
    return { ok: true, requestId: record.id, notionSyncStatus: record.notion_sync_status ?? "pending" };
  } catch (error) {
    if (error instanceof Error && error.message === "storage_not_configured") return { ok: false, code: "storage_not_configured" };
    if (error instanceof Error && error.message === "submission_conflict") return { ok: false, code: "submission_conflict" };
    return { ok: false, code: "storage_failed" };
  }
}

export async function claimNotionSync(requestId?: string) {
  return databaseRequest<Array<{
    outbox_id: string; request_id: string; request_payload: NormalizedEnquiry;
    request_status: LeadPipelineStatus; owner: string | null; next_action: string | null;
    next_action_at: string | null; crm_updated_at: string;
  }>>(
    "rpc/claim_quote_notion_sync_v2", { p_request_id: requestId ?? null },
  );
}

export async function finishNotionSync(outboxId: string, claimedCrmUpdatedAt: string, notionPageId?: string, error?: string) {
  return databaseRequest<unknown>("rpc/finish_quote_notion_sync_v2", {
    p_outbox_id: outboxId,
    p_claimed_crm_updated_at: claimedCrmUpdatedAt,
    p_notion_page_id: notionPageId ?? null,
    p_error: error?.slice(0, 400) ?? null,
  });
}

export async function claimSupplierCheckPreparation(requestId?: string) {
  return databaseRequest<Array<{ outbox_id: string; request_id: string }>>(
    "rpc/claim_supplier_check_preparation", { p_request_id: requestId ?? null },
  );
}

export async function prepareSupplierChecks(requestId: string) {
  return databaseRequest<SupplierCheckRecord[]>("rpc/prepare_supplier_checks", { p_request_id: requestId });
}

export async function finishSupplierCheckPreparation(outboxId: string, error?: string) {
  return databaseRequest<unknown>("rpc/finish_supplier_check_preparation", {
    p_outbox_id: outboxId,
    p_error: error?.slice(0, 300) ?? null,
  });
}

export async function claimSupplierCheckNotionSync(checkId?: string) {
  return databaseRequest<SupplierCheckRecord[]>("rpc/claim_supplier_check_notion_sync", { p_check_id: checkId ?? null });
}

export async function finishSupplierCheckNotionSync(checkId: string, notionPageId?: string, error?: string) {
  return databaseRequest<unknown>("rpc/finish_supplier_check_notion_sync", {
    p_check_id: checkId,
    p_notion_page_id: notionPageId ?? null,
    p_error: error?.slice(0, 300) ?? null,
  });
}

export async function recordSupplierWhatsAppReply(reply: {
  providerMessageId: string;
  senderPhone: string;
  contextMessageId: string | null;
  messageType: string;
  text: string;
}) {
  return databaseRequest<Array<{ stored_message_id: string; matched_check_id: string | null; event_status: string; is_duplicate: boolean }>>(
    "rpc/record_supplier_whatsapp_reply",
    {
      p_provider_message_id: reply.providerMessageId,
      p_sender_phone: reply.senderPhone,
      p_context_message_id: reply.contextMessageId,
      p_message_type: reply.messageType,
      p_message_text: reply.text,
    },
  );
}

export async function approveSupplierCheckForWhatsApp(checkId: string, reviewer: string) {
  return databaseRequest<SupplierCheckRecord[]>("rpc/approve_supplier_check_for_whatsapp", {
    p_check_id: checkId,
    p_reviewer: reviewer,
  });
}

export async function reviewSupplierCheckReply(input: {
  checkId: string;
  availability: "Available" | "Partial" | "Unavailable";
  quotedUnitPrice: number | null;
  moq: number | null;
  leadTime: string;
  reviewer: string;
  notes: string;
}) {
  return databaseRequest<SupplierCheckRecord[]>("rpc/review_supplier_check_reply", {
    p_check_id: input.checkId,
    p_availability: input.availability,
    p_quoted_unit_price: input.quotedUnitPrice,
    p_moq: input.moq,
    p_lead_time: input.leadTime,
    p_reviewer: input.reviewer,
    p_notes: input.notes,
  });
}

export async function claimSupplierCheckWhatsAppSend(checkId: string, actor: string) {
  return databaseRequest<SupplierWhatsAppSendClaim[]>("rpc/claim_supplier_check_whatsapp_send", {
    p_check_id: checkId,
    p_actor: actor,
  });
}

export async function completeSupplierCheckWhatsAppSend(checkId: string, providerMessageId: string) {
  return databaseRequest<unknown>("rpc/complete_supplier_check_whatsapp_send", {
    p_check_id: checkId,
    p_provider_message_id: providerMessageId,
  });
}

export async function failSupplierCheckWhatsAppSend(checkId: string, errorCode: string) {
  return databaseRequest<unknown>("rpc/fail_supplier_check_whatsapp_send", {
    p_check_id: checkId,
    p_error_code: errorCode,
  });
}

export async function listMarketingContent(): Promise<MarketingContentRecord[]> {
  const [items, events] = await Promise.all([
    databaseGet<Array<Omit<MarketingContentRecord, "events">>>(`marketing_content_items?${new URLSearchParams({
      select: "id,channel,campaign,objective,audience,brief,status,content,keyword_suggestions,image_brief,owner,created_by,model,usage,publish_at,approved_by,approved_at,published_url,published_at,notion_page_id,notion_sync_status,notion_synced_at,notion_attempts,notion_last_error,created_at,updated_at",
      order: "updated_at.desc", limit: "200",
    }).toString()}`),
    databaseGet<Array<MarketingContentRecord["events"][number] & { content_item_id: string }>>(`marketing_content_events?${new URLSearchParams({
      select: "id,content_item_id,event_type,previous_status,new_status,actor,note,reference,occurred_at",
      order: "occurred_at.desc", limit: "2000",
    }).toString()}`),
  ]);
  const eventMap = new Map<string, MarketingContentRecord["events"]>();
  for (const event of events) {
    const list = eventMap.get(event.content_item_id) ?? [];
    if (list.length < 30) list.push(event);
    eventMap.set(event.content_item_id, list);
  }
  return items.map((item) => ({ ...item, events: eventMap.get(item.id) ?? [] }));
}

export async function saveMarketingContentDraft(input: {
  id: string | null; channel: string; campaign: string; objective: string; audience: string; brief: string;
  content: Record<string, unknown>; keywordSuggestions: string[]; imageBrief: string; publishAt: string | null;
  owner: string; actor: string; model?: string | null; usage?: Record<string, unknown>;
}) {
  return databaseRequest<MarketingContentRecord[]>("rpc/save_marketing_content_draft", {
    p_content_item_id: input.id, p_channel: input.channel, p_campaign: input.campaign, p_objective: input.objective,
    p_audience: input.audience, p_brief: input.brief, p_content: input.content,
    p_keyword_suggestions: input.keywordSuggestions, p_image_brief: input.imageBrief, p_publish_at: input.publishAt,
    p_owner: input.owner, p_actor: input.actor, p_model: input.model ?? null, p_usage: input.usage ?? {},
  });
}

export async function transitionMarketingContent(input: {
  id: string; action: string; actor: string; note?: string; publishAt?: string | null; publishedUrl?: string;
}) {
  return databaseRequest<MarketingContentRecord[]>("rpc/transition_marketing_content", {
    p_content_item_id: input.id, p_action: input.action, p_actor: input.actor,
    p_note: input.note ?? null, p_publish_at: input.publishAt ?? null, p_published_url: input.publishedUrl ?? null,
  });
}

export async function claimMarketingContentNotionSync(contentItemId?: string) {
  return databaseRequest<MarketingContentRecord[]>("rpc/claim_marketing_content_notion_sync", { p_content_item_id: contentItemId ?? null });
}

export async function finishMarketingContentNotionSync(contentItemId: string, claimedUpdatedAt: string, notionPageId?: string, error?: string) {
  return databaseRequest<unknown>("rpc/finish_marketing_content_notion_sync", {
    p_content_item_id: contentItemId, p_claimed_updated_at: claimedUpdatedAt,
    p_notion_page_id: notionPageId ?? null, p_error: error?.slice(0, 400) ?? null,
  });
}

export async function listAgentRuns(): Promise<AgentRunRecord[]> {
  const [runs, events] = await Promise.all([
    databaseGet<Array<Omit<AgentRunRecord, "events">>>(`agent_runs?${new URLSearchParams({
      select: "id,agent_key,trigger_name,quote_request_id,order_id,content_item_id,input_reference,proposed_action,status,human_correction,correction_reason,reviewer,outcome,created_at,reviewed_at,updated_at,notion_page_id,notion_sync_status,notion_synced_at,notion_attempts,notion_last_error",
      order: "created_at.desc", limit: "300",
    }).toString()}`),
    databaseGet<Array<AgentRunRecord["events"][number] & { agent_run_id: string }>>(`agent_run_feedback_events?${new URLSearchParams({
      select: "id,agent_run_id,event_type,previous_status,new_status,before_feedback,after_feedback,actor,occurred_at",
      order: "occurred_at.desc", limit: "3000",
    }).toString()}`),
  ]);
  const eventMap = new Map<string, AgentRunRecord["events"]>();
  for (const event of events) {
    const list = eventMap.get(event.agent_run_id) ?? [];
    if (list.length < 30) list.push(event);
    eventMap.set(event.agent_run_id, list);
  }
  return runs.map((run) => ({ ...run, events: eventMap.get(run.id) ?? [] }));
}

export async function findSalesTriageRunForQuoteRequest(requestId: string): Promise<string | null> {
  const runs = await databaseGet<Array<{ id: string }>>(`agent_runs?${new URLSearchParams({
    select: "id", quote_request_id: `eq.${requestId}`, agent_key: "eq.sales",
    trigger_name: "eq.quote_request_received", order: "created_at.desc", limit: "1",
  }).toString()}`);
  return runs[0]?.id ?? null;
}

export async function reviewAgentRun(input: {
  id: string; status: string; humanCorrection: string; correctionReason: string; outcome: string; reviewer: string;
}) {
  return databaseRequest<AgentRunRecord[]>("rpc/review_agent_run", {
    p_agent_run_id: input.id, p_status: input.status, p_human_correction: input.humanCorrection,
    p_correction_reason: input.correctionReason, p_outcome: input.outcome, p_reviewer: input.reviewer,
  });
}

export async function claimAgentRunNotionSync(agentRunId?: string) {
  return databaseRequest<AgentRunRecord[]>("rpc/claim_agent_run_notion_sync", { p_agent_run_id: agentRunId ?? null });
}

export async function finishAgentRunNotionSync(agentRunId: string, claimedUpdatedAt: string, notionPageId?: string, error?: string) {
  return databaseRequest<unknown>("rpc/finish_agent_run_notion_sync", {
    p_agent_run_id: agentRunId, p_claimed_updated_at: claimedUpdatedAt,
    p_notion_page_id: notionPageId ?? null, p_error: error?.slice(0, 400) ?? null,
  });
}
