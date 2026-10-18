import {
  claimSupplierCheckPreparation,
  finishSupplierCheckPreparation,
  prepareSupplierChecks,
  type SupplierCheckRecord,
} from "@/lib/automation/store";

export type SupplierPreparationResult =
  | { status: "prepared"; checkCount: number; mappingExceptions: number; checks: SupplierCheckRecord[] }
  | { status: "failed" | "empty" };

/**
 * Turn a durable quote request into idempotent supplier-check drafts. These
 * records are internal work only; this function cannot send WhatsApp messages.
 */
export async function prepareQuoteSupplierChecks(requestId?: string): Promise<SupplierPreparationResult> {
  let claim: Awaited<ReturnType<typeof claimSupplierCheckPreparation>>;
  try {
    claim = await claimSupplierCheckPreparation(requestId);
  } catch {
    return { status: "failed" };
  }
  const job = Array.isArray(claim) ? claim[0] : undefined;
  if (!job) return { status: "empty" };

  try {
    const checks = await prepareSupplierChecks(job.request_id);
    await finishSupplierCheckPreparation(job.outbox_id);
    return {
      status: "prepared",
      checkCount: checks.length,
      mappingExceptions: checks.filter((check) => check.supplier_id === null).length,
      checks,
    };
  } catch {
    await finishSupplierCheckPreparation(job.outbox_id, "supplier_check_preparation_failed").catch(() => undefined);
    return { status: "failed" };
  }
}
