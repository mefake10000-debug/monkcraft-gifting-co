import { MarketingContentDesk } from "@/components/ops/MarketingContentDesk";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default async function MarketingContentPage() {
  await requireOperationsSession();
  return <MarketingContentDesk />;
}
