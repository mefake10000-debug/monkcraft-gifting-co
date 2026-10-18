export type OperationsException = {
  id: string;
  code: string;
  severity: "critical" | "high" | "medium";
  category: string;
  title: string;
  summary: string;
  owner: string;
  nextAction: string;
  dueAt: string | null;
  updatedAt: string | null;
  href: string;
};

type OperationsExceptionInputs = {
  leads: Array<{ id: string; status: string; owner: string | null; next_action: string | null; next_action_at: string | null; created_at: string }>;
  orders: Array<{ id: string; order_code: string; status: string; promised_delivery_date: string | null }>;
  syncRecords: Array<{ kind: string; id: string; label: string; status: string; error: string | null; updated_at: string; href: string }>;
  supplierChecks: Array<{ id: string; request_id: string; supplier_name: string | null; status: string; availability: string; whatsapp_send_error?: string | null; created_at: string }>;
  milestones: Array<{ id: string; order_id: string; order_code: string; stage: string; status: string; owner: string | null; due_at: string | null }>;
  shipments: Array<{ id: string; order_id: string; order_code: string; shipment_code: string; status: string; exception_notes: string | null; updated_at: string }>;
  finance: Array<{ id: string; order_code: string | null; document_type: string; status: string; notes: string | null; updated_at: string }>;
  customerCare: Array<{ id: string; title: string; status: string; owner: string | null; due_at: string | null; updated_at: string }>;
  outbox: Array<{ id: string; event_type: string; status: string; attempts: number; last_error: string | null; created_at: string }>;
};

const OPEN_LEAD_STATES = new Set(["New", "Qualified", "Draft ready", "Contacted", "Replied", "Discovery", "Quote request"]);
const HOURS = 60 * 60 * 1000;

function isBefore(value: string | null | undefined, cutoff: number) {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && time < cutoff;
}

export function buildOperationsExceptions(input: OperationsExceptionInputs, now = new Date()): OperationsException[] {
  const exceptions: Array<OperationsException & { rank: number }> = [];
  const add = (rank: number, item: OperationsException) => exceptions.push({ ...item, rank });

  for (const lead of input.leads) {
    if (!OPEN_LEAD_STATES.has(lead.status)) continue;
    if (!lead.owner?.trim() || !lead.next_action?.trim()) {
      add(10, {
        id: `lead:${lead.id}`, code: "lead_ownership", severity: "high", category: "Sales",
        title: `Lead ${lead.id.slice(0, 8)} needs an owner or next action`,
        summary: `Current stage: ${lead.status}. Assign a staff owner and record the next action before this lead leaves the queue.`,
        owner: lead.owner?.trim() || "Unassigned", nextAction: "Assign an owner and set a next action/date.",
        dueAt: lead.next_action_at, updatedAt: lead.created_at, href: "/ops/leads",
      });
    } else if (isBefore(lead.next_action_at, now.getTime())) {
      add(11, {
        id: `lead:${lead.id}`, code: "lead_followup_overdue", severity: "high", category: "Sales",
        title: `Lead ${lead.id.slice(0, 8)} follow-up is overdue`, summary: `Next action: ${lead.next_action}.`,
        owner: lead.owner, nextAction: "Complete the follow-up or move its due date with a note.",
        dueAt: lead.next_action_at, updatedAt: lead.created_at, href: "/ops/leads",
      });
    }
  }

  for (const row of input.syncRecords) {
    const stalePending = row.status === "pending" && isBefore(row.updated_at, now.getTime() - 48 * HOURS);
    if (row.status !== "failed" && !stalePending) continue;
    add(20, {
      id: `sync:${row.kind}:${row.id}`, code: "notion_sync_failed", severity: "high", category: "Integration",
      title: `${row.kind} Notion sync ${row.status === "failed" ? "failed" : "stalled"}: ${row.label}`,
      summary: row.error?.trim() || (stalePending ? "Sync has remained pending for more than 48 hours." : "Notion sync failed; retry is queued."),
      owner: "Operations", nextAction: "Check Notion permissions, board properties, and retry status.",
      dueAt: null, updatedAt: row.updated_at, href: row.href,
    });
  }

  for (const check of input.supplierChecks) {
    if (check.status === "Needs mapping") add(30, {
      id: `supplier:${check.id}`, code: "supplier_mapping", severity: "critical", category: "Sourcing",
      title: `Supplier mapping required for request ${check.request_id.slice(0, 8)}`,
      summary: `${check.supplier_name || "One or more requested products"} has no verified active supplier mapping.`,
      owner: "Unassigned", nextAction: "Map each requested catalogue SKU to an active supplier.", dueAt: null,
      updatedAt: check.created_at, href: "/ops/suppliers",
    });
    else if (check.status === "Clarification needed") {
      const sendFailure = check.whatsapp_send_error?.trim();
      add(40, {
        id: `supplier:${check.id}`, code: sendFailure ? "supplier_send_reconcile" : "supplier_reply_ambiguous",
        severity: sendFailure ? "critical" : "high", category: "Sourcing",
        title: sendFailure ? `Supplier message outcome needs reconciliation: ${check.supplier_name || "Supplier"}` : `Supplier reply needs clarification: ${check.supplier_name || "Supplier"}`,
        summary: sendFailure || `Availability is ${check.availability.toLowerCase()}; an operations reviewer must resolve the reply.`,
        owner: "Operations", nextAction: sendFailure ? "Manually reconcile the provider status with Meta before deciding whether to send again." : "Contact the supplier and record a reviewed availability, price, MOQ, and lead time.",
        dueAt: null, updatedAt: check.created_at, href: "/ops",
      });
    }
    else if (check.status === "Sent" && check.availability === "Unknown" && isBefore(check.created_at, now.getTime() - 48 * HOURS)) add(40, {
      id: `supplier:${check.id}`, code: "supplier_reply_late", severity: "high", category: "Sourcing",
      title: `Supplier reply is late: ${check.supplier_name || "Supplier"}`,
      summary: `Availability check has been waiting for more than 48 hours.`, owner: "Operations",
      nextAction: "Follow up with the supplier or record a no-response exception.", dueAt: null,
      updatedAt: check.created_at, href: "/ops",
    });
  }

  for (const order of input.orders) {
    if (order.status === "On hold") add(40, {
      id: `order:${order.id}`, code: "order_on_hold", severity: "critical", category: "Fulfilment",
      title: `${order.order_code} is on hold`, summary: "The order needs an operations decision before fulfilment can continue.",
      owner: "Operations", nextAction: "Review the hold reason and record an unblock plan or customer update.",
      dueAt: order.promised_delivery_date, updatedAt: null, href: "/ops/orders",
    });
    if (!["Delivered", "Closed", "Cancelled", "On hold"].includes(order.status) && order.promised_delivery_date
      && isBefore(`${order.promised_delivery_date}T23:59:59Z`, now.getTime())) add(40, {
      id: `order:${order.id}`, code: "order_delivery_overdue", severity: "critical", category: "Fulfilment",
      title: `${order.order_code} is past its promised delivery date`, summary: `Order remains in ${order.status.toLowerCase()}.`,
      owner: "Operations", nextAction: "Confirm the current delivery status, contact the customer if needed, and record a revised commitment only after verification.",
      dueAt: order.promised_delivery_date, updatedAt: null, href: "/ops/orders",
    });
  }

  for (const milestone of input.milestones) {
    if (milestone.status === "Complete") continue;
    if (milestone.status === "Blocked") add(40, {
      id: `milestone:${milestone.id}`, code: "milestone_blocked", severity: "critical", category: "Fulfilment",
      title: `${milestone.order_code} ${milestone.stage} is blocked`, summary: "A person must resolve the blocker before the order can advance.",
      owner: milestone.owner?.trim() || "Unassigned", nextAction: "Review the order stage and record the unblock plan.", dueAt: milestone.due_at,
      updatedAt: null, href: "/ops/orders",
    });
    else if (isBefore(milestone.due_at, now.getTime())) add(40, {
      id: `milestone:${milestone.id}`, code: "milestone_overdue", severity: "high", category: "Fulfilment",
      title: `${milestone.order_code} ${milestone.stage} is overdue`, summary: `Stage remains ${milestone.status.toLowerCase()}.`,
      owner: milestone.owner?.trim() || "Unassigned", nextAction: "Update the milestone or record a blocker and revised date.",
      dueAt: milestone.due_at, updatedAt: null, href: "/ops/orders",
    });
  }

  for (const shipment of input.shipments) if (["Exception", "Returned"].includes(shipment.status)) add(50, {
    id: `shipment:${shipment.id}`, code: "shipment_exception", severity: "critical", category: "Fulfilment",
    title: `${shipment.order_code} shipment ${shipment.shipment_code} is ${shipment.status.toLowerCase()}`,
    summary: shipment.exception_notes?.trim() || "Shipment needs an operations update.", owner: "Operations",
    nextAction: "Contact the carrier or customer, resolve the delivery issue, and record the outcome.",
    dueAt: null, updatedAt: shipment.updated_at, href: "/ops/orders",
  });

  for (const record of input.finance) if (["Mismatch", "Needs review", "Needs entry"].includes(record.status)) add(60, {
    id: `finance:${record.id}`, code: record.status === "Mismatch" ? "finance_mismatch" : "finance_review",
    severity: record.status === "Mismatch" ? "critical" : "high", category: "Finance",
    title: `${record.order_code || "Order record"} ${record.document_type}: ${record.status}`,
    summary: record.notes?.trim() || (record.status === "Needs entry" ? "Approved document still needs a Vyapar reference." : "Finance review is required."),
    owner: "Finance", nextAction: record.status === "Needs entry" ? "Enter the approved document in Vyapar and record its reference." : "Review the source document and reconcile the discrepancy.",
    dueAt: null, updatedAt: record.updated_at, href: "/ops/finance",
  });

  for (const task of input.customerCare) if (task.status === "Escalated" || (task.status !== "Resolved" && task.status !== "Dismissed" && isBefore(task.due_at, now.getTime()))) add(70, {
    id: `care:${task.id}`, code: task.status === "Escalated" ? "customer_care_escalated" : "customer_care_overdue",
    severity: "high", category: "Customer Care", title: task.title,
    summary: task.status === "Escalated" ? "Customer-care task is escalated." : `Task is overdue and remains ${task.status.toLowerCase()}.`,
    owner: task.owner?.trim() || "Unassigned", nextAction: "Review the customer context and record an owner and resolution plan.",
    dueAt: task.due_at, updatedAt: task.updated_at, href: "/ops/customer-care",
  });

  for (const item of input.outbox) if (item.status === "failed" || (item.status === "pending" && item.attempts >= 3)) add(80, {
    id: `outbox:${item.id}`, code: "outbox_retry_exhausted", severity: "high", category: "Integration",
    title: `Automation job needs attention: ${item.event_type}`,
    summary: item.last_error?.trim() || `${item.attempts} attempts recorded; inspect and retry safely.`, owner: "Operations",
    nextAction: "Inspect the job and source record before any manual retry.", dueAt: null, updatedAt: item.created_at,
    href: "/ops",
  });

  return exceptions.sort((a, b) => a.rank - b.rank || (Date.parse(a.updatedAt || "") || 0) - (Date.parse(b.updatedAt || "") || 0))
    .map((item) => ({
      id: item.id, code: item.code, severity: item.severity, category: item.category,
      title: item.title, summary: item.summary, owner: item.owner, nextAction: item.nextAction,
      dueAt: item.dueAt, updatedAt: item.updatedAt, href: item.href,
    }));
}
