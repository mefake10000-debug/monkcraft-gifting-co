const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MONEY_PAISE = 9_000_000_000_000;

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isMoney(value: unknown) {
  return Number.isSafeInteger(value) && Math.abs(value as number) <= MAX_MONEY_PAISE;
}

export type QuoteLine = { productId: string; description: string; quantity: number; unitPricePaise: number };
export type QuoteAdjustment = { label: string; amountPaise: number };
export type QuoteSupplierCheck = {
  supplierId: string | null;
  status: string;
  availability: string;
  reviewedAt: string | null;
  productIds: string[];
};

export function assessQuoteSupplierReadiness(lines: Array<Pick<QuoteLine, "productId">>, checks: QuoteSupplierCheck[]) {
  if (checks.length === 0) return { ready: false, reason: "Supplier checks have not been prepared yet." };
  const unresolved = checks.find((check) => !check.supplierId || check.status !== "Replied" || !check.reviewedAt);
  if (unresolved) return { ready: false, reason: "Every requested item needs a mapped supplier reply reviewed by a person." };
  const unavailable = checks.find((check) => check.availability !== "Available");
  if (unavailable) return { ready: false, reason: "A reviewed supplier reply is partial, unavailable, or still unknown." };
  const uncheckedLine = lines.find((line) => !checks.some((check) => check.productIds.includes(line.productId)));
  if (uncheckedLine) return { ready: false, reason: `Product ${uncheckedLine.productId} has no reviewed availability check.` };
  return { ready: true, reason: "Mapped supplier replies were reviewed as available. This is not a stock reservation." };
}

export type QuoteDraftInput = {
  requestId: string; lines: QuoteLine[]; adjustments: QuoteAdjustment[]; terms: string;
  validUntil: string | null; actor: string;
};

export function validateQuoteDraftInput(value: unknown):
  | { ok: true; value: QuoteDraftInput & { subtotalPaise: number; totalPaise: number } }
  | { ok: false; error: string } {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const requestId = text(input.requestId, 36);
  const actor = text(input.actor, 120);
  if (!UUID.test(requestId) || !actor) return { ok: false, error: "A valid quote request and staff name are required." };
  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 100) {
    return { ok: false, error: "Add between 1 and 100 quote lines." };
  }
  const lines: QuoteLine[] = [];
  let subtotal = BigInt(0);
  for (const raw of input.lines) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "A quote line is invalid." };
    const line = raw as Record<string, unknown>;
    const productId = text(line.productId, 80);
    const description = text(line.description, 300);
    const quantity = line.quantity;
    const unitPricePaise = line.unitPricePaise;
    if (!productId || !description || !Number.isSafeInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 1_000_000 || !isMoney(unitPricePaise) || (unitPricePaise as number) < 0) {
      return { ok: false, error: "Each line needs an item, description, positive whole quantity, and a non-negative manually entered unit price." };
    }
    subtotal += BigInt(quantity as number) * BigInt(unitPricePaise as number);
    if (subtotal > BigInt(MAX_MONEY_PAISE)) return { ok: false, error: "The quote subtotal exceeds the supported amount." };
    lines.push({ productId, description, quantity: quantity as number, unitPricePaise: unitPricePaise as number });
  }
  if (!Array.isArray(input.adjustments) || input.adjustments.length > 20) return { ok: false, error: "Use no more than 20 separately labelled quote adjustments." };
  const adjustments: QuoteAdjustment[] = [];
  let total = subtotal;
  for (const raw of input.adjustments) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "A quote adjustment is invalid." };
    const adjustment = raw as Record<string, unknown>;
    const label = text(adjustment.label, 120);
    const amountPaise = adjustment.amountPaise;
    if (!label || !isMoney(amountPaise)) return { ok: false, error: "Every additional charge, tax, or discount needs a label and an amount in paise." };
    total += BigInt(amountPaise as number);
    adjustments.push({ label, amountPaise: amountPaise as number });
  }
  if (total < BigInt(0) || total > BigInt(MAX_MONEY_PAISE)) return { ok: false, error: "The final quote amount must be between zero and the supported maximum." };
  const terms = text(input.terms, 4000);
  const rawValidUntil = text(input.validUntil, 30);
  const validUntil = rawValidUntil || null;
  if (validUntil && (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil) || Number.isNaN(Date.parse(`${validUntil}T00:00:00Z`)))) {
    return { ok: false, error: "Quote validity must be a valid date." };
  }
  return { ok: true, value: { requestId, lines, adjustments, subtotalPaise: Number(subtotal), totalPaise: Number(total), terms, validUntil, actor } };
}

export type QuoteTransition = "submit_for_approval" | "approve" | "request_changes" | "mark_sent" | "accept" | "decline";
export function validateQuoteTransitionInput(value: unknown, transition: QuoteTransition):
  | { ok: true; value: { quoteId: string; actor: string; evidenceReference: string; note: string } }
  | { ok: false; error: string } {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const quoteId = text(input.quoteId, 36);
  const actor = text(input.actor, 120);
  const evidenceReference = text(input.evidenceReference, 500);
  const note = text(input.note, 1000);
  if (!UUID.test(quoteId) || !actor) return { ok: false, error: "A valid quote and staff name are required." };
  if (["mark_sent", "accept", "decline"].includes(transition) && evidenceReference.length < 3) {
    return { ok: false, error: "Record an email, purchase order, or customer communication reference." };
  }
  if (transition === "request_changes" && !note) return { ok: false, error: "Add a note describing the changes required." };
  return { ok: true, value: { quoteId, actor, evidenceReference, note } };
}
