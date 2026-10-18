import type { Product } from "./types";

export type DesignFamily = {
  familyId: string;
  familyCode: string;
  familyName: string;
  optionLabel?: string;
  productIds: string[];
  labels: Record<string, string>;
  allowMissingSpecifications?: string[];
  variantSpecificSpecifications?: string[];
  reviewed: boolean;
  imageReviewed: boolean;
};

function normalize(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function coreSpecificationSignature(product: Product, family: DesignFamily): string {
  const variableLabels = new Set([
    ...family.allowMissingSpecifications ?? [],
    ...family.variantSpecificSpecifications ?? [],
  ].map(normalize));
  return product.attributes
    .filter(({ label }) => !["sku", "product code", "color", "colour", "stock availability", "stock update date", "dispatch timeline", "country of origin"].includes(normalize(label)) && !variableLabels.has(normalize(label)))
    .map(({ label, value }) => [normalize(label), normalize(value)] as const)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, value]) => `${label}:${value}`)
    .join("|");
}

function isSameProductModel(candidate: Product, first: Product, family: DesignFamily): boolean {
  const variableSpecifications = new Set((family.variantSpecificSpecifications ?? []).map(normalize));
  return candidate.categoryId === first.categoryId &&
    candidate.categorySlug === first.categorySlug &&
    candidate.subcategorySlug === first.subcategorySlug &&
    candidate.productTypeId === first.productTypeId &&
    normalize(candidate.brandName) === normalize(first.brandName) &&
    candidate.pricing.kind === first.pricing.kind &&
    (candidate.pricing.kind !== "fixed" || first.pricing.kind !== "fixed" || (
      candidate.pricing.amountInr === first.pricing.amountInr &&
      normalize(candidate.pricing.gstBasis ?? undefined) === normalize(first.pricing.gstBasis ?? undefined)
    )) &&
    (variableSpecifications.has("customization type") || normalize(candidate.customization) === normalize(first.customization)) &&
    coreSpecificationSignature(candidate, family) === coreSpecificationSignature(first, family);
}

/** Resolve only explicitly approved, image-reviewed product designs. */
export function resolveDesignFamily(
  product: Product,
  products: Product[],
  families: DesignFamily[],
): Product[] {
  const family = families.find((candidate) =>
    candidate.reviewed && candidate.imageReviewed && candidate.productIds.includes(product.id),
  );
  if (!family || !family.familyId.trim() || !family.familyCode.trim() || family.productIds.length < 2) return [];
  if (new Set(family.productIds).size !== family.productIds.length) return [];
  if (new Set(family.productIds.map((id) => normalize(family.labels[id]))).size !== family.productIds.length) return [];
  if (family.productIds.some((id) => !family.labels[id]?.trim())) return [];

  const byId = new Map(products.map((item) => [item.id, item]));
  const members = family.productIds.map((id) => byId.get(id));
  if (members.some((member) => !member)) return [];
  const resolved = members as Product[];
  const first = resolved[0];
  for (const optionalLabel of family.allowMissingSpecifications ?? []) {
    const label = normalize(optionalLabel);
    const values = new Set(resolved.flatMap((member) => member.attributes
      .filter((attribute) => normalize(attribute.label) === label)
      .map((attribute) => normalize(attribute.value))
      .filter(Boolean)));
    if (values.size > 1) return [];
  }
  if (resolved.some((member) =>
    !member.images.some((image) => image.src.trim()) || !isSameProductModel(member, first, family)
  )) return [];

  return resolved.map((member) => ({
    ...member,
    designFamilyCode: family.familyCode,
    designFamilyName: family.familyName,
    designFamilyOptionLabel: family.optionLabel ?? "design",
    designOptionLabel: family.labels[member.id],
  }));
}
