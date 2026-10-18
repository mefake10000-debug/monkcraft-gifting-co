import type { NormalizedEnquiry } from "@/lib/enquiry/validateServer";
import {
  claimNotionSync,
  claimSupplierCheckNotionSync,
  finishNotionSync,
  claimOrderNotionSync,
  claimCustomerCareNotionSync,
  claimSupplierDirectoryNotionSync,
  claimQuoteVersionNotionSync,
  claimMarketingContentNotionSync,
  claimAgentRunNotionSync,
  finishOrderNotionSync,
  finishCustomerCareNotionSync,
  finishSupplierCheckNotionSync,
  finishSupplierDirectoryNotionSync,
  finishQuoteVersionNotionSync,
  finishMarketingContentNotionSync,
  finishAgentRunNotionSync,
  getQuoteRequestPayload,
  listProductMappingsForSupplier,
  type SupplierCheckRecord,
  type SupplierDirectoryRecord,
} from "@/lib/automation/store";

const NOTION_VERSION = "2026-03-11";

function getNotionToken() {
  return process.env.MONKCRAFT_NOTION_TOKEN?.trim() || null;
}

function getNotionConfig() {
  const token = getNotionToken();
  const leadsDataSourceId = process.env.MONKCRAFT_NOTION_LEADS_DATA_SOURCE_ID?.trim();
  return token && leadsDataSourceId ? { token, leadsDataSourceId } : null;
}

function getSupplierChecksDataSourceId() {
  return process.env.MONKCRAFT_NOTION_SUPPLIER_CHECKS_DATA_SOURCE_ID?.trim() || null;
}

function getSuppliersDataSourceId() {
  return process.env.MONKCRAFT_NOTION_SUPPLIERS_DATA_SOURCE_ID?.trim() || null;
}

function getQuotesOrdersDataSourceId() {
  return process.env.MONKCRAFT_NOTION_QUOTES_ORDERS_DATA_SOURCE_ID?.trim() || null;
}

function getCustomerCareDataSourceId() {
  return process.env.MONKCRAFT_NOTION_CUSTOMER_CARE_DATA_SOURCE_ID?.trim() || null;
}

function getMarketingContentDataSourceId() {
  return process.env.MONKCRAFT_NOTION_CONTENT_DATA_SOURCE_ID?.trim() || null;
}

function getAgentFeedbackDataSourceId() {
  return process.env.MONKCRAFT_NOTION_AGENT_FEEDBACK_DATA_SOURCE_ID?.trim() || null;
}

export function isNotionLeadSyncConfigured() {
  return Boolean(getNotionConfig());
}

export function isNotionSupplierCheckSyncConfigured() {
  return Boolean(getNotionToken() && getSupplierChecksDataSourceId());
}

export function isNotionSupplierDirectorySyncConfigured() {
  return Boolean(getNotionToken() && getSuppliersDataSourceId());
}

export function isNotionOrderSyncConfigured() {
  return Boolean(getNotionToken() && getQuotesOrdersDataSourceId());
}

export function isNotionQuoteSyncConfigured() {
  return Boolean(getNotionToken() && getQuotesOrdersDataSourceId());
}

export function isNotionCustomerCareSyncConfigured() {
  return Boolean(getNotionToken() && getCustomerCareDataSourceId());
}

export function isNotionMarketingContentSyncConfigured() {
  return Boolean(getNotionToken() && getMarketingContentDataSourceId());
}

export function isNotionAgentFeedbackSyncConfigured() {
  return Boolean(getNotionToken() && getAgentFeedbackDataSourceId());
}

async function notionRequest(path: string, init: RequestInit = {}) {
  const token = getNotionToken();
  if (!token) throw new Error("notion_not_configured");
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as unknown;
  if (!response.ok) throw new Error(`notion_http_${response.status}`);
  return body as Record<string, unknown>;
}

function richText(content: string) {
  const trimmed = content.trim().slice(0, 1900);
  return { rich_text: trimmed ? [{ text: { content: trimmed } }] : [] };
}

function textValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function pageProperties(requestId: string, enquiry: NormalizedEnquiry, crm: {
  status: string; owner: string | null; nextAction: string | null; nextActionAt: string | null;
}) {
  const programme = enquiry.programme ?? {};
  const items = enquiry.products.map((product) => {
    const quantity = product.quantity ? ` × ${product.quantity}` : "";
    return `${product.id || product.name}${quantity}`;
  }).join(", ");
  const source = enquiry.source.toLowerCase().includes("linkedin") ? "LinkedIn"
    : enquiry.source.toLowerCase().includes("google") ? "Google"
      : enquiry.source.toLowerCase().includes("referral") ? "Referral"
      : enquiry.source.toLowerCase().includes("event") ? "Event" : "Website";
  const firstTouch = enquiry.attribution?.firstTouch;
  const lastTouch = enquiry.attribution?.lastTouch;
  const properties: Record<string, unknown> = {
    Lead: { title: [{ text: { content: `${enquiry.contact.company} — ${enquiry.contact.name}`.slice(0, 1900) } }] },
    Status: { select: { name: crm.status } },
    Owner: richText(crm.owner || ""),
    "Request ID": richText(requestId),
    "Next action date": { date: crm.nextActionAt ? { start: crm.nextActionAt } : null },
    Company: richText(enquiry.contact.company),
    Contact: richText(enquiry.contact.name),
    Source: { select: { name: source } },
    "Contact preference": { select: { name: enquiry.contactPreference === "whatsapp" ? "WhatsApp" : enquiry.contactPreference === "phone" ? "Phone" : "Email" } },
    "WhatsApp opt-in": { checkbox: enquiry.whatsappUpdatesOptIn },
    "Email marketing opt-in": { checkbox: enquiry.marketingEmailOptIn },
    "First touch source": richText(firstTouch?.source || ""),
    "Last touch source": richText(lastTouch?.source || ""),
    "Campaign source": richText(lastTouch?.source || ""),
    "Campaign medium": richText(lastTouch?.medium || ""),
    Campaign: richText(lastTouch?.campaign || ""),
    "Campaign term": richText(lastTouch?.term || ""),
    "Campaign content": richText(lastTouch?.content || ""),
    "Landing page": richText(firstTouch?.landingPath || ""),
    "Referrer domain": richText(firstTouch?.referrerHost || ""),
    Occasion: richText(textValue(programme.occasion)),
    "Recipient count": richText(textValue(programme.recipientCount)),
    "Budget per recipient": richText(textValue(programme.budgetPerRecipient)),
    Branding: richText(textValue(programme.branding)),
    "Delivery location": richText(textValue(programme.deliveryLocation)),
    Products: richText(items || "No catalogue items selected"),
    Notes: richText([textValue(programme.notes), enquiry.message, enquiry.summary].filter(Boolean).join("\n\n")),
    "Next action": richText(crm.nextAction || "Review brief and assign sales owner"),
    Team: { select: { name: "Sales" } },
  };
  if (enquiry.contact.email) properties.Email = { email: enquiry.contact.email };
  if (enquiry.contact.phone) properties.Phone = { phone_number: enquiry.contact.phone };
  if (typeof programme.deliveryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(programme.deliveryDate)) {
    properties["Delivery date"] = { date: { start: programme.deliveryDate } };
  }
  return properties;
}

async function findExistingLead(requestId: string) {
  const { leadsDataSourceId } = getNotionConfig()!;
  const query = await notionRequest(`/data_sources/${leadsDataSourceId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: { property: "Request ID", rich_text: { equals: requestId } },
      page_size: 1,
    }),
  });
  const results = Array.isArray(query.results) ? query.results as Array<{ id?: unknown }> : [];
  return typeof results[0]?.id === "string" ? results[0].id : null;
}

async function findExistingSupplier(supplierCode: string) {
  const dataSourceId = getSuppliersDataSourceId();
  if (!dataSourceId) throw new Error("notion_suppliers_not_configured");
  const query = await notionRequest(`/data_sources/${dataSourceId}/query`, {
    method: "POST",
    body: JSON.stringify({ filter: { property: "Supplier Code", rich_text: { equals: supplierCode } }, page_size: 1 }),
  });
  const results = Array.isArray(query.results) ? query.results as Array<{ id?: unknown }> : [];
  return typeof results[0]?.id === "string" ? results[0].id : null;
}

async function findExistingQuote(quoteId: string) {
  const dataSourceId = getQuotesOrdersDataSourceId();
  if (!dataSourceId) throw new Error("notion_quotes_orders_not_configured");
  const query = await notionRequest(`/data_sources/${dataSourceId}/query`, {
    method: "POST", body: JSON.stringify({ filter: { property: "Quote ID", rich_text: { equals: quoteId } }, page_size: 1 }),
  });
  const results = Array.isArray(query.results) ? query.results as Array<{ id?: unknown }> : [];
  return typeof results[0]?.id === "string" ? results[0].id : null;
}

async function upsertQuoteVersion(quote: Awaited<ReturnType<typeof claimQuoteVersionNotionSync>>[number]) {
  const dataSourceId = getQuotesOrdersDataSourceId();
  if (!dataSourceId) throw new Error("notion_quotes_orders_not_configured");
  const request = await getQuoteRequestPayload(quote.quote_request_id);
  if (!request) throw new Error("quote_request_not_found_for_notion_sync");
  const enquiry = request.payload;
  const snapshot = quote.snapshot;
  const customerApproval = quote.status === "Accepted" ? "Approved"
    : quote.status === "Declined" ? "Declined"
      : ["Sent", "Superseded"].includes(quote.status) ? "Pending" : "Not sent";
  const properties: Record<string, unknown> = {
    "Quote / Order": { title: [{ text: { content: `${enquiry.contact.company} — Quote v${quote.version}`.slice(0, 1900) } }] },
    "Quote ID": richText(quote.id),
    "Request ID": richText(quote.quote_request_id),
    "Quote version": richText(`v${quote.version}`),
    Status: { select: { name: quote.status } },
    "Quote total INR": { number: quote.total_paise / 100 },
    "Quote valid until": { date: quote.valid_until ? { start: quote.valid_until } : null },
    "Quote terms": richText(quote.terms),
    "Approved by": richText(quote.approved_by || ""),
    "Sent reference": richText(quote.sent_evidence_reference || ""),
    "Buyer decision reference": richText(quote.buyer_decision_reference || ""),
    Company: richText(enquiry.contact.company),
    Contact: richText(enquiry.contact.name),
    Products: richText(snapshot.lines.map((line) => `${line.productId} × ${line.quantity} @ ${line.unitPricePaise / 100}`).join(", ")),
    "Customer approval": { select: { name: customerApproval } },
    "Approval reference": richText(quote.buyer_decision_reference || ""),
    Notes: richText([quote.terms, snapshot.adjustments.map((item) => `${item.label}: ₹${(item.amountPaise / 100).toFixed(2)}`).join("; ")].filter(Boolean).join("\n\n")),
    Team: { select: { name: "Sales" } },
  };
  if (enquiry.contact.email) properties.Email = { email: enquiry.contact.email };
  if (enquiry.programme.deliveryLocation) properties["Delivery location"] = richText(enquiry.programme.deliveryLocation);
  if (enquiry.programme.deliveryDate && /^\d{4}-\d{2}-\d{2}$/.test(enquiry.programme.deliveryDate)) {
    properties["Delivery date"] = { date: { start: enquiry.programme.deliveryDate } };
  }
  const existingId = quote.notion_page_id || await findExistingQuote(quote.id);
  if (existingId) {
    const page = await notionRequest(`/pages/${existingId}`, { method: "PATCH", body: JSON.stringify({ properties }) });
    return typeof page.id === "string" ? page.id : existingId;
  }
  const page = await notionRequest("/pages", {
    method: "POST", body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: dataSourceId }, properties }),
  });
  if (typeof page.id !== "string") throw new Error("notion_quote_page_id_missing");
  return page.id;
}

export async function syncOneNotionQuoteVersion(quoteVersionId?: string): Promise<"synced" | "failed" | "empty" | "not_configured"> {
  if (!isNotionQuoteSyncConfigured()) return "not_configured";
  const claimed = await claimQuoteVersionNotionSync(quoteVersionId);
  const quote = claimed[0];
  if (!quote) return "empty";
  try {
    const pageId = await upsertQuoteVersion(quote);
    await finishQuoteVersionNotionSync(quote.id, quote.updated_at, pageId);
    return "synced";
  } catch (error) {
    const code = error instanceof Error ? error.message : "notion_quote_sync_failed";
    try { await finishQuoteVersionNotionSync(quote.id, quote.updated_at, undefined, code); } catch { /* Retry after the database claim expires if finish cannot be written. */ }
    return "failed";
  }
}

async function upsertSupplierDirectoryRecord(supplier: SupplierDirectoryRecord) {
  const dataSourceId = getSuppliersDataSourceId();
  if (!dataSourceId) throw new Error("notion_suppliers_not_configured");
  const mappingRows = await listProductMappingsForSupplier(supplier.id);
  const activeProductIds = mappingRows.filter((mapping) => mapping.active).map((mapping) => mapping.product_id);
  const status = !supplier.active ? "Paused" : activeProductIds.length ? "Mapped" : "Needs mapping";
  const properties: Record<string, unknown> = {
    Supplier: { title: [{ text: { content: supplier.display_name.slice(0, 1900) } }] },
    "Supplier Code": richText(supplier.supplier_code),
    Status: { select: { name: status } },
    Category: richText(supplier.category),
    Products: richText(activeProductIds.join(", ")),
    Contact: richText(supplier.contact_name || ""),
    "WhatsApp opt-in": { checkbox: supplier.whatsapp_opt_in },
    "Response notes": richText(supplier.whatsapp_opt_in
      ? `WhatsApp opt-in evidence: ${supplier.whatsapp_opt_in_evidence_reference || "recorded"}`
      : "WhatsApp opt-in not recorded; do not send WhatsApp messages."),
  };
  properties.Phone = supplier.phone_e164 ? { phone_number: supplier.phone_e164 } : { phone_number: null };
  properties.Email = supplier.email ? { email: supplier.email } : { email: null };
  const existingId = supplier.notion_page_id || await findExistingSupplier(supplier.supplier_code);
  if (existingId) {
    const page = await notionRequest(`/pages/${existingId}`, { method: "PATCH", body: JSON.stringify({ properties }) });
    return typeof page.id === "string" ? page.id : existingId;
  }
  const page = await notionRequest("/pages", {
    method: "POST", body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: dataSourceId }, properties }),
  });
  if (typeof page.id !== "string") throw new Error("notion_supplier_page_id_missing");
  return page.id;
}

export async function syncOneNotionSupplierDirectoryRecord(supplierId?: string): Promise<"synced" | "failed" | "empty" | "not_configured"> {
  if (!isNotionSupplierDirectorySyncConfigured()) return "not_configured";
  const claimed = await claimSupplierDirectoryNotionSync(supplierId);
  const supplier = claimed[0];
  if (!supplier) return "empty";
  try {
    const pageId = await upsertSupplierDirectoryRecord(supplier);
    await finishSupplierDirectoryNotionSync(supplier.id, supplier.updated_at, pageId);
    return "synced";
  } catch (error) {
    const code = error instanceof Error ? error.message : "notion_supplier_directory_sync_failed";
    try { await finishSupplierDirectoryNotionSync(supplier.id, supplier.updated_at, undefined, code); } catch { /* Retry after the DB claim expires if finish cannot be written. */ }
    return "failed";
  }
}

async function upsertLead(requestId: string, enquiry: NormalizedEnquiry, crm: {
  status: string; owner: string | null; nextAction: string | null; nextActionAt: string | null;
}) {
  const config = getNotionConfig();
  if (!config) throw new Error("notion_not_configured");
  const existingId = await findExistingLead(requestId);
  if (existingId) {
    const page = await notionRequest(`/pages/${existingId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties: pageProperties(requestId, enquiry, crm) }),
    });
    return String(page.id || existingId);
  }
  const page = await notionRequest("/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { type: "data_source_id", data_source_id: config.leadsDataSourceId },
      properties: pageProperties(requestId, enquiry, crm),
    }),
  });
  if (typeof page.id !== "string") throw new Error("notion_invalid_page_response");
  return page.id;
}

function supplierCheckProperties(check: SupplierCheckRecord) {
  const itemSummary = check.product_lines.map((line) => `${line.id || line.name}${line.quantity ? ` × ${line.quantity}` : ""}`).join(", ");
  const compactRequestId = check.request_id.slice(0, 8).toUpperCase();
  const title = `${check.supplier_name || "Unmapped products"} — ${compactRequestId}`.slice(0, 1900);
  const properties: Record<string, unknown> = {
    "Availability check": { title: [{ text: { content: title } }] },
    "Supplier Check ID": richText(check.id),
    "Request ID": richText(check.request_id),
    Supplier: richText(check.supplier_name || "Needs supplier mapping"),
    Products: richText(itemSummary || "No mapped products"),
    Quantity: { number: check.total_units },
    Status: { select: { name: check.status } },
    Availability: { select: { name: check.availability || "Unknown" } },
    Reply: richText(check.reply_text || ""),
    Team: { select: { name: "Operations" } },
    "Next action": richText(check.supplier_id ? "Verify supplier quantity, price, MOQ and lead time" : "Map product IDs to an active supplier"),
  };
  if (check.supplier_category) properties.Category = richText(check.supplier_category);
  if (typeof check.quoted_unit_price === "number") properties.Price = { number: check.quoted_unit_price };
  if (typeof check.moq === "number") properties.MOQ = { number: check.moq };
  if (check.lead_time) properties["Lead time"] = richText(check.lead_time);
  return properties;
}

async function findExistingSupplierCheck(checkId: string, dataSourceId: string) {
  const query = await notionRequest(`/data_sources/${dataSourceId}/query`, {
    method: "POST",
    body: JSON.stringify({ filter: { property: "Supplier Check ID", rich_text: { equals: checkId } }, page_size: 1 }),
  });
  const results = Array.isArray(query.results) ? query.results as Array<{ id?: unknown }> : [];
  return typeof results[0]?.id === "string" ? results[0].id : null;
}

async function upsertSupplierCheck(check: SupplierCheckRecord) {
  const dataSourceId = getSupplierChecksDataSourceId();
  if (!dataSourceId) throw new Error("notion_supplier_checks_not_configured");
  const existingId = await findExistingSupplierCheck(check.id, dataSourceId);
  if (existingId) {
    const page = await notionRequest(`/pages/${existingId}`, { method: "PATCH", body: JSON.stringify({ properties: supplierCheckProperties(check) }) });
    return String(page.id || existingId);
  }
  const page = await notionRequest("/pages", {
    method: "POST",
    body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: dataSourceId }, properties: supplierCheckProperties(check) }),
  });
  if (typeof page.id !== "string") throw new Error("notion_invalid_page_response");
  return page.id;
}

function orderProperties(item: Awaited<ReturnType<typeof claimOrderNotionSync>>[number]) {
  const enquiry = item.request_payload;
  const status = ["Delivered", "Closed"].includes(item.order_status) ? "Delivered / Closed" : item.order_status;
  const programme = enquiry.programme ?? {};
  const props: Record<string, unknown> = {
    "Quote / Order": { title: [{ text: { content: `${item.order_code} — ${enquiry.contact.company}`.slice(0, 1900) } }] },
    Status: { select: { name: status } },
    Owner: richText(""),
    "Next action": richText(`Update ${item.order_status.toLowerCase()} fulfilment stage`),
    "Next action date": { date: null },
    Team: { select: { name: "Operations" } },
    "Request ID": richText(item.quote_request_id),
    "Order ID": richText(item.order_code),
    "Quote version": richText(item.accepted_quote_version || ""),
    Company: richText(enquiry.contact.company),
    Contact: richText(enquiry.contact.name),
    "Delivery location": richText(textValue(programme.deliveryLocation)),
    "Customer approval": { select: { name: "Approved" } },
    "Approval reference": richText(item.customer_approval_reference),
    "Customer PO": richText(item.customer_po_reference || ""),
  };
  if (enquiry.contact.email) props.Email = { email: enquiry.contact.email };
  if (typeof programme.deliveryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(programme.deliveryDate)) {
    props["Delivery date"] = { date: { start: programme.deliveryDate } };
  }
  if (item.promised_delivery_date) props["Promised delivery date"] = { date: { start: item.promised_delivery_date } };
  return props;
}

async function upsertOrder(item: Awaited<ReturnType<typeof claimOrderNotionSync>>[number]) {
  const dataSourceId = getQuotesOrdersDataSourceId();
  if (!dataSourceId) throw new Error("notion_quotes_orders_not_configured");
  const query = await notionRequest(`/data_sources/${dataSourceId}/query`, {
    method: "POST",
    body: JSON.stringify({ filter: { property: "Order ID", rich_text: { equals: item.order_code } }, page_size: 1 }),
  });
  const results = Array.isArray(query.results) ? query.results as Array<{ id?: unknown }> : [];
  const existingId = typeof results[0]?.id === "string" ? results[0].id : null;
  if (existingId) {
    const page = await notionRequest(`/pages/${existingId}`, { method: "PATCH", body: JSON.stringify({ properties: orderProperties(item) }) });
    return String(page.id || existingId);
  }
  const page = await notionRequest("/pages", {
    method: "POST",
    body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: dataSourceId }, properties: orderProperties(item) }),
  });
  if (typeof page.id !== "string") throw new Error("notion_invalid_page_response");
  return page.id;
}

export async function syncOneNotionOrder(orderId?: string): Promise<"synced" | "failed" | "empty" | "not_configured"> {
  if (!isNotionOrderSyncConfigured()) return "not_configured";
  let claimed: Awaited<ReturnType<typeof claimOrderNotionSync>>;
  try { claimed = await claimOrderNotionSync(orderId); } catch { return "failed"; }
  const item = Array.isArray(claimed) ? claimed[0] : undefined;
  if (!item) return "empty";
  try {
    const pageId = await upsertOrder(item);
    await finishOrderNotionSync(item.order_id, item.ops_updated_at, pageId);
    return "synced";
  } catch (error) {
    const code = error instanceof Error ? error.message : "notion_order_sync_failed";
    await finishOrderNotionSync(item.order_id, item.ops_updated_at, undefined, code).catch(() => undefined);
    return "failed";
  }
}

function customerCareProperties(item: Awaited<ReturnType<typeof claimCustomerCareNotionSync>>[number]) {
  const enquiry = item.request_payload;
  const properties: Record<string, unknown> = {
    "Care task": { title: [{ text: { content: `${item.task_type} — ${item.order_code}`.slice(0, 1900) } }] },
    Status: { select: { name: item.task_status } },
    Owner: richText(item.owner || ""),
    "Next action": richText(item.task_status === "Resolved" || item.task_status === "Dismissed" ? "Closed" : "Review customer follow-up"),
    "Next action date": { date: item.due_at ? { start: item.due_at } : null },
    Team: { select: { name: "Customer Care" } },
    "Task ID": richText(item.task_id),
    "Order ID": richText(item.order_code),
    "Request ID": richText(item.quote_request_id),
    Company: richText(enquiry.contact.company),
    Contact: richText(enquiry.contact.name),
    "Task type": { select: { name: item.task_type } },
    Channel: item.contact_channel ? { select: { name: item.contact_channel } } : { select: null },
    Draft: richText(item.draft_message || ""),
    Outcome: richText(item.outcome || ""),
  };
  if (enquiry.contact.email) properties.Email = { email: enquiry.contact.email };
  if (enquiry.contact.phone) properties.Phone = { phone_number: enquiry.contact.phone };
  return properties;
}

async function upsertCustomerCareTask(item: Awaited<ReturnType<typeof claimCustomerCareNotionSync>>[number]) {
  const dataSourceId = getCustomerCareDataSourceId();
  if (!dataSourceId) throw new Error("notion_customer_care_not_configured");
  const query = await notionRequest(`/data_sources/${dataSourceId}/query`, {
    method: "POST",
    body: JSON.stringify({ filter: { property: "Task ID", rich_text: { equals: item.task_id } }, page_size: 1 }),
  });
  const results = Array.isArray(query.results) ? query.results as Array<{ id?: unknown }> : [];
  const existingId = typeof results[0]?.id === "string" ? results[0].id : null;
  if (existingId) {
    const page = await notionRequest(`/pages/${existingId}`, { method: "PATCH", body: JSON.stringify({ properties: customerCareProperties(item) }) });
    return String(page.id || existingId);
  }
  const page = await notionRequest("/pages", {
    method: "POST",
    body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: dataSourceId }, properties: customerCareProperties(item) }),
  });
  if (typeof page.id !== "string") throw new Error("notion_invalid_page_response");
  return page.id;
}

export async function syncOneNotionCustomerCareTask(taskId?: string): Promise<"synced" | "failed" | "empty" | "not_configured"> {
  if (!isNotionCustomerCareSyncConfigured()) return "not_configured";
  let claimed: Awaited<ReturnType<typeof claimCustomerCareNotionSync>>;
  try { claimed = await claimCustomerCareNotionSync(taskId); } catch { return "failed"; }
  const item = Array.isArray(claimed) ? claimed[0] : undefined;
  if (!item) return "empty";
  try {
    const pageId = await upsertCustomerCareTask(item);
    await finishCustomerCareNotionSync(item.task_id, item.updated_at, pageId);
    return "synced";
  } catch (error) {
    const code = error instanceof Error ? error.message : "notion_customer_care_sync_failed";
    await finishCustomerCareNotionSync(item.task_id, item.updated_at, undefined, code).catch(() => undefined);
    return "failed";
  }
}

async function findExistingMarketingContent(contentId: string) {
  const dataSourceId = getMarketingContentDataSourceId();
  if (!dataSourceId) throw new Error("notion_content_not_configured");
  const query = await notionRequest(`/data_sources/${dataSourceId}/query`, {
    method: "POST", body: JSON.stringify({ filter: { property: "Content ID", rich_text: { equals: contentId } }, page_size: 1 }),
  });
  const results = Array.isArray(query.results) ? query.results as Array<{ id?: unknown }> : [];
  return typeof results[0]?.id === "string" ? results[0].id : null;
}

async function upsertMarketingContent(item: Awaited<ReturnType<typeof claimMarketingContentNotionSync>>[number]) {
  const dataSourceId = getMarketingContentDataSourceId();
  if (!dataSourceId) throw new Error("notion_content_not_configured");
  const content = item.content;
  const properties: Record<string, unknown> = {
    "Content item": { title: [{ text: { content: `${item.channel}: ${content.title}`.slice(0, 1900) } }] },
    "Content ID": richText(item.id), Status: { select: { name: item.status } },
    Channel: { select: { name: item.channel } }, Campaign: richText(item.campaign), Objective: richText(item.objective),
    Audience: richText(item.audience), Brief: richText(item.brief), "Draft copy": richText(`${content.title}\n\n${content.copy}\n\nCTA: ${content.callToAction}`),
    "Image brief": richText(item.image_brief), Keywords: richText(item.keyword_suggestions.join(", ")),
    "Fact check": richText((content.factCheckNotes ?? []).join("\n")), Asset: richText(item.image_brief),
    "Publish date": { date: item.publish_at ? { start: item.publish_at } : null },
    "Result / URL": richText(item.published_url || ""), Owner: richText(item.owner),
    "Next action": richText(item.status === "Draft" ? "Submit draft for human review" : item.status === "Review" ? "Review claims and approve or request changes" : item.status === "Approved" ? "Schedule publication manually" : item.status === "Scheduled" ? "Publish manually and record the public URL" : "Review results and decide whether to repurpose"),
    Team: { select: { name: "Marketing" } },
  };
  const existingId = item.notion_page_id || await findExistingMarketingContent(item.id);
  if (existingId) {
    const page = await notionRequest(`/pages/${existingId}`, { method: "PATCH", body: JSON.stringify({ properties }) });
    return typeof page.id === "string" ? page.id : existingId;
  }
  const page = await notionRequest("/pages", {
    method: "POST", body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: dataSourceId }, properties }),
  });
  if (typeof page.id !== "string") throw new Error("notion_content_page_id_missing");
  return page.id;
}

export async function syncOneNotionMarketingContent(contentItemId?: string): Promise<"synced" | "failed" | "empty" | "not_configured"> {
  if (!isNotionMarketingContentSyncConfigured()) return "not_configured";
  let claimed: Awaited<ReturnType<typeof claimMarketingContentNotionSync>>;
  try { claimed = await claimMarketingContentNotionSync(contentItemId); } catch { return "failed"; }
  const item = claimed[0];
  if (!item) return "empty";
  try {
    const pageId = await upsertMarketingContent(item);
    await finishMarketingContentNotionSync(item.id, item.updated_at, pageId);
    return "synced";
  } catch (error) {
    const code = error instanceof Error ? error.message : "notion_content_sync_failed";
    try { await finishMarketingContentNotionSync(item.id, item.updated_at, undefined, code); } catch { /* Retry after the database claim expires if finish cannot be written. */ }
    return "failed";
  }
}

const AGENT_LABELS: Record<string, string> = {
  prospect_crm: "Prospect / CRM", marketing_seo: "Marketing / SEO", sales: "Sales",
  supplier_whatsapp: "Supplier WhatsApp", fulfillment: "Order / Fulfilment",
  finance_analytics: "Finance / Analytics", customer_care: "Customer Care",
};
const AGENT_TEAMS: Record<string, string> = {
  prospect_crm: "Sales", marketing_seo: "Marketing", sales: "Sales", supplier_whatsapp: "Operations",
  fulfillment: "Operations", finance_analytics: "Finance", customer_care: "Customer Care",
};

async function findExistingAgentRun(runId: string) {
  const dataSourceId = getAgentFeedbackDataSourceId();
  if (!dataSourceId) throw new Error("notion_agent_feedback_not_configured");
  const query = await notionRequest(`/data_sources/${dataSourceId}/query`, {
    method: "POST", body: JSON.stringify({ filter: { property: "Run ID", rich_text: { equals: runId } }, page_size: 1 }),
  });
  const results = Array.isArray(query.results) ? query.results as Array<{ id?: unknown }> : [];
  return typeof results[0]?.id === "string" ? results[0].id : null;
}

async function upsertAgentRun(run: Awaited<ReturnType<typeof claimAgentRunNotionSync>>[number]) {
  const dataSourceId = getAgentFeedbackDataSourceId();
  if (!dataSourceId) throw new Error("notion_agent_feedback_not_configured");
  const label = AGENT_LABELS[run.agent_key] || run.agent_key;
  const nextAction = run.status === "Needs review" || run.status === "Proposed" ? "Review the agent proposal and record a decision" : "Review the stored decision and correction history";
  const properties: Record<string, unknown> = {
    "Decision / Run": { title: [{ text: { content: `${label} · ${run.trigger_name}`.slice(0, 1900) } }] },
    "Run ID": richText(run.id), Status: { select: { name: run.status } }, Agent: { select: { name: label } },
    "Input reference": richText(run.input_reference || run.content_item_id || run.quote_request_id || run.order_id || ""),
    "Proposed action": richText(JSON.stringify(run.proposed_action)),
    "Human correction": richText(run.human_correction || ""), Reason: richText(run.correction_reason || ""),
    Reviewer: richText(run.reviewer || ""), Outcome: richText(run.outcome || ""),
    Owner: richText(run.reviewer || "Unassigned"), "Next action": richText(nextAction),
    Team: { select: { name: AGENT_TEAMS[run.agent_key] || "Operations" } },
  };
  const existingId = run.notion_page_id || await findExistingAgentRun(run.id);
  if (existingId) {
    const page = await notionRequest(`/pages/${existingId}`, { method: "PATCH", body: JSON.stringify({ properties }) });
    return typeof page.id === "string" ? page.id : existingId;
  }
  const page = await notionRequest("/pages", {
    method: "POST", body: JSON.stringify({ parent: { type: "data_source_id", data_source_id: dataSourceId }, properties }),
  });
  if (typeof page.id !== "string") throw new Error("notion_agent_run_page_id_missing");
  return page.id;
}

export async function syncOneNotionAgentRun(agentRunId?: string): Promise<"synced" | "failed" | "empty" | "not_configured"> {
  if (!isNotionAgentFeedbackSyncConfigured()) return "not_configured";
  let claimed: Awaited<ReturnType<typeof claimAgentRunNotionSync>>;
  try { claimed = await claimAgentRunNotionSync(agentRunId); } catch { return "failed"; }
  const run = claimed[0];
  if (!run) return "empty";
  try {
    const pageId = await upsertAgentRun(run);
    await finishAgentRunNotionSync(run.id, run.updated_at, pageId);
    return "synced";
  } catch (error) {
    const code = error instanceof Error ? error.message : "notion_agent_run_sync_failed";
    try { await finishAgentRunNotionSync(run.id, run.updated_at, undefined, code); } catch { /* Retry after lock expiry if the finish cannot be written. */ }
    return "failed";
  }
}

export async function syncOneNotionLead(requestId?: string): Promise<"synced" | "failed" | "empty" | "not_configured"> {
  if (!isNotionLeadSyncConfigured()) return "not_configured";
  let claimed: Awaited<ReturnType<typeof claimNotionSync>>;
  try {
    claimed = await claimNotionSync(requestId);
  } catch {
    return "failed";
  }
  const item = Array.isArray(claimed) ? claimed[0] : undefined;
  if (!item) return "empty";
  try {
    const pageId = await upsertLead(item.request_id, item.request_payload, {
      status: item.request_status, owner: item.owner, nextAction: item.next_action, nextActionAt: item.next_action_at,
    });
    await finishNotionSync(item.outbox_id, item.crm_updated_at, pageId);
    return "synced";
  } catch (error) {
    const code = error instanceof Error ? error.message : "notion_sync_failed";
    await finishNotionSync(item.outbox_id, item.crm_updated_at, undefined, code).catch(() => undefined);
    return "failed";
  }
}

export async function syncOneNotionSupplierCheck(checkId?: string): Promise<"synced" | "failed" | "empty" | "not_configured"> {
  if (!isNotionSupplierCheckSyncConfigured()) return "not_configured";
  let claimed: Awaited<ReturnType<typeof claimSupplierCheckNotionSync>>;
  try {
    claimed = await claimSupplierCheckNotionSync(checkId);
  } catch {
    return "failed";
  }
  const check = Array.isArray(claimed) ? claimed[0] : undefined;
  if (!check) return "empty";
  try {
    const pageId = await upsertSupplierCheck(check);
    await finishSupplierCheckNotionSync(check.id, pageId);
    return "synced";
  } catch (error) {
    const code = error instanceof Error ? error.message : "notion_supplier_sync_failed";
    await finishSupplierCheckNotionSync(check.id, undefined, code).catch(() => undefined);
    return "failed";
  }
}
