"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OperationsException } from "@/lib/automation/exceptions";

export function ExceptionsDesk() {
  const router = useRouter();
  const [items, setItems] = useState<OperationsException[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  async function load() {
    setError("");
    try {
      const response = await fetch("/api/ops/exceptions", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) { setState("unauthorized"); return; }
      const body = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(body?.exceptions)) throw new Error(body?.error || "The exception queue is unavailable.");
      setItems(body.exceptions as OperationsException[]); setUpdatedAt(typeof body.generatedAt === "string" ? body.generatedAt : ""); setState("ready");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The exception queue is unavailable."); setState("error"); }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/ops/exceptions", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return { unauthorized: true as const };
        const body = await response.json().catch(() => null);
        if (!response.ok || !Array.isArray(body?.exceptions)) throw new Error(body?.error || "The exception queue is unavailable.");
        return { items: body.exceptions as OperationsException[], generatedAt: String(body.generatedAt || "") };
      })
      .then((result) => {
        if (!active) return;
        if ("unauthorized" in result) setState("unauthorized");
        else { setItems(result.items); setUpdatedAt(result.generatedAt); setState("ready"); }
      })
      .catch((caught: unknown) => { if (active) { setError(caught instanceof Error ? caught.message : "The exception queue is unavailable."); setState("error"); } });
    return () => { active = false; };
  }, []);

  const critical = items.filter((item) => item.severity === "critical").length;
  const unassigned = items.filter((item) => item.owner === "Unassigned").length;
  return <main className="ops-shell">
    <header className="ops-header"><div><p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p><h1>Exceptions & follow-up</h1><p className="ops-muted">One staff queue for records that need a person’s attention. Open the linked desk to resolve the source record; this page does not retry jobs or change business state.</p></div><nav className="ops-nav"><Link href="/ops/leads">Sales</Link><Link href="/ops">Supplier checks</Link><Link href="/ops/orders">Fulfilment</Link><Link href="/ops/finance">Finance</Link><Link href="/ops/content">Content</Link><Link href="/ops/analytics">Analytics</Link><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav></header>
    {state === "loading" && <div className="ops-empty"><p>Loading the exception queue…</p></div>}
    {state === "unauthorized" && <div className="ops-empty"><h3>Sign in to the operations desk</h3><p>Your session has expired or you have not signed in.</p><Link href="/ops">Go to sign in</Link></div>}
    {state === "error" && <div className="ops-warning" role="alert">{error}</div>}
    {state === "ready" && <>
      <section className="ops-metrics" aria-label="Exception queue totals"><article><span>Needs attention</span><strong>{items.length}</strong></article><article><span>Critical</span><strong>{critical}</strong></article><article><span>Unassigned</span><strong>{unassigned}</strong></article></section>
      <section className="ops-toolbar"><div><h2>Action queue</h2><p className="ops-muted">Sorted by workflow area. This list refreshes when opened or when you press refresh.</p>{updatedAt && <p className="ops-footnote">Updated {new Date(updatedAt).toLocaleString()}</p>}</div><button className="ops-button ops-button-quiet" type="button" onClick={load}>Refresh queue</button></section>
      {error && <div className="ops-warning" role="alert">{error}</div>}
      {items.length === 0 ? <div className="ops-empty"><h3>No current exceptions</h3><p>Lead follow-ups, integration sync, supplier replies, fulfilment, finance, and customer-care queues have no detected exceptions.</p></div> : <section className="ops-exception-list" aria-label="Operations exceptions">
        {items.map((item) => <article className="ops-exception-card" key={`${item.code}:${item.id}`}>
          <div className="ops-exception-head"><div><p className="ops-eyebrow">{item.category.toUpperCase()} · {item.code.replaceAll("_", " ")}</p><h3>{item.title}</h3></div><span className={`ops-exception-severity ops-exception-${item.severity}`}>{item.severity}</span></div>
          <p className="ops-exception-summary">{item.summary}</p>
          <dl className="ops-exception-meta"><div><dt>Owner</dt><dd>{item.owner}</dd></div>{item.dueAt && <div><dt>Due</dt><dd>{new Date(item.dueAt).toLocaleString()}</dd></div>}{item.updatedAt && <div><dt>Updated</dt><dd>{new Date(item.updatedAt).toLocaleString()}</dd></div>}</dl>
          <div className="ops-exception-action"><p><strong>Next action:</strong> {item.nextAction}</p><Link href={item.href}>Open {item.category.toLowerCase()} desk →</Link></div>
        </article>)}
      </section>}
      <p className="ops-footnote">Detection thresholds: stale Notion sync 48 hours, unanswered supplier check 48 hours, and open due dates in the past. This page does not send push/email alerts; it is a protected operational queue.</p>
    </>}
  </main>;
}
