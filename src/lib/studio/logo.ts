"use client";

import type { StudioLogoAsset } from "@/data/catalogue/studioTypes";

/** Matches Build a Box — keep drafts small for localStorage. */
export const STUDIO_LOGO_MAX_BYTES = 400 * 1024;

export const STUDIO_LOGO_ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

export function validateStudioLogoFile(file: File): string | null {
  if (
    !STUDIO_LOGO_ALLOWED_TYPES.includes(
      file.type as (typeof STUDIO_LOGO_ALLOWED_TYPES)[number],
    )
  ) {
    return "Use a PNG, JPG, WebP, or SVG logo file.";
  }
  if (file.size > STUDIO_LOGO_MAX_BYTES) {
    return `Logo must be under ${Math.round(STUDIO_LOGO_MAX_BYTES / 1024)}KB for local draft storage.`;
  }
  return null;
}

/**
 * Read logo as a data URL for <img> / canvas use.
 * SVG is never injected as markup — only as an image data URL.
 */
export function readStudioLogoAsAsset(file: File): Promise<StudioLogoAsset> {
  return new Promise((resolve, reject) => {
    const error = validateStudioLogoFile(file);
    if (error) {
      reject(new Error(error));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl =
        typeof reader.result === "string" ? reader.result : undefined;
      if (!dataUrl?.startsWith("data:")) {
        reject(new Error("Could not read the logo file."));
        return;
      }
      // Reject SVG that somehow wasn't data-URLed as image
      if (
        file.type === "image/svg+xml" &&
        !dataUrl.startsWith("data:image/svg+xml")
      ) {
        reject(new Error("SVG logos must load as an image, not raw markup."));
        return;
      }
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

export function logoNeedsReattach(logo: StudioLogoAsset | null): boolean {
  return Boolean(logo && !logo.dataUrl);
}
