"use client";

import type {
  BrandingDraft,
  StudioProductSummary,
  WhiteLabelCatalogueDraft,
} from "@/data/catalogue/studioTypes";
import { writeBrief } from "@/lib/brief";
import { computeDisplayedPrice } from "@/lib/studio/displayPrice";

/** Push branding mockup context into the unified gifting brief (merge-safe). */
export function syncBrandingDraftToBrief(
  draft: BrandingDraft,
  product: StudioProductSummary | null,
) {
  const logo = draft.logo
    ? {
        fileName: draft.logo.fileName,
        fileType: draft.logo.fileType,
        fileSize: draft.logo.fileSize,
        hasBinary: Boolean(draft.logo.dataUrl),
      }
    : null;

  writeBrief({
    branding: product?.customization
      ? `Studio mockup · catalogue branding note: ${product.customization}`
      : draft.logo || draft.textEnabled
        ? "Studio branding mockup — methods to confirm"
        : undefined,
    productIds: product
      ? [product.id]
      : draft.productId
        ? [draft.productId]
        : undefined,
    sources: {
      studioBranding: {
        linkedAt: new Date().toISOString(),
        productId: product?.id ?? draft.productId,
        productSlug: product?.slug ?? draft.productSlug,
        productName: product?.name ?? null,
        productSku: product?.catalogueSku ?? product?.sku ?? null,
        priceLabel: product?.priceLabel ?? null,
        customizationNote: product?.customization ?? null,
        text: draft.text,
        textEnabled: draft.textEnabled,
        transform: { ...draft.transform },
        logo,
      },
    },
  });
}

export function buildBrandingQuotationPrepText(
  draft: BrandingDraft,
  product: StudioProductSummary | null,
  contact?: { name?: string; company?: string; email?: string; phone?: string },
): string {
  const lines = [
    "Monkcraft Studio — product branding mockup / quotation prep",
    "=========================================================",
    "",
    "Product",
    product
      ? `${product.name} · SKU ${product.catalogueSku || product.sku || "—"} · id ${product.id} · /gifts/${product.slug}`
      : "— none selected —",
    product ? `Catalogue price: ${product.priceLabel}` : "",
    product?.customization
      ? `Catalogue branding note: ${product.customization}`
      : "Catalogue branding note: not specified on this SKU",
    "",
    "Mockup settings (conceptual — not a print proof)",
    `Logo position: x=${draft.transform.x.toFixed(2)}, y=${draft.transform.y.toFixed(2)}`,
    `Logo size (width fraction): ${draft.transform.scale.toFixed(2)}`,
    `Logo rotation: ${Math.round(draft.transform.rotation)}°`,
    draft.textEnabled
      ? `Personalisation text: ${draft.text.trim() || "—"}`
      : "Personalisation text: off",
  ];

  if (draft.logo) {
    lines.push(
      `Logo file (local draft): ${draft.logo.fileName} (${draft.logo.fileType}, ${draft.logo.fileSize} bytes)`,
      draft.logo.dataUrl
        ? "Logo binary is in this browser only — attach the original file when emailing Monkcraft; text briefs cannot carry the image."
        : "Logo binary is not in storage — re-attach before export or when contacting Monkcraft.",
    );
  } else {
    lines.push("Logo: none");
  }

  if (contact) {
    lines.push(
      "",
      "Contact",
      `Name: ${contact.name || "—"}`,
      `Company: ${contact.company || "—"}`,
      `Email: ${contact.email || "—"}`,
      `Phone: ${contact.phone || "—"}`,
    );
  }

  lines.push(
    "",
    "Next: open My Gifting Brief (/gifts/brief) to combine this mockup with shortlist, box, and delivery details.",
    "Note: Inbox routing is not connected yet. Send this brief and your logo file via your usual Monkcraft channel.",
  );

  return lines.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
}

export function syncCatalogueDraftToBrief(
  draft: WhiteLabelCatalogueDraft,
  products: StudioProductSummary[],
) {
  const productSummaries = products.map((p) => {
    const price = computeDisplayedPrice(
      p.amountInr,
      draft.pricingMode,
      draft.markupValue,
    );
    return `${p.name} (${p.sku || p.id})${price.kind === "hidden" ? "" : ` · ${price.label}`}`;
  });

  const logo = draft.logo
    ? {
        fileName: draft.logo.fileName,
        fileType: draft.logo.fileType,
        fileSize: draft.logo.fileSize,
        hasBinary: Boolean(draft.logo.dataUrl),
      }
    : null;

  writeBrief({
    branding: "White-label catalogue prepared in Studio",
    // Product count stays on sources.studioCatalogue — not programme recipientCount
    contact: {
      name: draft.contactName || undefined,
      company: draft.companyName || undefined,
      email: draft.contactEmail || undefined,
      phone: draft.contactPhone || undefined,
    },
    productIds: draft.productIds,
    sources: {
      studioCatalogue: {
        linkedAt: new Date().toISOString(),
        title: draft.title,
        companyName: draft.companyName,
        productIds: draft.productIds,
        productSummaries,
        pricingMode: draft.pricingMode,
        logo,
      },
    },
  });
}
