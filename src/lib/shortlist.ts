"use client";

import type { ShortlistItem } from "@/data/catalogue/types";

const STORAGE_KEY_V2 = "monkcraft-shortlist-v2";
const STORAGE_KEY_V1 = "monkcraft-shortlist-v1";
export const SHORTLIST_EVENT = "monkcraft:shortlist";
export const MIN_STANDARD_PRODUCT_QUANTITY = 5;

export function standardProductQuantityFloor(minQuantity?: number): number {
  return Math.max(
    MIN_STANDARD_PRODUCT_QUANTITY,
    Number.isFinite(minQuantity) && minQuantity && minQuantity > 0
      ? Math.floor(minQuantity)
      : 0,
  );
}

function emit() {
  window.dispatchEvent(new CustomEvent(SHORTLIST_EVENT));
}

function isItem(value: unknown): value is ShortlistItem {
  if (!value || typeof value !== "object") return false;
  const item = value as ShortlistItem;
  return (
    typeof item.id === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.priceLabel === "string" &&
    typeof item.quantity === "number" &&
    Number.isFinite(item.quantity)
  );
}

function migrateV1(): ShortlistItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === "string")
      .map((id) => ({
        id,
        slug: id,
        name: id,
        priceLabel: "See product",
        quantity: 1,
      }));
  } catch {
    return [];
  }
}

export function readShortlist(): ShortlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(isItem).map((item) => ({
          ...item,
          quantity: Math.max(
            standardProductQuantityFloor(item.minQuantity),
            Math.floor(item.quantity),
          ),
        }));
      }
    }
    const migrated = migrateV1();
    if (migrated.length > 0) {
      writeShortlist(migrated);
      window.localStorage.removeItem(STORAGE_KEY_V1);
    }
    return migrated;
  } catch {
    return [];
  }
}

/** Stable empty id list for useSyncExternalStore getServerSnapshot. */
export const EMPTY_SHORTLIST_IDS: string[] = [];

let cachedShortlistIds: string[] = EMPTY_SHORTLIST_IDS;
let cachedShortlistIdsKey = "";

/** Convenience: ids only (catalogue shortlist filter). Cached for external-store snapshots. */
export function readShortlistIds(): string[] {
  const items = readShortlist();
  const key = items.map((item) => item.id).join("\0");
  if (key === cachedShortlistIdsKey) return cachedShortlistIds;
  cachedShortlistIdsKey = key;
  cachedShortlistIds =
    items.length === 0 ? EMPTY_SHORTLIST_IDS : items.map((item) => item.id);
  return cachedShortlistIds;
}

export function writeShortlist(items: ShortlistItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(items));
  cachedShortlistIdsKey = "";
  cachedShortlistIds = EMPTY_SHORTLIST_IDS;
  emit();
}

export function isShortlisted(id: string, list?: ShortlistItem[]) {
  const source = list ?? readShortlist();
  return source.some((item) => item.id === id);
}

export type ShortlistSnapshot = Omit<ShortlistItem, "quantity"> & {
  quantity?: number;
};

export function addToShortlist(snapshot: ShortlistSnapshot): ShortlistItem[] {
  const current = readShortlist();
  const existing = current.find((item) => item.id === snapshot.id);
  if (existing) {
    return current;
  }
  const min = standardProductQuantityFloor(snapshot.minQuantity);
  const quantity = Math.max(min, snapshot.quantity ?? min);
  const next = [
    ...current,
    {
      id: snapshot.id,
      slug: snapshot.slug,
      name: snapshot.name,
      imageSrc: snapshot.imageSrc,
      priceLabel: snapshot.priceLabel,
      amountInr: snapshot.amountInr,
      minQuantity: snapshot.minQuantity,
      quantity,
      categoryName: snapshot.categoryName,
    },
  ];
  writeShortlist(next);
  return next;
}

export function removeFromShortlist(id: string): ShortlistItem[] {
  const next = readShortlist().filter((item) => item.id !== id);
  writeShortlist(next);
  return next;
}

export function toggleShortlist(snapshot: ShortlistSnapshot): ShortlistItem[] {
  if (isShortlisted(snapshot.id)) {
    return removeFromShortlist(snapshot.id);
  }
  return addToShortlist(snapshot);
}

/** @deprecated Prefer toggleShortlist with a product snapshot. */
export function toggleShortlistId(id: string): string[] {
  if (isShortlisted(id)) {
    return removeFromShortlist(id).map((item) => item.id);
  }
  return addToShortlist({
    id,
    slug: id,
    name: id,
    priceLabel: "See product",
  }).map((item) => item.id);
}

export function setShortlistQuantity(
  id: string,
  quantity: number,
): ShortlistItem[] {
  const next = readShortlist().map((item) => {
    if (item.id !== id) return item;
    const min = standardProductQuantityFloor(item.minQuantity);
    return { ...item, quantity: Math.max(min, Math.floor(quantity) || min) };
  });
  writeShortlist(next);
  return next;
}

export function clearShortlist() {
  writeShortlist([]);
}

export function shortlistTotalUnits(list?: ShortlistItem[]) {
  return (list ?? readShortlist()).reduce((sum, item) => sum + item.quantity, 0);
}
