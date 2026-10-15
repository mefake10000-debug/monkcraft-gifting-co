"use client";

/**
 * Persist Smart Gift Finder requirements across navigation and refresh.
 * Separate from brief storage; sync into unified brief via briefBridge.
 */

import { parseBudgetInr } from "./budget";
import {
  emptyGiftFinderRequirements,
  GIFT_FINDER_SCHEMA_VERSION,
  type GiftFinderRequirements,
} from "./types";

const STORAGE_KEY = "monkcraft-gift-finder-v1";
export const GIFT_FINDER_EVENT = "monkcraft:gift-finder";

/** Stable empty snapshot for SSR / useSyncExternalStore getServerSnapshot. */
export const EMPTY_GIFT_FINDER_SNAPSHOT: GiftFinderRequirements =
  emptyGiftFinderRequirements();

/** Cached client snapshot — same reference until storage changes. */
let cachedDraft: GiftFinderRequirements = EMPTY_GIFT_FINDER_SNAPSHOT;
let cachedRaw: string | null | undefined = undefined;

function emit() {
  window.dispatchEvent(new CustomEvent(GIFT_FINDER_EVENT));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalize(raw: Partial<GiftFinderRequirements>): GiftFinderRequirements {
  const budgetLabel = String(raw.budgetPerRecipientLabel ?? "");
  const parsed =
    typeof raw.budgetPerRecipientInr === "number" &&
    Number.isFinite(raw.budgetPerRecipientInr) &&
    raw.budgetPerRecipientInr > 0
      ? Math.floor(raw.budgetPerRecipientInr)
      : parseBudgetInr(budgetLabel);

  return {
    schemaVersion: GIFT_FINDER_SCHEMA_VERSION,
    occasionIds: asStringArray(raw.occasionIds),
    audience: String(raw.audience ?? ""),
    recipientCount: String(raw.recipientCount ?? ""),
    budgetPerRecipientInr: parsed,
    budgetTotalInr:
      typeof raw.budgetTotalInr === "number" &&
      Number.isFinite(raw.budgetTotalInr) &&
      raw.budgetTotalInr > 0
        ? Math.floor(raw.budgetTotalInr)
        : null,
    budgetPerRecipientLabel: budgetLabel,
    categorySlugs: asStringArray(raw.categorySlugs),
    preferenceKeywords: asStringArray(raw.preferenceKeywords),
    brandingPreference: String(raw.brandingPreference ?? ""),
    brandingNotes: String(raw.brandingNotes ?? ""),
    packagingNotes: String(raw.packagingNotes ?? ""),
    deliveryDate: String(raw.deliveryDate ?? ""),
    deliveryLocation: String(raw.deliveryLocation ?? ""),
    specialInstructions: String(raw.specialInstructions ?? ""),
    freeText: String(raw.freeText ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
  };
}

export function readGiftFinderDraft(): GiftFinderRequirements {
  if (typeof window === "undefined") return EMPTY_GIFT_FINDER_SNAPSHOT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedDraft;
    if (!raw) {
      cachedRaw = null;
      cachedDraft = EMPTY_GIFT_FINDER_SNAPSHOT;
      return cachedDraft;
    }
    cachedRaw = raw;
    cachedDraft = normalize(JSON.parse(raw) as Partial<GiftFinderRequirements>);
    return cachedDraft;
  } catch {
    cachedRaw = null;
    cachedDraft = EMPTY_GIFT_FINDER_SNAPSHOT;
    return cachedDraft;
  }
}

export function writeGiftFinderDraft(
  draft: GiftFinderRequirements,
): GiftFinderRequirements {
  if (typeof window === "undefined") return draft;
  const next = normalize({
    ...draft,
    updatedAt: new Date().toISOString(),
  });
  const serialized = JSON.stringify(next);
  window.localStorage.setItem(STORAGE_KEY, serialized);
  cachedRaw = serialized;
  cachedDraft = next;
  emit();
  return next;
}

export function patchGiftFinderDraft(
  patch: Partial<GiftFinderRequirements>,
): GiftFinderRequirements {
  const current = readGiftFinderDraft();
  return writeGiftFinderDraft({ ...current, ...patch });
}

export function clearGiftFinderDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  cachedRaw = null;
  cachedDraft = EMPTY_GIFT_FINDER_SNAPSHOT;
  emit();
}

export function giftFinderHasRequirements(
  draft?: GiftFinderRequirements,
): boolean {
  const d = draft ?? readGiftFinderDraft();
  return Boolean(
    d.occasionIds.length ||
      d.audience.trim() ||
      d.recipientCount.trim() ||
      d.budgetPerRecipientInr != null ||
      d.budgetPerRecipientLabel.trim() ||
      d.categorySlugs.length ||
      d.preferenceKeywords.length ||
      d.brandingPreference.trim() ||
      d.brandingNotes.trim() ||
      d.packagingNotes.trim() ||
      d.deliveryDate.trim() ||
      d.deliveryLocation.trim() ||
      d.specialInstructions.trim() ||
      d.freeText.trim(),
  );
}

/**
 * When opening the finder, prefer empty finder fields filled from the
 * unified brief so buyers do not re-enter occasion / budget / qty.
 */
export function mergeBriefIntoFinderDraft(
  brief: {
    occasion?: string;
    audience?: string;
    recipientCount?: string;
    budgetPerRecipient?: string;
    branding?: string;
    packagingPrefs?: string;
    deliveryDate?: string;
    deliveryLocation?: string;
    notes?: string;
  },
  occasionIdByLabel: Map<string, string>,
): GiftFinderRequirements {
  const current = readGiftFinderDraft();
  if (giftFinderHasRequirements(current)) return current;

  const occasionLabel = (brief.occasion ?? "").trim().toLowerCase();
  let occasionIds = current.occasionIds;
  if (occasionIds.length === 0 && occasionLabel) {
    const exact = occasionIdByLabel.get(occasionLabel);
    if (exact) occasionIds = [exact];
  }

  const budgetLabel =
    current.budgetPerRecipientLabel ||
    String(brief.budgetPerRecipient ?? "");

  return writeGiftFinderDraft({
    ...current,
    occasionIds,
    audience: current.audience || String(brief.audience ?? ""),
    recipientCount:
      current.recipientCount || String(brief.recipientCount ?? ""),
    budgetPerRecipientLabel: budgetLabel,
    budgetPerRecipientInr: parseBudgetInr(budgetLabel),
    brandingNotes: current.brandingNotes || String(brief.branding ?? ""),
    packagingNotes:
      current.packagingNotes || String(brief.packagingPrefs ?? ""),
    deliveryDate: current.deliveryDate || String(brief.deliveryDate ?? ""),
    deliveryLocation:
      current.deliveryLocation || String(brief.deliveryLocation ?? ""),
    specialInstructions:
      current.specialInstructions || String(brief.notes ?? ""),
  });
}
