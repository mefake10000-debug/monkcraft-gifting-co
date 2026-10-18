import type { Product } from "./types";

export type ColourFamily = {
  familyId: string;
  familyCode: string;
  productIds: string[];
  reviewed: boolean;
  imageReviewed: boolean;
  /** Manually reviewed source-title wording difference, with the exact SKU and rationale recorded. */
  titleExceptions?: { productId: string; reason: string }[];
  optionLabels?: Record<string, string>;
  /** Source fields may be absent for some variants, but any supplied values must agree. */
  allowMissingSpecifications?: string[];
  sharedImagePath?: string;
  sharedImageFileName?: string;
};

function normalizedProductName(product: Product, verifiedOptionLabel?: string): string {
  const labelMatchesTitle = Boolean(
    verifiedOptionLabel && product.name.toLocaleLowerCase().includes(verifiedOptionLabel.toLocaleLowerCase()),
  );
  const colour = (labelMatchesTitle ? verifiedOptionLabel : product.colours[0])?.trim();
  const withoutColour = colour
    ? product.name.replace(
        new RegExp(`(?<![a-z0-9])${colour.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-z0-9])`, "ig"),
        " ",
      )
    : product.name;
  return withoutColour.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

/** Count colour choices in an approved family; stock is shown per choice. */
export function countAvailableColours(products: Pick<Product, "availabilityStatus">[]): number {
  return products.filter((product) => product.availabilityStatus === "IN_STOCK").length;
}

/** Return only complete, reviewed, unambiguous families of like products. */
export function resolveColourFamily(
  product: Product,
  products: Product[],
  families: ColourFamily[],
): Product[] {
  const family = families.find(
    (candidate) => candidate.reviewed && candidate.imageReviewed && candidate.productIds.includes(product.id),
  );
  if (!family || !family.familyId.trim() || family.productIds.length < 2) return [];
  if (new Set(family.productIds).size !== family.productIds.length) return [];
  const titleExceptionIds = new Set(family.titleExceptions?.map((exception) => exception.productId) ?? []);

  const byId = new Map(products.map((item) => [item.id, item]));
  const members = family.productIds.map((id) => byId.get(id));
  if (members.some((member) => !member)) return [];
  const resolved = members as Product[];
  const first = resolved[0];
  const optionLabelById = family.optionLabels ?? {};
  if (resolved.some((member) =>
    member.categoryId !== first.categoryId ||
    member.categorySlug !== first.categorySlug ||
    member.subcategorySlug !== first.subcategorySlug ||
    (normalizedProductName(member, optionLabelById[member.id]) !== normalizedProductName(first, optionLabelById[first.id]) && !titleExceptionIds.has(member.id)) ||
    (member.brandName ?? "").trim().toLocaleLowerCase() !== (first.brandName ?? "").trim().toLocaleLowerCase() ||
    member.colours.length !== 1 ||
    !member.colours[0].trim()
  )) return [];

  const normalizedColours = resolved.map((member) =>
    (optionLabelById[member.id] || member.colours[0]).trim().toLocaleLowerCase(),
  );
  if (new Set(normalizedColours).size !== resolved.length) return [];
  return resolved.sort((a, b) =>
    (optionLabelById[a.id] || a.colours[0]).localeCompare(optionLabelById[b.id] || b.colours[0]),
  );
}
