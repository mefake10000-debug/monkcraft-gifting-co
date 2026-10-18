"use client";

import { useState } from "react";
import Link from "next/link";
import type { SupplierCheckRecord } from "@/lib/automation/store";

type Props = {
  mode: "login" | "dashboard";
  initialChecks?: SupplierCheckRecord[];
  storageUnavailable?: boolean;
};

function messageForError(body: unknown) {
  if (body && typeof body === "object" && "error" in body && typeof body.error === "string") return body.error;
  if (body && typeof body === "object" && "code" in body && body.code === "whatsapp_not_configured") return "WhatsApp is not configured yet.";
  return "The request could not be completed. Check the connection and try again.";
}

export function OpsConsole({ mode, initialChecks = [], storageUnavailable = false }: Props) {
  const [password, setPassword] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("login");
    setError("");
    try {
      const response = await fetch("/api/ops/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageForError(body));
      setPassword("");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign in failed.");
      setBusy("");
    }
  }

  async function signOut() {
    await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" });
    window.location.reload();
  }

  async function act(check: SupplierCheckRecord, action: "approve" | "send") {
    if (action === "send" && !window.confirm(`Send the approved availability template to ${check.supplier_name}?`)) return;
    setBusy(check.id);
    setError("");
    try {
      const response = await fetch(`/api/ops/supplier-checks/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(action === "approve"
          ? { checkId: check.id, reviewer: reviewer.trim() }
          : { checkId: check.id, actor: reviewer.trim() || "operations" }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageForError(body));
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
      setBusy("");
    }
  }

  async function reviewReply(event: React.FormEvent<HTMLFormElement>, check: SupplierCheckRecord) {
    event.preventDefault();
    if (!reviewer.trim()) { setError("Enter your name before recording a supplier reply."); return; }
    const form = new FormData(event.currentTarget);
    setBusy(check.id);
    setError("");
    try {
      const response = await fetch("/api/ops/supplier-checks/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          checkId: check.id,
          reviewer: reviewer.trim(),
          availability: form.get("availability"),
          quotedUnitPrice: form.get("quotedUnitPrice"),
          moq: form.get("moq"),
          leadTime: form.get("leadTime"),
          notes: form.get("notes"),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(messageForError(body));
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reply review failed.");
      setBusy("");
    }
  }

  if (mode === "login") {
    return (
      <main className="ops-shell ops-login-shell">
        <section className="ops-login-card" aria-labelledby="ops-title">
          <p className="ops-eyebrow">MONKCRAFT · INTERNAL</p>
          <h1 id="ops-title">Operations desk</h1>
          <p className="ops-muted">Sign in with the operations access key to review supplier availability checks.</p>
          <form onSubmit={signIn} className="ops-login-form">
            <label htmlFor="ops-password">Operations access key</label>
            <input id="ops-password" name="password" type="password" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {error && <p className="ops-error" role="alert">{error}</p>}
            <button type="submit" disabled={busy === "login"}>{busy === "login" ? "Signing in…" : "Sign in"}</button>
          </form>
          <p className="ops-footnote">This shared-key console is for the supervised pilot. Use a separate named login for each staff member before broader rollout.</p>
        </section>
      </main>
    );
  }

  const pendingCount = initialChecks.filter((check) => ["Draft", "Needs mapping", "Ready for review", "Clarification needed"].includes(check.status)).length;
  const sentCount = initialChecks.filter((check) => ["Sent", "Replied"].includes(check.status)).length;

  return (
    <main className="ops-shell">
      <header className="ops-header">
        <div>
          <p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p>
          <h1>Operations desk</h1>
          <p className="ops-muted">Supplier checks from saved quote requests. Availability and stock are never confirmed by a message alone.</p>
        </div>
        <nav className="ops-nav"><Link href="/ops/exceptions">Exceptions</Link><Link href="/ops/suppliers">Supplier directory</Link><Link href="/ops/leads">Sales pipeline</Link><Link href="/ops/quotes">Quote desk</Link><Link href="/ops/orders">Orders</Link><Link href="/ops/finance">Finance</Link><Link href="/ops/content">Content desk</Link><Link href="/ops/analytics">Analytics</Link><Link href="/ops/marketing">Marketing consent</Link><button className="ops-button ops-button-quiet" type="button" onClick={signOut}>Sign out</button></nav>
      </header>

      <section className="ops-metrics" aria-label="Supplier check totals">
        <article><span>Checks awaiting action</span><strong>{pendingCount}</strong></article>
        <article><span>Sent or replied</span><strong>{sentCount}</strong></article>
        <article><span>Shown in this view</span><strong>{initialChecks.length}</strong></article>
      </section>

      {storageUnavailable && <div className="ops-warning" role="status">Supplier checks are not available. Confirm the Supabase connection and apply both operations migrations.</div>}
      {error && <div className="ops-error ops-message" role="alert">{error}</div>}

      <section className="ops-toolbar">
        <div>
          <h2>Supplier availability</h2>
          <p className="ops-muted">Review the mapping and quantities. Approval and sending are separate deliberate steps.</p>
        </div>
        <label className="ops-reviewer">Your name for this review
          <input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Name" maxLength={120} />
        </label>
      </section>

      {initialChecks.length === 0 ? (
        <div className="ops-empty"><h3>No supplier checks yet</h3><p>Saved quote requests create supplier drafts once the database has verified product-to-supplier mappings.</p></div>
      ) : (
        <section className="ops-check-list" aria-label="Supplier availability checks">
          {initialChecks.map((check) => (
            <article className="ops-check-card" key={check.id}>
              <div className="ops-check-heading">
                <div>
                  <p className="ops-eyebrow">CHECK {check.id.slice(0, 8).toUpperCase()} · REQUEST {check.request_id.slice(0, 8).toUpperCase()}</p>
                  <h3>{check.supplier_name || "Unmapped products"}</h3>
                  <p className="ops-muted">{check.supplier_category || (check.supplier_id ? "Supplier category not set" : "Map each product to an active supplier before requesting availability")}</p>
                </div>
                <span className={`ops-status ops-status-${check.status.toLowerCase().replaceAll(" ", "-")}`}>{check.status}</span>
              </div>

              <div className="ops-check-details">
                <div><span>Items</span><p>{check.product_lines.map((line) => `${line.id || line.name}${line.quantity ? ` × ${line.quantity}` : ""}`).join(", ") || "No product lines"}</p></div>
                <div><span>Total units</span><p>{check.total_units}</p></div>
                <div><span>Supplier reply</span><p>{check.reply_text || "No reply recorded"}</p></div>
                {check.availability !== "Unknown" && <div><span>Reviewed availability</span><p>{check.availability}</p></div>}
                {check.quoted_unit_price !== null && <div><span>Unit price</span><p>{check.quoted_unit_price}</p></div>}
                {check.moq !== null && <div><span>MOQ</span><p>{check.moq}</p></div>}
                {check.lead_time && <div><span>Lead time</span><p>{check.lead_time}</p></div>}
              </div>

              <footer className="ops-check-actions">
                {check.status === "Draft" || check.status === "Clarification needed" ? (
                  <button type="button" disabled={!reviewer.trim() || busy === check.id || !check.supplier_id} onClick={() => act(check, "approve")}>{busy === check.id ? "Working…" : "Approve availability request"}</button>
                ) : null}
                {check.status === "Ready for review" ? (
                  <button type="button" disabled={busy === check.id} onClick={() => act(check, "send")}>{busy === check.id ? "Sending…" : "Send approved WhatsApp template"}</button>
                ) : null}
                {check.status === "Sending" && <p className="ops-warning-inline">Send state needs reconciliation. Check Meta delivery before retrying.</p>}
                {check.status === "Needs mapping" && <p className="ops-warning-inline">Operations must map these SKUs before contacting a supplier.</p>}
                {check.status === "Replied" && <p className="ops-warning-inline">Review the reply and enter confirmed availability, price, MOQ, and lead time in the operating record.</p>}
                {check.status === "Draft" && !check.supplier_id && <p className="ops-warning-inline">No supplier mapping is attached to this check.</p>}
              </footer>
              {check.status === "Replied" && check.supplier_reply_reviewed_at && (
                <p className="ops-review-saved" role="status">Reviewed by {check.supplier_reply_reviewed_by || "staff"}{check.supplier_reply_review_notes ? ` · ${check.supplier_reply_review_notes}` : ""}. A new supplier reply will reopen review.</p>
              )}
              {check.status === "Replied" && !check.supplier_reply_reviewed_at && (
                <form className="ops-reply-review" onSubmit={(event) => reviewReply(event, check)}>
                  <h4>Record your review of this supplier reply</h4>
                  <p className="ops-muted">Enter values you verified from the supplier. This records the review but does not reserve stock.</p>
                  <div className="ops-review-fields">
                    <label>Availability
                      <select name="availability" defaultValue="" required>
                        <option value="" disabled>Select verified availability</option><option value="Available">Available</option><option value="Partial">Partial</option><option value="Unavailable">Unavailable</option>
                      </select>
                    </label>
                    <label>Unit price
                      <input name="quotedUnitPrice" inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,2})?" defaultValue={check.quoted_unit_price ?? ""} placeholder="Optional" />
                    </label>
                    <label>MOQ
                      <input name="moq" inputMode="numeric" pattern="[1-9][0-9]*" defaultValue={check.moq ?? ""} placeholder="Optional" />
                    </label>
                    <label>Lead time
                      <input name="leadTime" maxLength={200} defaultValue={check.lead_time || ""} placeholder="For example, 12 working days" />
                    </label>
                    <label className="ops-notes-field">Review notes
                      <textarea name="notes" rows={2} maxLength={1000} placeholder="What did you confirm with the supplier?" />
                    </label>
                  </div>
                  <button type="submit" disabled={busy === check.id || !reviewer.trim()}>{busy === check.id ? "Saving…" : "Save human-reviewed details"}</button>
                </form>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
