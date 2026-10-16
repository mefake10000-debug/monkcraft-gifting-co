/** Packaging options sourced from the exported catalogue snapshot. */
import options from "./packagingOptions.json";
import type { PackagingOption } from "./boxTypes";

export const APPROVED_PACKAGING: PackagingOption[] = options.map((option) => ({
  ...option,
  packagingKind: option.packagingKind as PackagingOption["packagingKind"],
}));

export function hasApprovedPackaging() {
  return APPROVED_PACKAGING.length > 0;
}

export function getPackagingById(id: string): PackagingOption | undefined {
  return APPROVED_PACKAGING.find((item) => item.id === id);
}
