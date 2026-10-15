"use client";

import type {
  BriefBoxSource,
  BriefCompanyStoreSource,
  BriefContact,
  BriefLogoMeta,
  BriefSources,
  BriefStudioBrandingSource,
  BriefStudioCatalogueSource,
  GiftingBriefDraft,
  ShortlistItem,
} from "@/data/catalogue/types";

const STORAGE_KEY_V2 = "monkcraft-brief-v2";
const STORAGE_KEY_V1 = "monkcraft-brief-v1";
export const BRIEF_EVENT = "monkcraft:brief";
export const BRIEF_SCHEMA_VERSION = 2 as const;

const EMPTY_CONTACT: BriefContact = {
  name: "",
  company: "",
  email: "",
  phone: "",
};

const EMPTY_SOURCES: BriefSources = {
  box: null,
  studioBranding: null,
  studioCatalogue: null,
  companyStore: null,
};

const EMPTY: GiftingBriefDraft = {
  schemaVersion: BRIEF_SCHEMA_VERSION,
  occasion: "",
  audience: "",
  recipientCount: "",
  budgetPerRecipient: "",
  branding: "",
  packagingPrefs: "",
  deliveryDate: "",
  deliveryLocation: "",
  notes: "",
  contact: { ...EMPTY_CONTACT },
  productIds: [],
  sources: { ...EMPTY_SOURCES },
  updatedAt: "",
};

function emit() {
  window.dispatchEvent(new CustomEvent(BRIEF_EVENT));
}

function asLogoMeta(value: unknown): BriefLogoMeta | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as BriefLogoMeta;
  if (typeof raw.fileName !== "string" || typeof raw.fileType !== "string") {
    return null;
  }
  return {
    fileName: raw.fileName,
    fileType: raw.fileType,
    fileSize: Number(raw.fileSize) || 0,
    hasBinary: Boolean(raw.hasBinary),
  };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string");
}

function normalizeContact(value: unknown): BriefContact {
  if (!value || typeof value !== "object") return { ...EMPTY_CONTACT };
  const raw = value as Partial<BriefContact>;
  return {
    name: String(raw.name ?? ""),
    company: String(raw.company ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
  };
}

function normalizeBoxSource(value: unknown): BriefBoxSource | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<BriefBoxSource>;
  const lines = Array.isArray(raw.productLines)
    ? raw.productLines
        .filter(
          (line): line is BriefBoxSource["productLines"][number] =>
            !!line &&
            typeof line === "object" &&
            typeof line.id === "string" &&
            typeof line.name === "string",
        )
        .map((line) => ({
          id: line.id,
          slug: String(line.slug ?? ""),
          name: line.name,
          quantityPerBox: Math.max(1, Math.floor(Number(line.quantityPerBox) || 1)),
          priceLabel: String(line.priceLabel ?? ""),
        }))
    : [];
  return {
    linkedAt: String(raw.linkedAt ?? ""),
    packagingSummary: String(raw.packagingSummary ?? ""),
    productCount: Number(raw.productCount) || lines.length,
    numberOfBoxes: Math.max(1, Math.floor(Number(raw.numberOfBoxes) || 1)),
    productLines: lines,
    companyName: String(raw.companyName ?? ""),
    occasion: String(raw.occasion ?? ""),
    budgetPerBox: String(raw.budgetPerBox ?? ""),
    brandingRequirements: String(raw.brandingRequirements ?? ""),
    giftMessage: String(raw.giftMessage ?? ""),
    personalizationNotes: String(raw.personalizationNotes ?? ""),
    packagingInstructions: String(raw.packagingInstructions ?? ""),
    deliveryRequirements: String(raw.deliveryRequirements ?? ""),
    logo: asLogoMeta(raw.logo),
  };
}

function normalizeStudioBranding(value: unknown): BriefStudioBrandingSource | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<BriefStudioBrandingSource>;
  const t = raw.transform && typeof raw.transform === "object" ? raw.transform : null;
  return {
    linkedAt: String(raw.linkedAt ?? ""),
    productId: typeof raw.productId === "string" ? raw.productId : null,
    productSlug: typeof raw.productSlug === "string" ? raw.productSlug : null,
    productName: typeof raw.productName === "string" ? raw.productName : null,
    productSku: typeof raw.productSku === "string" ? raw.productSku : null,
    priceLabel: typeof raw.priceLabel === "string" ? raw.priceLabel : null,
    customizationNote:
      typeof raw.customizationNote === "string" ? raw.customizationNote : null,
    text: String(raw.text ?? ""),
    textEnabled: Boolean(raw.textEnabled),
    transform: {
      x: Number(t?.x) || 0.5,
      y: Number(t?.y) || 0.42,
      scale: Number(t?.scale) || 0.28,
      rotation: Number(t?.rotation) || 0,
    },
    logo: asLogoMeta(raw.logo),
  };
}

function normalizeStudioCatalogue(value: unknown): BriefStudioCatalogueSource | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<BriefStudioCatalogueSource>;
  return {
    linkedAt: String(raw.linkedAt ?? ""),
    title: String(raw.title ?? ""),
    companyName: String(raw.companyName ?? ""),
    productIds: asStringArray(raw.productIds),
    productSummaries: asStringArray(raw.productSummaries),
    pricingMode: String(raw.pricingMode ?? ""),
    logo: asLogoMeta(raw.logo),
  };
}

function normalizeCompanyStore(value: unknown): BriefCompanyStoreSource | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<BriefCompanyStoreSource>;
  return {
    linkedAt: String(raw.linkedAt ?? ""),
    companyName: String(raw.companyName ?? ""),
    storeName: String(raw.storeName ?? ""),
    productCount: Number(raw.productCount) || 0,
    productIds: asStringArray(raw.productIds),
    rulesLabel: String(raw.rulesLabel ?? ""),
  };
}

function normalizeSources(value: unknown): BriefSources {
  if (!value || typeof value !== "object") return { ...EMPTY_SOURCES };
  const raw = value as Partial<BriefSources>;
  return {
    box: normalizeBoxSource(raw.box),
    studioBranding: normalizeStudioBranding(raw.studioBranding),
    studioCatalogue: normalizeStudioCatalogue(raw.studioCatalogue),
    companyStore: normalizeCompanyStore(raw.companyStore),
  };
}

function migrateV1(raw: string): GiftingBriefDraft | null {
  try {
    const parsed = JSON.parse(raw) as Partial<{
      occasion: string;
      budget: string;
      quantity: string;
      branding: string;
      delivery: string;
      notes: string;
      productIds: string[];
      updatedAt: string;
    }>;
    return {
      ...EMPTY,
      occasion: String(parsed.occasion ?? ""),
      audience: "",
      recipientCount: String(parsed.quantity ?? ""),
      budgetPerRecipient: String(parsed.budget ?? ""),
      branding: String(parsed.branding ?? ""),
      packagingPrefs: "",
      deliveryDate: "",
      deliveryLocation: String(parsed.delivery ?? ""),
      notes: String(parsed.notes ?? ""),
      contact: { ...EMPTY_CONTACT },
      productIds: asStringArray(parsed.productIds),
      sources: { ...EMPTY_SOURCES },
      updatedAt: String(parsed.updatedAt ?? ""),
    };
  } catch {
    return null;
  }
}

function normalizeDraft(parsed: Partial<GiftingBriefDraft>): GiftingBriefDraft {
  // Accept accidental v1 keys on a v2 blob
  const legacy = parsed as Partial<GiftingBriefDraft> & {
    budget?: string;
    quantity?: string;
    delivery?: string;
  };
  return {
    schemaVersion: BRIEF_SCHEMA_VERSION,
    occasion: String(parsed.occasion ?? ""),
    audience: String(parsed.audience ?? ""),
    recipientCount: String(
      parsed.recipientCount ?? legacy.quantity ?? "",
    ),
    budgetPerRecipient: String(
      parsed.budgetPerRecipient ?? legacy.budget ?? "",
    ),
    branding: String(parsed.branding ?? ""),
    packagingPrefs: String(parsed.packagingPrefs ?? ""),
    deliveryDate: String(parsed.deliveryDate ?? ""),
    deliveryLocation: String(
      parsed.deliveryLocation ?? legacy.delivery ?? "",
    ),
    notes: String(parsed.notes ?? ""),
    contact: normalizeContact(parsed.contact),
    productIds: asStringArray(parsed.productIds),
    sources: normalizeSources(parsed.sources),
    updatedAt: String(parsed.updatedAt ?? ""),
  };
}

export function emptyBrief(): GiftingBriefDraft {
  return {
    ...EMPTY,
    contact: { ...EMPTY_CONTACT },
    sources: { ...EMPTY_SOURCES },
    productIds: [],
  };
}

export function readBrief(): GiftingBriefDraft {
  if (typeof window === "undefined") return emptyBrief();
  try {
    const v2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (v2) {
      return normalizeDraft(JSON.parse(v2) as Partial<GiftingBriefDraft>);
    }
    const v1 = window.localStorage.getItem(STORAGE_KEY_V1);
    if (v1) {
      const migrated = migrateV1(v1);
      if (migrated) {
        persist(migrated);
        window.localStorage.removeItem(STORAGE_KEY_V1);
        return migrated;
      }
    }
    return emptyBrief();
  } catch {
    return emptyBrief();
  }
}

function persist(draft: GiftingBriefDraft) {
  if (typeof window === "undefined") return;
  const next: GiftingBriefDraft = {
    ...draft,
    schemaVersion: BRIEF_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(next));
  emit();
}

/** Full programme save from the workspace form (may clear fields). */
export function saveBriefProgramme(
  draft: Omit<GiftingBriefDraft, "updatedAt" | "schemaVersion">,
) {
  persist({
    ...draft,
    schemaVersion: BRIEF_SCHEMA_VERSION,
    updatedAt: "",
  });
}

export type BriefFieldMode = "fill-empty" | "merge-nonempty" | "replace";

export type BriefPatch = {
  occasion?: string;
  audience?: string;
  recipientCount?: string;
  budgetPerRecipient?: string;
  branding?: string;
  packagingPrefs?: string;
  deliveryDate?: string;
  deliveryLocation?: string;
  notes?: string;
  contact?: Partial<BriefContact>;
  productIds?: string[];
  /** When true (default for sync), union product ids instead of replacing */
  unionProductIds?: boolean;
  sources?: Partial<BriefSources>;
  /**
   * fill-empty (default): only write when current field is blank — safe for syncers.
   * merge-nonempty: apply non-empty next; keep current if next is blank.
   * replace: always apply provided fields (workspace form saves).
   */
  fieldMode?: BriefFieldMode;
  /** @deprecated Prefer fieldMode: "replace" */
  overwriteEmpty?: boolean;
};

function applyString(
  current: string,
  next: string | undefined,
  mode: BriefFieldMode,
): string {
  if (next === undefined) return current;
  if (mode === "replace") return next;
  if (mode === "fill-empty") return current.trim() ? current : next;
  // merge-nonempty
  if (next.trim() === "" && current.trim() !== "") return current;
  return next;
}

/** Merge patch into the current brief without wiping sibling sources. */
export function patchBrief(patch: BriefPatch): GiftingBriefDraft {
  const current = readBrief();
  const mode: BriefFieldMode = patch.overwriteEmpty
    ? "replace"
    : (patch.fieldMode ?? "fill-empty");
  const unionIds = patch.unionProductIds !== false;
  const next: GiftingBriefDraft = {
    ...current,
    occasion: applyString(current.occasion, patch.occasion, mode),
    audience: applyString(current.audience, patch.audience, mode),
    recipientCount: applyString(
      current.recipientCount,
      patch.recipientCount,
      mode,
    ),
    budgetPerRecipient: applyString(
      current.budgetPerRecipient,
      patch.budgetPerRecipient,
      mode,
    ),
    branding: applyString(current.branding, patch.branding, mode),
    packagingPrefs: applyString(
      current.packagingPrefs,
      patch.packagingPrefs,
      mode,
    ),
    deliveryDate: applyString(current.deliveryDate, patch.deliveryDate, mode),
    deliveryLocation: applyString(
      current.deliveryLocation,
      patch.deliveryLocation,
      mode,
    ),
    notes: applyString(current.notes, patch.notes, mode),
    contact: patch.contact
      ? {
          name: applyString(current.contact.name, patch.contact.name, mode),
          company: applyString(
            current.contact.company,
            patch.contact.company,
            mode,
          ),
          email: applyString(current.contact.email, patch.contact.email, mode),
          phone: applyString(current.contact.phone, patch.contact.phone, mode),
        }
      : current.contact,
    productIds: patch.productIds
      ? unionIds
        ? Array.from(new Set([...current.productIds, ...patch.productIds]))
        : patch.productIds
      : current.productIds,
    sources: patch.sources
      ? {
          box:
            patch.sources.box !== undefined
              ? patch.sources.box
              : current.sources.box,
          studioBranding:
            patch.sources.studioBranding !== undefined
              ? patch.sources.studioBranding
              : current.sources.studioBranding,
          studioCatalogue:
            patch.sources.studioCatalogue !== undefined
              ? patch.sources.studioCatalogue
              : current.sources.studioCatalogue,
          companyStore:
            patch.sources.companyStore !== undefined
              ? patch.sources.companyStore
              : current.sources.companyStore,
        }
      : current.sources,
  };
  persist(next);
  return readBrief();
}

/**
 * Compat write used by older callers (box / studio sync, brief form).
 * Maps v1 field names and merges non-empty values by default.
 */
export function writeBrief(
  draft: {
    occasion?: string;
    budget?: string;
    quantity?: string;
    branding?: string;
    delivery?: string;
    notes?: string;
    productIds?: string[];
    audience?: string;
    recipientCount?: string;
    budgetPerRecipient?: string;
    packagingPrefs?: string;
    deliveryDate?: string;
    deliveryLocation?: string;
    contact?: Partial<BriefContact>;
    sources?: Partial<BriefSources>;
    fieldMode?: BriefFieldMode;
    overwriteEmpty?: boolean;
    unionProductIds?: boolean;
  },
) {
  return patchBrief({
    occasion: draft.occasion,
    audience: draft.audience,
    recipientCount: draft.recipientCount ?? draft.quantity,
    budgetPerRecipient: draft.budgetPerRecipient ?? draft.budget,
    branding: draft.branding,
    packagingPrefs: draft.packagingPrefs,
    deliveryDate: draft.deliveryDate,
    deliveryLocation: draft.deliveryLocation ?? draft.delivery,
    notes: draft.notes,
    productIds: draft.productIds,
    contact: draft.contact,
    sources: draft.sources,
    fieldMode: draft.fieldMode,
    overwriteEmpty: draft.overwriteEmpty,
    unionProductIds: draft.unionProductIds,
  });
}

export function clearBrief() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY_V2);
  window.localStorage.removeItem(STORAGE_KEY_V1);
  emit();
}

export function briefHasProgramme(brief?: GiftingBriefDraft) {
  const b = brief ?? readBrief();
  return Boolean(
    b.occasion.trim() ||
      b.audience.trim() ||
      b.recipientCount.trim() ||
      b.budgetPerRecipient.trim() ||
      b.branding.trim() ||
      b.packagingPrefs.trim() ||
      b.deliveryDate.trim() ||
      b.deliveryLocation.trim() ||
      b.notes.trim() ||
      b.sources.box ||
      b.sources.studioBranding ||
      b.sources.studioCatalogue ||
      b.sources.companyStore,
  );
}

export function briefLinkedSourceCount(brief?: GiftingBriefDraft) {
  const b = brief ?? readBrief();
  let count = 0;
  if (b.sources.box) count += 1;
  if (b.sources.studioBranding) count += 1;
  if (b.sources.studioCatalogue) count += 1;
  if (b.sources.companyStore) count += 1;
  return count;
}

export type BriefMissingItem = {
  id: string;
  label: string;
  severity: "required" | "recommended";
};

export type BriefLiveContext = {
  /** Live Build a Box draft has products (even if not yet written to brief.sources). */
  hasLiveBoxProducts?: boolean;
  liveBoxNumberOfBoxes?: number;
  liveBoxBudgetPerBox?: string;
};

export function getBriefMissingDetails(
  brief: GiftingBriefDraft,
  products: ShortlistItem[],
  live?: BriefLiveContext,
): BriefMissingItem[] {
  const missing: BriefMissingItem[] = [];
  const hasProducts =
    products.length > 0 ||
    Boolean(brief.sources.box?.productCount) ||
    Boolean(live?.hasLiveBoxProducts) ||
    Boolean(brief.sources.studioBranding?.productId) ||
    Boolean(brief.sources.studioCatalogue?.productIds.length) ||
    Boolean(brief.sources.companyStore?.productCount);

  if (!hasProducts) {
    missing.push({
      id: "products",
      label: "Add at least one catalogue product, box, or Studio selection",
      severity: "required",
    });
  }
  if (!brief.occasion.trim()) {
    missing.push({
      id: "occasion",
      label: "Occasion",
      severity: "required",
    });
  }
  const hasBoxCount =
    Boolean(brief.sources.box?.numberOfBoxes) ||
    (typeof live?.liveBoxNumberOfBoxes === "number" &&
      live.liveBoxNumberOfBoxes >= 1 &&
      Boolean(live.hasLiveBoxProducts));
  if (!brief.recipientCount.trim() && !hasBoxCount) {
    missing.push({
      id: "recipientCount",
      label: "Recipient count or number of boxes",
      severity: "recommended",
    });
  }
  const hasBoxBudget =
    Boolean(brief.sources.box?.budgetPerBox?.trim()) ||
    Boolean(live?.liveBoxBudgetPerBox?.trim());
  if (!brief.budgetPerRecipient.trim() && !hasBoxBudget) {
    missing.push({
      id: "budget",
      label: "Target budget",
      severity: "recommended",
    });
  }
  if (!brief.deliveryLocation.trim() && !brief.deliveryDate.trim()) {
    missing.push({
      id: "delivery",
      label: "Delivery city/region or desired date",
      severity: "recommended",
    });
  }
  return missing;
}

function logoLine(logo: BriefLogoMeta | null, context: string): string {
  if (!logo) return `${context}: none noted`;
  return (
    `${context}: ${logo.fileName} (${logo.fileType}, ${logo.fileSize} bytes)` +
    (logo.hasBinary
      ? " — binary stays in the source draft browser storage; re-attach the original file when emailing Monkcraft"
      : " — re-attach the logo file when contacting Monkcraft (not stored on this brief)")
  );
}

export type QuotationPrepOptions = {
  brief: GiftingBriefDraft;
  products: ShortlistItem[];
  contact?: Partial<BriefContact>;
  /** Optional live price notes from Build a Box estimate */
  boxPriceNote?: string;
};

/**
 * Human-readable quotation preparation summary.
 * Distinguishes catalogue labels from final quotes; never invents totals.
 */
export function buildQuotationPrepText({
  brief,
  products,
  contact,
  boxPriceNote,
}: QuotationPrepOptions): string {
  const c = {
    ...brief.contact,
    ...contact,
  };

  const lines = [
    "Monkcraft gifting brief / quotation preparation",
    "==============================================",
    "",
    "Programme context",
    `Occasion: ${brief.occasion || "—"}`,
    `Audience / recipient group: ${brief.audience || "—"}`,
    `Total recipients / quantity: ${brief.recipientCount || "—"}`,
    `Target budget per recipient/box: ${brief.budgetPerRecipient || "—"}`,
    `Custom branding: ${brief.branding || "—"}`,
    `Packaging preferences: ${brief.packagingPrefs || "—"}`,
    `Desired delivery date: ${brief.deliveryDate || "—"}`,
    `Delivery city/region / multi-address notes: ${brief.deliveryLocation || "—"}`,
    `Additional notes: ${brief.notes || "—"}`,
    "",
    "Selected catalogue products (shortlist)",
  ];

  if (products.length === 0) {
    lines.push("— none shortlisted —");
  } else {
    for (const item of products) {
      const priceNote = item.priceLabel?.trim()
        ? item.priceLabel
        : "price to confirm";
      lines.push(
        `- ${item.name} (id: ${item.id}) · qty ${item.quantity}` +
          ` · ${priceNote}` +
          (item.slug ? ` · /gifts/${item.slug}` : "") +
          (item.categoryName ? ` · ${item.categoryName}` : ""),
      );
    }
  }

  const box = brief.sources.box;
  if (box) {
    lines.push("", "Build a Box configuration");
    lines.push(`Packaging: ${box.packagingSummary || "—"}`);
    lines.push(`Number of complete gift boxes: ${box.numberOfBoxes}`);
    lines.push(`Company (box draft): ${box.companyName || "—"}`);
    lines.push(`Box occasion: ${box.occasion || "—"}`);
    lines.push(`Budget per box: ${box.budgetPerBox || "—"}`);
    lines.push(`Branding requirements: ${box.brandingRequirements || "—"}`);
    lines.push(`Gift message: ${box.giftMessage || "—"}`);
    lines.push(`Personalisation: ${box.personalizationNotes || "—"}`);
    lines.push(`Packaging instructions: ${box.packagingInstructions || "—"}`);
    lines.push(`Box delivery notes: ${box.deliveryRequirements || "—"}`);
    lines.push(logoLine(box.logo, "Box logo"));
    if (box.productLines.length === 0) {
      lines.push("Box contents: — none —");
    } else {
      lines.push("Box contents (qty per box):");
      for (const item of box.productLines) {
        lines.push(
          `- ${item.name} (id: ${item.id}) · ${item.quantityPerBox}/box · ${item.priceLabel || "price to confirm"}` +
            (item.slug ? ` · /gifts/${item.slug}` : ""),
        );
      }
    }
    if (boxPriceNote) lines.push(boxPriceNote);
  }

  const branding = brief.sources.studioBranding;
  if (branding) {
    lines.push("", "Studio — product branding mockup (conceptual)");
    lines.push(
      branding.productName
        ? `Product: ${branding.productName}` +
            (branding.productSku ? ` · SKU ${branding.productSku}` : "") +
            (branding.productId ? ` · id ${branding.productId}` : "") +
            (branding.productSlug ? ` · /gifts/${branding.productSlug}` : "")
        : "Product: not selected",
    );
    if (branding.priceLabel) {
      lines.push(`Catalogue price label: ${branding.priceLabel}`);
    }
    if (branding.customizationNote) {
      lines.push(`Catalogue branding note: ${branding.customizationNote}`);
    }
    lines.push(
      `Logo placement (conceptual): x=${branding.transform.x.toFixed(2)}, y=${branding.transform.y.toFixed(2)}, scale=${branding.transform.scale.toFixed(2)}, rotation=${Math.round(branding.transform.rotation)}°`,
    );
    lines.push(
      branding.textEnabled
        ? `Personalisation text: ${branding.text.trim() || "—"}`
        : "Personalisation text: off",
    );
    lines.push(logoLine(branding.logo, "Studio logo"));
    lines.push(
      "Preview is a conceptual mockup only — printable area, measurements, and decoration methods require confirmation.",
    );
  }

  const catalogue = brief.sources.studioCatalogue;
  if (catalogue) {
    lines.push("", "Studio — white-label catalogue draft");
    lines.push(`Title: ${catalogue.title || "—"}`);
    lines.push(`Prepared for / reseller: ${catalogue.companyName || "—"}`);
    lines.push(`Pricing display mode: ${catalogue.pricingMode || "—"}`);
    lines.push(logoLine(catalogue.logo, "Reseller logo"));
    if (catalogue.productSummaries.length === 0) {
      lines.push("Products: none selected");
    } else {
      lines.push("Products:");
      for (const summary of catalogue.productSummaries) {
        lines.push(`- ${summary}`);
      }
    }
    lines.push(
      "Displayed prices (if any) are derived from verified catalogue bases only; taxes, branding, and shipping are not included.",
    );
  }

  const store = brief.sources.companyStore;
  if (store) {
    lines.push("", "Company Store proposal (draft configurator)");
    lines.push(`Company: ${store.companyName || "—"}`);
    lines.push(`Proposed store: ${store.storeName || "—"}`);
    lines.push(`Merchandise selected: ${store.productCount} catalogue product(s)`);
    lines.push(`Draft rules: ${store.rulesLabel || "—"}`);
    lines.push(
      "This is a proposal draft from the Company Stores demo — not a provisioned live store.",
    );
  }

  lines.push(
    "",
    "Price & fulfilment notes",
    "Catalogue price labels above are verified where shown; many items remain quote-on-request.",
    "Quantity discounts, taxes/GST, shipping, packaging, and customisation charges require confirmation.",
    "Desired delivery dates are requests only — not a confirmed commitment.",
    "This summary is not a final quotation or order confirmation.",
  );

  lines.push(
    "",
    "Contact",
    `Name: ${c.name || "—"}`,
    `Company: ${c.company || "—"}`,
    `Email: ${c.email || "—"}`,
    `Phone: ${c.phone || "—"}`,
    "",
    "Delivery limitation: Online inbox routing is not connected yet.",
    "Copy this brief and share it with Monkcraft via email, WhatsApp, or consultation once those channels are configured — or use the homepage contact form.",
    "Do not treat this screen as a submitted quotation or confirmed order.",
  );

  return lines.join("\n");
}

export function buildMailtoHref(prepText: string, contactEmail?: string): string {
  const subject = encodeURIComponent("Monkcraft gifting quotation request");
  // Keep mailto under practical length limits; full text stays on Copy
  const limit = 1800;
  const truncated =
    prepText.length > limit
      ? `${prepText.slice(0, limit)}\n\n[…truncated for email length — use “Copy enquiry summary” for the full brief.]`
      : prepText;
  const body = encodeURIComponent(truncated);
  let to = contactEmail?.trim() || "";
  if (!to && typeof process !== "undefined") {
    const configured = process.env.NEXT_PUBLIC_MONKCRAFT_ENQUIRY_EMAIL?.trim();
    if (configured) to = configured;
  }
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

/** Compact WhatsApp-oriented lines from a prepared brief (customer reviews before send). */
export function buildBriefWhatsAppMessage(
  brief: GiftingBriefDraft,
  products: ShortlistItem[],
  contact?: Partial<BriefContact>,
): string {
  const c = { ...brief.contact, ...contact };
  const productLines = products.slice(0, 8).map((item) => ({
    name: item.name,
    id: item.id,
    quantity: item.quantity,
  }));
  if (productLines.length === 0 && brief.sources.box?.productLines.length) {
    for (const line of brief.sources.box.productLines.slice(0, 8)) {
      productLines.push({
        name: line.name,
        id: line.id,
        quantity: line.quantityPerBox,
      });
    }
  }

  // Lazy import avoided — keep string assembly local to brief for tree simplicity
  const parts = [
    "Hi Monkcraft — I'd like help with a corporate gifting programme.",
    c.company?.trim() ? `Company: ${c.company.trim()}` : "",
    brief.occasion.trim() ? `Occasion: ${brief.occasion.trim()}` : "",
    productLines.length
      ? `Products: ${productLines
          .map(
            (line) =>
              `${line.name}${line.id ? ` (${line.id})` : ""}${
                line.quantity != null ? ` ×${line.quantity}` : ""
              }`,
          )
          .join("; ")}`
      : "",
    brief.recipientCount.trim()
      ? `Quantity: ${brief.recipientCount.trim()}`
      : brief.sources.box
        ? `Boxes: ${brief.sources.box.numberOfBoxes}`
        : "",
    brief.budgetPerRecipient.trim()
      ? `Budget: ${brief.budgetPerRecipient.trim()}`
      : "",
    brief.branding.trim() ? `Branding: ${brief.branding.trim()}` : "",
    brief.notes.trim() ? `Notes: ${brief.notes.trim()}` : "",
  ].filter(Boolean);

  let message = parts.join("\n");
  if (message.length > 1200) {
    message = `${message.slice(0, 1199)}…`;
  }
  return message;
}
