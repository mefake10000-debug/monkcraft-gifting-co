"use client";

import type { CompanyStoreDraft } from "@/data/companyStore/types";
import { writeBrief } from "@/lib/brief";
import { buildCompanyStoreRulesLabel } from "@/lib/companyStore/enquiry";

/** Link a Company Store proposal draft into the unified gifting brief (merge-safe). */
export function syncCompanyStoreDraftToBrief(draft: CompanyStoreDraft) {
  writeBrief({
    branding: draft.identity.companyName
      ? `Company Store proposal for ${draft.identity.companyName}`
      : "Company Store proposal draft",
    productIds: draft.productIds,
    contact: {
      company: draft.identity.companyName || undefined,
    },
    delivery:
      draft.rules.ordering.deliveryNote ||
      `Delivery preference (draft): ${draft.rules.ordering.deliveryPreference}`,
    sources: {
      companyStore: {
        linkedAt: new Date().toISOString(),
        companyName: draft.identity.companyName,
        storeName: draft.identity.storeName || draft.identity.storeTitle,
        productCount: draft.productIds.length,
        productIds: draft.productIds,
        rulesLabel: buildCompanyStoreRulesLabel(draft),
      },
    },
  });
}
