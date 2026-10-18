import type { QuoteLine, SupplierMapping } from "@/lib/automation/blueprint";

export type SupplierCheckDraft = {
  supplierId: string | null;
  status: "Draft" | "Needs mapping";
  productIds: string[];
  totalUnits: number;
  /** Draft generation never implies permission or readiness to send externally. */
  canSendWhatsApp: false;
};

function positiveQuantity(value: QuoteLine["quantity"]): number {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  if (typeof value !== "string") return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Group SKU lines into supplier-check drafts. Unmapped products remain visible
 * as an operations exception; none of these drafts can send a WhatsApp message.
 */
export function buildSupplierCheckDrafts(lines: QuoteLine[], mappings: SupplierMapping[]): SupplierCheckDraft[] {
  const mappingByProductId = new Map(mappings.map((mapping) => [mapping.productId, mapping]));
  const grouped = new Map<string, SupplierCheckDraft>();
  let unmapped: SupplierCheckDraft | null = null;

  for (const line of lines) {
    const productId = line.id?.trim();
    const supplierId = productId ? mappingByProductId.get(productId)?.supplierId : undefined;
    const draft = supplierId
      ? (grouped.get(supplierId) ?? { supplierId, status: "Draft" as const, productIds: [], totalUnits: 0, canSendWhatsApp: false as const })
      : (unmapped ??= { supplierId: null, status: "Needs mapping", productIds: [], totalUnits: 0, canSendWhatsApp: false });
    if (productId) draft.productIds.push(productId);
    draft.totalUnits += positiveQuantity(line.quantity);
    if (supplierId) grouped.set(supplierId, draft);
  }

  return [...grouped.values(), ...(unmapped ? [unmapped] : [])];
}
