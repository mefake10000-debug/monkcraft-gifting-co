"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LEAD_PIPELINE_STATUSES, type LeadPipelineStatus } from "@/lib/automation/leadPipeline";
import type { OperationsLeadRecord } from "@/lib/automation/store";
import type { LeadCopilotRecommendation } from "@/lib/automation/leadCopilot";

type Lead = OperationsLeadRecord;

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function LeadCopilotPanel({ lead, actor, onUseAction, onSaved }: {
  lead: Lead; actor: string; onUseAction: (action: string, dueAt: string | null) => void; onSaved: () => void;
}) {
  const [channel, setChannel] = useState("email");
  const [direction, setDirection] = useState("outbound");
  const [content, setContent] = useState("");
  const [outcome, setOutcome] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [busy, setBusy] = useState<"save" | "coach" | "copy" | "">("");
  const [error, setError] = useState("");
  const [recommendation, setRecommendation] = useState<LeadCopilotRecommendation | null>(null);
  const [followUpAt, setFollowUpAt] = useState<string | null>(null);
  const [runId, setRunId] = useState("");

  async function saveInteraction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy("save"); setError("");
    try {
      const response = await fetch("/api/ops/leads/interaction", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ requestId: lead.id, channel, direction, content, outcome, actor, occurredAt: occurredAt ? new Date(occurredAt).toISOString() : "" }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body && typeof body.error === "string" ? body.error : "Could not save the interaction.");
      setContent(""); setOutcome(""); setOccurredAt(""); onSaved();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not save the interaction."); }
    finally { setBusy(""); }
  }

  async function coach() {
    setBusy("coach"); setError("");
    try {
      const response = await fetch("/api/ops/leads/coach", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ requestId: lead.id }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.recommendation) throw new Error(body && typeof body.error === "string" ? body.error : "Could not prepare coaching.");
      setRecommendation(body.recommendation as LeadCopilotRecommendation);
      setFollowUpAt(typeof body.suggestedFollowUpAt === "string" ? body.suggestedFollowUpAt : null);
      setRunId(typeof body.run?.id === "string" ? body.run.id : "");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not prepare coaching."); }
    finally { setBusy(""); }
  }

  async function copyDraft() {
    if (!recommendation?.draftMessage) return;
    try { setBusy("copy"); await navigator.clipboard.writeText(recommendation.draftMessage); }
    catch { setError("Clipboard access was blocked. Select and copy the draft manually."); }
    finally { setBusy(""); }
  }

  return <details className="ops-copilot">
    <summary>Conversation history & AI coach <span>{lead.interactions?.length ?? 0} logged</span></summary>
    <p className="ops-copilot-privacy">Paste only business-relevant conversation details. Logged messages are sent to the configured AI provider only when you request coaching. The coach never sends a message.</p>
    <div className="ops-copilot-layout">
      <section className="ops-copilot-history" aria-label="Lead conversation history">
        <h4>Recent interactions</h4>
        {lead.interactions?.length ? <ol>{lead.interactions.map((entry) => <li key={entry.id}>
          <div><strong>{entry.direction.replaceAll("_", " ")} · {entry.channel}</strong><time dateTime={entry.occurred_at}>{new Date(entry.occurred_at).toLocaleString()}</time></div>
          <p>{entry.content}</p>{entry.outcome && <small>Outcome: {entry.outcome}</small>}<small>Logged by {entry.actor}</small>
        </li>)}</ol> : <p className="ops-muted">No messages logged yet. Website brief details are already available to the coach.</p>}
      </section>
      <div className="ops-copilot-tools">
        <form className="ops-copilot-form" onSubmit={saveInteraction}>
          <h4>Log a message or call</h4>
          <div className="ops-copilot-fields">
            <label>Channel<select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="email">Email</option><option value="whatsapp">WhatsApp</option><option value="linkedin">LinkedIn</option><option value="phone">Phone</option><option value="meeting">Meeting</option><option value="internal">Internal note</option></select></label>
            <label>Direction<select value={direction} onChange={(event) => setDirection(event.target.value)}><option value="outbound">I sent this</option><option value="inbound">They sent this</option><option value="internal_note">Internal note</option></select></label>
          </div>
          <label>Paste message or write call notes<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} maxLength={8000} required placeholder="Include the relevant message and any context needed to understand the conversation." /></label>
          <label>When did this happen? (optional)<input type="datetime-local" value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /></label>
          <label>Outcome (optional)<input value={outcome} onChange={(event) => setOutcome(event.target.value)} maxLength={500} placeholder="e.g. Asked for a revised quantity" /></label>
          <button type="submit" disabled={busy !== "" || !actor.trim()}>{busy === "save" ? "Saving…" : "Save to lead history"}</button>
        </form>
        <section className="ops-copilot-coach">
          <div><h4>Lead conversion coach</h4><p>Uses the website brief and logged history to suggest one next step.</p></div>
          <button type="button" onClick={() => void coach()} disabled={busy !== ""}>{busy === "coach" ? "Reviewing…" : "Get AI coaching"}</button>
          {recommendation && <div className="ops-copilot-result">
            <div className="ops-copilot-result-head"><strong>{recommendation.priority} priority</strong>{runId && <span>Review run {runId.slice(0, 8)}</span>}</div>
            <p>{recommendation.opportunitySummary}</p>
            <h5>Suggested next step</h5><p>{recommendation.nextBestAction}</p>
            <p className="ops-copilot-timing">{recommendation.suggestedChannel} · {recommendation.timingWindow.replaceAll("_", " ")} · {recommendation.confidence} confidence</p>
            {followUpAt && <p className="ops-copilot-date">Suggested follow-up time: {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(followUpAt))} IST</p>}
            {recommendation.buyingSignals.length > 0 && <><h5>Signals</h5><ul>{recommendation.buyingSignals.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
            {recommendation.unansweredQuestions.length > 0 && <><h5>Still to learn</h5><ul>{recommendation.unansweredQuestions.map((item, index) => <li key={index}>{item}</li>)}</ul></>}
            <h5>Why this recommendation</h5><p>{recommendation.rationale}</p>
            {recommendation.evidenceReferences.length > 0 && <small>Evidence: {recommendation.evidenceReferences.join(", ")}</small>}
            {recommendation.draftMessage && <><label>Editable message draft<textarea rows={5} maxLength={2500} value={recommendation.draftMessage} onChange={(event) => setRecommendation({ ...recommendation, draftMessage: event.target.value })} /></label><div className="ops-actions"><button type="button" className="ops-button ops-button-quiet" onClick={() => void copyDraft()} disabled={busy !== ""}>{busy === "copy" ? "Copying…" : "Copy draft"}</button><button type="button" className="ops-button" onClick={() => onUseAction(recommendation.nextBestAction, followUpAt)}>Use as follow-up task</button></div></>}
            <p className="ops-copilot-human-check">Review before use. This recommendation and any draft are not sent automatically.</p>
          </div>}
          {error && <p className="ops-error" role="alert">{error}</p>}
        </section>
      </div>
    </div>
  </details>;
}

function LeadCard({ lead, actor, onSaved }: { lead: Lead; actor: string; onSaved: () => void }) {
  const [status, setStatus] = useState<LeadPipelineStatus>(lead.status);
  const [owner, setOwner] = useState(lead.owner || "");
  const [nextAction, setNextAction] = useState(lead.next_action || "");
  const [nextActionAt, setNextActionAt] = useState(localDateTime(lead.next_action_at));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const enquiry = lead.payload;
  const programme = enquiry.programme;

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ops/leads/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          requestId: lead.id, status, owner, nextAction,
          nextActionAt: nextActionAt ? new Date(nextActionAt).toISOString() : "",
          note, actor,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body && typeof body.error === "string" ? body.error : "Could not update this lead.");
      onSaved();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update this lead.");
      setBusy(false);
    }
  }

  return (
    <article className="ops-lead-card" id={`lead-${lead.id}`}>
      <div className="ops-check-heading">
        <div>
          <p className="ops-eyebrow">REQUEST {lead.id.slice(0, 8).toUpperCase()} · {enquiry.source || "Unknown source"}</p>
          <h3>{enquiry.contact.company || "Company not provided"}</h3>
          <p className="ops-muted">{enquiry.contact.name} · {enquiry.contactPreference} follow-up</p>
        </div>
        <div className="ops-lead-meta">
          <span className={`ops-status ops-status-${lead.status.toLowerCase().replaceAll(" ", "-")}`}>{lead.status}</span>
          <span className="ops-sync-state">Notion {lead.notion_sync_status}</span>
        </div>
      </div>

      <div className="ops-lead-summary">
        <p><strong>Programme:</strong> {[programme.occasion, programme.recipientCount && `${programme.recipientCount} recipients`, programme.budgetPerRecipient && `Budget ${programme.budgetPerRecipient}`].filter(Boolean).join(" · ") || "Not specified"}</p>
        <p><strong>Delivery:</strong> {[programme.deliveryDate, programme.deliveryLocation].filter(Boolean).join(" · ") || "Not specified"}</p>
        <p><strong>Products:</strong> {enquiry.products.map((line) => `${line.name}${line.quantity ? ` × ${line.quantity}` : ""}`).join(", ") || "No catalogue lines selected"}</p>
        {(enquiry.message || programme.notes) && <p><strong>Brief:</strong> {[enquiry.message, programme.notes].filter(Boolean).join(" — ")}</p>}
      </div>

      <div className="ops-contact-row">
        {enquiry.contact.email && <a href={`mailto:${enquiry.contact.email}`}>{enquiry.contact.email}</a>}
        {enquiry.contact.phone && <a href={`tel:${enquiry.contact.phone}`}>{enquiry.contact.phone}</a>}
        {enquiry.whatsappUpdatesOptIn && <span>WhatsApp quote updates opted in</span>}
      </div>

      <LeadCopilotPanel lead={lead} actor={actor} onSaved={onSaved} onUseAction={(action, dueAt) => {
        setNextAction(action);
        setNextActionAt(localDateTime(dueAt));
        document.getElementById(`lead-${lead.id}-next-action`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }} />

      <form className="ops-lead-form" onSubmit={save}>
        <label>Pipeline stage
          <select value={status} onChange={(event) => setStatus(event.target.value as LeadPipelineStatus)}>
            {LEAD_PIPELINE_STATUSES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
          </select>
        </label>
        <label>Owner
          <input value={owner} onChange={(event) => setOwner(event.target.value)} maxLength={120} placeholder="Assign a person" />
        </label>
        <label>Next action
          <input id={`lead-${lead.id}-next-action`} value={nextAction} onChange={(event) => setNextAction(event.target.value)} maxLength={300} placeholder="For example, confirm branding requirements" />
        </label>
        <label>Follow-up due
          <input type="datetime-local" value={nextActionAt} onChange={(event) => setNextActionAt(event.target.value)} />
        </label>
        <label className="ops-notes-field">Add an activity note
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} maxLength={1000} placeholder="Record a call, reply, or decision" />
        </label>
        {error && <p className="ops-error ops-notes-field" role="alert">{error}</p>}
        <div className="ops-lead-save-row"><button type="submit" disabled={busy || !actor.trim()}>{busy ? "Saving…" : "Save sales update"}</button></div>
      </form>

      {lead.activity?.length ? (
        <details className="ops-activity">
          <summary>Recent activity ({lead.activity.length})</summary>
          <ol>{lead.activity.map((event) => (
            <li key={event.id}><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString()}</time> · {event.actor} · {event.previous_status && event.previous_status !== event.new_status ? `${event.previous_status} → ` : ""}{event.new_status}{event.note ? ` — ${event.note}` : ""}</li>
          ))}</ol>
        </details>
      ) : null}
    </article>
  );
}

export function SalesQueue() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [actor, setActor] = useState("");
  const [filter, setFilter] = useState("All stages");
  const [view, setView] = useState<"open" | "due" | "all">("open");
  const [query, setQuery] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [now, setNow] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");

  async function load() {
    try {
      const response = await fetch("/api/ops/leads", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) { setState("unauthorized"); return; }
      const body = await response.json().catch(() => null);
      if (!response.ok || !body || !Array.isArray(body.leads)) throw new Error("Unavailable");
      setLeads(body.leads as Lead[]);
      setNow(Date.now());
      setState("ready");
    } catch { setState("error"); }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/ops/leads", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return { unauthorized: true as const };
        const body = await response.json().catch(() => null);
        if (!response.ok || !body || !Array.isArray(body.leads)) throw new Error("Unavailable");
        return { leads: body.leads as Lead[] };
      })
      .then((result) => {
        if (!active) return;
        if ("unauthorized" in result) setState("unauthorized");
        else { setLeads(result.leads); setNow(Date.now()); setState("ready"); }
      })
      .catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, []);
  const dueCount = leads.filter((lead) => lead.next_action_at && now > 0 && new Date(lead.next_action_at).getTime() <= now && !["Won", "Lost"].includes(lead.status)).length;
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return leads.filter((lead) => {
      const isOpen = !["Won", "Lost"].includes(lead.status);
      const isDue = Boolean(lead.next_action_at && now > 0 && new Date(lead.next_action_at).getTime() <= now);
      const matchesView = view === "all" || (view === "open" && isOpen) || (view === "due" && isDue && isOpen);
      const matchesStage = filter === "All stages" || lead.status === filter;
      const haystack = [lead.payload.contact.company, lead.payload.contact.name, lead.payload.contact.email, lead.payload.contact.phone, lead.next_action, ...lead.payload.products.map((item) => item.name)].join(" ").toLocaleLowerCase();
      return matchesView && matchesStage && (!normalizedQuery || haystack.includes(normalizedQuery));
    }).sort((a, b) => {
      const aDue = a.next_action_at ? new Date(a.next_action_at).getTime() : Number.POSITIVE_INFINITY;
      const bDue = b.next_action_at ? new Date(b.next_action_at).getTime() : Number.POSITIVE_INFINITY;
      return aDue - bDue || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [filter, leads, now, query, view]);
  const selectedLead = filtered.find((lead) => lead.id === selectedLeadId) ?? filtered[0] ?? null;

  return (
    <main className="ops-shell">
      <header className="ops-header">
        <div>
          <p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p>
          <h1>Sales pipeline</h1>
          <p className="ops-muted">Every saved enquiry has a stage, owner, and next action. Updates sync back to the same Notion lead.</p>
        </div>
        <nav className="ops-nav"><Link href="/ops/exceptions">Exceptions</Link><Link href="/ops/agents">Agent review</Link><Link href="/ops/suppliers">Supplier directory</Link><Link href="/ops/quotes">Quote desk</Link><Link href="/ops">Supplier checks</Link><Link href="/ops/orders">Orders</Link><Link href="/ops/finance">Finance</Link><Link href="/ops/analytics">Analytics</Link><Link href="/ops/marketing">Marketing consent</Link><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav>
      </header>

      <section className="ops-metrics" aria-label="Sales pipeline totals">
        <article><span>Open leads</span><strong>{leads.filter((lead) => !["Won", "Lost"].includes(lead.status)).length}</strong></article>
        <article><span>Follow-ups due</span><strong>{dueCount}</strong></article>
        <article><span>Won</span><strong>{leads.filter((lead) => lead.status === "Won").length}</strong></article>
      </section>

      <section className="ops-toolbar">
        <div><h2>Enquiries</h2><p className="ops-muted">Contact details are visible only in this authenticated operations area.</p></div>
        <div className="ops-sales-controls">
          <label>Your name for the activity log<input value={actor} onChange={(event) => setActor(event.target.value)} maxLength={120} placeholder="Name" /></label>
          <label>Search leads<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company, contact, product…" /></label>
          <label>Filter stage<select value={filter} onChange={(event) => setFilter(event.target.value)}><option>All stages</option>{LEAD_PIPELINE_STATUSES.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
        </div>
      </section>

      <div className="ops-lead-views" role="group" aria-label="Lead inbox views">
        <button type="button" className={view === "open" ? "is-active" : ""} onClick={() => setView("open")}>Open leads <span>{leads.filter((lead) => !["Won", "Lost"].includes(lead.status)).length}</span></button>
        <button type="button" className={view === "due" ? "is-active" : ""} onClick={() => setView("due")}>Follow-ups due <span>{dueCount}</span></button>
        <button type="button" className={view === "all" ? "is-active" : ""} onClick={() => setView("all")}>All requests <span>{leads.length}</span></button>
      </div>

      {state === "loading" && <div className="ops-empty"><p>Loading sales pipeline…</p></div>}
      {state === "unauthorized" && <div className="ops-empty"><h3>Sign in to the operations desk</h3><p>Your session has expired or you have not signed in.</p><Link href="/ops">Go to sign in</Link></div>}
      {state === "error" && <div className="ops-warning" role="alert">Sales records are unavailable. Confirm the Supabase project and apply the sales pipeline migration.</div>}
      {state === "ready" && filtered.length === 0 && <div className="ops-empty"><h3>No leads in this view</h3><p>New quote requests will appear here after durable submission.</p></div>}
      {state === "ready" && filtered.length > 0 && <section className="ops-lead-workspace" aria-label="Sales lead inbox">
        <nav className="ops-lead-inbox" aria-label="Choose a lead">
          <div className="ops-lead-inbox-heading"><strong>{filtered.length} {filtered.length === 1 ? "request" : "requests"}</strong><span>Sorted by next follow-up</span></div>
          {filtered.map((lead) => {
            const isDue = Boolean(lead.next_action_at && now > 0 && new Date(lead.next_action_at).getTime() <= now && !["Won", "Lost"].includes(lead.status));
            const isSelected = lead.id === selectedLead?.id;
            return <button type="button" key={lead.id} className={`ops-lead-inbox-item${isSelected ? " is-selected" : ""}`} aria-current={isSelected ? "true" : undefined} onClick={() => setSelectedLeadId(lead.id)}>
              <span className="ops-lead-inbox-top"><strong>{lead.payload.contact.company || "Company not provided"}</strong>{isDue && <em>Due</em>}</span>
              <span>{lead.payload.contact.name || "Contact not provided"}</span>
              <span className="ops-lead-inbox-bottom"><small>{lead.status}</small><small>{lead.next_action_at ? new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(lead.next_action_at)) : "No follow-up set"}</small></span>
              {lead.next_action && <span className="ops-lead-inbox-action">{lead.next_action}</span>}
            </button>;
          })}
        </nav>
        <div className="ops-lead-detail-panel">{selectedLead && <LeadCard key={selectedLead.id} lead={selectedLead} actor={actor} onSaved={() => void load()} />}</div>
      </section>}
    </main>
  );
}
