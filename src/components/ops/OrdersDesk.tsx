"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ORDER_MILESTONE_STAGES, type OrderMilestoneStatus } from "@/lib/automation/orderWorkflow";
import type { OperationsOrderRecord, OrderEligibleLead } from "@/lib/automation/store";

type DeskData = { orders: OperationsOrderRecord[]; eligibleLeads: OrderEligibleLead[] };
const milestoneStatuses: OrderMilestoneStatus[] = ["Pending", "In progress", "Blocked", "Complete"];
const shipmentStatuses = ["Preparing", "Dispatched", "In transit", "Delivered", "Exception", "Returned"];

function dateTimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function OrdersDesk() {
  const router = useRouter();
  const [data, setData] = useState<DeskData>({ orders: [], eligibleLeads: [] });
  const [actor, setActor] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/ops/orders", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) { setState("unauthorized"); return; }
      const body = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(body?.orders) || !Array.isArray(body?.eligibleLeads)) throw new Error(body?.error || "Order data is unavailable.");
      setData({ orders: body.orders, eligibleLeads: body.eligibleLeads });
      setState("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Order data is unavailable.");
      setState("error");
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/ops/orders", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return { unauthorized: true as const };
        const body = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(body?.orders) || !Array.isArray(body?.eligibleLeads)) throw new Error(body?.error || "Order data is unavailable.");
        return { data: { orders: body.orders as OperationsOrderRecord[], eligibleLeads: body.eligibleLeads as OrderEligibleLead[] } };
      })
      .then((result) => {
        if (!active) return;
        if ("unauthorized" in result) setState("unauthorized");
        else { setData(result.data); setState("ready"); }
      })
      .catch((caught: unknown) => { if (active) { setError(caught instanceof Error ? caught.message : "Order data is unavailable."); setState("error"); } });
    return () => { active = false; };
  }, []);

  async function post(path: string, payload: Record<string, unknown>, key: string) {
    if (!actor.trim()) { setError("Enter your name for the operations audit log first."); return false; }
    setBusy(key); setError("");
    try {
      const response = await fetch(path, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ ...payload, actor: actor.trim() }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Could not save this operations update.");
      await load();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save this operations update.");
      return false;
    } finally { setBusy(""); }
  }

  const incomplete = data.orders.filter((order) => !["Delivered", "Closed", "Cancelled"].includes(order.status)).length;

  return (
    <main className="ops-shell">
      <header className="ops-header">
        <div><p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p><h1>Orders & fulfilment</h1><p className="ops-muted">Create orders only after customer approval is recorded. Track each handoff and capture evidence for critical stages.</p></div>
        <nav className="ops-nav"><Link href="/ops/exceptions">Exceptions</Link><Link href="/ops/suppliers">Supplier directory</Link><Link href="/ops/leads">Sales pipeline</Link><Link href="/ops/quotes">Quote desk</Link><Link href="/ops">Supplier checks</Link><Link href="/ops/finance">Finance</Link><Link href="/ops/analytics">Analytics</Link><Link href="/ops/marketing">Marketing consent</Link><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav>
      </header>

      {state === "loading" && <div className="ops-empty"><p>Loading orders…</p></div>}
      {state === "unauthorized" && <div className="ops-empty"><h3>Sign in to the operations desk</h3><p>Your session has expired or you have not signed in.</p><Link href="/ops">Go to sign in</Link></div>}
      {state === "error" && <div className="ops-warning" role="alert">{error}</div>}

      {state === "ready" && <>
        <section className="ops-metrics" aria-label="Order totals">
          <article><span>Active orders</span><strong>{incomplete}</strong></article>
          <article><span>Awaiting order creation</span><strong>{data.eligibleLeads.length}</strong></article>
          <article><span>Delivered</span><strong>{data.orders.filter((order) => ["Delivered", "Closed"].includes(order.status)).length}</strong></article>
        </section>

        <section className="ops-toolbar">
          <div><h2>Customer accepted a quote</h2><p className="ops-muted">Only Won leads appear here. Record the quote version and an approval reference before creating the fulfilment record.</p></div>
          <label className="ops-reviewer">Your name for this review<input value={actor} onChange={(event) => setActor(event.target.value)} maxLength={120} placeholder="Name" /></label>
        </section>
        {error && <div className="ops-error ops-message" role="alert">{error}</div>}

        {data.eligibleLeads.length === 0 ? <div className="ops-empty"><h3>No accepted quotes awaiting order creation</h3><p>Move an accepted customer quote to Won in the sales pipeline first.</p></div> : (
          <section className="ops-check-list" aria-label="Accepted customer quotes">
            {data.eligibleLeads.map((lead) => <AcceptedQuoteForm key={lead.id} lead={lead} busy={busy === lead.id} disabled={!actor.trim()} onCreate={(payload) => post("/api/ops/orders", payload, lead.id)} />)}
          </section>
        )}

        <section className="ops-toolbar ops-orders-heading"><div><h2>Active fulfilment</h2><p className="ops-muted">Evidence and stage ordering are enforced by the database.</p></div></section>
        {data.orders.length === 0 ? <div className="ops-empty"><p>No orders have been created.</p></div> : (
          <section className="ops-check-list" aria-label="Orders in fulfilment">
            {data.orders.map((order) => <OrderCard key={order.id} order={order} actor={actor} busy={busy} onPost={post} />)}
          </section>
        )}
      </>}
    </main>
  );
}

function AcceptedQuoteForm({ lead, busy, disabled, onCreate }: {
  lead: OrderEligibleLead; busy: boolean; disabled: boolean;
  onCreate: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [orderCode, setOrderCode] = useState("");
  const [quoteVersion, setQuoteVersion] = useState("");
  const [customerApprovedAt, setCustomerApprovedAt] = useState("");
  const [approvalReference, setApprovalReference] = useState("");
  const [customerPoReference, setCustomerPoReference] = useState("");
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState("");
  return <article className="ops-order-card">
    <p className="ops-eyebrow">WON · REQUEST {lead.id.slice(0, 8).toUpperCase()}</p>
    <h3>{lead.company} <span>· {lead.contact}</span></h3>
    <form className="ops-order-create-form" onSubmit={async (event) => {
      event.preventDefault();
      const created = await onCreate({ requestId: lead.id, orderCode, quoteVersion, customerApprovedAt: new Date(customerApprovedAt).toISOString(), approvalReference, customerPoReference, promisedDeliveryDate });
      if (created) { setOrderCode(""); setQuoteVersion(""); setCustomerApprovedAt(""); setApprovalReference(""); setCustomerPoReference(""); setPromisedDeliveryDate(""); }
    }}>
      <label>Order code<input value={orderCode} onChange={(event) => setOrderCode(event.target.value)} maxLength={60} required placeholder="MC-2026-001" /></label>
      <label>Accepted quote version<input value={quoteVersion} onChange={(event) => setQuoteVersion(event.target.value)} maxLength={80} required placeholder="For example, v1" /></label>
      <label>Customer approval date and time<input type="datetime-local" value={customerApprovedAt} onChange={(event) => setCustomerApprovedAt(event.target.value)} required /></label>
      <label>Promised delivery date<input type="date" value={promisedDeliveryDate} onChange={(event) => setPromisedDeliveryDate(event.target.value)} /></label>
      <label className="ops-notes-field">Approval evidence reference<input value={approvalReference} onChange={(event) => setApprovalReference(event.target.value)} maxLength={500} required placeholder="Email subject, signed PO reference, or CRM record ID" /></label>
      <label>Customer PO reference<input value={customerPoReference} onChange={(event) => setCustomerPoReference(event.target.value)} maxLength={120} placeholder="Optional" /></label>
      <div className="ops-lead-save-row"><button type="submit" disabled={busy || disabled}>{busy ? "Creating…" : "Create fulfilment order"}</button></div>
    </form>
  </article>;
}

function OrderCard({ order, actor, busy, onPost }: {
  order: OperationsOrderRecord; actor: string; busy: string; onPost: (path: string, payload: Record<string, unknown>, key: string) => Promise<boolean>;
}) {
  return <article className="ops-order-card">
    <div className="ops-check-heading"><div><p className="ops-eyebrow">ORDER {order.order_code} · REQUEST {order.quote_request_id.slice(0, 8).toUpperCase()}</p><h3>{order.company} <span>· {order.contact}</span></h3><p className="ops-muted">Quote {order.accepted_quote_version} · Approved {new Date(order.customer_approved_at).toLocaleString()} · {order.customer_approval_reference}</p>{order.customer_po_reference && <p className="ops-muted">PO {order.customer_po_reference}</p>}</div><span className="ops-status">{order.status}</span></div>
    <div className="ops-stage-list">{ORDER_MILESTONE_STAGES.map((stage) => {
      const milestone = order.milestones.find((item) => item.stage === stage);
      if (!milestone) return null;
      const predecessorStages = ORDER_MILESTONE_STAGES.slice(0, ORDER_MILESTONE_STAGES.indexOf(stage));
      const predecessorsComplete = predecessorStages.every((previous) => order.milestones.find((item) => item.stage === previous)?.status === "Complete");
      const shipmentsDelivered = order.shipments.length > 0 && order.shipments.every((shipment) => shipment.status === "Delivered");
      const blockedByOrder = !predecessorsComplete || (stage === "Delivered" && !shipmentsDelivered);
      return <MilestoneForm key={milestone.id} milestone={milestone} actor={actor} disabled={blockedByOrder} busy={busy === milestone.id} onSave={(payload) => onPost("/api/ops/orders/milestone", payload, milestone.id)} orderId={order.id} />;
    })}</div>
    <ShipmentPanel order={order} actor={actor} busy={busy} onPost={onPost} />
    {order.activity.length > 0 && <details className="ops-activity"><summary>Order activity ({order.activity.length})</summary><ol>{order.activity.map((event) => <li key={event.id}><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString()}</time> · {event.actor} · {event.event_type}{event.new_status ? ` · ${event.new_status}` : ""}</li>)}</ol></details>}
  </article>;
}

function MilestoneForm({ milestone, actor, disabled, busy, orderId, onSave }: {
  milestone: OperationsOrderRecord["milestones"][number]; actor: string; disabled: boolean; busy: boolean; orderId: string;
  onSave: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [status, setStatus] = useState(milestone.status);
  const [owner, setOwner] = useState(milestone.owner || "");
  const [dueAt, setDueAt] = useState(dateTimeInput(milestone.due_at));
  const [evidenceUrl, setEvidenceUrl] = useState(milestone.evidence_url || "");
  const [notes, setNotes] = useState(milestone.notes || "");
  return <form className={`ops-milestone-form ${milestone.status === "Complete" ? "is-complete" : ""}`} onSubmit={async (event) => {
    event.preventDefault();
    const saved = await onSave({ orderId, stage: milestone.stage, status, owner, dueAt: dueAt ? new Date(dueAt).toISOString() : "", evidenceUrl, notes });
    if (saved) window.location.reload();
  }}>
    <div className="ops-milestone-title"><strong>{milestone.stage}</strong><span className={`ops-status ops-status-${milestone.status.toLowerCase().replaceAll(" ", "-")}`}>{milestone.status}</span></div>
    <div className="ops-milestone-fields">
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as OrderMilestoneStatus)}>{milestoneStatuses.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Owner<input value={owner} onChange={(event) => setOwner(event.target.value)} maxLength={120} /></label>
      <label>Due date<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
      <label>Evidence URL<input type="url" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} maxLength={1000} placeholder="Required for QC and dispatch" /></label>
      <label className="ops-notes-field">Notes<input value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} placeholder={status === "Blocked" ? "Required: explain the blocker" : "Optional"} /></label>
    </div>
    <button type="submit" disabled={busy || disabled || !actor.trim()}>{busy ? "Saving…" : "Save stage"}</button>
    {disabled && milestone.status !== "Complete" && <span className="ops-warning-inline">Complete the previous stage first{milestone.stage === "Delivered" ? " and record delivery proof" : ""}.</span>}
  </form>;
}

function ShipmentPanel({ order, actor, busy, onPost }: {
  order: OperationsOrderRecord; actor: string; busy: string; onPost: (path: string, payload: Record<string, unknown>, key: string) => Promise<boolean>;
}) {
  const qcComplete = order.milestones.some((milestone) => milestone.stage === "Quality check" && milestone.status === "Complete");
  const [shipmentCode, setShipmentCode] = useState("");
  const [destination, setDestination] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingReference, setTrackingReference] = useState("");
  const active = !["Delivered", "Closed", "Cancelled"].includes(order.status);
  return <section className="ops-shipment-panel">
    <h4>Shipments</h4>
    {order.shipments.map((shipment) => <ShipmentForm key={shipment.id} shipment={shipment} actor={actor} busy={busy === shipment.id} onSave={(payload) => onPost("/api/ops/orders/shipments/update", payload, shipment.id)} />)}
    {active && qcComplete && <form className="ops-shipment-create" onSubmit={async (event) => {
      event.preventDefault();
      const created = await onPost("/api/ops/orders/shipments", { orderId: order.id, shipmentCode, destination, carrier, trackingReference }, order.id);
      if (created) { setShipmentCode(""); setDestination(""); setCarrier(""); setTrackingReference(""); }
    }}>
      <h5>Register shipment</h5>
      <div className="ops-review-fields"><label>Shipment code<input value={shipmentCode} onChange={(event) => setShipmentCode(event.target.value)} required maxLength={60} /></label><label>Destination<input value={destination} onChange={(event) => setDestination(event.target.value)} required maxLength={500} /></label><label>Carrier<input value={carrier} onChange={(event) => setCarrier(event.target.value)} maxLength={120} /></label><label>Tracking reference<input value={trackingReference} onChange={(event) => setTrackingReference(event.target.value)} maxLength={200} /></label></div>
      <button type="submit" disabled={busy === order.id || !actor.trim()}>{busy === order.id ? "Saving…" : "Register shipment"}</button>
    </form>}
    {!qcComplete && <p className="ops-muted">Quality check must be complete before registering a shipment.</p>}
  </section>;
}

function ShipmentForm({ shipment, actor, busy, onSave }: {
  shipment: OperationsOrderRecord["shipments"][number]; actor: string; busy: boolean; onSave: (payload: Record<string, unknown>) => Promise<boolean>;
}) {
  const [status, setStatus] = useState(shipment.status);
  const [carrier, setCarrier] = useState(shipment.carrier || "");
  const [trackingReference, setTrackingReference] = useState(shipment.tracking_reference || "");
  const [deliveredAt, setDeliveredAt] = useState(dateTimeInput(shipment.delivered_at));
  const [proofOfDeliveryUrl, setProofOfDeliveryUrl] = useState(shipment.proof_of_delivery_url || "");
  const [exceptionNotes, setExceptionNotes] = useState(shipment.exception_notes || "");
  return <form className="ops-shipment-form" onSubmit={async (event) => {
    event.preventDefault();
    const saved = await onSave({ shipmentId: shipment.id, status, carrier, trackingReference, deliveredAt: deliveredAt ? new Date(deliveredAt).toISOString() : "", proofOfDeliveryUrl, exceptionNotes });
    if (saved) window.location.reload();
  }}>
    <div className="ops-milestone-title"><strong>{shipment.shipment_code} · {shipment.destination}</strong><span className="ops-status">{shipment.status}</span></div>
    <div className="ops-milestone-fields"><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{shipmentStatuses.map((value) => <option key={value}>{value}</option>)}</select></label><label>Carrier<input value={carrier} onChange={(event) => setCarrier(event.target.value)} maxLength={120} /></label><label>Tracking reference<input value={trackingReference} onChange={(event) => setTrackingReference(event.target.value)} maxLength={200} /></label><label>Delivered at<input type="datetime-local" value={deliveredAt} onChange={(event) => setDeliveredAt(event.target.value)} /></label><label>Proof of delivery URL<input type="url" value={proofOfDeliveryUrl} onChange={(event) => setProofOfDeliveryUrl(event.target.value)} maxLength={1000} placeholder="Required to mark delivered" /></label><label className="ops-notes-field">Exception details<input value={exceptionNotes} onChange={(event) => setExceptionNotes(event.target.value)} maxLength={1000} placeholder={status === "Exception" ? "Required: explain the exception" : "Optional"} /></label></div>
    <button type="submit" disabled={busy || !actor.trim()}>{busy ? "Saving…" : "Save shipment update"}</button>
  </form>;
}
