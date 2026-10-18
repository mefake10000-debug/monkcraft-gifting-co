"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OperationsLeadRecord, OperationsQuoteRecord, QuoteReadinessCheck } from "@/lib/automation/store";
import { assessQuoteSupplierReadiness } from "@/lib/automation/quoteWorkflow";

type Lead = OperationsLeadRecord;
type Quote = OperationsQuoteRecord & { lead: Lead | null };
type DeskData = { leads: Lead[]; quotes: Quote[]; supplierChecks: QuoteReadinessCheck[] };
type EditableLine = { productId: string; description: string; quantity: string; unitPrice: string };
type EditableAdjustment = { label: string; amount: string };

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);
const draftLines = (lead?: Lead): EditableLine[] => lead?.payload.products.length
  ? lead.payload.products.map((line) => ({ productId: line.id || line.name, description: line.name, quantity: String(Number(line.quantity) || 1), unitPrice: "" }))
  : [{ productId: "CUSTOM", description: "", quantity: "1", unitPrice: "" }];

export function QuoteDesk() {
  const router = useRouter();
  const [data, setData] = useState<DeskData>({ leads: [], quotes: [], supplierChecks: [] });
  const [requestId, setRequestId] = useState("");
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [adjustments, setAdjustments] = useState<EditableAdjustment[]>([]);
  const [terms, setTerms] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [actor, setActor] = useState("");
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("Open");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch("/api/ops/quotes", { credentials: "same-origin", cache: "no-store" });
    if (response.status === 401) { router.push("/ops"); return; }
    const body = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(body?.leads) || !Array.isArray(body?.quotes) || !Array.isArray(body?.supplierChecks)) throw new Error(body?.error || "Quote records are unavailable.");
    const next = body as DeskData;
    setData(next);
    if (!requestId && next.leads[0]) {
      setRequestId(next.leads[0].id);
      setLines(draftLines(next.leads[0]));
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/ops/quotes", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) throw new Error("Sign in to operations to manage quotes.");
        const body = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(body?.leads) || !Array.isArray(body?.quotes) || !Array.isArray(body?.supplierChecks)) throw new Error(body?.error || "Quote records are unavailable.");
        return body as DeskData;
      })
      .then((next) => {
        if (!active) return;
        setData(next);
        if (next.leads[0]) { setRequestId(next.leads[0].id); setLines(draftLines(next.leads[0])); }
      })
      .catch((caught: unknown) => { if (active) setError(caught instanceof Error ? caught.message : "Quote records are unavailable."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selectedLead = data.leads.find((lead) => lead.id === requestId) ?? data.quotes.find((quote) => quote.quote_request_id === requestId)?.lead ?? null;
  const lineSubtotal = lines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Math.round((Number(line.unitPrice) || 0) * 100) || 0), 0);
  const adjustmentTotal = adjustments.reduce((sum, adjustment) => sum + (Math.round((Number(adjustment.amount) || 0) * 100) || 0), 0);
  const total = lineSubtotal + adjustmentTotal;
  const selectedChecks = data.supplierChecks.filter((check) => check.request_id === requestId).map((check) => ({
    supplierId: check.supplier_id, status: check.status, availability: check.availability,
    reviewedAt: check.supplier_reply_reviewed_at, productIds: check.product_lines.map((line) => line.id || ""),
  }));
  const draftReadiness = assessQuoteSupplierReadiness(lines.map((line) => ({ productId: line.productId })), selectedChecks);
  const visibleQuotes = useMemo(() => filter === "Open"
    ? data.quotes.filter((quote) => ["Draft", "Changes requested", "Approval requested", "Approved", "Sent"].includes(quote.status))
    : data.quotes, [data.quotes, filter]);

  function selectLead(id: string) {
    setRequestId(id); setQuoteId(null); setTerms(""); setValidUntil(""); setAdjustments([]);
    setLines(draftLines(data.leads.find((lead) => lead.id === id)));
  }

  function editQuote(quote: Quote) {
    setRequestId(quote.quote_request_id); setQuoteId(quote.id);
    setLines(quote.snapshot.lines.map((line) => ({ productId: line.productId, description: line.description, quantity: String(line.quantity), unitPrice: (line.unitPricePaise / 100).toFixed(2) })));
    setAdjustments(quote.snapshot.adjustments.map((item) => ({ label: item.label, amount: (item.amountPaise / 100).toFixed(2) })));
    setTerms(quote.terms); setValidUntil(quote.valid_until || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!actor.trim()) { setError("Enter your name before saving a commercial quote."); return; }
    setBusy("save"); setError(""); setNotice("");
    try {
      const response = await fetch("/api/ops/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ action: "save_draft", draft: {
          requestId, quoteId, actor: actor.trim(), terms, validUntil: validUntil || null,
          lines: lines.map((line) => ({ productId: line.productId, description: line.description, quantity: Number(line.quantity), unitPricePaise: Math.round(Number(line.unitPrice) * 100) })),
          adjustments: adjustments.map((item) => ({ label: item.label, amountPaise: Math.round(Number(item.amount) * 100) })),
        } }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Quote draft could not be saved.");
      await load(); setQuoteId(body.quote.id); setNotice(`Quote v${body.quote.version} saved as a draft. No price or stock has been confirmed to the buyer.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Quote draft could not be saved."); }
    finally { setBusy(""); }
  }

  async function transition(quote: Quote, action: string) {
    if (!actor.trim()) { setError("Enter your name before updating a quote."); return; }
    const evidenceRequired = ["mark_sent", "accept", "decline"].includes(action);
    if (evidenceRequired && (evidence[quote.id] || "").trim().length < 3) { setError("Add a reference for the sent email, purchase order, or buyer decision."); return; }
    if (action === "accept" && !window.confirm(`Record quote v${quote.version} as accepted by ${quote.lead?.payload.contact.company || "this customer"}?`)) return;
    setBusy(`${quote.id}:${action}`); setError(""); setNotice("");
    try {
      const response = await fetch("/api/ops/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ action, quoteId: quote.id, actor: actor.trim(), evidenceReference: evidence[quote.id] || "", note: notes[quote.id] || "" }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Quote transition failed.");
      await load(); setNotice(`Quote v${quote.version} updated to ${body.quote.status}.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Quote transition failed."); }
    finally { setBusy(""); }
  }

  return <main className="ops-shell">
    <header className="ops-header">
      <div><p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p><h1>Quote desk</h1><p className="ops-muted">Build priced drafts from staff-entered values, obtain approval, record manual sending, and record the buyer’s decision. This desk does not calculate tax policy or reserve stock.</p></div>
      <nav className="ops-nav"><Link href="/ops/exceptions">Exceptions</Link><Link href="/ops/leads">Sales pipeline</Link><Link href="/ops/suppliers">Supplier directory</Link><Link href="/ops">Supplier checks</Link><Link href="/ops/orders">Orders</Link><Link href="/ops/finance">Finance</Link><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav>
    </header>
    {error && <div className="ops-error ops-message" role="alert">{error}</div>}{notice && <div className="ops-success ops-message" role="status">{notice}</div>}
    <section className="ops-toolbar ops-finance-toolbar"><div><h2>{quoteId ? "Edit quote draft" : "Create quote draft"}</h2><p className="ops-muted">Only manual prices supplied by staff are included. Add tax/fees as clearly named amounts after checking the approved business rules.</p></div><label className="ops-reviewer">Your name for the quote audit log<input value={actor} onChange={(event) => setActor(event.target.value)} maxLength={120} placeholder="Name" /></label></section>
    {data.leads.length ? <form className="ops-quote-form" onSubmit={saveDraft}>
      <label className="ops-quote-request">Customer request<select value={requestId} onChange={(event) => selectLead(event.target.value)} required>{data.leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.payload.contact.company} · {lead.payload.contact.name} · {lead.status}</option>)}</select></label>
      {selectedLead && <div className="ops-quote-context"><strong>{selectedLead.payload.contact.company}</strong><span>{selectedLead.payload.contact.email || selectedLead.payload.contact.phone || "No contact channel"}</span><span>{selectedLead.payload.programme.deliveryDate || "No requested date"} · {selectedLead.payload.programme.deliveryLocation || "No delivery location"}</span></div>}
      <div className={`ops-quote-readiness ${draftReadiness.ready ? "is-ready" : "is-held"}`} role="status"><strong>Supplier readiness: {draftReadiness.ready ? "Ready for review" : "Hold"}</strong><span>{draftReadiness.reason}</span><span>Reviewed availability does not reserve stock. Reconfirm before making a customer commitment.</span></div>
      <div className="ops-quote-lines" aria-label="Quote line items"><div className="ops-quote-table-head"><span>Product ID / description</span><span>Qty</span><span>Unit price (₹)</span><span>Line amount</span></div>
        {lines.map((line, index) => <div className="ops-quote-line" key={`${index}-${line.productId}`}>
          <label><span className="visually-hidden">Product ID</span><input value={line.productId} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, productId: event.target.value } : item))} maxLength={80} placeholder="Catalogue product ID" required /><span className="visually-hidden">Description</span><input value={line.description} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} maxLength={300} placeholder="Product / customization description" required /></label>
          <label><span className="visually-hidden">Quantity</span><input type="number" min="1" step="1" value={line.quantity} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} required /></label>
          <label><span className="visually-hidden">Unit price in rupees</span><input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, unitPrice: event.target.value } : item))} placeholder="Enter approved price" required /></label>
          <strong>{money((Number(line.quantity) || 0) * (Math.round((Number(line.unitPrice) || 0) * 100) || 0))}</strong>
          <button type="button" className="ops-button ops-button-quiet ops-quote-remove" onClick={() => setLines(lines.filter((_, i) => i !== index))} aria-label={`Remove quote line ${index + 1}`}>Remove</button>
        </div>)}
        <button type="button" className="ops-button ops-button-quiet" onClick={() => setLines([...lines, { productId: "CUSTOM", description: "", quantity: "1", unitPrice: "" }])}>Add quote line</button>
      </div>
      <fieldset className="ops-quote-adjustments"><legend>Additional charges, taxes, or discounts (manual amounts)</legend>{adjustments.map((item, index) => <div className="ops-quote-adjustment" key={index}><label>Label<input value={item.label} onChange={(event) => setAdjustments(adjustments.map((entry, i) => i === index ? { ...entry, label: event.target.value } : entry))} maxLength={120} placeholder="Delivery / GST / discount" required /></label><label>Amount (₹)<input type="number" step="0.01" value={item.amount} onChange={(event) => setAdjustments(adjustments.map((entry, i) => i === index ? { ...entry, amount: event.target.value } : entry))} required /></label><button type="button" className="ops-button ops-button-quiet" onClick={() => setAdjustments(adjustments.filter((_, i) => i !== index))}>Remove</button></div>)}<button type="button" className="ops-button ops-button-quiet" onClick={() => setAdjustments([...adjustments, { label: "", amount: "" }])}>Add named amount</button></fieldset>
      <label className="ops-quote-terms">Terms and notes<textarea value={terms} onChange={(event) => setTerms(event.target.value)} maxLength={4000} rows={4} placeholder="Validity, customization assumptions, delivery terms, exclusions, and payment terms as approved by Monkcraft" /></label>
      <label>Valid until<input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} /></label>
      <div className="ops-quote-total"><span>Subtotal {money(lineSubtotal)}</span><span>Named amounts {money(adjustmentTotal)}</span><strong>Quote total {money(total)}</strong></div>
      <div className="ops-lead-save-row"><button type="submit" disabled={busy === "save" || !actor.trim()}>{busy === "save" ? "Saving…" : "Save quote draft"}</button></div>
    </form> : !loading && <div className="ops-empty"><h3>No open quote requests</h3><p>New or qualified customer requests will appear here. Won and Lost requests are not available for new drafts.</p></div>}

    <section className="ops-toolbar ops-finance-toolbar"><div><h2>Quote versions and approvals</h2><p className="ops-muted">Marking a quote sent requires a communication reference. Recording acceptance marks the lead Won; order creation still requires this accepted version and evidence.</p></div><label className="ops-reviewer">Show<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="Open">Open quotes</option><option value="All">All versions</option></select></label></section>
    {loading ? <div className="ops-empty"><p>Loading quotes…</p></div> : visibleQuotes.length === 0 ? <div className="ops-empty"><h3>No quote versions yet</h3><p>Save a draft after entering the reviewed commercial values.</p></div> : <section className="ops-check-list" aria-label="Quote versions">{visibleQuotes.map((quote) => {
      const checks = data.supplierChecks.filter((check) => check.request_id === quote.quote_request_id).map((check) => ({
        supplierId: check.supplier_id, status: check.status, availability: check.availability,
        reviewedAt: check.supplier_reply_reviewed_at, productIds: check.product_lines.map((line) => line.id || ""),
      }));
      const readiness = assessQuoteSupplierReadiness(quote.snapshot.lines, checks);
      return <QuoteCard key={quote.id} quote={quote} actor={actor} busy={busy.startsWith(`${quote.id}:`)} evidence={evidence[quote.id] || ""} note={notes[quote.id] || ""} readiness={readiness} setEvidence={(value) => setEvidence({ ...evidence, [quote.id]: value })} setNote={(value) => setNotes({ ...notes, [quote.id]: value })} onAction={(action) => void transition(quote, action)} onEdit={() => editQuote(quote)} />;
    })}</section>}
  </main>;
}

function QuoteCard({ quote, actor, busy, evidence, note, readiness, setEvidence, setNote, onAction, onEdit }: {
  quote: Quote; actor: string; busy: boolean; evidence: string; note: string;
  readiness: ReturnType<typeof assessQuoteSupplierReadiness>;
  setEvidence: (value: string) => void; setNote: (value: string) => void; onAction: (action: string) => void; onEdit: () => void;
}) {
  const contact = quote.lead?.payload.contact;
  return <article className="ops-quote-card">
    <div className="ops-finance-record-head"><div><p className="ops-eyebrow">QUOTE v{quote.version} · REQUEST {quote.quote_request_id.slice(0, 8).toUpperCase()}</p><h3>{contact?.company || "Company not provided"} <span>· {contact?.name || "Contact not provided"}</span></h3><p className="ops-muted">Created by {quote.created_by} · {new Date(quote.created_at).toLocaleString()}{quote.valid_until ? ` · Valid until ${quote.valid_until}` : ""} · Notion sync: {quote.notion_sync_status}{quote.notion_last_error ? ` (${quote.notion_last_error})` : ""}</p></div><span className={`ops-status ops-status-${quote.status.toLowerCase().replaceAll(" ", "-")}`}>{quote.status}</span></div>
    <div className="ops-quote-preview"><div className="ops-quote-preview-head"><strong>Item</strong><strong>Qty</strong><strong>Unit price</strong><strong>Amount</strong></div>{quote.snapshot.lines.map((line, index) => <div className="ops-quote-preview-row" key={`${line.productId}-${index}`}><span>{line.description}<small>{line.productId}</small></span><span>{line.quantity}</span><span>{money(line.unitPricePaise)}</span><span>{money(line.unitPricePaise * line.quantity)}</span></div>)}{quote.snapshot.adjustments.map((item, index) => <div className="ops-quote-preview-row" key={`${item.label}-${index}`}><span>{item.label}</span><span>—</span><span>—</span><span>{money(item.amountPaise)}</span></div>)}<div className="ops-quote-preview-total"><strong>Subtotal {money(quote.subtotal_paise)}</strong><strong>Total {money(quote.total_paise)}</strong></div></div>
    {quote.terms && <p className="ops-quote-terms-preview">{quote.terms}</p>}
    {(quote.sent_evidence_reference || quote.buyer_decision_reference) && <p className="ops-muted">Communication evidence: {quote.sent_evidence_reference || quote.buyer_decision_reference}</p>}
    <div className={`ops-quote-readiness ${readiness.ready ? "is-ready" : "is-held"}`}><strong>Supplier readiness: {readiness.ready ? "Ready" : "Hold"}</strong><span>{readiness.reason}</span></div>
    <div className="ops-quote-controls">
      {quote.status === "Draft" || quote.status === "Changes requested" ? <><button type="button" className="ops-button ops-button-quiet" onClick={onEdit}>Edit draft</button><button type="button" className="ops-button" disabled={!actor.trim() || busy || !readiness.ready} onClick={() => onAction("submit_for_approval")}>Submit for approval</button></> : null}
      {quote.status === "Approval requested" && <><label>Reviewer note<input value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Reason or approval notes" /></label><button type="button" className="ops-button ops-button-quiet" disabled={!actor.trim() || busy || note.trim().length < 3} onClick={() => onAction("request_changes")}>Request changes</button><button type="button" className="ops-button" disabled={!actor.trim() || busy || !readiness.ready} onClick={() => onAction("approve")}>Approve quote</button></>}
      {quote.status === "Approved" && <><label>Sent email / CRM reference<input value={evidence} onChange={(event) => setEvidence(event.target.value)} maxLength={500} placeholder="Reference after manually sending the quote" /></label><button type="button" className="ops-button" disabled={!actor.trim() || busy || !readiness.ready || evidence.trim().length < 3} onClick={() => onAction("mark_sent")}>Record quote sent</button></>}
      {quote.status === "Sent" && <><label>Buyer communication / PO reference<input value={evidence} onChange={(event) => setEvidence(event.target.value)} maxLength={500} placeholder="Email reply, signed quote, or purchase order" /></label><button type="button" className="ops-button ops-button-quiet" disabled={!actor.trim() || busy || evidence.trim().length < 3} onClick={() => onAction("decline")}>Record declined</button><button type="button" className="ops-button" disabled={!actor.trim() || busy || evidence.trim().length < 3} onClick={() => onAction("accept")}>Record accepted</button></>}
    </div>
    {quote.events.length > 0 && <details className="ops-activity"><summary>Quote history · {quote.events.length} event{quote.events.length === 1 ? "" : "s"}</summary><ol>{quote.events.map((event) => <li key={event.id}><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString()}</time> · {event.actor} · {event.previous_status ? `${event.previous_status} → ` : ""}{event.new_status}{event.evidence_reference ? ` · ${event.evidence_reference}` : ""}{event.note ? ` · ${event.note}` : ""}</li>)}</ol></details>}
  </article>;
}
