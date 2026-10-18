"use client";

import type { StudioLogoAsset } from "@/data/catalogue/studioTypes";
import {
  COMPANY_STORE_DRAFT_VERSION,
  emptyCompanyStoreDraft,
  emptyStoreIdentity,
  emptyStoreRules,
  type CompanyStoreDraft,
  type CompanyStoreIdentity,
  type CompanyStoreRules,
  type StoreCategory,
  type StoreDeliveryPreference,
  type StoreAllowanceMode,
} from "@/data/companyStore/types";

const STORAGE_KEY = "monkcraft-company-store-draft-v1";
export const COMPANY_STORE_DRAFT_EVENT = "monkcraft:company-store-draft";

function emit() {
  window.dispatchEvent(new CustomEvent(COMPANY_STORE_DRAFT_EVENT));
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

function normalizeIdentity(value: unknown): CompanyStoreIdentity {
  const fallback = emptyStoreIdentity();
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Partial<CompanyStoreIdentity>;
  const accent =
    typeof raw.accentColor === "string" && /^#[0-9A-Fa-f]{6}$/.test(raw.accentColor)
      ? raw.accentColor
      : fallback.accentColor;
  const savedWelcome = String(raw.welcomeMessage ?? fallback.welcomeMessage);
  const welcomeMessage = {
    "Welcome to your company merchandise store. Browse approved items and prepare a draft order request.":
      "Browse the gifts selected for your team.",
    "Choose a gift from this collection as a thank-you for all you do.":
      "Choose a gift as a thank-you for your work.",
    "Pick a welcome gift selected for your first days with the team.":
      "Choose a gift selected to welcome you to the team.",
    "Celebrate the milestone with a gift chosen for you.":
      "Choose a gift to mark this milestone.",
  }[savedWelcome] ?? savedWelcome;
  return {
    companyName: String(raw.companyName ?? ""),
    storeName: String(raw.storeName ?? ""),
    storeTitle: String(raw.storeTitle ?? ""),
    welcomeMessage,
    accentColor: accent,
    logo: normalizeLogo(raw.logo),
  };
}

function normalizeCategories(value: unknown, productIds: string[]): StoreCategory[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [{ id: "cat-general", name: "General", productIds: [...productIds] }];
  }
  const cats: StoreCategory[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Partial<StoreCategory>;
    const id =
      typeof raw.id === "string" && raw.id.trim()
        ? raw.id.trim()
        : `cat-${cats.length + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const name =
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : "Untitled";
    const ids = Array.isArray(raw.productIds)
      ? raw.productIds.filter(
          (pid): pid is string =>
            typeof pid === "string" && productIds.includes(pid),
        )
      : [];
    cats.push({ id, name, productIds: ids });
  }
  return cats.length > 0
    ? cats
    : [{ id: "cat-general", name: "General", productIds: [...productIds] }];
}

function normalizePositiveInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

function normalizeAllowanceMode(value: unknown): StoreAllowanceMode {
  if (value === "company-funded" || value === "allowance-cap" || value === "none") {
    return value;
  }
  return "none";
}

function normalizeDelivery(value: unknown): StoreDeliveryPreference {
  if (
    value === "office" ||
    value === "home" ||
    value === "either" ||
    value === "undecided"
  ) {
    return value;
  }
  return "undecided";
}

function normalizeRules(value: unknown): CompanyStoreRules {
  const fallback = emptyStoreRules();
  if (!value || typeof value !== "object") return fallback;
  const raw = value as Partial<CompanyStoreRules>;
  const access = (raw.access ?? {}) as Partial<CompanyStoreRules["access"]>;
  const ordering = (raw.ordering ?? {}) as Partial<
    CompanyStoreRules["ordering"]
  >;
  return {
    access: {
      accessNote: String(access.accessNote ?? ""),
      requireWorkEmail: Boolean(
        access.requireWorkEmail ?? fallback.access.requireWorkEmail,
      ),
      visibilityNote: String(
        access.visibilityNote ?? fallback.access.visibilityNote,
      ),
    },
    ordering: {
      maxItemsPerOrder: normalizePositiveInt(ordering.maxItemsPerOrder),
      maxUnitsPerProduct: normalizePositiveInt(ordering.maxUnitsPerProduct),
      allowanceMode: normalizeAllowanceMode(ordering.allowanceMode),
      allowanceCapInr: normalizePositiveInt(ordering.allowanceCapInr),
      allowanceNote: String(ordering.allowanceNote ?? ""),
      requireApproval: Boolean(ordering.requireApproval),
      approvalNote: String(ordering.approvalNote ?? ""),
      deliveryPreference: normalizeDelivery(ordering.deliveryPreference),
      deliveryNote: String(ordering.deliveryNote ?? ""),
    },
  };
}

export function normalizeCompanyStoreDraft(
  value: unknown,
): CompanyStoreDraft {
  const empty = emptyCompanyStoreDraft();
  if (!value || typeof value !== "object") return empty;
  const raw = value as Partial<CompanyStoreDraft>;
  const productIds = Array.isArray(raw.productIds)
    ? [...new Set(raw.productIds.filter((id): id is string => typeof id === "string"))]
    : [];
  return {
    version: COMPANY_STORE_DRAFT_VERSION,
    identity: normalizeIdentity(raw.identity),
    productIds,
    categories: normalizeCategories(raw.categories, productIds),
    rules: normalizeRules(raw.rules),
    updatedAt: String(raw.updatedAt ?? ""),
  };
}

export function readCompanyStoreDraft(): CompanyStoreDraft {
  if (typeof window === "undefined") return emptyCompanyStoreDraft();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCompanyStoreDraft();
    return normalizeCompanyStoreDraft(JSON.parse(raw));
  } catch {
    return emptyCompanyStoreDraft();
  }
}

export function writeCompanyStoreDraft(
  draft: Omit<CompanyStoreDraft, "updatedAt"> | CompanyStoreDraft,
) {
  if (typeof window === "undefined") return;
  const next: CompanyStoreDraft = {
    ...normalizeCompanyStoreDraft(draft),
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

export function patchCompanyStoreDraft(
  patch: Partial<CompanyStoreDraft>,
): CompanyStoreDraft {
  const current = readCompanyStoreDraft();
  const next = normalizeCompanyStoreDraft({ ...current, ...patch });
  writeCompanyStoreDraft(next);
  return readCompanyStoreDraft();
}

export function clearCompanyStoreDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  emit();
}

export function addStoreProduct(
  productId: string,
  categoryId?: string,
): CompanyStoreDraft {
  const draft = readCompanyStoreDraft();
  if (draft.productIds.includes(productId)) return draft;
  const productIds = [...draft.productIds, productId];
  const categories = draft.categories.map((cat) => {
    if (categoryId && cat.id !== categoryId) return cat;
    if (!categoryId && cat.id !== draft.categories[0]?.id) return cat;
    if (cat.productIds.includes(productId)) return cat;
    return { ...cat, productIds: [...cat.productIds, productId] };
  });
  writeCompanyStoreDraft({ ...draft, productIds, categories });
  return readCompanyStoreDraft();
}

export function removeStoreProduct(productId: string): CompanyStoreDraft {
  const draft = readCompanyStoreDraft();
  writeCompanyStoreDraft({
    ...draft,
    productIds: draft.productIds.filter((id) => id !== productId),
    categories: draft.categories.map((cat) => ({
      ...cat,
      productIds: cat.productIds.filter((id) => id !== productId),
    })),
  });
  return readCompanyStoreDraft();
}

export function reorderStoreProducts(productIds: string[]): CompanyStoreDraft {
  const draft = readCompanyStoreDraft();
  const allowed = new Set(draft.productIds);
  const next = productIds.filter((id) => allowed.has(id));
  for (const id of draft.productIds) {
    if (!next.includes(id)) next.push(id);
  }
  writeCompanyStoreDraft({ ...draft, productIds: next });
  return readCompanyStoreDraft();
}

export function moveStoreProduct(
  productId: string,
  direction: "up" | "down",
): CompanyStoreDraft {
  const draft = readCompanyStoreDraft();
  const index = draft.productIds.indexOf(productId);
  if (index < 0) return draft;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= draft.productIds.length) return draft;
  const next = [...draft.productIds];
  [next[index], next[target]] = [next[target], next[index]];
  return reorderStoreProducts(next);
}

export function upsertStoreCategory(
  category: StoreCategory,
): CompanyStoreDraft {
  const draft = readCompanyStoreDraft();
  const exists = draft.categories.some((c) => c.id === category.id);
  const categories = exists
    ? draft.categories.map((c) => (c.id === category.id ? category : c))
    : [...draft.categories, category];
  writeCompanyStoreDraft({ ...draft, categories });
  return readCompanyStoreDraft();
}

export function removeStoreCategory(categoryId: string): CompanyStoreDraft {
  const draft = readCompanyStoreDraft();
  if (draft.categories.length <= 1) return draft;
  const removed = draft.categories.find((c) => c.id === categoryId);
  const remaining = draft.categories.filter((c) => c.id !== categoryId);
  if (removed && remaining[0]) {
    const mergeIds = removed.productIds.filter(
      (id) => !remaining[0].productIds.includes(id),
    );
    remaining[0] = {
      ...remaining[0],
      productIds: [...remaining[0].productIds, ...mergeIds],
    };
  }
  writeCompanyStoreDraft({ ...draft, categories: remaining });
  return readCompanyStoreDraft();
}

export function assignProductToCategory(
  productId: string,
  categoryId: string,
): CompanyStoreDraft {
  const draft = readCompanyStoreDraft();
  if (!draft.productIds.includes(productId)) return draft;
  const categories = draft.categories.map((cat) => {
    const without = cat.productIds.filter((id) => id !== productId);
    if (cat.id === categoryId) {
      return {
        ...cat,
        productIds: without.includes(productId)
          ? without
          : [...without, productId],
      };
    }
    return { ...cat, productIds: without };
  });
  writeCompanyStoreDraft({ ...draft, categories });
  return readCompanyStoreDraft();
}

export function newCategoryId(): string {
  return `cat-${Date.now().toString(36)}`;
}
