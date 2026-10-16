"use client";

import type {
  StoreOrderDraft,
  StoreOrderLine,
  StoreOrderRequest,
} from "@/data/companyStore/types";

const ORDER_KEY = "monkcraft-company-store-order-v1";
const REQUESTS_KEY = "monkcraft-company-store-requests-v1";
export const STORE_ORDER_EVENT = "monkcraft:company-store-order";
export const STORE_REQUESTS_EVENT = "monkcraft:company-store-requests";

function emitOrder() {
  window.dispatchEvent(new CustomEvent(STORE_ORDER_EVENT));
}

function emitRequests() {
  window.dispatchEvent(new CustomEvent(STORE_REQUESTS_EVENT));
}

function emptyOrder(): StoreOrderDraft {
  return { version: 1, lines: [], notes: "", updatedAt: "" };
}

function isLine(value: unknown): value is StoreOrderLine {
  if (!value || typeof value !== "object") return false;
  const line = value as StoreOrderLine;
  return (
    typeof line.productId === "string" &&
    typeof line.slug === "string" &&
    typeof line.name === "string" &&
    typeof line.priceLabel === "string" &&
    typeof line.quantity === "number" &&
    Number.isFinite(line.quantity) &&
    Array.isArray(line.variants)
  );
}

function lineKey(line: Pick<StoreOrderLine, "productId" | "variants">): string {
  const variantKey = line.variants
    .map((v) => `${v.label}:${v.value}`)
    .sort()
    .join("|");
  return `${line.productId}::${variantKey}`;
}

export function readStoreOrderDraft(): StoreOrderDraft {
  if (typeof window === "undefined") return emptyOrder();
  try {
    const raw = window.localStorage.getItem(ORDER_KEY);
    if (!raw) return emptyOrder();
    const parsed = JSON.parse(raw) as Partial<StoreOrderDraft>;
    return {
      version: 1,
      lines: Array.isArray(parsed.lines) ? parsed.lines.filter(isLine) : [],
      notes: String(parsed.notes ?? ""),
      deliveryAddress:
        parsed.deliveryAddress && typeof parsed.deliveryAddress === "object"
          ? parsed.deliveryAddress
          : undefined,
      employeeId: typeof parsed.employeeId === "string" ? parsed.employeeId : undefined,
      updatedAt: String(parsed.updatedAt ?? ""),
    };
  } catch {
    return emptyOrder();
  }
}

export function writeStoreOrderDraft(
  draft: Omit<StoreOrderDraft, "updatedAt"> | StoreOrderDraft,
) {
  if (typeof window === "undefined") return;
  const next: StoreOrderDraft = {
    version: 1,
    lines: draft.lines.filter(isLine).map((line) => ({
      ...line,
      quantity: Math.max(1, Math.floor(line.quantity) || 1),
      variants: Array.isArray(line.variants) ? line.variants : [],
    })),
    notes: String(draft.notes ?? ""),
    deliveryAddress: draft.deliveryAddress,
    employeeId: draft.employeeId,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(ORDER_KEY, JSON.stringify(next));
  emitOrder();
}

export function clearStoreOrderDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ORDER_KEY);
  emitOrder();
}

export function addStoreOrderLine(line: StoreOrderLine): StoreOrderDraft {
  const current = readStoreOrderDraft();
  const key = lineKey(line);
  const existing = current.lines.find((l) => lineKey(l) === key);
  let lines: StoreOrderLine[];
  if (existing) {
    lines = current.lines.map((l) =>
      lineKey(l) === key
        ? { ...l, quantity: l.quantity + Math.max(1, line.quantity) }
        : l,
    );
  } else {
    lines = [...current.lines, { ...line, quantity: Math.max(1, line.quantity) }];
  }
  writeStoreOrderDraft({ ...current, lines });
  return readStoreOrderDraft();
}

export function setStoreOrderQuantity(
  productId: string,
  variants: StoreOrderLine["variants"],
  quantity: number,
): StoreOrderDraft {
  const current = readStoreOrderDraft();
  const key = lineKey({ productId, variants });
  const lines = current.lines
    .map((l) =>
      lineKey(l) === key
        ? { ...l, quantity: Math.max(1, Math.floor(quantity) || 1) }
        : l,
    )
    .filter((l) => (lineKey(l) === key ? quantity > 0 : true));
  if (quantity <= 0) {
    writeStoreOrderDraft({
      ...current,
      lines: current.lines.filter((l) => lineKey(l) !== key),
    });
  } else {
    writeStoreOrderDraft({ ...current, lines });
  }
  return readStoreOrderDraft();
}

export function removeStoreOrderLine(
  productId: string,
  variants: StoreOrderLine["variants"],
): StoreOrderDraft {
  const current = readStoreOrderDraft();
  const key = lineKey({ productId, variants });
  writeStoreOrderDraft({
    ...current,
    lines: current.lines.filter((l) => lineKey(l) !== key),
  });
  return readStoreOrderDraft();
}

export function storeOrderEstimatedTotal(
  lines: StoreOrderLine[],
): number | null {
  let total = 0;
  let hasAny = false;
  for (const line of lines) {
    if (typeof line.amountInr === "number" && Number.isFinite(line.amountInr)) {
      total += line.amountInr * line.quantity;
      hasAny = true;
    }
  }
  return hasAny ? total : null;
}

export function readStoreOrderRequests(): StoreOrderRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is StoreOrderRequest => {
        if (!item || typeof item !== "object") return false;
        const r = item as StoreOrderRequest;
        return (
          typeof r.id === "string" &&
          typeof r.createdAt === "string" &&
          r.status === "draft-prepared" &&
          Array.isArray(r.lines)
        );
      })
      .slice(0, 50);
  } catch {
    return [];
  }
}

export function writeStoreOrderRequests(requests: StoreOrderRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests.slice(0, 50)));
  emitRequests();
}

export function prepareStoreOrderRequest(input: {
  lines: StoreOrderLine[];
  notes: string;
  deliveryAddress?: StoreOrderDraft["deliveryAddress"];
  employeeId?: string;
  rulesLabel: string;
}): StoreOrderRequest {
  const request: StoreOrderRequest = {
    id: `req-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    status: "draft-prepared",
    lines: input.lines,
    notes: input.notes,
    deliveryAddress: input.deliveryAddress,
    employeeId: input.employeeId,
    estimatedTotalInr: storeOrderEstimatedTotal(input.lines),
    rulesLabel: input.rulesLabel,
  };
  const next = [request, ...readStoreOrderRequests()];
  writeStoreOrderRequests(next);
  return request;
}

export function clearStoreOrderRequests() {
  writeStoreOrderRequests([]);
}
