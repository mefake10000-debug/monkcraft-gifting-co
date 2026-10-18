import { ExceptionsDesk } from "@/components/ops/ExceptionsDesk";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default async function ExceptionsPage() {
  await requireOperationsSession();
  return <ExceptionsDesk />;
}
