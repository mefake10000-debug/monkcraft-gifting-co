"use client";

import {
  DEFAULT_BRANDING_TRANSFORM,
  type BrandingDraft,
  type BrandingTransform,
  type StudioLogoAsset,
} from "@/data/catalogue/studioTypes";

const STORAGE_KEY = "monkcraft-studio-branding-v1";
export const BRANDING_DRAFT_EVENT = "monkcraft:studio-branding";

function emit() {
  window.dispatchEvent(new CustomEvent(BRANDING_DRAFT_EVENT));
}

function emptyDraft(): BrandingDraft {
  return {
    productId: null,
    productSlug: null,
    logo: null,
    transform: { ...DEFAULT_BRANDING_TRANSFORM },
    text: "",
    textEnabled: false,
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

function normalizeTransform(value: unknown): BrandingTransform {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_BRANDING_TRANSFORM };
  }
  const raw = value as Partial<BrandingTransform>;
  const clamp01 = (n: number, fallback: number) =>
    Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
  const scale = Number(raw.scale);
  const rotation = Number(raw.rotation);
  return {
    x: clamp01(Number(raw.x), DEFAULT_BRANDING_TRANSFORM.x),
    y: clamp01(Number(raw.y), DEFAULT_BRANDING_TRANSFORM.y),
    scale:
      Number.isFinite(scale) && scale > 0.05 && scale <= 0.9
        ? scale
        : DEFAULT_BRANDING_TRANSFORM.scale,
    rotation: Number.isFinite(rotation) ? rotation % 360 : 0,
  };
}

export function readBrandingDraft(): BrandingDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as Partial<BrandingDraft>;
    return {
      productId:
        typeof parsed.productId === "string" ? parsed.productId : null,
      productSlug:
        typeof parsed.productSlug === "string" ? parsed.productSlug : null,
      logo: normalizeLogo(parsed.logo),
      transform: normalizeTransform(parsed.transform),
      text: String(parsed.text ?? ""),
      textEnabled: Boolean(parsed.textEnabled),
      dirty: Boolean(parsed.dirty),
      updatedAt: String(parsed.updatedAt ?? ""),
    };
  } catch {
    return emptyDraft();
  }
}

export function writeBrandingDraft(
  draft: Omit<BrandingDraft, "updatedAt"> | BrandingDraft,
) {
  if (typeof window === "undefined") return;
  const next: BrandingDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

export function clearBrandingDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  emit();
}

export function markBrandingClean(draft?: BrandingDraft) {
  const current = draft ?? readBrandingDraft();
  writeBrandingDraft({ ...current, dirty: false });
}

export function patchBrandingDraft(
  patch: Partial<BrandingDraft>,
  options?: { dirty?: boolean },
): BrandingDraft {
  const current = readBrandingDraft();
  const next: BrandingDraft = {
    ...current,
    ...patch,
    dirty: options?.dirty ?? true,
  };
  writeBrandingDraft(next);
  return readBrandingDraft();
}

export function resetBrandingTransform(): BrandingDraft {
  return patchBrandingDraft({
    transform: { ...DEFAULT_BRANDING_TRANSFORM },
  });
}
