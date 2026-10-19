import type { CompanyStoreDraft } from "@/data/companyStore/types";
import { formatInrAmount } from "@/lib/pricing";

export function buildCompanyStoreEnquiryText(draft: CompanyStoreDraft): string {
  const { identity, productIds, categories, rules } = draft;
  const lines = [
    "Monkcraft Company Store enquiry",
    "================================",
    "",
    "Interest: Company Store programme",
    `Company: ${identity.companyName || "—"}`,
    `Proposed store name: ${identity.storeName || "—"}`,
    `Store title: ${identity.storeTitle || "—"}`,
    `Accent colour (draft): ${identity.accentColor}`,
    `Logo attached in draft: ${identity.logo ? identity.logo.fileName : "no"}`,
    "",
    "Welcome message (draft):",
    identity.welcomeMessage || "—",
    "",
    `Merchandise selected: ${productIds.length} catalogue product(s)`,
    `Selected catalogue IDs: ${productIds.join(", ") || "none yet"}`,
  ];

  if (categories.length > 0) {
    lines.push("", "Store categories:");
    for (const cat of categories) {
      lines.push(`- ${cat.name}: ${cat.productIds.length} item(s)`);
    }
  }

  lines.push(
    "",
    "Draft access / ordering rules (configuration only — not live):",
    `Work email required (draft): ${rules.access.requireWorkEmail ? "yes" : "no"}`,
    `Access note: ${rules.access.accessNote || "—"}`,
    `Visibility: ${rules.access.visibilityNote || "—"}`,
    `Max items / order: ${rules.ordering.maxItemsPerOrder ?? "not set"}`,
    `Max units / product: ${rules.ordering.maxUnitsPerProduct ?? "not set"}`,
    `Allowance mode: ${rules.ordering.allowanceMode}`,
  );

  if (rules.ordering.allowanceMode === "allowance-cap") {
    lines.push(
      `Draft allowance cap: ${
        rules.ordering.allowanceCapInr != null
          ? formatInrAmount(rules.ordering.allowanceCapInr)
          : "not set"
      } (DRAFT RULE — not a live balance)`,
    );
  }
  if (rules.ordering.allowanceNote) {
    lines.push(`Allowance note: ${rules.ordering.allowanceNote}`);
  }
  lines.push(
    `Approval required (draft): ${rules.ordering.requireApproval ? "yes" : "no"}`,
    `Approval note: ${rules.ordering.approvalNote || "—"}`,
    `Delivery preference: ${rules.ordering.deliveryPreference}`,
    `Delivery note: ${rules.ordering.deliveryNote || "—"}`,
    "",
    "This message was prepared from the Company Stores demo configurator.",
    "It is a proposal draft — not a provisioned live store.",
    "Please confirm pricing, access, credits and fulfilment before launch.",
  );

  return lines.join("\n");
}

/** Compact handoff that carries actual draft choices; the customer sends it in WhatsApp. */
export function buildCompanyStoreWhatsAppMessage(draft: CompanyStoreDraft): string {
  const selected = draft.productIds.slice(0, 8);
  const remaining = draft.productIds.length - selected.length;
  return [
    "Hi Monkcraft! Let’s plan a Company Store for our team.",
    `Company: ${draft.identity.companyName.trim() || "to discuss"}`,
    `Store: ${draft.identity.storeName.trim() || "to name together"}`,
    `Selected gifts: ${draft.productIds.length}`,
    selected.length ? `Catalogue IDs: ${selected.join(", ")}${remaining > 0 ? ` (+${remaining} more in the full brief)` : ""}` : "Gift selection: I’d like your help.",
    `Draft rules: ${buildCompanyStoreRulesLabel(draft)}`,
    "This is a demo proposal. Please help confirm the plan, pricing and launch details.",
  ].join("\n");
}

export function buildCompanyStoreRulesLabel(draft: CompanyStoreDraft): string {
  const parts: string[] = [];
  const { ordering } = draft.rules;
  if (ordering.allowanceMode === "company-funded") {
    parts.push("Company-funded (draft)");
  } else if (ordering.allowanceMode === "allowance-cap") {
    parts.push(
      ordering.allowanceCapInr != null
        ? `Draft allowance cap ${formatInrAmount(ordering.allowanceCapInr)}`
        : "Draft allowance cap (unset)",
    );
  } else {
    parts.push("No allowance configured");
  }
  if (ordering.requireApproval) parts.push("Approval required (draft)");
  if (ordering.maxItemsPerOrder) {
    parts.push(`Max ${ordering.maxItemsPerOrder} line items`);
  }
  if (ordering.maxUnitsPerProduct) {
    parts.push(`Max ${ordering.maxUnitsPerProduct} units/product`);
  }
  parts.push(`Delivery: ${ordering.deliveryPreference}`);
  return parts.join(" · ");
}
