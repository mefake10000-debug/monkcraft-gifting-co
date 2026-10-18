"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FinanceEligibleOrder, FinanceRecord } from "@/lib/automation/store";

type Data = { records: FinanceRecord[]; orders: FinanceEligibleOrder[] };
const documentTypes = ["Estimate", "Sales order", "Invoice", "Receipt", "Supplier bill", "Credit note"];
const statuses = ["Needs entry", "Entered in Vyapar", "Matched", "Mismatch", "Needs review"];

export function FinanceDesk() {
  const router = useRouter();
  const [data, setData] = useState<Data>({ records: [], orders: [] });
  const [actor, setActor] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [packBusy, setPackBusy] = useState("");
  const [selected, setSelected] = useState<FinanceRecord | null>(null);

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/ops/finance", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) { setState("unauthorized"); return; }
      const body = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(body?.records) || !Array.isArray(body?.orders)) throw new Error(body?.error || "Finance data is unavailable.");
      setData({ records: body.records, orders: body.orders });
      setState("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Finance data is unavailable.");
      setState("error");
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/ops/finance", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return { unauthorized: true as const };
        const body = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(body?.records) || !Array.isArray(body?.orders)) throw new Error(body?.error || "Finance data is unavailable.");
        return { data: { records: body.records as FinanceRecord[], orders: body.orders as FinanceEligibleOrder[] } };
      })
      .then((result) => {
        if (!active) return;
        if ("unauthorized" in result) setState("unauthorized");
        else { setData(result.data); setState("ready"); }
      })
      .catch((caught: unknown) => { if (active) { setError(caught instanceof Error ? caught.message : "Finance data is unavailable."); setState("error"); } });
    return () => { active = false; };
  }, []);

  const mismatches = useMemo(() => data.records.filter((record) => ["Mismatch", "Needs review"].includes(record.status)).length, [data.records]);

  async function save(values: Record<string, unknown>) {
    if (!actor.trim()) { setError("Enter your name for the finance audit log first."); return false; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/ops/finance", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ ...values, actor: actor.trim(), enteredBy: values.enteredBy || actor.trim() }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Finance record could not be saved.");
      setSelected(null);
      await load();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Finance record could not be saved.");
      return false;
    } finally { setBusy(false); }
  }

  async function downloadEntryPack(order: FinanceEligibleOrder) {
    setError(""); setPackBusy(order.id);
    try {
      const response = await fetch(`/api/ops/finance/entry-pack?orderId=${encodeURIComponent(order.id)}`, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || "The entry pack could not be prepared.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${order.order_code.replace(/[^a-zA-Z0-9_-]/g, "-")}-vyapar-entry-pack.json`;
      document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The entry pack could not be prepared.");
    } finally { setPackBusy(""); }
  }

  return <main className="ops-shell">
    <header className="ops-header">
      <div><p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p><h1>Finance & Vyapar reconciliation</h1><p className="ops-muted">Record what staff entered in Vyapar, then reconcile order amounts and route differences for review. This desk does not post accounting entries to Vyapar.</p></div>
      <nav className="ops-nav"><Link href="/ops/suppliers">Supplier directory</Link><Link href="/ops/quotes">Quote desk</Link><Link href="/ops/content">Content desk</Link><Link href="/ops/analytics">Analytics</Link><Link href="/ops/orders">Orders</Link><Link href="/ops/leads">Sales pipeline</Link><Link href="/ops/marketing">Marketing consent</Link><Link href="/ops">Supplier checks</Link><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav>
    </header>
    {state === "loading" && <div className="ops-empty"><p>Loading finance records…</p></div>}
    {state === "unauthorized" && <div className="ops-empty"><h3>Sign in to the operations desk</h3><p>Your session has expired or you have not signed in.</p><Link href="/ops">Go to sign in</Link></div>}
    {state === "error" && <div className="ops-warning" role="alert">{error}</div>}
    {state === "ready" && <>
      <section className="ops-metrics" aria-label="Finance reconciliation totals">
        <article><span>Documents recorded</span><strong>{data.records.length}</strong></article>
        <article><span>Needs entry</span><strong>{data.records.filter((record) => record.status === "Needs entry").length}</strong></article>
        <article><span>Mismatch or review</span><strong>{mismatches}</strong></article>
      </section>
      <section className="ops-toolbar ops-finance-toolbar">
        <div><h2>Vyapar entry log</h2><p className="ops-muted">Enter or correct a reference after staff creates the document in Vyapar. Match status requires equal amounts; a difference must stay visible.</p></div>
        <label className="ops-reviewer">Your name for this audit log<input value={actor} onChange={(event) => setActor(event.target.value)} maxLength={120} placeholder="Name" /></label>
      </section>
      <section className="ops-toolbar ops-finance-toolbar"><div><h2>Accepted order entry packs</h2><p className="ops-muted">Download the accepted order and quote details to prepare manual entries in Vyapar. The pack is an internal JSON aid, not a Vyapar import file.</p></div></section>
      {data.orders.length === 0 ? <div className="ops-empty"><p>Accepted orders will appear here after the customer quote is accepted and an order is created.</p></div> : <section className="ops-check-list" aria-label="Vyapar entry packs">{data.orders.map((order) => <article className="ops-finance-record ops-entry-pack-row" key={order.id}><div className="ops-finance-record-head"><div><p className="ops-eyebrow">{order.order_code} · {order.company}</p><h3>{order.accepted_quote_version ? `Accepted quote ${order.accepted_quote_version}` : "No accepted quote version"}</h3></div><button type="button" className="ops-button" disabled={!order.accepted_quote_version || packBusy === order.id} onClick={() => void downloadEntryPack(order)}>{packBusy === order.id ? "Preparing…" : "Download entry pack"}</button></div></article>)}</section>}
      {error && <div className="ops-error ops-message" role="alert">{error}</div>}
      <FinanceEntryForm key={selected?.id || "new"} record={selected} orders={data.orders} actor={actor} busy={busy} onCancel={() => setSelected(null)} onSave={save} />
      <section className="ops-toolbar ops-orders-heading"><div><h2>Recorded documents</h2><p className="ops-muted">Each correction creates an audit event. Use “Needs review” with a note for unresolved differences.</p></div></section>
      {data.records.length === 0 ? <div className="ops-empty"><p>No Vyapar documents have been recorded yet.</p></div> : <section className="ops-check-list" aria-label="Vyapar reconciliation documents">
        {data.records.map((record) => <article className="ops-finance-record" key={record.id}>
          <div className="ops-finance-record-head"><div><p className="ops-eyebrow">{record.order_code || "QUOTE REQUEST"} · {record.company}</p><h3>{record.document_type}{record.vyapar_reference ? ` · ${record.vyapar_reference}` : ""}</h3></div><span className={`ops-status ops-status-${record.status.toLowerCase().replaceAll(" ", "-")}`}>{record.status}</span></div>
          <div className="ops-finance-summary"><span>Expected: {formatAmount(record.expected_amount)}</span><span>Vyapar: {formatAmount(record.recorded_amount)}</span><span>Date: {record.document_date || "Not entered"}</span><span>Entered by: {record.entered_by || "Not entered"}</span></div>
          {record.notes && <p className="ops-muted ops-finance-note">{record.notes}</p>}
          <details className="ops-activity"><summary>Audit history · {record.events.length} change{record.events.length === 1 ? "" : "s"}</summary><ol>{record.events.map((event) => <li key={event.id}><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString()}</time> · {event.event_type} by {event.actor} · {String(event.after_record.status || "updated")} · {formatAmount(event.after_record.recorded_amount == null ? null : Number(event.after_record.recorded_amount))}</li>)}</ol></details>
          <button type="button" className="ops-button ops-button-quiet" onClick={() => setSelected(record)}>Edit / reconcile</button>
        </article>)}
      </section>}
      <p className="ops-footnote">Amounts are recorded as supplied by staff. This screen does not calculate tax, approve payments, issue refunds, or replace the Vyapar ledger.</p>
    </>}
  </main>;
}

function formatAmount(amount: number | null) {
  return amount === null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}

function FinanceEntryForm({ record, orders, actor, busy, onCancel, onSave }: {
  record?: FinanceRecord | null; orders: FinanceEligibleOrder[]; actor: string; busy: boolean;
  onCancel: () => void; onSave: (values: Record<string, unknown>) => Promise<boolean>;
}) {
  const [submissionId, setSubmissionId] = useState(() => globalThis.crypto?.randomUUID?.() || "");
  const [orderId, setOrderId] = useState(record?.order_id || "");
  const [documentType, setDocumentType] = useState(record?.document_type || "Invoice");
  const [status, setStatus] = useState(record?.status || "Needs entry");
  const [reference, setReference] = useState(record?.vyapar_reference || "");
  const [expected, setExpected] = useState(record?.expected_amount?.toString() || "");
  const [recorded, setRecorded] = useState(record?.recorded_amount?.toString() || "");
  const [documentDate, setDocumentDate] = useState(record?.document_date || "");
  const [enteredBy, setEnteredBy] = useState(record?.entered_by || "");
  const [notes, setNotes] = useState(record?.notes || "");
  const canSave = Boolean(actor.trim() && orderId && (enteredBy.trim() || actor.trim()) && (record || submissionId));
  return <form className="ops-finance-form" onSubmit={async (event) => {
    event.preventDefault();
    const saved = await onSave({ id: record?.id || null, clientSubmissionId: record ? null : submissionId, orderId, documentType, status, vyaparReference: reference,
      expectedAmount: expected.trim() ? Number(expected) : null, recordedAmount: recorded.trim() ? Number(recorded) : null,
      documentDate: documentDate || null, enteredBy, notes });
    if (saved && !record) setSubmissionId(globalThis.crypto.randomUUID());
  }}>
    <div className="ops-finance-form-head"><div><h3>{record ? "Edit finance record" : "Record a Vyapar document"}</h3><p>For a quote-only estimate that has no order yet, use the quote or sales pipeline record separately.</p></div>{record && <button type="button" className="ops-button ops-button-quiet" onClick={onCancel}>Cancel edit</button>}</div>
    <div className="ops-finance-fields">
      <label>Order<select value={orderId} onChange={(event) => setOrderId(event.target.value)} required><option value="">Select an order</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.order_code} · {order.company} · {order.status}</option>)}</select></label>
      <label>Document type<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}>{documentTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      <label>Reconciliation state<select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Vyapar reference<input value={reference} onChange={(event) => setReference(event.target.value)} maxLength={200} placeholder="Estimate / invoice number" /></label>
      <label>Expected amount (₹)<input type="number" min="0" step="0.01" value={expected} onChange={(event) => setExpected(event.target.value)} /></label>
      <label>Amount in Vyapar (₹)<input type="number" min="0" step="0.01" value={recorded} onChange={(event) => setRecorded(event.target.value)} /></label>
      <label>Document date<input type="date" value={documentDate} onChange={(event) => setDocumentDate(event.target.value)} /></label>
      <label>Entered by<input value={enteredBy} onChange={(event) => setEnteredBy(event.target.value)} maxLength={120} placeholder={actor || "Staff name"} required /></label>
      <label className="ops-finance-notes">Notes / review reason<textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={3} placeholder="Required for Needs review" /></label>
    </div>
    <div className="ops-lead-save-row"><button type="submit" disabled={busy || !canSave}>{busy ? "Saving…" : record ? "Save reconciliation" : "Record document"}</button></div>
    {orders.length === 0 && <p className="ops-warning-inline">Create an approved customer order before adding order-level finance records.</p>}
  </form>;
}
