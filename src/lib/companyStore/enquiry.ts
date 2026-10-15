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
    "Inbox routing is not connected yet; please send via your usual channel.",
  );

  return lines.join("\n");
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
