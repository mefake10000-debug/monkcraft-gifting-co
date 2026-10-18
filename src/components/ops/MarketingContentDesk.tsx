"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MARKETING_CHANNELS, type MarketingDraftContent } from "@/lib/automation/marketingContent";
import type { MarketingContentRecord } from "@/lib/automation/store";

const emptyContent = (): MarketingDraftContent => ({ title: "", copy: "", callToAction: "", imageBrief: "", hashtags: [], keywordSuggestions: [], factCheckNotes: [] });
const niceDate = (value: string | null) => value ? new Date(value).toLocaleString() : "Not scheduled";

export function MarketingContentDesk() {
  const router = useRouter();
  const [items, setItems] = useState<MarketingContentRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [aiConfigured, setAiConfigured] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actor, setActor] = useState("");
  const [note, setNote] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [channel, setChannel] = useState<string>(MARKETING_CHANNELS[0]);
  const [campaign, setCampaign] = useState("");
  const [objective, setObjective] = useState("");
  const [audience, setAudience] = useState("");
  const [brief, setBrief] = useState("");
  const [keywords, setKeywords] = useState("");
  const [owner, setOwner] = useState("");
  const [content, setContent] = useState<MarketingDraftContent>(emptyContent);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  async function load(chooseId?: string) {
    const response = await fetch("/api/ops/content", { credentials: "same-origin", cache: "no-store" });
    if (response.status === 401) { setState("unauthorized"); return; }
    const body = await response.json().catch(() => null);
    if (!response.ok || !Array.isArray(body?.items)) throw new Error(body?.error || "Marketing content is unavailable.");
    const nextItems = body.items as MarketingContentRecord[];
    setItems(nextItems); setAiConfigured(Boolean(body.aiConfigured)); setState("ready");
    const nextId = chooseId || selectedId;
    const nextSelected = nextItems.find((item) => item.id === nextId) || nextItems[0] || null;
    setSelectedId(nextSelected?.id || "");
    if (nextSelected) fillEditor(nextSelected);
  }

  const fillEditor = useCallback((item: MarketingContentRecord) => {
    setChannel(item.channel); setCampaign(item.campaign); setObjective(item.objective); setAudience(item.audience);
    setBrief(item.brief); setKeywords(item.keyword_suggestions.join(", ")); setOwner(item.owner);
    setPublishAt(item.publish_at ? new Date(item.publish_at).toISOString().slice(0, 16) : "");
    setContent({ ...emptyContent(), ...item.content }); setNote(""); setPublishedUrl(item.published_url || "");
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/ops/content", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return { unauthorized: true as const };
        const body = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(body?.items)) throw new Error(body?.error || "Marketing content is unavailable.");
        return { items: body.items as MarketingContentRecord[], aiConfigured: Boolean(body.aiConfigured) };
      })
      .then((result) => {
        if (!active) return;
        if ("unauthorized" in result) setState("unauthorized");
        else { setItems(result.items); setAiConfigured(result.aiConfigured); const first = result.items[0]; setSelectedId(first?.id || ""); if (first) fillEditor(first); setState("ready"); }
      })
      .catch((caught: unknown) => { if (active) { setError(caught instanceof Error ? caught.message : "Marketing content is unavailable."); setState("error"); } });
    return () => { active = false; };
  }, [fillEditor]);

  async function send(action: string, overrides: Record<string, unknown> = {}) {
    if (!actor.trim()) { setError("Enter your name for the marketing audit log first."); return false; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/ops/content", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ action, actor: actor.trim(), ...overrides }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Marketing action failed.");
      if (body.item?.id) await load(body.item.id);
      return true;
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Marketing action failed."); return false; }
    finally { setBusy(false); }
  }

  function briefPayload() {
    return { id: selected?.id || null, channel, campaign, objective, audience, brief, keywordThemes: keywords.split(",").map((word) => word.trim()).filter(Boolean), publishAt: publishAt ? new Date(publishAt).toISOString() : null, owner, actor: actor.trim() };
  }

  async function createDraft(action: "generate" | "save_draft") {
    const manualContent = { ...content, title: content.title || campaign, copy: content.copy || brief, callToAction: content.callToAction || "Request a tailored corporate gifting quote.", imageBrief: content.imageBrief || "Create an editorial visual using only verified Moncraft products and brand assets.", keywordSuggestions: keywords.split(",").map((word) => word.trim()).filter(Boolean) };
    await send(action, { ...briefPayload(), id: null, content: manualContent });
  }

  async function saveEdits() {
    if (!selected) return;
    await send("save_draft", { ...briefPayload(), id: selected.id, content: { ...content, keywordSuggestions: content.keywordSuggestions.length ? content.keywordSuggestions : keywords.split(",").map((word) => word.trim()).filter(Boolean) } });
  }

  function switchItem(item: MarketingContentRecord) { setSelectedId(item.id); fillEditor(item); }
  const editable = !selected || ["Idea", "Draft"].includes(selected.status);

  return <main className="ops-shell">
    <header className="ops-header"><div><p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p><h1>Marketing content desk</h1><p className="ops-muted">Create a draft, check claims and brand details, approve it, then publish manually. This desk never posts to a social account.</p></div><nav className="ops-nav"><Link href="/ops/exceptions">Exceptions</Link><Link href="/ops/analytics">Analytics</Link><Link href="/ops/marketing">Marketing consent</Link><Link href="/ops/leads">Sales pipeline</Link><Link href="/ops">Supplier checks</Link><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav></header>
    {state === "loading" && <div className="ops-empty"><p>Loading marketing content…</p></div>}
    {state === "unauthorized" && <div className="ops-empty"><h3>Sign in to the operations desk</h3><p>Your session has expired or you have not signed in.</p><Link href="/ops">Go to sign in</Link></div>}
    {state === "error" && <div className="ops-warning" role="alert">{error}</div>}
    {state === "ready" && <>
      <section className="ops-metrics" aria-label="Marketing content totals"><article><span>Drafts and ideas</span><strong>{items.filter((item) => ["Idea", "Draft"].includes(item.status)).length}</strong></article><article><span>Awaiting review</span><strong>{items.filter((item) => item.status === "Review").length}</strong></article><article><span>Scheduled / published</span><strong>{items.filter((item) => ["Scheduled", "Published"].includes(item.status)).length}</strong></article></section>
      {!aiConfigured && <div className="ops-warning">AI drafting is not configured. Manual drafts still work; add a server-only OpenAI key to enable draft generation.</div>}
      {error && <div className="ops-error ops-message" role="alert">{error}</div>}
      <section className="ops-toolbar"><div><h2>New campaign draft</h2><p className="ops-muted">Give the agent a focused brief. It suggests copy and keyword ideas; it does not verify rankings or product claims.</p></div><label className="ops-reviewer">Your name for the audit log<input value={actor} onChange={(event) => setActor(event.target.value)} maxLength={120} placeholder="Name" /></label></section>
      <div className="ops-content-layout">
        <section className="ops-content-form">
          <div className="ops-content-fields">
            <label>Channel<select value={channel} onChange={(event) => setChannel(event.target.value)}>{MARKETING_CHANNELS.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label>Campaign<input value={campaign} onChange={(event) => setCampaign(event.target.value)} maxLength={120} placeholder="Diwali gifting 2026" /></label>
            <label>Objective<input value={objective} onChange={(event) => setObjective(event.target.value)} maxLength={240} placeholder="Generate qualified corporate enquiries" /></label>
            <label>Audience<input value={audience} onChange={(event) => setAudience(event.target.value)} maxLength={240} placeholder="HR and people teams at Bengaluru companies" /></label>
            <label className="ops-content-wide">Brief<textarea value={brief} onChange={(event) => setBrief(event.target.value)} rows={4} maxLength={2000} placeholder="What should the post communicate? Include only facts Moncraft can support." /></label>
            <label>Keyword themes<input value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="corporate gifting Bengaluru, employee gifts" /></label>
            <label>Owner<input value={owner} onChange={(event) => setOwner(event.target.value)} maxLength={120} placeholder="Marketing owner" /></label>
          </div>
          <div className="ops-actions"><button className="ops-button" disabled={busy || !aiConfigured} onClick={() => createDraft("generate")}>{busy ? "Working…" : "Generate draft with AI"}</button><button className="ops-button ops-button-quiet" disabled={busy} onClick={() => createDraft("save_draft")}>Create manual draft</button></div>
          <p className="ops-footnote">Do not include buyer personal data. Review every claim, keyword, image brief and brand detail before approval.</p>
        </section>

        <section className="ops-content-list"><h2>Content queue · {items.length}</h2>{items.length === 0 ? <div className="ops-empty"><h3>No drafts yet</h3><p>Create the first campaign draft above.</p></div> : items.map((item) => <button className={`ops-content-row${item.id === selectedId ? " is-selected" : ""}`} key={item.id} type="button" onClick={() => switchItem(item)}><span className="ops-content-row-title">{item.content.title || item.campaign}</span><span>{item.channel} · {item.campaign}</span><span className={`ops-status ops-status-${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span><small>Notion: {item.notion_sync_status}{item.notion_last_error ? " · retry queued" : ""}</small></button>)}</section>
      </div>

      {selected && <section className="ops-content-editor">
        <div className="ops-finance-record-head"><div><p className="ops-eyebrow">{selected.channel.toUpperCase()} · {selected.campaign}</p><h2>{selected.content.title}</h2><p className="ops-muted">Owner: {selected.owner} · updated {new Date(selected.updated_at).toLocaleString()} · planned: {niceDate(selected.publish_at)}</p></div><span className={`ops-status ops-status-${selected.status.toLowerCase().replaceAll(" ", "-")}`}>{selected.status}</span></div>
        <div className="ops-content-fields">
          <label>Title<input disabled={!editable} value={content.title} onChange={(event) => setContent({ ...content, title: event.target.value })} maxLength={180} /></label>
          <label>Call to action<input disabled={!editable} value={content.callToAction} onChange={(event) => setContent({ ...content, callToAction: event.target.value })} maxLength={300} /></label>
          <label className="ops-content-wide">Draft copy<textarea disabled={!editable} value={content.copy} onChange={(event) => setContent({ ...content, copy: event.target.value })} rows={8} maxLength={4000} /></label>
          <label className="ops-content-wide">Image / video brief<textarea disabled={!editable} value={content.imageBrief} onChange={(event) => setContent({ ...content, imageBrief: event.target.value })} rows={3} maxLength={1200} /></label>
          <label>Hashtags<input disabled={!editable} value={content.hashtags.join(" ")} onChange={(event) => setContent({ ...content, hashtags: event.target.value.split(/\s+/).filter(Boolean).slice(0, 15) })} /></label>
          <label>Keyword suggestions<input disabled={!editable} value={content.keywordSuggestions.join(", ")} onChange={(event) => setContent({ ...content, keywordSuggestions: event.target.value.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 12) })} /></label>
        </div>
        {content.factCheckNotes.length > 0 && <div className="ops-warning"><strong>Fact-check before approval</strong><ul>{content.factCheckNotes.map((check, index) => <li key={`${index}-${check}`}>{check}</li>)}</ul></div>}
        <p className="ops-footnote">Draft history: {selected.events.length} recorded event(s). AI: {selected.model || "manual"}. Notion sync: {selected.notion_sync_status}{selected.notion_synced_at ? ` · ${new Date(selected.notion_synced_at).toLocaleString()}` : ""}</p>
        <details className="ops-activity"><summary>Review and change history</summary><ol>{selected.events.map((event) => <li key={event.id}><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString()}</time> · {event.event_type.replaceAll("_", " ")} by {event.actor}{event.note ? ` · ${event.note}` : ""}{event.reference ? ` · ${event.reference}` : ""}</li>)}</ol></details>
        <div className="ops-actions">
          {editable && <><button className="ops-button ops-button-quiet" disabled={busy} onClick={saveEdits}>Save edits</button><button className="ops-button" disabled={busy || !content.title.trim() || !content.copy.trim()} onClick={() => send("submit_for_review", { id: selected.id })}>Submit for review</button></>}
          {selected.status === "Review" && <><label className="ops-reviewer">Review note<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Required when requesting changes" /></label><button className="ops-button ops-button-quiet" disabled={busy || note.trim().length < 3} onClick={() => send("request_changes", { id: selected.id, note })}>Request changes</button><button className="ops-button" disabled={busy} onClick={() => send("approve", { id: selected.id })}>Approve draft</button></>}
          {selected.status === "Approved" && <><label className="ops-reviewer">Planned publish time<input type="datetime-local" value={publishAt} onChange={(event) => setPublishAt(event.target.value)} /></label><button className="ops-button" disabled={busy || !publishAt} onClick={() => send("schedule", { id: selected.id, publishAt: new Date(publishAt).toISOString() })}>Record schedule</button></>}
          {selected.status === "Scheduled" && <><label className="ops-reviewer">Public post/page URL<input value={publishedUrl} onChange={(event) => setPublishedUrl(event.target.value)} placeholder="https://…" /></label><button className="ops-button" disabled={busy || !publishedUrl.startsWith("https://")} onClick={() => send("mark_published", { id: selected.id, publishedUrl })}>Record manual publication</button></>}
          {selected.status === "Published" && <button className="ops-button ops-button-quiet" disabled={busy} onClick={() => send("repurpose", { id: selected.id })}>Move to repurpose</button>}
        </div>
      </section>}
    </>}
  </main>;
}
