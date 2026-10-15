import type { StudioProductSummary } from "@/data/catalogue/studioTypes";
import type { StoreVariantSelection } from "@/data/companyStore/types";

const VARIANT_LABEL = /^(size|sizes|colour|color|fit)$/i;

/**
 * Only expose selectable options when export data contains multiple values
 * (comma / slash / pipe separated). Never invent S/M/L charts.
 */
export function extractSelectableVariants(
  attributes: { label: string; value: string }[],
): { label: string; options: string[] }[] {
  const result: { label: string; options: string[] }[] = [];
  for (const attr of attributes) {
    if (!VARIANT_LABEL.test(attr.label)) continue;
    const options = attr.value
      .split(/[,|/]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (options.length > 1) {
      result.push({ label: attr.label, options });
    }
  }
  return result;
}

/** Display-only attributes (single values) for product detail. */
export function displayAttributes(
  attributes: { label: string; value: string }[],
): { label: string; value: string }[] {
  return attributes.filter((attr) => {
    if (!VARIANT_LABEL.test(attr.label)) return true;
    const options = attr.value
      .split(/[,|/]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    return options.length <= 1;
  });
}

export function variantsComplete(
  product: StudioProductSummary,
  selected: StoreVariantSelection[],
): boolean {
  const required = extractSelectableVariants(product.attributes);
  return required.every((group) =>
    selected.some(
      (s) => s.label === group.label && group.options.includes(s.value),
    ),
  );
}
