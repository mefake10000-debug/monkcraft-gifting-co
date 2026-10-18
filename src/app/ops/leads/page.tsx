import { SalesQueue } from "@/components/ops/SalesQueue";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default async function SalesPipelinePage() {
  await requireOperationsSession();
  return <SalesQueue />;
}
