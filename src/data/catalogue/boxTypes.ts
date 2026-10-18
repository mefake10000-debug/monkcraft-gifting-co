/**
 * Build-a-Box domain types.
 * Draft-only — no production inventory, payments, or packaging catalogue yet.
 */

export type BoxStep =
  | "packaging"
  | "products"
  | "quote";

export const BOX_STEPS: BoxStep[] = [
  "products",
  "packaging",
  "quote",
];

export const BOX_STEP_LABELS: Record<BoxStep, string> = {
  products: "Products",
  packaging: "Packaging",
  quote: "Review & request",
};

/** Approved packaging SKU when a real catalogue exists. */
export type PackagingOption = {
  id: string;
  name: string;
  summary: string;
  /** Only set when dimensions are verified in source data */
  dimensionsLabel?: string;
  /** Only set when a verified price exists */
  priceLabel?: string;
  imageSrc?: string;
  packagingKind?: "box" | "tote";
};

export type PackagingChoice =
  | {
      kind: "pending";
      /** Optional buyer note while packaging is TBD */
      note: string;
    }
  | {
      kind: "selected";
      optionId: string;
      name: string;
      summary: string;
      dimensionsLabel?: string;
      priceLabel?: string;
      imageSrc?: string;
      packagingKind?: "box" | "tote";
    };

/** Product line inside one gift box (qty is per box, not programme total). */
export type BoxProductItem = {
  id: string;
  slug: string;
  name: string;
  imageSrc?: string;
  priceLabel: string;
  /** Present only when catalogue has a verified fixed INR amount */
  amountInr?: number;
  quantityPerBox: number;
  categoryName?: string;
  minQuantity?: number;
};

export type BoxLogoDraft = {
  fileName: string;
  fileType: string;
  fileSize: number;
  /** Small previews only — never treated as a server upload */
  dataUrl?: string;
};

export type BoxCustomization = {
  companyName: string;
  brandingRequirements: string;
  logo: BoxLogoDraft | null;
  giftMessage: string;
  personalizationNotes: string;
  /** Complete gift boxes in the programme */
  numberOfBoxes: number;
  occasion: string;
  budgetPerBox: string;
  packagingInstructions: string;
  deliveryRequirements: string;
  dispatchType: "single-city" | "multi-point" | "international" | "";
};

export type BoxContact = {
  name: string;
  company: string;
  email: string;
  phone: string;
};

export type BoxDraft = {
  step: BoxStep;
  packaging: PackagingChoice | null;
  products: BoxProductItem[];
  customization: BoxCustomization;
  contact: BoxContact;
  updatedAt: string;
};

export type BoxProductSnapshot = Omit<BoxProductItem, "quantityPerBox"> & {
  quantityPerBox?: number;
};

export type BoxPriceEstimate = {
  /** Sum of verified unit prices × qty per box × number of boxes */
  pricedSubtotalInr: number | null;
  pricedLineCount: number;
  unpricedLineCount: number;
  allLinesPriced: boolean;
  packagingPerBoxInr: number | null;
  packagingTotalInr: number | null;
};
