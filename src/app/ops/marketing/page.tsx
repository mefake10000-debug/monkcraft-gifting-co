import { MarketingConsentDesk } from "@/components/ops/MarketingConsentDesk";
import { requireOperationsSession } from "@/lib/automation/requireOperationsSession";
import "../ops.css";

export default async function MarketingPage() {
  await requireOperationsSession();
  return <MarketingConsentDesk />;
}
