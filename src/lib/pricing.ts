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
