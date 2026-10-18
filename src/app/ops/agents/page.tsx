import { AgentReviewDesk } from "@/components/ops/AgentReviewDesk";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default async function AgentReviewPage() {
  await requireOperationsSession();
  return <AgentReviewDesk />;
}
