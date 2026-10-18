export type BoardDefinition = {
  key: string;
  name: string;
  titleProperty: string;
  statuses: string[];
  properties: Record<string, unknown>;
  views: {
    kanban: { type: "board"; groupBy: "Status" };
    roleViews: Array<{ name: string; type: "board"; groupBy: "Status"; filter?: Record<string, unknown> }>;
  };
};

const richText = { rich_text: {} };
const select = (options: string[]) => ({ select: { options: options.map((name) => ({ name })) } });
const field = (property: string, kind: "select" | "rich_text" | "date" | "checkbox", condition: Record<string, unknown>) => ({ property, [kind]: condition });
const allOf = (...filters: Record<string, unknown>[]) => ({ and: filters });
const team = (name: string) => field("Team", "select", { equals: name });
const status = (name: string) => field("Status", "select", { equals: name });
const ownerEmpty = field("Owner", "rich_text", { is_empty: true });
const noOwner = (teamName: string) => allOf(team(teamName), ownerEmpty);
const dateSet = field("Next action date", "date", { is_not_empty: true });
const namedView = (name: string, filter: Record<string, unknown>) => ({ name, type: "board" as const, groupBy: "Status" as const, filter });
const statusBoard = (
  key: string,
  name: string,
  titleProperty: string,
  statuses: string[],
  properties: Record<string, unknown> = {},
): BoardDefinition => ({
  key,
  name,
  titleProperty,
  statuses,
  properties: {
    [titleProperty]: { title: {} },
    Status: select(statuses),
    Owner: richText,
    "Next action": richText,
    "Next action date": { date: {} },
    Team: select(["Sales", "Marketing", "Operations", "Finance", "Customer Care"]),
    ...properties,
  },
  views: { kanban: { type: "board", groupBy: "Status" }, roleViews: [] },
});

export const MONCRAFT_BOARDS: BoardDefinition[] = [
  statusBoard("leads", "Leads & Outreach", "Lead", ["New", "Qualified", "Draft ready", "Contacted", "Replied", "Discovery", "Quote request", "Won", "Lost"], {
    "Request ID": richText, Company: richText, Contact: richText, Email: { email: {} }, Phone: { phone_number: {} }, Source: select(["Website", "LinkedIn", "Google", "Referral", "Event", "Other"]), "Contact preference": select(["Email", "Phone", "WhatsApp", "Not specified"]), "WhatsApp opt-in": { checkbox: {} }, "Email marketing opt-in": { checkbox: {} }, "First touch source": richText, "Last touch source": richText, "Campaign source": richText, "Campaign medium": richText, Campaign: richText, "Campaign term": richText, "Campaign content": richText, "Landing page": richText, "Referrer domain": richText, Occasion: richText, "Recipient count": richText, "Budget per recipient": richText, Branding: richText, "Delivery date": { date: {} }, "Delivery location": richText, Products: richText, Notes: richText,
  }),
  statusBoard("suppliers", "Supplier Directory", "Supplier", ["Needs mapping", "Mapped", "Active", "Paused", "Do not contact"], {
    "Supplier Code": richText, Category: richText, Products: richText, Contact: richText, Phone: { phone_number: {} }, Email: { email: {} }, "WhatsApp opt-in": { checkbox: {} }, "Response notes": richText,
  }),
  statusBoard("supplier_checks", "Supplier Checks", "Availability check", ["Needs mapping", "Draft", "Ready for review", "Sending", "Sent", "Replied", "Clarification needed", "Expired", "Closed"], {
    "Supplier Check ID": richText, Supplier: richText, Category: richText, "Request ID": richText, Products: richText, Quantity: { number: {} }, Availability: select(["Unknown", "Available", "Partial", "Unavailable"]), Price: { number: {} }, MOQ: { number: {} }, "Lead time": richText, Reply: richText,
  }),
  statusBoard("quotes_orders", "Quotes & Orders", "Quote / Order", ["Request received", "Supplier checks", "Quote draft", "Draft", "Changes requested", "Approval", "Approval requested", "Approved", "Sent", "Accepted", "Declined", "Superseded", "Won", "Lost", "Procurement", "Customization", "Quality check", "Dispatch", "Delivered / Closed", "On hold", "Cancelled"], {
    "Request ID": richText, "Quote ID": richText, "Order ID": richText, "Quote version": richText, "Quote total INR": { number: { format: "number" } }, "Quote valid until": { date: {} }, "Quote terms": richText, "Approved by": richText, "Sent reference": richText, "Buyer decision reference": richText, Company: richText, Contact: richText, Email: { email: {} }, "Delivery date": { date: {} }, "Promised delivery date": { date: {} }, "Delivery location": richText, Products: richText, Notes: richText, "Customer approval": select(["Not sent", "Pending", "Approved", "Declined"]), "Approval reference": richText, "Customer PO": richText,
  }),
  statusBoard("content", "Content Calendar", "Content item", ["Idea", "Draft", "Review", "Approved", "Scheduled", "Published", "Repurpose"], {
    "Content ID": richText, Channel: select(["LinkedIn", "Instagram", "YouTube", "Google Business", "Website", "Email"]), Campaign: richText,
    Objective: richText, Audience: richText, Brief: richText, "Draft copy": richText, "Image brief": richText,
    Keywords: richText, "Fact check": richText, Asset: richText, "Publish date": { date: {} }, "Result / URL": richText,
  }),
  statusBoard("agent_feedback", "Agent Feedback & Decisions", "Decision / Run", ["Proposed", "Needs review", "Approved", "Rejected", "Completed", "Failed"], {
    "Run ID": richText, Agent: select(["Prospect / CRM", "Marketing / SEO", "Sales", "Supplier WhatsApp", "Order / Fulfilment", "Finance / Analytics", "Customer Care"]), "Input reference": richText, "Proposed action": richText, "Human correction": richText, Reason: richText, Reviewer: richText, Outcome: richText,
  }),
  statusBoard("customer_care", "Customer Care", "Care task", ["Open", "Draft ready", "Needs review", "Waiting on customer", "Escalated", "Resolved", "Dismissed"], {
    "Task ID": richText, "Order ID": richText, "Request ID": richText, Company: richText, Contact: richText,
    "Task type": select(["Delivery check-in", "Issue follow-up", "Feedback request"]), Channel: select(["Email", "Phone", "WhatsApp"]),
    Draft: richText, Outcome: richText, Email: { email: {} }, Phone: { phone_number: {} },
  }),
];

MONCRAFT_BOARDS.find((board) => board.key === "suppliers")!.views.roleViews.push(
  namedView("Operations — Needs product mapping", status("Needs mapping")),
  namedView("Operations — Mapped suppliers", status("Mapped")),
  namedView("Operations — WhatsApp opt-in recorded", field("WhatsApp opt-in", "checkbox", { equals: true })),
  namedView("Operations — Paused suppliers", status("Paused")),
);
MONCRAFT_BOARDS.find((board) => board.key === "leads")!.views.roleViews.push(
  namedView("Sales — Open", allOf(team("Sales"), field("Status", "select", { does_not_equal: "Won" }), field("Status", "select", { does_not_equal: "Lost" }))),
  namedView("Sales — Unassigned", noOwner("Sales")),
  namedView("Sales — Follow-up scheduled", allOf(team("Sales"), dateSet)),
  namedView("Sales — New enquiries", allOf(team("Sales"), status("New"))),
  namedView("Marketing — Attributed leads", allOf(team("Marketing"), field("Campaign", "rich_text", { is_not_empty: true }))),
);
MONCRAFT_BOARDS.find((board) => board.key === "supplier_checks")!.views.roleViews.push(
  namedView("Operations Queue", team("Operations")),
  namedView("Operations — Needs mapping", status("Needs mapping")),
  namedView("Operations — Ready to review", allOf(team("Operations"), status("Ready for review"))),
  namedView("Operations — Awaiting supplier", allOf(team("Operations"), status("Sent"))),
  namedView("Operations — Replies to verify", allOf(team("Operations"), status("Replied"))),
  namedView("Operations — Clarifications", allOf(team("Operations"), status("Clarification needed"))),
);
MONCRAFT_BOARDS.find((board) => board.key === "quotes_orders")!.views.roleViews.push(
  namedView("Operations Queue", team("Operations")),
  namedView("Sales — Quote drafts", allOf(team("Sales"), status("Draft"))),
  namedView("Sales — Approval queue", allOf(team("Sales"), status("Approval requested"))),
  namedView("Sales — Awaiting buyer", allOf(team("Sales"), status("Sent"))),
  namedView("Sales — Accepted, order not created", allOf(team("Sales"), status("Accepted"), field("Order ID", "rich_text", { is_empty: true }))),
  namedView("Operations — Active orders", allOf(team("Operations"), field("Order ID", "rich_text", { is_not_empty: true }), field("Status", "select", { does_not_equal: "Delivered / Closed" }), field("Status", "select", { does_not_equal: "Cancelled" }))),
);
MONCRAFT_BOARDS.find((board) => board.key === "content")!.views.roleViews.push(
  namedView("Marketing Queue", team("Marketing")),
  namedView("Marketing — Ideas", allOf(team("Marketing"), status("Idea"))),
  namedView("Marketing — Drafts", allOf(team("Marketing"), status("Draft"))),
  namedView("Marketing — Review queue", allOf(team("Marketing"), status("Review"))),
  namedView("Marketing — Approved to schedule", allOf(team("Marketing"), status("Approved"))),
  namedView("Marketing — Scheduled", allOf(team("Marketing"), status("Scheduled"))),
  namedView("Marketing — Published", allOf(team("Marketing"), status("Published"))),
  ...["LinkedIn", "Instagram", "YouTube", "Google Business", "Website", "Email"].map((channel) => namedView(`Marketing — ${channel}`, allOf(team("Marketing"), field("Channel", "select", { equals: channel })))),
);
MONCRAFT_BOARDS.find((board) => board.key === "agent_feedback")!.views.roleViews.push(
  namedView("Agents — Human review", status("Needs review")),
  ...["Sales", "Marketing / SEO", "Prospect / CRM", "Supplier WhatsApp", "Order / Fulfilment", "Finance / Analytics", "Customer Care"].map((agent) => namedView(`Agents — ${agent}`, field("Agent", "select", { equals: agent }))),
  namedView("Agents — Failed runs", status("Failed")),
);
MONCRAFT_BOARDS.find((board) => board.key === "customer_care")!.views.roleViews.push(
  namedView("Escalations", status("Escalated")),
  namedView("Care — Open tasks", allOf(field("Status", "select", { does_not_equal: "Resolved" }), field("Status", "select", { does_not_equal: "Dismissed" }))),
  namedView("Care — Escalations", status("Escalated")),
  namedView("Care — Delivery check-ins", field("Task type", "select", { equals: "Delivery check-in" })),
  namedView("Care — Issues", field("Task type", "select", { equals: "Issue follow-up" })),
  namedView("Care — Feedback requests", field("Task type", "select", { equals: "Feedback request" })),
);

export const AGENT_ROLES = [
  { key: "prospect_crm", name: "Prospect / CRM", responsibilities: ["Research permitted company sources", "Qualify prospects", "Draft outreach", "Create follow-up tasks"], prohibitedActions: ["linkedin_automated_engagement", "send_unapproved_outreach"], approvalGates: ["Approve outbound message before first send", "Human review for contact data and qualification"] },
  { key: "marketing_seo", name: "Marketing / SEO", responsibilities: ["Seasonal content plan", "Keyword research", "Draft channel content and image briefs", "Report qualified enquiry outcomes"], prohibitedActions: ["publish_without_approval", "promise_search_rankings"], approvalGates: ["Human approval before publication", "Claims and product facts verified"] },
  { key: "sales", name: "Sales", responsibilities: ["Check brief completeness", "Summarize opportunity", "Suggest catalogue items", "Prepare quote draft"], prohibitedActions: ["send_quote_without_approval", "confirm_live_stock"], approvalGates: ["Human approves quote, price, discount and delivery promise"] },
  { key: "supplier_whatsapp", name: "Supplier WhatsApp", responsibilities: ["Group mapped SKU lines by supplier", "Ask opted-in suppliers for availability, price, MOQ and lead time", "Route replies and exceptions"], prohibitedActions: ["contact_without_opt_in", "claim_stock_reserved", "purchase_without_approval"], approvalGates: ["Supplier and product mapping required", "Official WhatsApp templates and opt-in required", "Ambiguous replies go to operations"] },
  { key: "fulfillment", name: "Order / Fulfilment", responsibilities: ["Track procurement, customization, QC, dispatch and delivery", "Flag late or missing stages"], prohibitedActions: ["mark_stage_complete_without_evidence", "promise_delivery_without_confirmation"], approvalGates: ["Human confirms exceptions and quality release"] },
  { key: "finance_analytics", name: "Finance / Analytics", responsibilities: ["Prepare Vyapar entry packs", "Flag reconciliation mismatches", "Report funnel, margin, supplier and delivery metrics"], prohibitedActions: ["post_unapproved_accounting_entries", "decide_tax_treatment", "issue_refunds"], approvalGates: ["Staff enters approved estimates/invoices in Vyapar", "Human approves payment, tax and reconciliation decisions"] },
  { key: "customer_care", name: "Customer Care", responsibilities: ["Queue post-delivery check-ins", "Draft service and feedback follow-ups", "Track unresolved customer issues and outcomes"], prohibitedActions: ["send_without_human_approval", "infer_marketing_consent", "promise_compensation"], approvalGates: ["Human verifies contact permission and approves every customer message", "Complaint remedies and compensation require a person"] },
] as const;

export type SupplierMapping = { productId: string; supplierId: string; category?: string };
export type QuoteLine = { id?: string; name: string; quantity?: number | string };
export function groupQuoteItemsBySupplier(lines: QuoteLine[], mappings: SupplierMapping[]) {
  const mappingByProductId = new Map(mappings.map((mapping) => [mapping.productId, mapping]));
  const groups = new Map<string, { supplierId: string; category?: string; items: QuoteLine[] }>();
  const unmapped: QuoteLine[] = [];
  for (const line of lines) {
    const mapping = line.id ? mappingByProductId.get(line.id) : undefined;
    if (!mapping) { unmapped.push(line); continue; }
    const group = groups.get(mapping.supplierId) ?? { supplierId: mapping.supplierId, category: mapping.category, items: [] };
    group.items.push(line);
    groups.set(mapping.supplierId, group);
  }
  return { mapped: [...groups.values()], unmapped };
}
