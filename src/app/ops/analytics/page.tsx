import { AnalyticsDesk } from "@/components/ops/AnalyticsDesk";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default async function AnalyticsPage() {
  await requireOperationsSession();
  return <AnalyticsDesk />;
}
