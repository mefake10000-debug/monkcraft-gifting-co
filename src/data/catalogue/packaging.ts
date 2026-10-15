/**
 * Packaging options for Build a Box.
 * Populate APPROVED_PACKAGING only with verified Monkcraft packaging data.
 * Until then, buyers can proceed with an honest "pending" choice.
 */

import type { PackagingOption } from "./boxTypes";

/** Verified packaging SKUs — keep empty until real data is supplied. */
export const APPROVED_PACKAGING: PackagingOption[] = [];

export const PACKAGING_PENDING_ID = "packaging-to-be-confirmed";

/**
 * Indicative packaging-style artwork already in the media export.
 * Not selectable SKUs — shown as conceptual reference only until
 * APPROVED_PACKAGING is populated with verified product photos.
 */
export type PackagingConceptPreview = {
  id: string;
  label: string;
  src: string;
};

export const PACKAGING_CONCEPT_PREVIEWS: PackagingConceptPreview[] = [
  {
    id: "concept-rigid-gift-box",
    label: "Rigid gift box",
    src: "/catalogue-media/packaging/illustrations/rigid-gift-box.svg",
  },
  {
    id: "concept-kraft-paper-pack",
    label: "Kraft paper pack",
    src: "/catalogue-media/packaging/illustrations/kraft-paper-pack.svg",
  },
  {
    id: "concept-reusable-tote",
    label: "Reusable tote",
    src: "/catalogue-media/packaging/illustrations/reusable-tote.svg",
  },
];

export function hasApprovedPackaging() {
  return APPROVED_PACKAGING.length > 0;
}

export function getPackagingById(id: string): PackagingOption | undefined {
  return APPROVED_PACKAGING.find((item) => item.id === id);
}
