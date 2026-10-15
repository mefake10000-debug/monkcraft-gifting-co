import type { ProductPricing } from "@/data/catalogue/types";

export function formatInrAmount(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPricing(pricing: ProductPricing): string {
  if (pricing.kind === "quote") {
    return pricing.label ?? "Quote on request";
  }
  const formatted = formatInrAmount(pricing.amountInr);
  return pricing.label ? `${formatted} · ${pricing.label}` : formatted;
}

/** Map catalogue GST enum tokens to customer-facing labels (audit D02). */
export function formatGstBasis(
  gstBasis: string | null | undefined,
): string | null {
  if (!gstBasis) return null;
  const key = gstBasis.trim().toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, string> = {
    GST_EXCL: "excl. GST",
    GST_INCL: "incl. GST",
    EXCL: "excl. GST",
    INCL: "incl. GST",
    EXCLUSIVE: "excl. GST",
    INCLUSIVE: "incl. GST",
  };
  if (map[key]) return map[key];
  // Fall back to readable text rather than raw enums like GST_EXCL
  return gstBasis.replace(/_/g, " ").toLowerCase();
}
