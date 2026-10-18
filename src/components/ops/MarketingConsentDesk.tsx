"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MarketingPermissionRecord } from "@/lib/automation/store";

export function MarketingConsentDesk() {
  const router = useRouter();
  const [permissions, setPermissions] = useState<MarketingPermissionRecord[]>([]);
  const [actor, setActor] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/ops/marketing-consent", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) { setState("unauthorized"); return; }
      const body = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(body?.permissions)) throw new Error(body?.error || "Marketing permission records are unavailable.");
      setPermissions(body.permissions);
      setState("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Marketing permission records are unavailable.");
      setState("error");
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/ops/marketing-consent", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return { unauthorized: true as const };
        const body = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(body?.permissions)) throw new Error(body?.error || "Marketing permission records are unavailable.");
        return { permissions: body.permissions as MarketingPermissionRecord[] };
      })
      .then((result) => {
        if (!active) return;
        if ("unauthorized" in result) setState("unauthorized");
        else { setPermissions(result.permissions); setState("ready"); }
      })
      .catch((caught: unknown) => { if (active) { setError(caught instanceof Error ? caught.message : "Marketing permission records are unavailable."); setState("error"); } });
    return () => { active = false; };
  }, []);

  async function revoke(permissionId: string, evidenceReference: string) {
    if (!actor.trim()) { setError("Enter your name for the consent audit log first."); return false; }
    setBusy(permissionId); setError("");
    try {
      const response = await fetch("/api/ops/marketing-consent", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ permissionId, evidenceReference, actor: actor.trim() }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Consent could not be withdrawn.");
      await load();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Consent could not be withdrawn.");
      return false;
    } finally { setBusy(""); }
  }

  const activeCount = permissions.filter((permission) => permission.status === "active").length;
  const revokedCount = permissions.length - activeCount;
  return <main className="ops-shell">
    <header className="ops-header">
      <div><p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p><h1>Marketing consent</h1><p className="ops-muted">Email permissions are separate from quote follow-up. Review opt-ins and record withdrawal requests before any future marketing send.</p></div>
      <nav className="ops-nav"><Link href="/ops/analytics">Analytics</Link><Link href="/ops/customer-care">Customer care</Link><Link href="/ops/leads">Sales pipeline</Link><Link href="/ops">Supplier checks</Link><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav>
    </header>
    {state === "loading" && <div className="ops-empty"><p>Loading consent records…</p></div>}
    {state === "unauthorized" && <div className="ops-empty"><h3>Sign in to the operations desk</h3><p>Your session has expired or you have not signed in.</p><Link href="/ops">Go to sign in</Link></div>}
    {state === "error" && <div className="ops-warning" role="alert">{error}</div>}
    {state === "ready" && <>
      <section className="ops-metrics" aria-label="Email marketing permission totals"><article><span>Active email opt-ins</span><strong>{activeCount}</strong></article><article><span>Withdrawn</span><strong>{revokedCount}</strong></article><article><span>Marketing sends</span><strong>Not connected</strong></article></section>
      <section className="ops-toolbar ops-finance-toolbar"><div><h2>Permission register</h2><p className="ops-muted">Only an unchecked quote form is not an opt-out. If a person asks to stop email updates, record the request and its source here.</p></div><label className="ops-reviewer">Your name for the audit log<input value={actor} onChange={(event) => setActor(event.target.value)} maxLength={120} placeholder="Name" /></label></section>
      {error && <div className="ops-error ops-message" role="alert">{error}</div>}
      {permissions.length === 0 ? <div className="ops-empty"><h3>No email marketing opt-ins recorded</h3><p>Website quote requests can capture this separately when the buyer chooses it.</p></div> : <section className="ops-check-list" aria-label="Marketing consent records">
        {permissions.map((permission) => <PermissionCard key={permission.id} permission={permission} busy={busy === permission.id} actorReady={Boolean(actor.trim())} onRevoke={(reference) => revoke(permission.id, reference)} />)}
      </section>}
      <p className="ops-footnote">This register records consent; it does not send campaigns. The quote-specific WhatsApp permission never creates an email marketing permission. Provide unsubscribe controls in every marketing message before connecting an email sender.</p>
    </>}
  </main>;
}

function PermissionCard({ permission, busy, actorReady, onRevoke }: {
  permission: MarketingPermissionRecord; busy: boolean; actorReady: boolean; onRevoke: (reference: string) => Promise<boolean>;
}) {
  const [evidence, setEvidence] = useState("");
  const lastEvent = permission.events[0];
  return <article className="ops-permission-card">
    <div className="ops-finance-record-head"><div><p className="ops-eyebrow">EMAIL · {permission.wording_version}</p><h3>{permission.normalized_email}</h3><p className="ops-muted">Latest consent: {new Date(permission.consented_at).toLocaleString()} · source: {lastEvent?.source || "not recorded"}</p></div><span className={`ops-status ops-status-${permission.status}`}>{permission.status}</span></div>
    <details className="ops-activity"><summary>Consent history · {permission.events.length} event{permission.events.length === 1 ? "" : "s"}</summary><ol>{permission.events.map((event) => <li key={event.id}><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString()}</time> · {event.event_type} by {event.actor}{event.evidence_reference ? ` · evidence: ${event.evidence_reference}` : ""}</li>)}</ol></details>
    {permission.status === "active" && <form className="ops-permission-revoke" onSubmit={async (event) => { event.preventDefault(); const success = await onRevoke(evidence); if (success) setEvidence(""); }}>
      <label>Customer opt-out request reference<input value={evidence} onChange={(event) => setEvidence(event.target.value)} maxLength={500} required placeholder="Email, call note, or support ticket reference" /></label>
      <button type="submit" disabled={busy || !actorReady || evidence.trim().length < 3}>{busy ? "Withdrawing…" : "Record email opt-out"}</button>
    </form>}
  </article>;
}
