import { FinanceDesk } from "@/components/ops/FinanceDesk";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default async function FinancePage() {
  await requireOperationsSession();
  return <FinanceDesk />;
}
