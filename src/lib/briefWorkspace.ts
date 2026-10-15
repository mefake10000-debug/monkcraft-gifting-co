"use client";

/**
 * Assembles the unified My Gifting Brief workspace from live local drafts.
 * Avoids circular imports: sync helpers live in box/studio/companyStore modules.
 */

import type { BoxDraft } from "@/data/catalogue/boxTypes";
import type { GiftingBriefDraft, ShortlistItem } from "@/data/catalogue/types";
import type { BrandingDraft, WhiteLabelCatalogueDraft } from "@/data/catalogue/studioTypes";
import type { CompanyStoreDraft } from "@/data/companyStore/types";
import {
  briefLinkedSourceCount,
  buildQuotationPrepText,
  getBriefMissingDetails,
  patchBrief,
  readBrief,
  type BriefMissingItem,
  type QuotationPrepOptions,
} from "@/lib/brief";
import {
  estimateBoxPricing,
  formatInr,
  packagingSummary,
  readBoxDraft,
  syncBoxDraftToBrief,
} from "@/lib/box";
import { readCompanyStoreDraft } from "@/lib/companyStore/draft";
import { syncCompanyStoreDraftToBrief } from "@/lib/companyStore/briefSync";
import { readShortlist } from "@/lib/shortlist";
import { readBrandingDraft } from "@/lib/studio/brandingDraft";
import {
  syncBrandingDraftToBrief,
  syncCatalogueDraftToBrief,
} from "@/lib/studio/briefSync";
import { readCatalogueDraft } from "@/lib/studio/catalogueDraft";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";

export type BriefWorkspaceSnapshot = {
  brief: GiftingBriefDraft;
  products: ShortlistItem[];
  box: BoxDraft;
  hasBoxContent: boolean;
  branding: BrandingDraft;
  hasBrandingContent: boolean;
  catalogue: WhiteLabelCatalogueDraft;
  hasCatalogueContent: boolean;
  companyStore: CompanyStoreDraft;
  hasCompanyStoreContent: boolean;
  /** Studio / company-store app routes may be absent while libs exist */
  studioRouteAvailable: boolean;
  companyStoreRouteAvailable: boolean;
  missing: BriefMissingItem[];
  selectionCount: number;
  linkedSourceCount: number;
};

function boxHasContent(box: BoxDraft) {
  return (
    box.products.length > 0 ||
    box.packaging != null ||
    Boolean(box.customization.companyName.trim()) ||
    Boolean(box.customization.occasion.trim())
  );
}

function brandingHasContent(draft: BrandingDraft) {
  return Boolean(
    draft.productId ||
      draft.logo ||
      (draft.textEnabled && draft.text.trim()) ||
      draft.dirty,
  );
}

const DEFAULT_CATALOGUE_TITLE = "Corporate Gift Selection";

function catalogueHasContent(draft: WhiteLabelCatalogueDraft) {
  const title = draft.title.trim();
  const titleIsCustom =
    Boolean(title) && title !== DEFAULT_CATALOGUE_TITLE;
  return Boolean(
    draft.productIds.length > 0 ||
      titleIsCustom ||
      draft.companyName.trim() ||
      draft.logo,
  );
}

function companyStoreHasContent(draft: CompanyStoreDraft) {
  return Boolean(
    draft.productIds.length > 0 ||
      draft.identity.companyName.trim() ||
      draft.identity.storeName.trim(),
  );
}

/**
 * App routes present in this milestone (honest — update if a route is removed).
 */
export function detectExperienceRoutes(): {
  studio: boolean;
  companyStores: boolean;
} {
  return { studio: true, companyStores: true };
}

export function readBriefWorkspace(
  routeAvailability?: Partial<{ studio: boolean; companyStores: boolean }>,
): BriefWorkspaceSnapshot {
  const brief = readBrief();
  const products = readShortlist();
  const box = readBoxDraft();
  const branding = readBrandingDraft();
  const catalogue = readCatalogueDraft();
  const companyStore = readCompanyStoreDraft();
  const routes = {
    ...detectExperienceRoutes(),
    ...routeAvailability,
  };

  const hasBoxContent = boxHasContent(box);
  const hasBrandingContent = brandingHasContent(branding);
  const hasCatalogueContent = catalogueHasContent(catalogue);
  const hasCompanyStoreContent = companyStoreHasContent(companyStore);

  const selectionCount =
    products.length +
    (hasBoxContent ? 1 : 0) +
    (hasBrandingContent ? 1 : 0) +
    (hasCatalogueContent ? 1 : 0) +
    (hasCompanyStoreContent ? 1 : 0);

  return {
    brief,
    products,
    box,
    hasBoxContent,
    branding,
    hasBrandingContent,
    catalogue,
    hasCatalogueContent,
    companyStore,
    hasCompanyStoreContent,
    studioRouteAvailable: routes.studio,
    companyStoreRouteAvailable: routes.companyStores,
    missing: getBriefMissingDetails(brief, products, {
      hasLiveBoxProducts: hasBoxContent && box.products.length > 0,
      liveBoxNumberOfBoxes: box.customization.numberOfBoxes,
      liveBoxBudgetPerBox: box.customization.budgetPerBox,
    }),
    selectionCount,
    linkedSourceCount: briefLinkedSourceCount(brief),
  };
}

/** Pull live drafts into brief.sources before quotation prep (merge-safe). */
export async function refreshBriefLinksFromLiveDrafts(): Promise<GiftingBriefDraft> {
  const box = readBoxDraft();
  if (boxHasContent(box)) {
    syncBoxDraftToBrief(box);
  }

  const branding = readBrandingDraft();
  if (brandingHasContent(branding)) {
    let brandingProduct: Awaited<
      ReturnType<typeof fetchStudioProducts>
    >[number] | null = null;
    try {
      if (branding.productId) {
        const found = await fetchStudioProducts({
          ids: [branding.productId],
          limit: 1,
        });
        brandingProduct = found[0] ?? null;
      } else if (branding.productSlug) {
        const found = await fetchStudioProducts({
          slug: branding.productSlug,
          limit: 1,
        });
        brandingProduct = found[0] ?? null;
      }
    } catch {
      brandingProduct = null;
    }
    syncBrandingDraftToBrief(branding, brandingProduct);
  }

  const catalogue = readCatalogueDraft();
  if (catalogueHasContent(catalogue)) {
    let products: Awaited<ReturnType<typeof fetchStudioProducts>> = [];
    try {
      if (catalogue.productIds.length > 0) {
        products = await fetchStudioProducts({ ids: catalogue.productIds });
      }
    } catch {
      products = [];
    }
    syncCatalogueDraftToBrief(catalogue, products);
  }

  const store = readCompanyStoreDraft();
  if (companyStoreHasContent(store)) {
    syncCompanyStoreDraftToBrief(store);
  }

  // Mirror shortlist + linked source product ids (drop removed shortlist items;
  // keep box / Studio / store SKUs that are not on the shortlist).
  const shortlist = readShortlist();
  const linkedIds = new Set<string>();
  for (const item of shortlist) linkedIds.add(item.id);
  for (const item of box.products) linkedIds.add(item.id);
  if (branding.productId) linkedIds.add(branding.productId);
  for (const id of catalogue.productIds) linkedIds.add(id);
  for (const id of store.productIds) linkedIds.add(id);

  return patchBrief({
    productIds: Array.from(linkedIds),
    unionProductIds: false,
  });
}

export function buildWorkspaceQuotationText(
  snapshot: BriefWorkspaceSnapshot,
  contact?: QuotationPrepOptions["contact"],
): string {
  let boxPriceNote: string | undefined;
  if (snapshot.hasBoxContent) {
    const estimate = estimateBoxPricing(snapshot.box);
    if (estimate.pricedLineCount > 0 && estimate.pricedSubtotalInr !== null) {
      boxPriceNote =
        `Verified catalogue line estimate (box products only): ${formatInr(estimate.pricedSubtotalInr)}` +
        (estimate.allLinesPriced
          ? " — all selected box products have catalogue unit prices"
          : ` — covers ${estimate.pricedLineCount} priced line(s); ${estimate.unpricedLineCount} line(s) still quote-on-request`) +
        ". Packaging, branding, taxes, and shipping are not included.";
    } else {
      boxPriceNote =
        "No verified box product subtotal available yet — several lines may be quote-on-request.";
    }
    // Ensure packaging label is current even if source snapshot is slightly stale
    if (snapshot.brief.sources.box) {
      snapshot.brief.sources.box.packagingSummary = packagingSummary(
        snapshot.box.packaging,
      );
    }
  }

  return buildQuotationPrepText({
    brief: snapshot.brief,
    products: snapshot.products,
    contact,
    boxPriceNote,
  });
}

export function briefNavCount(): number {
  if (typeof window === "undefined") return 0;
  const products = readShortlist().length;
  const linked = briefLinkedSourceCount();
  const programme = readBrief();
  const hasFields = Boolean(
    programme.occasion.trim() ||
      programme.audience.trim() ||
      programme.notes.trim(),
  );
  return products + linked + (hasFields && products === 0 && linked === 0 ? 1 : 0);
}
