import { OrdersDesk } from "@/components/ops/OrdersDesk";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default async function OrdersPage() {
  await requireOperationsSession();
  return <OrdersDesk />;
}
