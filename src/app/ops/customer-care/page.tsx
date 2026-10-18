import { CustomerCareDesk } from "@/components/ops/CustomerCareDesk";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default async function CustomerCarePage() {
  await requireOperationsSession();
  return <CustomerCareDesk />;
}
