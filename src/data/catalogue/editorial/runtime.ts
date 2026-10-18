import descriptions from "./product-descriptions.json";
import bundleContents from "./bundle-contents.json";

const reviewedDescriptionById = new Map(
  descriptions
    .filter((entry) => entry.reviewed === true)
    .map((entry) => [entry.productId, entry.description]),
);

const reviewedBundleContentsById = new Map(
  bundleContents
    .filter((entry) => entry.reviewed === true)
    .map((entry) => [entry.productId, entry.contents]),
);

export function getReviewedProductDescription(productId: string): string | undefined {
  return reviewedDescriptionById.get(productId);
}

export function getReviewedBundleContents(productId: string): string[] {
  return reviewedBundleContentsById.get(productId) ?? [];
}
