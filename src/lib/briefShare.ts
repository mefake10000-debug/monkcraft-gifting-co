"use client";

import type { GiftingBriefDraft, ShortlistItem } from "@/data/catalogue/types";
import { BRIEF_SCHEMA_VERSION, emptyBrief } from "@/lib/brief";

/**
 * Shareable gifting brief — encodes the programme fields, contact block, and
 * the shortlist products into a compact base64url payload that can travel in a
 * URL (`?brief=`). No third party, no server round-trip: the recipient decodes
 * it in their browser and can choose to import it over their own draft.
 */

export const SHARED_BRIEF_PARAM = "brief";
export const SHARED_BRIEF_ENVELOPE_VERSION = 1 as const;

export type SharedBriefPayload = {
  v: typeof SHARED_BRIEF_ENVELOPE_VERSION;
  brief: GiftingBriefDraft;
  products: ShortlistItem[];
};

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function isShortlistItem(value: unknown): value is ShortlistItem {
  if (!value || typeof value !== "object") return false;
  const item = value as ShortlistItem;
  return (
    typeof item.id === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.priceLabel === "string" &&
    typeof item.quantity === "number"
  );
}

/** Encode a brief + its products into a URL-safe token. */
export function encodeSharedBrief(
  brief: GiftingBriefDraft,
  products: ShortlistItem[],
): string {
  const payload: SharedBriefPayload = {
    v: SHARED_BRIEF_ENVELOPE_VERSION,
    brief: { ...brief, schemaVersion: BRIEF_SCHEMA_VERSION },
    products,
  };
  return toBase64Url(JSON.stringify(payload));
}

/** Decode a token back into a brief + products, or null when invalid. */
export function decodeSharedBrief(
  token: string,
): { brief: GiftingBriefDraft; products: ShortlistItem[] } | null {
  if (!token) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(token)) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const payload = parsed as Partial<SharedBriefPayload>;
    if (!payload.brief || typeof payload.brief !== "object") return null;

    const base = emptyBrief();
    const incoming = payload.brief as GiftingBriefDraft;
    const brief: GiftingBriefDraft = {
      ...base,
      ...incoming,
      contact: { ...base.contact, ...(incoming.contact ?? {}) },
      productIds: Array.isArray(incoming.productIds) ? incoming.productIds : [],
      schemaVersion: BRIEF_SCHEMA_VERSION,
    };

    const products = Array.isArray(payload.products)
      ? payload.products.filter(isShortlistItem).map((item) => ({
          ...item,
          quantity: Math.max(1, Math.floor(item.quantity) || 1),
        }))
      : [];

    return { brief, products };
  } catch {
    return null;
  }
}

export function buildBriefShareUrl(token: string, origin: string): string {
  return `${origin}/gifts/brief?${SHARED_BRIEF_PARAM}=${token}`;
}
