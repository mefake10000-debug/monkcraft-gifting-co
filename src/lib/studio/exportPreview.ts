"use client";

import type { BrandingTransform } from "@/data/catalogue/studioTypes";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    // Same-origin catalogue media + data URLs stay untainted for canvas export
    if (!src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error("Could not load an image for export."));
    img.src = src;
  });
}

/**
 * Composite product photo + logo (and optional text) into a downloadable PNG.
 * Source product photo is never modified on disk — export is a new canvas only.
 */
export async function exportBrandingPreviewPng(options: {
  productImageSrc: string;
  logoDataUrl?: string;
  transform: BrandingTransform;
  text?: string;
  fileName?: string;
}): Promise<{ blob: Blob; fileName: string }> {
  const product = await loadImage(options.productImageSrc);
  const width = product.naturalWidth || product.width;
  const height = product.naturalHeight || product.height;
  if (!width || !height) {
    throw new Error("Product image has no dimensions for export.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  ctx.drawImage(product, 0, 0, width, height);

  if (options.logoDataUrl) {
    const logo = await loadImage(options.logoDataUrl);
    const logoW = Math.max(8, width * options.transform.scale);
    const aspect =
      logo.naturalWidth && logo.naturalHeight
        ? logo.naturalWidth / logo.naturalHeight
        : 1;
    const logoH = logoW / (aspect || 1);
    const cx = options.transform.x * width;
    const cy = options.transform.y * height;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((options.transform.rotation * Math.PI) / 180);
    ctx.drawImage(logo, -logoW / 2, -logoH / 2, logoW, logoH);
    ctx.restore();
  }

  const text = options.text?.trim();
  if (text) {
    const fontSize = Math.max(14, Math.round(width * 0.035));
    ctx.save();
    ctx.font = `600 ${fontSize}px "DM Sans", system-ui, sans-serif`;
    ctx.fillStyle = "rgba(63, 63, 55, 0.92)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const padY = height * 0.92;
    const metrics = ctx.measureText(text);
    const boxW = metrics.width + fontSize * 0.8;
    const boxH = fontSize * 1.6;
    ctx.fillStyle = "rgba(241, 242, 242, 0.88)";
    ctx.fillRect(width / 2 - boxW / 2, padY - boxH / 2, boxW, boxH);
    ctx.fillStyle = "rgba(63, 63, 55, 0.92)";
    ctx.fillText(text, width / 2, padY);
    ctx.restore();
  }

  // Conceptual mockup watermark — honest about print readiness
  const badge = "Conceptual mockup — not a print proof";
  ctx.save();
  const badgeSize = Math.max(11, Math.round(width * 0.018));
  ctx.font = `600 ${badgeSize}px "DM Sans", system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  const badgePad = badgeSize * 0.6;
  const badgeW = ctx.measureText(badge).width + badgePad * 2;
  const badgeH = badgeSize * 1.7;
  ctx.fillRect(badgePad, badgePad, badgeW, badgeH);
  ctx.fillStyle = "rgba(63, 63, 55, 0.88)";
  ctx.textBaseline = "middle";
  ctx.fillText(badge, badgePad * 2, badgePad + badgeH / 2);
  ctx.restore();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Export failed — browser could not create PNG."));
      },
      "image/png",
      0.92,
    );
  });

  const safeName =
    options.fileName?.replace(/[^\w.-]+/g, "-") || "monkcraft-branding-preview";
  return { blob, fileName: `${safeName}.png` };
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
