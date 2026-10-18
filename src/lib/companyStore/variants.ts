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

/** Prefer only colour options that have an exact, source-linked product photo. */
export function extractProductVariants(
  product: StudioProductSummary,
): { label: string; options: string[] }[] {
  const attributeGroups = extractSelectableVariants(product.attributes);
  const imageVariants = product.imageVariants ?? [];
  if (imageVariants.length < 2) return attributeGroups;

  const colourGroup = attributeGroups.find((group) =>
    /^(colour|color)$/i.test(group.label),
  );
  return [
    ...attributeGroups.filter((group) => !/^(colour|color)$/i.test(group.label)),
    {
      label: colourGroup?.label ?? "Colour",
      options: imageVariants.map((variant) => variant.label),
    },
  ];
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
  const required = extractProductVariants(product);
  return required.every((group) =>
    selected.some(
      (s) => s.label === group.label && group.options.includes(s.value),
    ),
  );
}
