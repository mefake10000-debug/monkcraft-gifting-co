"use client";

/**
 * Product comparison — local, browser-only, no account required.
 * Stores lightweight snapshots (identity + display fields) capped at
 * MAX_COMPARE products. Full comparison attributes are resolved server-side
 * on /gifts/compare from the product slugs, so we never bundle the catalogue
 * into the client.
 */

export const COMPARE_EVENT = "monkcraft:compare";
export const MAX_COMPARE = 4;

const STORAGE_KEY = "monkcraft-compare-v1";

export type CompareItem = {
  id: string;
  slug: string;
  name: string;
  imageSrc?: string;
  priceLabel: string;
  categoryName?: string;
};

export type CompareSnapshot = Omit<CompareItem, "id" | "slug" | "name"> & {
  id: string;
  slug: string;
  name: string;
};

function emit() {
  window.dispatchEvent(new CustomEvent(COMPARE_EVENT));
}

function isItem(value: unknown): value is CompareItem {
  if (!value || typeof value !== "object") return false;
  const item = value as CompareItem;
  return (
    typeof item.id === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.priceLabel === "string"
  );
}

export function readCompare(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isItem).slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

export function writeCompare(items: CompareItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_COMPARE)),
    );
  } catch {
    /* storage unavailable — compare stays session-only */
  }
  cachedCompareIdsKey = "";
  cachedCompareIds = EMPTY_COMPARE_IDS;
  emit();
}

export function isCompared(id: string, list?: CompareItem[]) {
  const source = list ?? readCompare();
  return source.some((item) => item.id === id);
}

export function addToCompare(snapshot: CompareSnapshot): CompareItem[] {
  const current = readCompare();
  if (current.some((item) => item.id === snapshot.id)) {
    return current;
  }
  const next = [...current, snapshot].slice(0, MAX_COMPARE);
  writeCompare(next);
  return next;
}

export function removeFromCompare(id: string): CompareItem[] {
  const next = readCompare().filter((item) => item.id !== id);
  writeCompare(next);
  return next;
}

export function toggleCompare(snapshot: CompareSnapshot): CompareItem[] {
  if (isCompared(snapshot.id)) {
    return removeFromCompare(snapshot.id);
  }
  return addToCompare(snapshot);
}

export function clearCompare() {
  writeCompare([]);
}

export function compareSlugs(list?: CompareItem[]): string[] {
  return (list ?? readCompare()).map((item) => item.slug);
}

/** Convenience for stable ids snapshot (mirrors the shortlist helper). */
export const EMPTY_COMPARE_IDS: string[] = [];
let cachedCompareIds: string[] = EMPTY_COMPARE_IDS;
let cachedCompareIdsKey = "";

export function readCompareIds(): string[] {
  const items = readCompare();
  const key = items.map((item) => item.id).join("\0");
  if (key === cachedCompareIdsKey) return cachedCompareIds;
  cachedCompareIdsKey = key;
  cachedCompareIds =
    items.length === 0 ? EMPTY_COMPARE_IDS : items.map((item) => item.id);
  return cachedCompareIds;
}
