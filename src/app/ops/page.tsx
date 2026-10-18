import { cookies } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { OpsConsole } from "@/components/ops/OpsConsole";
import { listSupplierChecksForOperations } from "@/lib/automation/store";
import { OPS_SESSION_COOKIE, verifyOperationsSession } from "@/lib/automation/opsSession";
import "./ops.css";

export default function OperationsPage() {
  return <Suspense fallback={<main className="ops-shell"><p className="ops-muted">Loading operations desk…</p></main>}><OperationsContent /></Suspense>;
}

async function OperationsContent() {
  await connection();
  const secret = process.env.MONKCRAFT_OPS_API_SECRET?.trim() || "";
  const cookieStore = await cookies();
  const session = cookieStore.get(OPS_SESSION_COOKIE)?.value || "";
  const authenticated = verifyOperationsSession(session, secret);

  if (!authenticated) return <OpsConsole mode="login" />;

  let checks: Awaited<ReturnType<typeof listSupplierChecksForOperations>> = [];
  let storageUnavailable = false;
  try { checks = await listSupplierChecksForOperations(); }
  catch { storageUnavailable = true; }
  return <OpsConsole mode="dashboard" initialChecks={checks} storageUnavailable={storageUnavailable} />;
}
