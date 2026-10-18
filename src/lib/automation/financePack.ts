import type { QuoteAdjustment, QuoteLine } from "@/lib/automation/quoteWorkflow";

type VyaparPackInput = {
  exportedAt: string;
  order: {
    orderCode: string; requestId: string; acceptedQuoteVersion: string;
    approvalReference: string; customerPoReference: string | null; promisedDeliveryDate: string | null;
  };
  customer: { company: string; contact: string; email: string; phone: string; deliveryLocation: string };
  quote: { version: number; subtotalPaise: number; totalPaise: number; terms: string; lines: QuoteLine[]; adjustments: QuoteAdjustment[] };
};

export function buildVyaparEntryPack(input: VyaparPackInput) {
  return {
    schema: "monkcraft.vyapar-entry-pack.v1",
    exportedAt: input.exportedAt,
    integrationStatus: "Staff must enter and verify this information in Vyapar.",
    vyaparImportCompatible: false,
    order: {
      orderCode: input.order.orderCode,
      requestId: input.order.requestId,
      acceptedQuoteVersion: input.order.acceptedQuoteVersion,
      customerApprovalReference: input.order.approvalReference,
      customerPoReference: input.order.customerPoReference,
      promisedDeliveryDate: input.order.promisedDeliveryDate,
    },
    customer: {
      company: input.customer.company,
      contact: input.customer.contact,
      email: input.customer.email || null,
      phone: input.customer.phone || null,
      deliveryLocation: input.customer.deliveryLocation || null,
      billingAddress: null,
      gstin: null,
    },
    lineItems: input.quote.lines.map((line) => ({
      productId: line.productId,
      description: line.description,
      quantity: line.quantity,
      unitPriceINR: line.unitPricePaise / 100,
      lineAmountINR: Math.round(line.quantity * line.unitPricePaise) / 100,
    })),
    adjustments: input.quote.adjustments.map((adjustment) => ({
      label: adjustment.label,
      amountINR: adjustment.amountPaise / 100,
      classification: "Staff-entered amount; finance must choose the correct Vyapar category.",
    })),
    subtotalINR: input.quote.subtotalPaise / 100,
    totalINR: input.quote.totalPaise / 100,
    quoteTerms: input.quote.terms,
    taxInstruction: "Do not infer or copy tax treatment from this pack. Confirm the applicable GST, HSN/SAC, place of supply, and invoice rules with the authorized finance owner before creating a tax document.",
    manualReviewRequired: [
      "Confirm seller GSTIN, registered business address, and invoice series in Vyapar.",
      "Confirm customer GSTIN, billing address, state, and place of supply.",
      "Confirm product HSN/SAC, GST treatment, and whether each named adjustment is taxable.",
      "Confirm the correct Vyapar document type, date, payment terms, and any amount rounding.",
    ],
    warning: "This is an internal entry aid, not an invoice, tax calculation, stock confirmation, payment instruction, or Vyapar import file.",
  };
}
