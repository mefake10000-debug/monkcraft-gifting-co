import type { CataloguePricingMode } from "@/data/catalogue/studioTypes";
import { formatInrAmount } from "@/lib/pricing";

export type DisplayedPrice = {
  label: string;
  kind: "priced" | "quote" | "hidden";
};

/**
 * Derive a displayed price from a verified catalogue base only.
 * Never invents a base amount — unpriced products stay quote-based or omitted.
 */
export function computeDisplayedPrice(
  amountInr: number | undefined,
  mode: CataloguePricingMode,
  markupValue: number,
): DisplayedPrice {
  if (mode === "hide") {
    return { label: "", kind: "hidden" };
  }

  if (typeof amountInr !== "number" || !Number.isFinite(amountInr)) {
    return { label: "Quote on request", kind: "quote" };
  }

  if (mode === "base") {
    return { label: formatInrAmount(amountInr), kind: "priced" };
  }

  if (mode === "markup-fixed") {
    const shown = amountInr + Math.max(0, markupValue);
    return {
      label: formatInrAmount(shown),
      kind: "priced",
    };
  }

  // markup-percent
  const pct = Math.max(0, markupValue);
  const shown = amountInr * (1 + pct / 100);
  return {
    label: formatInrAmount(shown),
    kind: "priced",
  };
}
