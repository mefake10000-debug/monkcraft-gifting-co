"use client";

import Link from "next/link";
import { CatalogueBrowseLink } from "@/components/catalogue/BackToResults";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type {
  BrandingDraft,
  BrandingTransform,
  StudioProductSummary,
} from "@/data/catalogue/studioTypes";
import { DEFAULT_BRANDING_TRANSFORM } from "@/data/catalogue/studioTypes";
import {
  markBrandingClean,
  patchBrandingDraft,
  readBrandingDraft,
  writeBrandingDraft,
} from "@/lib/studio/brandingDraft";
import {
  buildBrandingQuotationPrepText,
  syncBrandingDraftToBrief,
} from "@/lib/studio/briefSync";
import {
  downloadBlob,
  exportBrandingPreviewPng,
} from "@/lib/studio/exportPreview";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";
import {
  logoNeedsReattach,
  readStudioLogoAsAsset,
} from "@/lib/studio/logo";
import { BrandingCanvas } from "./BrandingCanvas";
import { ProductPicker } from "./ProductPicker";

type BrandingEditorProps = {
  initialProductSlug?: string;
  returnHref?: string;
  returnLabel?: string;
  onDirtyChange?: (dirty: boolean) => void;
};

type HistoryEntry = {
  transform: BrandingTransform;
  text: string;
  textEnabled: boolean;
  logoDataUrl?: string;
  logoFileName?: string;
};

export function BrandingEditor({
  initialProductSlug,
  returnHref,
  returnLabel,
  onDirtyChange,
}: BrandingEditorProps) {
  const fileInputId = useId();
  const [draft, setDraft] = useState<BrandingDraft | null>(null);
  const [product, setProduct] = useState<StudioProductSummary | null>(null);
  const [loadError, setLoadError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportBusy, setExportBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const seededSlug = useRef<string | null>(null);

  const syncDraft = useCallback((next: BrandingDraft) => {
    setDraft(next);
    onDirtyChange?.(next.dirty);
  }, [onDirtyChange]);

  useEffect(() => {
    const sync = () => {
      const current = readBrandingDraft();
      setDraft(current);
      onDirtyChange?.(current.dirty);
    };
    sync();
    window.addEventListener("monkcraft:studio-branding", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:studio-branding", sync);
      window.removeEventListener("storage", sync);
    };
  }, [onDirtyChange]);

  useEffect(() => {
    const slug = initialProductSlug || draft?.productSlug || undefined;
    const id = draft?.productId || undefined;
    let cancelled = false;
    void (async () => {
      try {
        if (!slug && !id) {
          if (!cancelled) setProduct(null);
          return;
        }
        if (!cancelled) setLoadError("");
        const products = slug
          ? await fetchStudioProducts({ slug })
          : id
            ? await fetchStudioProducts({ ids: [id] })
            : [];
        if (cancelled) return;
        const found = products[0] ?? null;
        setProduct(found);
        if (
          found &&
          initialProductSlug &&
          seededSlug.current !== initialProductSlug
        ) {
          seededSlug.current = initialProductSlug;
          const next = patchBrandingDraft({
            productId: found.id,
            productSlug: found.slug,
          });
          syncDraft(next);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Could not load product.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft?.productId, draft?.productSlug, initialProductSlug, syncDraft]);

  function pushHistory(from: BrandingDraft) {
    setHistory((prev) => [
      ...prev.slice(-24),
      {
        transform: { ...from.transform },
        text: from.text,
        textEnabled: from.textEnabled,
        logoDataUrl: from.logo?.dataUrl,
        logoFileName: from.logo?.fileName,
      },
    ]);
    setFuture([]);
  }

  function applyPatch(patch: Partial<BrandingDraft>, recordHistory = true) {
    const current = readBrandingDraft();
    if (recordHistory) pushHistory(current);
    const next = patchBrandingDraft(patch);
    syncDraft(next);
  }

  function undo() {
    if (!draft || history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [
      {
        transform: { ...draft.transform },
        text: draft.text,
        textEnabled: draft.textEnabled,
        logoDataUrl: draft.logo?.dataUrl,
        logoFileName: draft.logo?.fileName,
      },
      ...f,
    ]);
    const next = patchBrandingDraft({
      transform: previous.transform,
      text: previous.text,
      textEnabled: previous.textEnabled,
      logo: previous.logoFileName
        ? {
            fileName: previous.logoFileName,
            fileType: draft.logo?.fileType || "image/png",
            fileSize: draft.logo?.fileSize || 0,
            dataUrl: previous.logoDataUrl,
          }
        : draft.logo,
    });
    syncDraft(next);
  }

  function redo() {
    if (!draft || future.length === 0) return;
    const nextEntry = future[0];
    setFuture((f) => f.slice(1));
    pushHistory(draft);
    const next = patchBrandingDraft({
      transform: nextEntry.transform,
      text: nextEntry.text,
      textEnabled: nextEntry.textEnabled,
      logo: nextEntry.logoFileName
        ? {
            fileName: nextEntry.logoFileName,
            fileType: draft.logo?.fileType || "image/png",
            fileSize: draft.logo?.fileSize || 0,
            dataUrl: nextEntry.logoDataUrl,
          }
        : draft.logo,
    });
    syncDraft(next);
  }

  async function onLogoFile(file: File | null) {
    setUploadError("");
    if (!file) return;
    try {
      const asset = await readStudioLogoAsAsset(file);
      applyPatch({ logo: asset });
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Could not use that logo file.",
      );
    }
  }

  async function handleExport() {
    setExportError("");
    if (!product?.imageSrc) {
      setExportError("Choose a product with an image before exporting.");
      return;
    }
    if (draft?.logo && !draft.logo.dataUrl) {
      setExportError(
        "Your logo needs to be re-attached after refresh before export.",
      );
      return;
    }
    setExportBusy(true);
    try {
      const { blob, fileName } = await exportBrandingPreviewPng({
        productImageSrc: product.imageSrc,
        logoDataUrl: draft?.logo?.dataUrl,
        transform: draft?.transform ?? DEFAULT_BRANDING_TRANSFORM,
        text: draft?.textEnabled ? draft.text : undefined,
        fileName: `monkcraft-${product.slug}-branding-preview`,
      });
      downloadBlob(blob, fileName);
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : "Export failed. Try another browser or re-upload the logo.",
      );
    } finally {
      setExportBusy(false);
    }
  }

  function handleSaveDraft() {
    const current = readBrandingDraft();
    markBrandingClean(current);
    syncDraft(readBrandingDraft());
  }

  function handlePrepareEnquiry() {
    if (!draft) return;
    syncBrandingDraftToBrief(draft, product);
    const text = buildBrandingQuotationPrepText(draft, product);
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    });
  }

  if (!draft) {
    return (
      <div className="studio-panel" aria-busy="true">
        <p>Loading branding editor…</p>
      </div>
    );
  }

  const needsLogo = logoNeedsReattach(draft.logo);

  return (
    <div className="studio-editor">
      <div className="studio-editor__preview">
        <BrandingCanvas
          productImageSrc={product?.imageSrc}
          productImageAlt={product?.imageAlt || product?.name || ""}
          logoDataUrl={draft.logo?.dataUrl}
          transform={draft.transform}
          text={draft.text}
          textEnabled={draft.textEnabled}
          onTransformGestureStart={() => pushHistory(draft)}
          onTransformChange={(transform) => applyPatch({ transform }, false)}
        />
        <p className="studio-honesty">
          Concept only. Monkcraft confirms print area, measurements and
          decoration methods.
        </p>
      </div>

      <aside className="studio-editor__tools">
        {returnHref ? (
          <Link className="studio-return" href={returnHref}>
            ← {returnLabel || "Back"}
          </Link>
        ) : null}

        <section className="studio-tool-block" aria-labelledby="studio-product-heading">
          <h2 id="studio-product-heading">1. Product</h2>
          {!product ? (
            <div className="studio-empty-guide" role="status">
              <p className="studio-empty-guide__title">Next step</p>
              <p>
                Choose a product to start. Add a logo and optional message,
                then download a concept to share with Monkcraft.
              </p>
              <CatalogueBrowseLink className="journey-btn journey-btn--ghost" label="Browse full catalogue" />
            </div>
          ) : null}
          {product ? (
            <div className="studio-selected-product">
              <p className="studio-selected-product__name">{product.name}</p>
              <p className="studio-selected-product__meta">
                {product.categoryName}
                {product.catalogueSku ? ` · SKU ${product.catalogueSku}` : ""}
              </p>
              <p className="studio-selected-product__price">{product.priceLabel}</p>
              {product.customization ? (
                <p className="studio-selected-product__branding">
                  Catalogue branding note: {product.customization}
                </p>
              ) : (
                <p className="studio-selected-product__branding">
                  No branding method listed on this SKU yet.
                </p>
              )}
              <div className="studio-inline-actions">
                <Link href={`/gifts/${product.slug}`}>View product</Link>
                <button
                  type="button"
                  className="studio-link-btn"
                  onClick={() =>
                    applyPatch({ productId: null, productSlug: null })
                  }
                >
                  Change product
                </button>
              </div>
            </div>
          ) : (
            <ProductPicker
              mode="single"
              selectedIds={[]}
              heading="Search & select a product"
              emptyHint="Type a name, SKU, or category — results come from the live Monkcraft catalogue."
              onSelect={(item) =>
                applyPatch({ productId: item.id, productSlug: item.slug })
              }
            />
          )}
          {loadError ? (
            <p className="studio-error" role="alert">
              {loadError}
            </p>
          ) : null}
        </section>

        <section className="studio-tool-block" aria-labelledby="studio-logo-heading">
          <h2 id="studio-logo-heading">2. Logo</h2>
          <label className="studio-file studio-file--primary" htmlFor={fileInputId}>
            <span>{draft.logo ? "Replace logo" : "Upload logo"}</span>
            <input
              id={fileInputId}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void onLogoFile(file);
                event.target.value = "";
              }}
            />
          </label>
          <p className="studio-hint">
            PNG, JPG, WebP, or SVG · max 400KB · this browser only.
          </p>
          {draft.logo ? (
            <div className="studio-logo-meta">
              <p>
                {draft.logo.fileName} ·{" "}
                {Math.round(draft.logo.fileSize / 1024)}KB
              </p>
              {needsLogo ? (
                <p className="studio-warning" role="status">
                  Logo preview is missing after refresh. Re-attach the same file
                  to continue editing and exporting.
                </p>
              ) : null}
              <button
                type="button"
                className="studio-link-btn"
                onClick={() => applyPatch({ logo: null })}
              >
                Remove logo
              </button>
            </div>
          ) : null}
          {uploadError ? (
            <p className="studio-error" role="alert">
              {uploadError}
            </p>
          ) : null}
        </section>

        <section className="studio-tool-block studio-tool-block--compact" aria-labelledby="studio-adjust-heading">
          <h2 id="studio-adjust-heading">3. Adjust your logo</h2>
          <p className="studio-tool-intro">Position your logo on the product preview. This is a visual guide; the Monkcraft team will confirm print area and production method.</p>
          <div className="studio-branding-options" aria-label="Branding options">
            <span><b aria-hidden="true">↔</b><strong>Placement</strong><small>Drag the logo on the preview or nudge it with your keyboard.</small></span>
            <span><b aria-hidden="true">◉</b><strong>Scale & angle</strong><small>Fine-tune size and rotation with the controls below.</small></span>
            <span><b aria-hidden="true">Aa</b><strong>Personalisation</strong><small>Add a short name, message or event detail.</small></span>
            <span><b aria-hidden="true">↶</b><strong>Try it safely</strong><small>Undo, redo or reset whenever you like.</small></span>
          </div>
          <label className="studio-range">
            <span className="studio-range__label">
              Size
              <span className="studio-range__value">
                {Math.round(draft.transform.scale * 100)}%
              </span>
            </span>
            <input
              type="range"
              min={0.08}
              max={0.7}
              step={0.01}
              value={draft.transform.scale}
              onChange={(event) =>
                applyPatch({
                  transform: {
                    ...draft.transform,
                    scale: Number(event.target.value),
                  },
                })
              }
            />
          </label>
          <label className="studio-range">
            <span className="studio-range__label">
              Rotation
              <span className="studio-range__value">
                {Math.round(draft.transform.rotation)}°
              </span>
            </span>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={draft.transform.rotation}
              onChange={(event) =>
                applyPatch({
                  transform: {
                    ...draft.transform,
                    rotation: Number(event.target.value),
                  },
                })
              }
            />
          </label>
          <label className="studio-check">
            <input
              type="checkbox"
              checked={draft.textEnabled}
              onChange={(event) =>
                applyPatch({ textEnabled: event.target.checked })
              }
            />
            <span>Optional personalisation text</span>
          </label>
          {draft.textEnabled ? (
            <label className="studio-field">
              <span>Text on mockup</span>
              <input
                type="text"
                value={draft.text}
                maxLength={80}
                onChange={(event) => applyPatch({ text: event.target.value })}
                placeholder="e.g. Team Diwali 2026"
              />
            </label>
          ) : null}
          <div className="studio-inline-actions">
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={() =>
                applyPatch({ transform: { ...DEFAULT_BRANDING_TRANSFORM } })
              }
            >
              Reset position
            </button>
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              disabled={history.length === 0}
              onClick={undo}
            >
              Undo
            </button>
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              disabled={future.length === 0}
              onClick={redo}
            >
              Redo
            </button>
          </div>
          <p className="studio-hint">
            Drag to move · arrow keys nudge when focused.
          </p>
        </section>

        <section className="studio-tool-block" aria-labelledby="studio-export-heading">
          <h2 id="studio-export-heading">4. Export & enquiry</h2>
          <div className="studio-export-actions">
            <button
              type="button"
              className="journey-btn"
              disabled={exportBusy || !product?.imageSrc}
              onClick={() => void handleExport()}
            >
              {exportBusy ? "Exporting…" : "Download PNG"}
            </button>
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={handleSaveDraft}
            >
              Save draft
            </button>
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={handlePrepareEnquiry}
            >
              {copied ? "Copied" : "Copy enquiry"}
            </button>
            <Link className="journey-btn journey-btn--outline" href="/gifts/brief">
              Open My Brief
            </Link>
            <Link className="journey-btn journey-btn--ghost" href="/#enquire">
              Talk to Monkcraft
            </Link>
          </div>
          {exportError ? (
            <p className="studio-error" role="alert">
              {exportError}
            </p>
          ) : null}
          <p className="studio-hint">
            PNG exports the product + logo only. Logos stay in this browser until
            you send them.
          </p>
          <button
            type="button"
            className="studio-link-btn"
            onClick={() => {
              if (
                window.confirm(
                  "Clear this branding draft? Your Build a Box and shortlist are not affected.",
                )
              ) {
                writeBrandingDraft({
                  productId: null,
                  productSlug: null,
                  logo: null,
                  transform: { ...DEFAULT_BRANDING_TRANSFORM },
                  text: "",
                  textEnabled: false,
                  dirty: false,
                });
                syncDraft(readBrandingDraft());
                setProduct(null);
                setHistory([]);
                setFuture([]);
              }
            }}
          >
            Clear branding draft
          </button>
        </section>
      </aside>
    </div>
  );
}
