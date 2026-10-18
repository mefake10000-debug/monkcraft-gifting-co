/**
 * Company Stores draft shapes — browser-local prototype only.
 * Prepares for multi-customer stores, auth, allowances, and fulfilment
 * without claiming production isolation or live commerce.
 */

import type { StudioLogoAsset } from "@/data/catalogue/studioTypes";

export const COMPANY_STORE_DRAFT_VERSION = 1 as const;

export type CompanyStoreIdentity = {
  companyName: string;
  storeName: string;
  storeTitle: string;
  welcomeMessage: string;
  /** CSS colour string for accent (draft branding) */
  accentColor: string;
  logo: StudioLogoAsset | null;
};

export type StoreCategory = {
  id: string;
  name: string;
  /** Ordered product ids assigned to this store category */
  productIds: string[];
};

export type StoreAccessRules = {
  /** Free-text draft requirement (e.g. work email domain) — not enforced */
  accessNote: string;
  requireWorkEmail: boolean;
  /** Config intent only — not live security */
  visibilityNote: string;
};

export type StoreAllowanceMode = "none" | "company-funded" | "allowance-cap";

export type StoreDeliveryPreference =
  | "office"
  | "home"
  | "either"
  | "undecided";

export type StoreOrderingRules = {
  maxItemsPerOrder: number | null;
  maxUnitsPerProduct: number | null;
  allowanceMode: StoreAllowanceMode;
  /** Draft cap in INR when allowanceMode is allowance-cap — NOT a live balance */
  allowanceCapInr: number | null;
  allowanceNote: string;
  requireApproval: boolean;
  approvalNote: string;
  deliveryPreference: StoreDeliveryPreference;
  deliveryNote: string;
};

export type CompanyStoreRules = {
  access: StoreAccessRules;
  ordering: StoreOrderingRules;
};

/**
 * Serializable store configuration draft.
 * Product ids reference the genuine Monkcraft catalogue only.
 */
export type CompanyStoreDraft = {
  version: typeof COMPANY_STORE_DRAFT_VERSION;
  identity: CompanyStoreIdentity;
  /** Master ordered selection of catalogue product ids */
  productIds: string[];
  categories: StoreCategory[];
  rules: CompanyStoreRules;
  updatedAt: string;
};

/** Selected product option when export data exposes multi-value attributes */
export type StoreVariantSelection = {
  label: string;
  value: string;
};

export type StoreOrderLine = {
  productId: string;
  slug: string;
  name: string;
  imageSrc?: string;
  priceLabel: string;
  amountInr?: number;
  quantity: number;
  variants: StoreVariantSelection[];
};

/**
 * Employee draft cart — local preview only.
 * Never stores private employee identity.
 */
export type StoreOrderDraft = {
  version: 1;
  lines: StoreOrderLine[];
  notes: string;
  deliveryAddress?: StoreDeliveryAddress;
  updatedAt: string;
};

export type StoreDeliveryAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
};

/**
 * Prepared order request snapshot for admin demo inbox.
 * Status is always draft — never a confirmed production order.
 */
export type StoreOrderRequest = {
  id: string;
  createdAt: string;
  status: "draft-prepared";
  lines: StoreOrderLine[];
  notes: string;
  deliveryAddress?: StoreDeliveryAddress;
  estimatedTotalInr: number | null;
  rulesLabel: string;
};

/** Future architecture placeholders (not implemented in V1) */
export type CompanyStoreFutureCapabilities =
  | "multi-customer-isolation"
  | "employee-auth"
  | "admin-permissions"
  | "company-catalogue-sync"
  | "live-allowances"
  | "approval-workflows"
  | "bulk-invites"
  | "multi-address-fulfilment"
  | "order-ingestion"
  | "inventory-pricing-sync"
  | "reporting"
  | "custom-domains";

export const DEFAULT_ACCENT = "#662F90";

export function emptyStoreIdentity(): CompanyStoreIdentity {
  return {
    companyName: "",
    storeName: "",
    storeTitle: "",
    welcomeMessage: "Browse the gifts selected for your team.",
    accentColor: DEFAULT_ACCENT,
    logo: null,
  };
}

export function emptyStoreRules(): CompanyStoreRules {
  return {
    access: {
      accessNote: "",
      requireWorkEmail: true,
      visibilityNote: "Employees see only merchandise selected for this store.",
    },
    ordering: {
      maxItemsPerOrder: null,
      maxUnitsPerProduct: null,
      allowanceMode: "none",
      allowanceCapInr: null,
      allowanceNote: "",
      requireApproval: false,
      approvalNote: "",
      deliveryPreference: "undecided",
      deliveryNote: "",
    },
  };
}

export function emptyCompanyStoreDraft(): CompanyStoreDraft {
  return {
    version: COMPANY_STORE_DRAFT_VERSION,
    identity: emptyStoreIdentity(),
    productIds: [],
    categories: [
      {
        id: "cat-general",
        name: "General",
        productIds: [],
      },
    ],
    rules: emptyStoreRules(),
    updatedAt: "",
  };
}
