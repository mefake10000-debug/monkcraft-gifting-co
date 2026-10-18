"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AgentRunRecord } from "@/lib/automation/store";

const decisions = ["Approved", "Rejected", "Completed", "Failed"] as const;
const agentLabels: Record<string, string> = {
  prospect_crm: "Prospect / CRM", marketing_seo: "Marketing / SEO", sales: "Sales",
  supplier_whatsapp: "Supplier WhatsApp", fulfillment: "Order / Fulfilment",
  finance_analytics: "Finance / Analytics", customer_care: "Customer Care",
};

export function AgentReviewDesk() {
  const router = useRouter();
  const [runs, setRuns] = useState<AgentRunRecord[]>([]);
  const [filter, setFilter] = useState("Needs review");
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [reviewer, setReviewer] = useState("");

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/ops/agents", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) { setState("unauthorized"); return; }
      const body = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(body?.runs)) throw new Error(body?.error || "Agent review records are unavailable.");
      setRuns(body.runs as AgentRunRecord[]); setState("ready");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Agent review records are unavailable."); setState("error"); }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/ops/agents", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return { unauthorized: true as const };
        const body = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(body?.runs)) throw new Error(body?.error || "Agent review records are unavailable.");
        return { runs: body.runs as AgentRunRecord[] };
      })
      .then((result) => {
        if (!active) return;
        if ("unauthorized" in result) setState("unauthorized");
        else { setRuns(result.runs); setState("ready"); }
      })
      .catch((caught: unknown) => { if (active) { setError(caught instanceof Error ? caught.message : "Agent review records are unavailable."); setState("error"); } });
    return () => { active = false; };
  }, []);

  async function submit(values: Record<string, unknown>) {
    if (!reviewer.trim()) { setError("Enter your name for the review record."); return false; }
    const id = typeof values.id === "string" ? values.id : "";
    setBusyId(id); setError("");
    try {
      const response = await fetch("/api/ops/agents", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, reviewer: reviewer.trim() }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Agent decision could not be saved.");
      await load();
      return true;
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Agent decision could not be saved."); return false; }
    finally { setBusyId(""); }
  }

  const visible = useMemo(() => runs.filter((run) => filter === "All" || run.status === filter), [runs, filter]);
  const needsReview = runs.filter((run) => ["Proposed", "Needs review"].includes(run.status)).length;
  return <main className="ops-shell">
    <header className="ops-header"><div><p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p><h1>Agent feedback & decisions</h1><p className="ops-muted">Review proposals, record corrections and outcomes, and keep an auditable history. Reviewed examples are stored for future evaluation; agent rules and models do not change automatically.</p></div><nav className="ops-nav"><Link href="/ops/exceptions">Exceptions</Link><Link href="/ops/content">Content</Link><Link href="/ops/leads">Sales</Link><Link href="/ops">Supplier checks</Link><Link href="/ops/analytics">Analytics</Link><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav></header>
    {state === "loading" && <div className="ops-empty"><p>Loading agent runs…</p></div>}
    {state === "unauthorized" && <div className="ops-empty"><h3>Sign in to the operations desk</h3><p>Your session has expired or you have not signed in.</p><Link href="/ops">Go to sign in</Link></div>}
    {state === "error" && <div className="ops-warning" role="alert">{error}</div>}
    {state === "ready" && <>
      <section className="ops-metrics" aria-label="Agent review totals"><article><span>Total recorded runs</span><strong>{runs.length}</strong></article><article><span>Needs human review</span><strong>{needsReview}</strong></article><article><span>Reviewed examples</span><strong>{runs.filter((run) => run.reviewer).length}</strong></article></section>
      {error && <div className="ops-warning" role="alert">{error}</div>}
      <section className="ops-toolbar"><div><h2>Run queue</h2><p className="ops-muted">The same decision record syncs to the Notion Agent Feedback & Decisions board when configured.</p></div><div className="ops-agent-controls"><label className="ops-reviewer">Your name for the review record<input value={reviewer} onChange={(event) => setReviewer(event.target.value)} maxLength={120} placeholder="Name" /></label><label className="ops-reviewer">Show<select value={filter} onChange={(event) => setFilter(event.target.value)}><option>Needs review</option><option>All</option>{["Proposed", "Approved", "Rejected", "Completed", "Failed"].map((status) => <option key={status}>{status}</option>)}</select></label><button className="ops-button ops-button-quiet" type="button" onClick={load}>Refresh</button></div></section>
      {visible.length === 0 ? <div className="ops-empty"><h3>No agent runs in this view</h3><p>When an agent proposes work, its run and review state will appear here.</p></div> : <section className="ops-agent-run-list" aria-label="Agent runs">
        {visible.map((run) => <AgentRunCard key={run.id} run={run} busy={busyId === run.id} onSubmit={submit} />)}
      </section>}
      <p className="ops-footnote">Notion sync state is operational metadata. Human decisions stay in the protected database with append-only feedback events.</p>
    </>}
  </main>;
}

function AgentRunCard({ run, busy, onSubmit }: { run: AgentRunRecord; busy: boolean; onSubmit: (values: Record<string, unknown>) => Promise<boolean> }) {
  const [status, setStatus] = useState<(typeof decisions)[number]>("Approved");
  const [humanCorrection, setHumanCorrection] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [outcome, setOutcome] = useState("");
  const needsDecision = ["Proposed", "Needs review"].includes(run.status);
  const action = run.proposed_action && typeof run.proposed_action === "object" ? JSON.stringify(run.proposed_action, null, 2) : String(run.proposed_action || "{}");
  return <article className="ops-agent-run-card">
    <div className="ops-exception-head"><div><p className="ops-eyebrow">{agentLabels[run.agent_key] || run.agent_key} · {run.trigger_name}</p><h3>{run.status}</h3></div><span className={`ops-status ops-status-${run.status.toLowerCase().replaceAll(" ", "-")}`}>{run.notion_sync_status === "synced" ? "Notion synced" : `Notion ${run.notion_sync_status}`}</span></div>
    <dl className="ops-exception-meta"><div><dt>Run ID</dt><dd>{run.id}</dd></div><div><dt>Created</dt><dd>{new Date(run.created_at).toLocaleString()}</dd></div>{run.input_reference && <div><dt>Input reference</dt><dd>{run.input_reference}</dd></div>}</dl>
    {run.quote_request_id && <p><Link href={`/ops/leads#lead-${run.quote_request_id}`}>Open related sales lead →</Link></p>}
    <details className="ops-agent-proposal" open={needsDecision}><summary>Proposed action</summary><pre>{action}</pre></details>
    {!needsDecision && <div className="ops-agent-decision"><p><strong>Reviewer:</strong> {run.reviewer || "—"} · <strong>Outcome:</strong> {run.outcome || "—"}</p>{run.human_correction && <p><strong>Correction:</strong> {run.human_correction}</p>}{run.correction_reason && <p><strong>Reason:</strong> {run.correction_reason}</p>}</div>}
    {run.events.length > 0 && <details className="ops-activity"><summary>Feedback history · {run.events.length}</summary><ol>{run.events.map((event) => <li key={event.id}><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString()}</time> · {event.previous_status} → {event.new_status} by {event.actor}{typeof event.after_feedback.outcome === "string" ? ` · ${event.after_feedback.outcome}` : ""}</li>)}</ol></details>}
    {needsDecision && <form className="ops-agent-review" onSubmit={async (event) => { event.preventDefault(); await onSubmit({ id: run.id, status, humanCorrection, correctionReason, outcome }); }}>
      <label>Decision<select value={status} onChange={(event) => setStatus(event.target.value as (typeof decisions)[number])}>{decisions.map((decision) => <option key={decision}>{decision}</option>)}</select></label>
      {status === "Rejected" ? <><label>Human correction<textarea value={humanCorrection} onChange={(event) => setHumanCorrection(event.target.value)} rows={2} maxLength={2000} required placeholder="What should the agent have proposed?" /></label><label>Reason<textarea value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} rows={2} maxLength={1000} required placeholder="Why was the proposal rejected?" /></label></> : <label>Review outcome<textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} rows={2} maxLength={2000} required placeholder="What did the reviewer decide and what happened next?" /></label>}
      <button className="ops-button" type="submit" disabled={busy}>{busy ? "Saving review…" : "Save human decision"}</button>
    </form>}
  </article>;
}
