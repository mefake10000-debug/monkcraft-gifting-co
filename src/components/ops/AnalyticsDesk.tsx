"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OperationsAnalytics } from "@/lib/automation/store";

export function AnalyticsDesk() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<OperationsAnalytics | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unauthorized" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/ops/analytics", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) return { unauthorized: true as const };
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.analytics) throw new Error(body?.error || "Analytics are unavailable.");
        return { analytics: body.analytics as OperationsAnalytics };
      })
      .then((result) => {
        if (!active) return;
        if ("unauthorized" in result) setState("unauthorized");
        else { setAnalytics(result.analytics); setState("ready"); }
      })
      .catch((caught: unknown) => { if (active) { setError(caught instanceof Error ? caught.message : "Analytics are unavailable."); setState("error"); } });
    return () => { active = false; };
  }, []);

  return <main className="ops-shell">
    <header className="ops-header">
      <div><p className="ops-eyebrow">MONKCRAFT · INTERNAL WORKSPACE</p><h1>Business analytics</h1><p className="ops-muted">A compact operating view of enquiry cohorts, supplier responsiveness, fulfilment risk, and Vyapar reconciliation.</p></div>
      <nav className="ops-nav"><Link href="/ops/exceptions">Exceptions</Link><Link href="/ops/suppliers">Supplier directory</Link><Link href="/ops/leads">Sales pipeline</Link><Link href="/ops/orders">Orders</Link><Link href="/ops/finance">Finance</Link><Link href="/ops/content">Content</Link><Link href="/ops/marketing">Marketing consent</Link><Link href="/ops">Supplier checks</Link><button className="ops-button ops-button-quiet" type="button" onClick={async () => { await fetch("/api/ops/session", { method: "DELETE", credentials: "same-origin" }); router.push("/ops"); }}>Sign out</button></nav>
    </header>
    {state === "loading" && <div className="ops-empty"><p>Loading business metrics…</p></div>}
    {state === "unauthorized" && <div className="ops-empty"><h3>Sign in to the operations desk</h3><p>Your session has expired or you have not signed in.</p><Link href="/ops">Go to sign in</Link></div>}
    {state === "error" && <div className="ops-warning" role="alert">{error}</div>}
    {state === "ready" && analytics && <>
      <section className="ops-metrics ops-analytics-metrics" aria-label="Business overview">
        <article><span>Enquiries · last 30 days</span><strong>{analytics.enquiriesLast30Days}</strong></article>
        <article><span>Active email opt-ins</span><strong>{analytics.marketing.activeEmailOptIns}</strong></article>
        <article><span>Active orders</span><strong>{analytics.fulfillment.activeOrders}</strong></article>
        <article><span>Overdue milestones</span><strong>{analytics.fulfillment.overdueMilestones}</strong></article>
        <article><span>Finance exceptions</span><strong>{exceptionCount(analytics.finance.byStatus)}</strong></article>
      </section>
      <section className="ops-analytics-grid">
        <AnalyticsPanel title="Lead pipeline · recent cohort" description="Enquiries created in the last 30 days, grouped by their current status.">
          <BarList rows={analytics.leadPipeline.map((row) => ({ label: row.status, value: row.count }))} empty="No enquiry records yet." />
        </AnalyticsPanel>
        <AnalyticsPanel title="Enquiry sources · recent cohort" description="Source attribution recorded on submitted quote requests.">
          <BarList rows={analytics.leadSources.map((row) => ({ label: row.source, value: row.count }))} empty="No attributed enquiries yet." />
        </AnalyticsPanel>
        <AnalyticsPanel title="Campaign outcomes" description="Last-touch campaign recorded on submitted quote requests; Won is the lead’s current state.">
          {analytics.marketing.campaigns.length ? <div className="ops-analytics-table-wrap"><table className="ops-analytics-table"><thead><tr><th>Campaign</th><th>Source</th><th>Medium</th><th>Requests</th><th>Won</th><th>Orders</th></tr></thead><tbody>{analytics.marketing.campaigns.map((campaign) => <tr key={`${campaign.source}:${campaign.medium}:${campaign.campaign}`}><th scope="row">{campaign.campaign}</th><td>{campaign.source}</td><td>{campaign.medium}</td><td>{campaign.requests}</td><td>{campaign.won}</td><td>{campaign.orders}</td></tr>)}</tbody></table></div> : <p className="ops-analytics-empty">Campaign and enquiry data is not available yet.</p>}
        </AnalyticsPanel>
        <AnalyticsPanel title="Supplier response" description="Replies divided by checks sent; response time uses captured supplier reply timestamps.">
          {analytics.supplierPerformance.length ? <div className="ops-analytics-table-wrap"><table className="ops-analytics-table"><thead><tr><th>Supplier</th><th>Replied / sent</th><th>Response</th><th>Avg hours</th><th>Mapping issues</th></tr></thead><tbody>{analytics.supplierPerformance.map((supplier) => <tr key={supplier.supplier}><th scope="row">{supplier.supplier}</th><td>{supplier.replied} / {supplier.sent}</td><td>{supplier.responseRate === null ? "—" : `${supplier.responseRate}%`}</td><td>{supplier.avgResponseHours === null ? "—" : supplier.avgResponseHours}</td><td>{supplier.mappingExceptions}</td></tr>)}</tbody></table></div> : <p className="ops-analytics-empty">No supplier checks yet.</p>}
        </AnalyticsPanel>
        <AnalyticsPanel title="Fulfilment risk" description="Orders with a late milestone or a passed promised date and unfinished status.">
          {analytics.fulfillment.atRiskOrders.length ? <div className="ops-analytics-table-wrap"><table className="ops-analytics-table"><thead><tr><th>Order</th><th>Status</th><th>Promised</th><th>Late stages</th></tr></thead><tbody>{analytics.fulfillment.atRiskOrders.map((order) => <tr key={order.orderCode}><th scope="row">{order.orderCode}</th><td>{order.status}</td><td>{order.promisedDeliveryDate || "—"}</td><td>{order.overdueMilestones}</td></tr>)}</tbody></table></div> : <p className="ops-analytics-empty">No overdue or at-risk orders.</p>}
        </AnalyticsPanel>
        <AnalyticsPanel title="Vyapar reconciliation" description="Documents recorded by staff. Differences remain exceptions until reviewed and corrected.">
          <BarList rows={analytics.finance.byStatus.map((row) => ({ label: row.status, value: row.count }))} empty="No documents recorded yet." />
          <p className="ops-analytics-footnote">Sum of recorded absolute amount gaps for mismatch and review exceptions: {formatAmount(analytics.finance.exceptionAmountGap)}. This is an exception indicator, not a balance or tax figure.</p>
        </AnalyticsPanel>
      </section>
      <p className="ops-footnote">Campaign outcomes use only tagged attribution on submitted quotes; they do not measure impressions, spend, or anonymous page traffic. Customer service, cash collection, margins, and on-time delivery rates remain unreported until their source records and definitions are approved. Metrics are operational indicators, not accounting or tax statements.</p>
    </>}
  </main>;
}

function AnalyticsPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="ops-analytics-panel"><header><h2>{title}</h2><p>{description}</p></header>{children}</section>;
}

function BarList({ rows, empty }: { rows: Array<{ label: string; value: number }>; empty: string }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  if (!rows.length) return <p className="ops-analytics-empty">{empty}</p>;
  return <ol className="ops-bar-list">{rows.map((row) => <li key={row.label}><div><span>{row.label}</span><strong>{row.value}</strong></div><span className="ops-bar-track"><span style={{ width: `${Math.max(row.value ? 4 : 0, row.value / max * 100)}%` }} /></span></li>)}</ol>;
}

function exceptionCount(rows: Array<{ status: string; count: number }>) {
  return rows.filter((row) => ["Mismatch", "Needs review"].includes(row.status)).reduce((total, row) => total + row.count, 0);
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}
