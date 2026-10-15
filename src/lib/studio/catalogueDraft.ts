"use client";

import {
  DEFAULT_CATALOGUE_FIELDS,
  type CatalogueFieldKey,
  type CataloguePricingMode,
  type StudioLogoAsset,
  type WhiteLabelCatalogueDraft,
} from "@/data/catalogue/studioTypes";

const STORAGE_KEY = "monkcraft-studio-catalogue-v1";
export const CATALOGUE_DRAFT_EVENT = "monkcraft:studio-catalogue";

const PRICING_MODES: CataloguePricingMode[] = [
  "hide",
  "base",
  "markup-fixed",
  "markup-percent",
];

function emit() {
  window.dispatchEvent(new CustomEvent(CATALOGUE_DRAFT_EVENT));
}

function emptyDraft(): WhiteLabelCatalogueDraft {
  return {
    productIds: [],
    title: "Corporate Gift Selection",
    companyName: "",
    coverText:
      "A curated selection prepared for your review. Prices and branding methods are confirmed with Monkcraft before order.",
    accentColor: "#662F90",
    watermark: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    logo: null,
    fields: { ...DEFAULT_CATALOGUE_FIELDS },
    pricingMode: "base",
    markupValue: 0,
    showPageNumbers: true,
    dirty: false,
    updatedAt: "",
  };
}

function normalizeLogo(value: unknown): StudioLogoAsset | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as StudioLogoAsset;
  if (typeof raw.fileName !== "string" || typeof raw.fileType !== "string") {
    return null;
  }
  return {
    fileName: raw.fileName,
    fileType: raw.fileType,
    fileSize: Number(raw.fileSize) || 0,
    dataUrl:
      typeof raw.dataUrl === "string" && raw.dataUrl.startsWith("data:")
        ? raw.dataUrl
        : undefined,
  };
}

function normalizeFields(value: unknown): Record<CatalogueFieldKey, boolean> {
  const base = { ...DEFAULT_CATALOGUE_FIELDS };
  if (!value || typeof value !== "object") return base;
  const raw = value as Partial<Record<CatalogueFieldKey, boolean>>;
  for (const key of Object.keys(base) as CatalogueFieldKey[]) {
    if (typeof raw[key] === "boolean") base[key] = raw[key]!;
  }
  return base;
}

function normalizeAccent(value: unknown): string {
  if (typeof value !== "string") return "#662F90";
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
  return "#662F90";
}

export function readCatalogueDraft(): WhiteLabelCatalogueDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as Partial<WhiteLabelCatalogueDraft>;
    const markup = Number(parsed.markupValue);
    return {
      productIds: Array.isArray(parsed.productIds)
        ? parsed.productIds.filter((id): id is string => typeof id === "string")
        : [],
      title: String(parsed.title ?? emptyDraft().title),
      companyName: String(parsed.companyName ?? ""),
      coverText: String(parsed.coverText ?? emptyDraft().coverText),
      accentColor: normalizeAccent(parsed.accentColor),
      watermark: String(parsed.watermark ?? ""),
      contactName: String(parsed.contactName ?? ""),
      contactEmail: String(parsed.contactEmail ?? ""),
      contactPhone: String(parsed.contactPhone ?? ""),
      logo: normalizeLogo(parsed.logo),
      fields: normalizeFields(parsed.fields),
      pricingMode:
        typeof parsed.pricingMode === "string" &&
        PRICING_MODES.includes(parsed.pricingMode as CataloguePricingMode)
          ? (parsed.pricingMode as CataloguePricingMode)
          : "base",
      markupValue: Number.isFinite(markup) ? Math.max(0, markup) : 0,
      showPageNumbers: parsed.showPageNumbers !== false,
      dirty: Boolean(parsed.dirty),
      updatedAt: String(parsed.updatedAt ?? ""),
    };
  } catch {
    return emptyDraft();
  }
}

export function writeCatalogueDraft(
  draft: Omit<WhiteLabelCatalogueDraft, "updatedAt"> | WhiteLabelCatalogueDraft,
) {
  if (typeof window === "undefined") return;
  const next: WhiteLabelCatalogueDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

export function clearCatalogueDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  emit();
}

export function patchCatalogueDraft(
  patch: Partial<WhiteLabelCatalogueDraft>,
  options?: { dirty?: boolean },
): WhiteLabelCatalogueDraft {
  const current = readCatalogueDraft();
  writeCatalogueDraft({
    ...current,
    ...patch,
    dirty: options?.dirty ?? true,
  });
  return readCatalogueDraft();
}

export function markCatalogueClean(draft?: WhiteLabelCatalogueDraft) {
  const current = draft ?? readCatalogueDraft();
  writeCatalogueDraft({ ...current, dirty: false });
}

/** Seed product ids from shortlist without wiping brand settings. */
export function mergeShortlistIntoCatalogue(productIds: string[]) {
  const current = readCatalogueDraft();
  const seen = new Set(current.productIds);
  const merged = [...current.productIds];
  for (const id of productIds) {
    if (!seen.has(id)) {
      seen.add(id);
      merged.push(id);
    }
  }
  writeCatalogueDraft({
    ...current,
    productIds: merged,
    dirty: true,
  });
  return readCatalogueDraft();
}

export function reorderCatalogueProduct(
  productId: string,
  direction: "up" | "down",
) {
  const current = readCatalogueDraft();
  const index = current.productIds.indexOf(productId);
  if (index < 0) return current;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= current.productIds.length) return current;
  const next = [...current.productIds];
  [next[index], next[swapWith]] = [next[swapWith], next[index]];
  return patchCatalogueDraft({ productIds: next });
}
