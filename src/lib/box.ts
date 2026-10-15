"use client";

import type {
  BoxContact,
  BoxCustomization,
  BoxDraft,
  BoxLogoDraft,
  BoxPriceEstimate,
  BoxProductItem,
  BoxProductSnapshot,
  BoxStep,
  PackagingChoice,
} from "@/data/catalogue/boxTypes";
import { BOX_STEPS } from "@/data/catalogue/boxTypes";
import { getPackagingById } from "@/data/catalogue/packaging";
import { writeBrief } from "@/lib/brief";

const STORAGE_KEY = "monkcraft-box-v1";
export const BOX_EVENT = "monkcraft:box";

export const LOGO_MAX_BYTES = 400 * 1024;
export const LOGO_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

const EMPTY_CUSTOMIZATION: BoxCustomization = {
  companyName: "",
  brandingRequirements: "",
  logo: null,
  giftMessage: "",
  personalizationNotes: "",
  numberOfBoxes: 1,
  occasion: "",
  budgetPerBox: "",
  packagingInstructions: "",
  deliveryRequirements: "",
};

const EMPTY_CONTACT: BoxContact = {
  name: "",
  company: "",
  email: "",
  phone: "",
};

function emptyDraft(): BoxDraft {
  return {
    step: "packaging",
    packaging: null,
    products: [],
    customization: { ...EMPTY_CUSTOMIZATION },
    contact: { ...EMPTY_CONTACT },
    updatedAt: "",
  };
}

function emit() {
  window.dispatchEvent(new CustomEvent(BOX_EVENT));
}

function isStep(value: unknown): value is BoxStep {
  return typeof value === "string" && BOX_STEPS.includes(value as BoxStep);
}

function isProduct(value: unknown): value is BoxProductItem {
  if (!value || typeof value !== "object") return false;
  const item = value as BoxProductItem;
  return (
    typeof item.id === "string" &&
    typeof item.slug === "string" &&
    typeof item.name === "string" &&
    typeof item.priceLabel === "string" &&
    typeof item.quantityPerBox === "number" &&
    Number.isFinite(item.quantityPerBox)
  );
}

function normalizePackaging(value: unknown): PackagingChoice | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as PackagingChoice;
  if (raw.kind === "pending") {
    return { kind: "pending", note: String(raw.note ?? "") };
  }
  if (raw.kind === "selected" && typeof raw.optionId === "string") {
    const live = getPackagingById(raw.optionId);
    if (live) {
      return {
        kind: "selected",
        optionId: live.id,
        name: live.name,
        summary: live.summary,
        dimensionsLabel: live.dimensionsLabel,
        priceLabel: live.priceLabel,
        imageSrc: live.imageSrc,
      };
    }
    // Stale selected id — fall back to pending so the draft remains usable
    return {
      kind: "pending",
      note: `Previous packaging selection (${raw.name || raw.optionId}) is no longer available.`,
    };
  }
  return null;
}

function normalizeCustomization(value: unknown): BoxCustomization {
  if (!value || typeof value !== "object") return { ...EMPTY_CUSTOMIZATION };
  const raw = value as Partial<BoxCustomization>;
  const boxes = Number(raw.numberOfBoxes);
  let logo: BoxLogoDraft | null = null;
  if (raw.logo && typeof raw.logo === "object") {
    const l = raw.logo as BoxLogoDraft;
    if (typeof l.fileName === "string" && typeof l.fileType === "string") {
      logo = {
        fileName: l.fileName,
        fileType: l.fileType,
        fileSize: Number(l.fileSize) || 0,
        dataUrl:
          typeof l.dataUrl === "string" && l.dataUrl.startsWith("data:")
            ? l.dataUrl
            : undefined,
      };
    }
  }
  return {
    companyName: String(raw.companyName ?? ""),
    brandingRequirements: String(raw.brandingRequirements ?? ""),
    logo,
    giftMessage: String(raw.giftMessage ?? ""),
    personalizationNotes: String(raw.personalizationNotes ?? ""),
    numberOfBoxes: Number.isFinite(boxes) && boxes >= 1 ? Math.floor(boxes) : 1,
    occasion: String(raw.occasion ?? ""),
    budgetPerBox: String(raw.budgetPerBox ?? ""),
    packagingInstructions: String(raw.packagingInstructions ?? ""),
    deliveryRequirements: String(raw.deliveryRequirements ?? ""),
  };
}

function normalizeContact(value: unknown): BoxContact {
  if (!value || typeof value !== "object") return { ...EMPTY_CONTACT };
  const raw = value as Partial<BoxContact>;
  return {
    name: String(raw.name ?? ""),
    company: String(raw.company ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
  };
}

export function readBoxDraft(): BoxDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDraft();
    const parsed = JSON.parse(raw) as Partial<BoxDraft>;
    const products = Array.isArray(parsed.products)
      ? parsed.products.filter(isProduct).map((item) => ({
          ...item,
          quantityPerBox: Math.max(1, Math.floor(item.quantityPerBox)),
          amountInr:
            typeof item.amountInr === "number" && Number.isFinite(item.amountInr)
              ? item.amountInr
              : undefined,
        }))
      : [];
    return {
      step: isStep(parsed.step) ? parsed.step : "packaging",
      packaging: normalizePackaging(parsed.packaging),
      products,
      customization: normalizeCustomization(parsed.customization),
      contact: normalizeContact(parsed.contact),
      updatedAt: String(parsed.updatedAt ?? ""),
    };
  } catch {
    return emptyDraft();
  }
}

export function writeBoxDraft(draft: Omit<BoxDraft, "updatedAt"> | BoxDraft) {
  if (typeof window === "undefined") return;
  const next: BoxDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  emit();
}

export function clearBoxDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  emit();
}

export function setBoxStep(step: BoxStep) {
  const draft = readBoxDraft();
  writeBoxDraft({ ...draft, step });
}

export function setBoxPackaging(packaging: PackagingChoice) {
  const draft = readBoxDraft();
  writeBoxDraft({ ...draft, packaging });
}

export function isInBox(id: string, draft?: BoxDraft) {
  const source = draft ?? readBoxDraft();
  return source.products.some((item) => item.id === id);
}

export function getBoxProductQuantity(id: string, draft?: BoxDraft) {
  const source = draft ?? readBoxDraft();
  return source.products.find((item) => item.id === id)?.quantityPerBox ?? 0;
}

function boxLineMinQuantity(minQuantity?: number) {
  return minQuantity && minQuantity > 0 ? minQuantity : 1;
}

export function addToBox(
  snapshot: BoxProductSnapshot,
  quantityPerBox = 1,
): BoxDraft {
  const draft = readBoxDraft();
  const min = boxLineMinQuantity(snapshot.minQuantity);
  const qty = Math.max(min, Math.floor(quantityPerBox) || min);
  const existing = draft.products.find((item) => item.id === snapshot.id);
  // Already in box: keep quantity; adjust via Build a Box qty controls (no silent +1).
  if (existing) {
    writeBoxDraft({ ...draft, step: "products" });
    return readBoxDraft();
  }
  const products: BoxProductItem[] = [
    ...draft.products,
    {
      id: snapshot.id,
      slug: snapshot.slug,
      name: snapshot.name,
      imageSrc: snapshot.imageSrc,
      priceLabel: snapshot.priceLabel,
      amountInr: snapshot.amountInr,
      quantityPerBox: snapshot.quantityPerBox
        ? Math.max(min, Math.floor(snapshot.quantityPerBox))
        : qty,
      categoryName: snapshot.categoryName,
      minQuantity: snapshot.minQuantity,
    },
  ];
  // Keep buyers on the products step when adding from the catalogue
  writeBoxDraft({ ...draft, products, step: "products" });
  return readBoxDraft();
}

export function removeFromBox(id: string): BoxDraft {
  const draft = readBoxDraft();
  writeBoxDraft({
    ...draft,
    products: draft.products.filter((item) => item.id !== id),
  });
  return readBoxDraft();
}

export function setBoxProductQuantity(id: string, quantityPerBox: number): BoxDraft {
  const draft = readBoxDraft();
  writeBoxDraft({
    ...draft,
    products: draft.products.map((item) => {
      if (item.id !== id) return item;
      const min = boxLineMinQuantity(item.minQuantity);
      return {
        ...item,
        quantityPerBox: Math.max(min, Math.floor(quantityPerBox) || min),
      };
    }),
  });
  return readBoxDraft();
}

export function clearBoxProducts(): BoxDraft {
  const draft = readBoxDraft();
  writeBoxDraft({ ...draft, products: [] });
  return readBoxDraft();
}

export function updateBoxCustomization(
  patch: Partial<BoxCustomization>,
): BoxDraft {
  const draft = readBoxDraft();
  const customization = { ...draft.customization, ...patch };
  if (typeof patch.numberOfBoxes === "number") {
    customization.numberOfBoxes = Math.max(
      1,
      Math.floor(patch.numberOfBoxes) || 1,
    );
  }
  writeBoxDraft({ ...draft, customization });
  return readBoxDraft();
}

export function updateBoxContact(patch: Partial<BoxContact>): BoxDraft {
  const draft = readBoxDraft();
  writeBoxDraft({
    ...draft,
    contact: { ...draft.contact, ...patch },
  });
  return readBoxDraft();
}

export function boxProductCount(draft?: BoxDraft) {
  return (draft ?? readBoxDraft()).products.length;
}

export function boxUnitsPerBox(draft?: BoxDraft) {
  return (draft ?? readBoxDraft()).products.reduce(
    (sum, item) => sum + item.quantityPerBox,
    0,
  );
}

export function estimateBoxPricing(draft: BoxDraft): BoxPriceEstimate {
  let pricedSubtotalInr = 0;
  let pricedLineCount = 0;
  let unpricedLineCount = 0;
  const boxes = draft.customization.numberOfBoxes;

  for (const item of draft.products) {
    if (typeof item.amountInr === "number" && Number.isFinite(item.amountInr)) {
      pricedSubtotalInr += item.amountInr * item.quantityPerBox * boxes;
      pricedLineCount += 1;
    } else {
      unpricedLineCount += 1;
    }
  }

  const allLinesPriced =
    draft.products.length > 0 && unpricedLineCount === 0;

  return {
    pricedSubtotalInr:
      pricedLineCount > 0 ? pricedSubtotalInr : null,
    pricedLineCount,
    unpricedLineCount,
    allLinesPriced,
  };
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function packagingSummary(packaging: PackagingChoice | null): string {
  if (!packaging) return "Not chosen yet";
  if (packaging.kind === "pending") {
    return packaging.note.trim()
      ? `Packaging to be confirmed — ${packaging.note.trim()}`
      : "Packaging to be confirmed";
  }
  return packaging.name;
}

export function validateLogoFile(file: File): string | null {
  if (
    !LOGO_ALLOWED_TYPES.includes(
      file.type as (typeof LOGO_ALLOWED_TYPES)[number],
    )
  ) {
    return "Use a PNG, JPG, WebP, or SVG logo file.";
  }
  if (file.size > LOGO_MAX_BYTES) {
    return `Logo must be under ${Math.round(LOGO_MAX_BYTES / 1024)}KB for local draft storage.`;
  }
  return null;
}

export function readLogoAsDraft(file: File): Promise<BoxLogoDraft> {
  return new Promise((resolve, reject) => {
    const error = validateLogoFile(file);
    if (error) {
      reject(new Error(error));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : undefined;
      resolve({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        dataUrl,
      });
    };
    reader.onerror = () => reject(new Error("Could not read the logo file."));
    reader.readAsDataURL(file);
  });
}

/** Sync box config into the unified gifting brief (merge-safe; does not wipe other sources). */
export function syncBoxDraftToBrief(draft: BoxDraft) {
  const logo = draft.customization.logo
    ? {
        fileName: draft.customization.logo.fileName,
        fileType: draft.customization.logo.fileType,
        fileSize: draft.customization.logo.fileSize,
        hasBinary: Boolean(draft.customization.logo.dataUrl),
      }
    : null;

  writeBrief({
    occasion: draft.customization.occasion,
    budget: draft.customization.budgetPerBox
      ? `${draft.customization.budgetPerBox} per box`
      : undefined,
    // numberOfBoxes stays on sources.box — do not overwrite programme recipientCount
    branding: draft.customization.brandingRequirements || undefined,
    packagingPrefs:
      packagingSummary(draft.packaging) !== "Not chosen yet"
        ? packagingSummary(draft.packaging)
        : draft.customization.packagingInstructions || undefined,
    delivery: draft.customization.deliveryRequirements || undefined,
    contact: {
      name: draft.contact.name || undefined,
      company: draft.contact.company || draft.customization.companyName || undefined,
      email: draft.contact.email || undefined,
      phone: draft.contact.phone || undefined,
    },
    productIds: draft.products.map((item) => item.id),
    sources: {
      box: {
        linkedAt: new Date().toISOString(),
        packagingSummary: packagingSummary(draft.packaging),
        productCount: draft.products.length,
        numberOfBoxes: draft.customization.numberOfBoxes,
        productLines: draft.products.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          quantityPerBox: item.quantityPerBox,
          priceLabel: item.priceLabel,
        })),
        companyName: draft.customization.companyName,
        occasion: draft.customization.occasion,
        budgetPerBox: draft.customization.budgetPerBox,
        brandingRequirements: draft.customization.brandingRequirements,
        giftMessage: draft.customization.giftMessage,
        personalizationNotes: draft.customization.personalizationNotes,
        packagingInstructions: draft.customization.packagingInstructions,
        deliveryRequirements: draft.customization.deliveryRequirements,
        logo,
      },
    },
  });
}

export function buildBoxQuotationPrepText(draft: BoxDraft): string {
  const estimate = estimateBoxPricing(draft);
  const lines = [
    "Monkcraft Build a Box — quotation preparation",
    "=============================================",
    "",
    "Packaging",
    packagingSummary(draft.packaging),
    "",
    "Box contents (quantity per box)",
  ];

  if (draft.products.length === 0) {
    lines.push("— no products selected —");
  } else {
    for (const item of draft.products) {
      lines.push(
        `- ${item.name} (id: ${item.id}) · ${item.quantityPerBox} per box` +
          (item.priceLabel ? ` · ${item.priceLabel}` : "") +
          (typeof item.amountInr === "number" ? "" : " · price to confirm") +
          (item.slug ? ` · /gifts/${item.slug}` : ""),
      );
    }
  }

  lines.push(
    "",
    "Programme",
    `Company: ${draft.customization.companyName || "—"}`,
    `Occasion: ${draft.customization.occasion || "—"}`,
    `Number of complete gift boxes: ${draft.customization.numberOfBoxes}`,
    `Target budget per box: ${draft.customization.budgetPerBox || "—"}`,
    `Branding / corporate requirements: ${draft.customization.brandingRequirements || "—"}`,
    `Gift message: ${draft.customization.giftMessage || "—"}`,
    `Personalisation notes: ${draft.customization.personalizationNotes || "—"}`,
    `Special packaging instructions: ${draft.customization.packagingInstructions || "—"}`,
    `Delivery requirements: ${draft.customization.deliveryRequirements || "—"}`,
  );

  if (draft.customization.logo) {
    lines.push(
      `Logo (local draft only): ${draft.customization.logo.fileName} (${draft.customization.logo.fileType}, ${draft.customization.logo.fileSize} bytes) — not uploaded to a server`,
    );
  } else {
    lines.push("Logo: none attached in this draft");
  }

  lines.push("", "Price notes");
  if (estimate.pricedLineCount > 0 && estimate.pricedSubtotalInr !== null) {
    lines.push(
      `Verified catalogue line estimate (products only): ${formatInr(estimate.pricedSubtotalInr)}` +
        (estimate.allLinesPriced
          ? " — all selected products have catalogue unit prices"
          : ` — covers ${estimate.pricedLineCount} priced line(s); ${estimate.unpricedLineCount} line(s) still quote-on-request`),
    );
  } else {
    lines.push("No verified product subtotal available yet.");
  }
  lines.push(
    "Quantity discounts, taxes/GST, shipping, packaging, and customisation charges require confirmation.",
    "This is not a final price.",
    "",
    "Contact",
    `Name: ${draft.contact.name || "—"}`,
    `Company: ${draft.contact.company || draft.customization.companyName || "—"}`,
    `Email: ${draft.contact.email || "—"}`,
    `Phone: ${draft.contact.phone || "—"}`,
    "",
    "Note: Inbox routing is not connected yet. Please send this brief to Monkcraft via your usual channel or the homepage contact form.",
  );

  return lines.join("\n");
}

export function stepIndex(step: BoxStep) {
  return BOX_STEPS.indexOf(step);
}

export function canEnterStep(draft: BoxDraft, step: BoxStep): boolean {
  const target = stepIndex(step);
  if (target <= 0) return true;
  // Packaging must be chosen (including honest pending) before later steps
  if (!draft.packaging && target >= stepIndex("products")) return false;
  if (target >= stepIndex("customize") && draft.products.length === 0) {
    return false;
  }
  if (target >= stepIndex("review")) {
    if (!draft.customization.companyName.trim()) return false;
    if (!draft.customization.occasion.trim()) return false;
    if (draft.customization.numberOfBoxes < 1) return false;
  }
  if (target >= stepIndex("quote")) {
    // Review is informational; quote needs the same core fields
    return canEnterStep(draft, "review");
  }
  return true;
}
