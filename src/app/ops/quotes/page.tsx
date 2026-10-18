import { connection } from "next/server";
import { Suspense } from "react";
import { QuoteDesk } from "@/components/ops/QuoteDesk";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default function QuotesPage() {
  return <Suspense fallback={<main className="ops-shell"><p className="ops-muted">Loading quote desk…</p></main>}><QuotesContent /></Suspense>;
}

async function QuotesContent() {
  await connection();
  await requireOperationsSession();
  return <QuoteDesk />;
}
