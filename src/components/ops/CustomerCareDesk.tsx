"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CustomerCareTask, OperationsOrderRecord } from "@/lib/automation/store";

type Data = { tasks: CustomerCareTask[]; orders: OperationsOrderRecord[] };
const taskTypes = ["Issue follow-up", "Feedback request"];
const statuses = ["Open", "Draft ready", "Needs review", "Waiting on customer", "Escalated", "Resolved", "Dismissed"];
const channels = ["Email", "Phone", "WhatsApp"];

function toDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function CustomerCareDesk() {
  const router = useRouter();
  const [data, setData] = useState<Data>({ tasks: [], orders: [] });
  const [asOf, setAsOf] = useState(0);
  const [actor, setActor] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [careResponse, ordersResponse] = await Promise.all([
        fetch("/api/ops/customer-care", { credentials: "same-origin", cache: "no-store" }),
        fetch("/api/ops/orders", { credentials: "same-origin", cache: "no-store" }),
      ]);
      if (careResponse.status === 401 || ordersResponse.status === 401) { setState("unauthorized"); return; }
      const [careBody, ordersBody] = await Promise.all([careResponse.json().catch(() => null), ordersResponse.json().catch(() => null)]);
      if (!careResponse.ok || !Array.isArray(careBody?.tasks) || !ordersResponse.ok || !Array.isArray(ordersBody?.orders)) {
        throw new Error(careBody?.error || ordersBody?.error || "Customer-care data is unavailable.");
      }
      setData({ tasks: careBody.tasks, orders: ordersBody.orders });
      setAsOf(Date.parse(careBody.serverTime) || 0);
      setState("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Customer-care data is unavailable.");
      setState("error");
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/ops/customer-care", { credentials: "same-origin", cache: "no-store" }),
      fetch("/api/ops/orders", { credentials: "same-origin", cache: "no-store" }),
    ]).then(async ([careResponse, ordersResponse]) => {
      if (careResponse.status === 401 || ordersResponse.status === 401) return { unauthorized: true as const };
      const [careBody, ordersBody] = await Promise.all([careResponse.json().catch(() => null), ordersResponse.json().catch(() => null)]);
      if (!careResponse.ok || !Array.isArray(careBody?.tasks) || !ordersResponse.ok || !Array.isArray(ordersBody?.orders)) {
        throw new Error(careBody?.error || ordersBody?.error || "Customer-care data is unavailable.");
      }
        return { data: { tasks: careBody.tasks as CustomerCareTask[], orders: ordersBody.orders as OperationsOrderRecord[] }, asOf: typeof careBody.serverTime === "string" ? Date.parse(careBody.serverTime) || 0 : 0 };
    }).then((result) => {
      if (!active) return;
      if ("unauthorized" in result) setState("unauthorized");
      else { setData(result.data); setAsOf(result.asOf); setState("ready"); }
    }).catch((caught: unknown) => { if (active) { setError(caught instanceof Error ? caught.message : "Customer-care data is unavailable."); setState("error"); } });
    return () => { active = false; };
  }, []);

  async function save(payload: Record<string, unknown>, key: string) {
    if (!actor.trim()) { setError("Enter your name for the customer-care audit log first."); return false; }
    setBusy(key); setError("");
    try {
      const response = await fetch("/api/ops/customer-care", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin",
        body: JSON.stringify({ ...payload, actor: actor.trim() }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Customer-care task could not be saved.");
      await load();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Customer-care task could not be saved.");
      return false;
    } finally { setBusy(""); }
  }

  const openCount = data.tasks.filter((task) => !["Resolved", "Dismissed"].includes(task.status)).length;
  const overdueCount = data.tasks.filter((task) => task.due_at && new Date(task.due_at).getTime() < asOf && !["Resolved", "Dismissed"].includes(task.status)).length;
  const escalatedCount = data.tasks.filter((task) => task.status === "Escalated").length;

  return <main className="ops-shell">
    <header className="ops-header">
      <div><p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p><h1>Customer care</h1><p className="ops-muted">Delivery check-ins and issue follow-ups stay in a staff-owned queue. Drafts are not sent from this desk.</p></div>
      <nav className="ops-nav"><Link href="/ops/suppliers">Supplier directory</Link><Link href="/ops/leads">Sales pipeline</Link><Link href="/ops/orders">Orders</Link><Link href="/ops/finance">Finance</Link><Link href="/ops/analytics">Analytics</Link><Link href="/ops/marketing">Marketing consent</Link><Link href="/ops">Supplier checks</Link><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav>
    </header>
    {state === "loading" && <div className="ops-empty"><p>Loading customer-care tasks…</p></div>}
    {state === "unauthorized" && <div className="ops-empty"><h3>Sign in to the operations desk</h3><p>Your session has expired or you have not signed in.</p><Link href="/ops">Go to sign in</Link></div>}
    {state === "error" && <div className="ops-warning" role="alert">{error}</div>}
    {state === "ready" && <>
      <section className="ops-metrics" aria-label="Customer-care queue totals">
        <article><span>Open</span><strong>{openCount}</strong></article>
        <article><span>Overdue tasks</span><strong>{overdueCount}</strong></article>
        <article><span>Escalated</span><strong>{escalatedCount}</strong></article>
      </section>
      <section className="ops-toolbar ops-finance-toolbar">
        <div><h2>New service follow-up</h2><p className="ops-muted">Delivered orders create one check-in task automatically. Add an issue follow-up or feedback request when a person identifies a need.</p></div>
        <label className="ops-reviewer">Your name for this audit log<input value={actor} onChange={(event) => setActor(event.target.value)} maxLength={120} placeholder="Name" /></label>
      </section>
      {error && <div className="ops-error ops-message" role="alert">{error}</div>}
      <NewCareTaskForm orders={data.orders} actor={actor} busy={busy === "new"} onSave={(payload) => save(payload, "new")} />
      <div className="ops-customer-care-note"><strong>Contact and consent:</strong> The WhatsApp opt-in shown on a request applies to that quote request only; it is not marketing consent. Confirm the appropriate service-contact permission before using any channel. This queue has no send action and does not create repeat-order marketing tasks.</div>
      <section className="ops-toolbar ops-orders-heading"><div><h2>Customer-care queue</h2><p className="ops-muted">Every change is recorded with the staff name. Resolved tasks require an outcome note.</p></div></section>
      {data.tasks.length === 0 ? <div className="ops-empty"><h3>No customer-care tasks yet</h3><p>A delivery check-in will appear here after an order reaches Delivered.</p></div> : <section className="ops-check-list" aria-label="Customer-care tasks">
        {data.tasks.map((task) => <CareTaskCard key={task.id} task={task} actor={actor} busy={busy === task.id} onSave={(payload) => save(payload, task.id)} />)}
      </section>}
    </>}
  </main>;
}

function NewCareTaskForm({ orders, actor, busy, onSave }: { orders: OperationsOrderRecord[]; actor: string; busy: boolean; onSave: (payload: Record<string, unknown>) => Promise<boolean> }) {
  const [orderId, setOrderId] = useState("");
  const [taskType, setTaskType] = useState(taskTypes[0]);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const activeOrders = orders.filter((order) => !["Cancelled", "Closed"].includes(order.status));
  return <form className="ops-care-create" onSubmit={async (event) => {
    event.preventDefault();
    const saved = await onSave({ taskId: null, orderId, taskType, title, status: "Open", owner: actor, dueAt: dueAt ? new Date(dueAt).toISOString() : null, contactChannel: null, draftMessage: "", outcome: "" });
    if (saved) { setTitle(""); setDueAt(""); }
  }}>
    <label>Order<select value={orderId} onChange={(event) => setOrderId(event.target.value)} required><option value="">Select an order</option>{activeOrders.map((order) => <option key={order.id} value={order.id}>{order.order_code} · {order.company} · {order.status}</option>)}</select></label>
    <label>Task type<select value={taskType} onChange={(event) => setTaskType(event.target.value)}>{taskTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
    <label>Task title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={300} required placeholder="What should the team follow up on?" /></label>
    <label>Due date<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
    <button type="submit" disabled={busy || !actor.trim() || !orderId}>{busy ? "Adding…" : "Add task"}</button>
    {activeOrders.length === 0 && <p className="ops-warning-inline">No active orders available.</p>}
  </form>;
}

function CareTaskCard({ task, actor, busy, onSave }: { task: CustomerCareTask; actor: string; busy: boolean; onSave: (payload: Record<string, unknown>) => Promise<boolean> }) {
  const [status, setStatus] = useState(task.status);
  const [owner, setOwner] = useState(task.owner || "");
  const [dueAt, setDueAt] = useState(toDateInput(task.due_at));
  const [channel, setChannel] = useState(task.contact_channel || "");
  const [draft, setDraft] = useState(task.draft_message || "");
  const [outcome, setOutcome] = useState(task.outcome || "");
  const saveTask = () => onSave({ taskId: task.id, orderId: null, taskType: null, title: task.title, status, owner,
    dueAt: dueAt ? new Date(dueAt).toISOString() : null, contactChannel: channel || null, draftMessage: draft, outcome });
  return <article className="ops-care-card">
    <div className="ops-finance-record-head"><div><p className="ops-eyebrow">{task.order_code} · {task.task_type} · {task.company}</p><h3>{task.title}</h3><p className="ops-muted">Contact: {task.contact} · {task.email || "No email"} · {task.phone || "No phone"}</p></div><span className={`ops-status ops-status-${task.status.toLowerCase().replaceAll(" ", "-")}`}>{task.status}</span></div>
    {task.original_contact_preference && <p className="ops-warning-inline ops-care-permission">Request preference: {task.original_contact_preference}. WhatsApp opt-in on file for quote updates: {task.quote_whatsapp_opt_in ? "Yes" : "No"}; confirm permission separately before other contact.</p>}
    <div className="ops-care-fields">
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Owner<input value={owner} onChange={(event) => setOwner(event.target.value)} maxLength={120} /></label>
      <label>Next action date<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
      <label>Contact channel<select value={channel} onChange={(event) => setChannel(event.target.value)}><option value="">Choose when reviewed</option>{channels.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="ops-care-wide">Message draft<textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} rows={3} placeholder="Draft only. This system will not send it." /></label>
      <label className="ops-care-wide">Outcome / resolution note<textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} maxLength={2000} rows={2} placeholder={status === "Resolved" ? "Required to resolve" : "Optional until resolved"} /></label>
    </div>
    <div className="ops-lead-save-row"><button type="button" disabled={busy || !actor.trim() || (status === "Draft ready" && (!draft.trim() || !channel)) || (status === "Resolved" && !outcome.trim())} onClick={saveTask}>{busy ? "Saving…" : "Save customer-care task"}</button></div>
    {task.activity.length > 0 && <details className="ops-activity"><summary>Task history · {task.activity.length} change{task.activity.length === 1 ? "" : "s"}</summary><ol>{task.activity.map((event) => <li key={event.id}><time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString()}</time> · {event.event_type} · {event.previous_status ? `${event.previous_status} → ` : ""}{event.new_status} · {event.actor}</li>)}</ol></details>}
  </article>;
}
