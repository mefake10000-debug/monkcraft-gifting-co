"use client";

/**
 * Sync Smart Gift Finder requirements into the unified My Gifting Brief.
 * Uses merge-nonempty so we do not wipe sibling Studio/Box sources.
 */

import { patchBrief, readBrief, type BriefPatch } from "@/lib/brief";
import type { GiftFinderRequirements } from "./types";

function brandingLine(req: GiftFinderRequirements): string {
  const parts: string[] = [];
  if (req.brandingPreference === "none") parts.push("No branding needed");
  if (req.brandingPreference === "logo") parts.push("Company logo branding");
  if (req.brandingPreference === "print") {
    parts.push("Print / embroidery / engraving");
  }
  if (req.brandingPreference === "undecided") {
    parts.push("Branding undecided");
  }
  if (req.brandingNotes.trim()) parts.push(req.brandingNotes.trim());
  return parts.join(" — ");
}

export type OccasionLabelLookup = { id: string; label: string }[];

/**
 * Push finder requirements into the unified brief (merge-safe).
 * Pass occasionFacets from the page so labels stay accurate.
 */
export function syncGiftFinderToBrief(
  req: GiftFinderRequirements,
  occasionFacets: OccasionLabelLookup = [],
  options?: { fieldMode?: BriefPatch["fieldMode"] },
) {
  let occasion = "";
  if (req.occasionIds.length > 0) {
    const labels = req.occasionIds.map(
      (id) => occasionFacets.find((f) => f.id === id)?.label ?? id,
    );
    occasion = labels.join(", ");
  }

  const notesParts: string[] = [];
  if (req.freeText.trim()) {
    notesParts.push(`Gift finder notes: ${req.freeText.trim()}`);
  }
  if (req.specialInstructions.trim()) {
    notesParts.push(req.specialInstructions.trim());
  }
  if (req.preferenceKeywords.length > 0) {
    notesParts.push(`Preferences: ${req.preferenceKeywords.join(", ")}`);
  }

  const budgetLabel =
    req.budgetPerRecipientLabel.trim() ||
    (req.budgetPerRecipientInr != null
      ? `₹${req.budgetPerRecipientInr.toLocaleString("en-IN")}`
      : "");

  return patchBrief({
    occasion: occasion || undefined,
    audience: req.audience || undefined,
    recipientCount: req.recipientCount || undefined,
    budgetPerRecipient: budgetLabel || undefined,
    branding: brandingLine(req) || undefined,
    packagingPrefs: req.packagingNotes || undefined,
    deliveryDate: req.deliveryDate || undefined,
    deliveryLocation: req.deliveryLocation || undefined,
    notes: notesParts.length ? notesParts.join("\n") : undefined,
    fieldMode: options?.fieldMode ?? "merge-nonempty",
  });
}

export function readBriefForFinderSeed() {
  return readBrief();
}
