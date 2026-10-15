"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CATALOGUE_FIELD_LABELS,
  type CatalogueFieldKey,
  type CataloguePricingMode,
  type StudioProductSummary,
  type WhiteLabelCatalogueDraft,
} from "@/data/catalogue/studioTypes";
import { readShortlist } from "@/lib/shortlist";
import { syncCatalogueDraftToBrief } from "@/lib/studio/briefSync";
import {
  clearCatalogueDraft,
  markCatalogueClean,
  mergeShortlistIntoCatalogue,
  patchCatalogueDraft,
  readCatalogueDraft,
  reorderCatalogueProduct,
} from "@/lib/studio/catalogueDraft";
import { computeDisplayedPrice } from "@/lib/studio/displayPrice";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";
import {
  logoNeedsReattach,
  readStudioLogoAsAsset,
} from "@/lib/studio/logo";
import { ProductPicker } from "./ProductPicker";
import { CataloguePrintDocument } from "./CataloguePrintDocument";

type CatalogueBuilderProps = {
  seedFromShortlist?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
};

const FIELD_KEYS = Object.keys(CATALOGUE_FIELD_LABELS) as CatalogueFieldKey[];

export function CatalogueBuilder({
  seedFromShortlist = false,
  onDirtyChange,
}: CatalogueBuilderProps) {
  const logoInputId = useId();
  const [draft, setDraft] = useState<WhiteLabelCatalogueDraft | null>(null);
  const [products, setProducts] = useState<StudioProductSummary[]>([]);
  const [loadError, setLoadError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [step, setStep] = useState<"select" | "brand" | "fields" | "preview">(
    "select",
  );
  const seededRef = useRef(false);

  const syncDraft = useCallback(
    (next: WhiteLabelCatalogueDraft) => {
      setDraft(next);
      onDirtyChange?.(next.dirty);
    },
    [onDirtyChange],
  );

  useEffect(() => {
    const sync = () => {
      let current = readCatalogueDraft();
      if (seedFromShortlist && !seededRef.current) {
        seededRef.current = true;
        const ids = readShortlist().map((item) => item.id);
        if (ids.length > 0) {
          current = mergeShortlistIntoCatalogue(ids);
        }
      }
      setDraft(current);
      onDirtyChange?.(current.dirty);
    };
    sync();
    window.addEventListener("monkcraft:studio-catalogue", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:studio-catalogue", sync);
      window.removeEventListener("storage", sync);
    };
  }, [seedFromShortlist, onDirtyChange]);

  useEffect(() => {
    const ids = draft?.productIds ?? [];
    let cancelled = false;
    void (async () => {
      if (ids.length === 0) {
        if (!cancelled) setProducts([]);
        return;
      }
      try {
        if (!cancelled) setLoadError("");
        const list = await fetchStudioProducts({
          ids,
          limit: 48,
        });
        if (cancelled) return;
        const byId = new Map(list.map((p) => [p.id, p]));
        setProducts(
          ids
            .map((id) => byId.get(id))
            .filter((p): p is StudioProductSummary => Boolean(p)),
        );
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Could not load selected products.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [draft?.productIds]);

  function applyPatch(patch: Partial<WhiteLabelCatalogueDraft>) {
    const next = patchCatalogueDraft(patch);
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

  function handlePrintPdf() {
    window.print();
  }

  function handlePrepareEnquiry() {
    if (!draft) return;
    syncCatalogueDraftToBrief(draft, products);
  }

  const orderedProducts = useMemo(() => products, [products]);

  if (!draft) {
    return (
      <div className="studio-panel" aria-busy="true">
        <p>Loading catalogue builder…</p>
      </div>
    );
  }

  const needsLogo = logoNeedsReattach(draft.logo);

  return (
    <div className="studio-catalogue">
      <nav className="studio-steps" aria-label="Catalogue builder steps">
        {(
          [
            ["select", "Products"],
            ["brand", "Brand"],
            ["fields", "Fields & price"],
            ["preview", "Preview & PDF"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={
              step === id
                ? "studio-steps__btn studio-steps__btn--active"
                : "studio-steps__btn"
            }
            onClick={() => setStep(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {step === "select" ? (
        <section className="studio-catalogue__section" aria-labelledby="cat-select">
          <h2 id="cat-select">Select products</h2>
          <p>
            Choose genuine catalogue products. Your selection stays while you
            edit branding. Import from shortlist anytime.
          </p>
          <div className="studio-inline-actions">
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={() => {
                const ids = readShortlist().map((item) => item.id);
                if (ids.length === 0) {
                  window.alert(
                    "Your shortlist is empty. Save products from the gifts catalogue first.",
                  );
                  return;
                }
                syncDraft(mergeShortlistIntoCatalogue(ids));
              }}
            >
              Add from shortlist
            </button>
            <Link className="journey-btn journey-btn--ghost" href="/gifts/shortlist">
              Open shortlist
            </Link>
          </div>

          {orderedProducts.length > 0 ? (
            <ul className="studio-selected-list">
              {orderedProducts.map((product, index) => (
                <li key={product.id}>
                  <div className="studio-selected-list__media">
                    {product.imageSrc ? (
                      <Image
                        src={product.imageSrc}
                        alt=""
                        width={64}
                        height={64}
                      />
                    ) : (
                      <span>No image</span>
                    )}
                  </div>
                  <div>
                    <p className="studio-selected-list__name">{product.name}</p>
                    <p className="studio-selected-list__meta">
                      {product.categoryName}
                      {product.sku ? ` · ${product.sku}` : ""}
                    </p>
                  </div>
                  <div className="studio-selected-list__actions">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        syncDraft(reorderCatalogueProduct(product.id, "up"))
                      }
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      disabled={index === orderedProducts.length - 1}
                      onClick={() =>
                        syncDraft(reorderCatalogueProduct(product.id, "down"))
                      }
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      className="studio-link-btn"
                      onClick={() =>
                        applyPatch({
                          productIds: draft.productIds.filter(
                            (id) => id !== product.id,
                          ),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="studio-picker__status" role="status">
              No products selected yet.
            </p>
          )}

          <ProductPicker
            mode="multi"
            selectedIds={draft.productIds}
            heading="Search & add"
            onSelect={(product) => {
              if (draft.productIds.includes(product.id)) return;
              applyPatch({ productIds: [...draft.productIds, product.id] });
            }}
            onRemove={(id) =>
              applyPatch({
                productIds: draft.productIds.filter((item) => item !== id),
              })
            }
          />
          {loadError ? (
            <p className="studio-error" role="alert">
              {loadError}
            </p>
          ) : null}
          <div className="journey-actions journey-actions--footer">
            <button
              type="button"
              className="journey-btn"
              disabled={draft.productIds.length === 0}
              onClick={() => setStep("brand")}
            >
              Continue to brand
            </button>
          </div>
        </section>
      ) : null}

      {step === "brand" ? (
        <section className="studio-catalogue__section" aria-labelledby="cat-brand">
          <h2 id="cat-brand">Brand customization</h2>
          <p>
            This catalogue is presented under the name you enter — it does not
            claim Monkcraft affiliation unless you include that yourself.
          </p>
          <div className="studio-form-grid">
            <label className="studio-field">
              <span>Catalogue title</span>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => applyPatch({ title: e.target.value })}
              />
            </label>
            <label className="studio-field">
              <span>Company / reseller name</span>
              <input
                type="text"
                value={draft.companyName}
                onChange={(e) => applyPatch({ companyName: e.target.value })}
                placeholder="Your company name"
              />
            </label>
            <label className="studio-field studio-field--full">
              <span>Cover text</span>
              <textarea
                rows={3}
                value={draft.coverText}
                onChange={(e) => applyPatch({ coverText: e.target.value })}
              />
            </label>
            <label className="studio-field">
              <span>Accent colour</span>
              <input
                type="color"
                value={draft.accentColor}
                onChange={(e) => applyPatch({ accentColor: e.target.value })}
              />
            </label>
            <label className="studio-field">
              <span>Optional watermark</span>
              <input
                type="text"
                value={draft.watermark}
                onChange={(e) => applyPatch({ watermark: e.target.value })}
                placeholder="e.g. Confidential"
              />
            </label>
            <label className="studio-field">
              <span>Contact name</span>
              <input
                type="text"
                value={draft.contactName}
                onChange={(e) => applyPatch({ contactName: e.target.value })}
              />
            </label>
            <label className="studio-field">
              <span>Contact email</span>
              <input
                type="email"
                value={draft.contactEmail}
                onChange={(e) => applyPatch({ contactEmail: e.target.value })}
              />
            </label>
            <label className="studio-field">
              <span>Contact phone</span>
              <input
                type="tel"
                value={draft.contactPhone}
                onChange={(e) => applyPatch({ contactPhone: e.target.value })}
              />
            </label>
          </div>

          <label className="studio-file" htmlFor={logoInputId}>
            <span>{draft.logo ? "Replace brand logo" : "Upload brand logo"}</span>
            <input
              id={logoInputId}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
              onChange={(event) => {
                void onLogoFile(event.target.files?.[0] ?? null);
                event.target.value = "";
              }}
            />
          </label>
          {draft.logo ? (
            <div className="studio-logo-meta">
              <p>{draft.logo.fileName}</p>
              {needsLogo ? (
                <p className="studio-warning" role="status">
                  Logo binary missing after refresh — re-attach before printing.
                </p>
              ) : draft.logo.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="studio-logo-thumb"
                  src={draft.logo.dataUrl}
                  alt=""
                />
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

          <div className="journey-actions journey-actions--footer">
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={() => setStep("select")}
            >
              Back
            </button>
            <button
              type="button"
              className="journey-btn"
              onClick={() => setStep("fields")}
            >
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {step === "fields" ? (
        <section className="studio-catalogue__section" aria-labelledby="cat-fields">
          <h2 id="cat-fields">Product fields & pricing</h2>
          <p>
            Only real catalogue fields appear. Missing values are omitted
            cleanly. Prices never invent a base amount.
          </p>
          <fieldset className="studio-fieldset">
            <legend>Visible fields</legend>
            {FIELD_KEYS.map((key) => (
              <label key={key} className="studio-check">
                <input
                  type="checkbox"
                  checked={draft.fields[key]}
                  onChange={(event) =>
                    applyPatch({
                      fields: {
                        ...draft.fields,
                        [key]: event.target.checked,
                      },
                    })
                  }
                />
                <span>{CATALOGUE_FIELD_LABELS[key]}</span>
              </label>
            ))}
          </fieldset>

          <label className="studio-field">
            <span>Pricing display</span>
            <select
              value={draft.pricingMode}
              onChange={(event) =>
                applyPatch({
                  pricingMode: event.target.value as CataloguePricingMode,
                })
              }
            >
              <option value="hide">Hide prices</option>
              <option value="base">Show verified catalogue price</option>
              <option value="markup-fixed">
                Catalogue price + fixed INR markup
              </option>
              <option value="markup-percent">
                Catalogue price + percent markup
              </option>
            </select>
          </label>

          {draft.pricingMode === "markup-fixed" ||
          draft.pricingMode === "markup-percent" ? (
            <label className="studio-field">
              <span>
                {draft.pricingMode === "markup-fixed"
                  ? "Fixed markup (INR)"
                  : "Markup percent"}
              </span>
              <input
                type="number"
                min={0}
                step={draft.pricingMode === "markup-fixed" ? 1 : 0.5}
                value={draft.markupValue}
                onChange={(event) =>
                  applyPatch({
                    markupValue: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
            </label>
          ) : null}

          <p className="studio-hint">
            Markups apply only when a verified catalogue unit price exists.
            Unpriced products show as quote on request (or are omitted if prices
            are hidden). Taxes, branding, and shipping are never assumed included.
          </p>

          {orderedProducts.length > 0 && draft.fields.price ? (
            <ul className="studio-price-preview">
              {orderedProducts.slice(0, 6).map((product) => {
                const shown = computeDisplayedPrice(
                  product.amountInr,
                  draft.pricingMode,
                  draft.markupValue,
                );
                return (
                  <li key={product.id}>
                    <span>{product.name}</span>
                    <span>
                      {shown.kind === "hidden"
                        ? "Hidden"
                        : shown.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <label className="studio-check">
            <input
              type="checkbox"
              checked={draft.showPageNumbers}
              onChange={(event) =>
                applyPatch({ showPageNumbers: event.target.checked })
              }
            />
            <span>Show page numbers in print preview</span>
          </label>

          <div className="journey-actions journey-actions--footer">
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={() => setStep("brand")}
            >
              Back
            </button>
            <button
              type="button"
              className="journey-btn"
              onClick={() => setStep("preview")}
            >
              Preview catalogue
            </button>
          </div>
        </section>
      ) : null}

      {step === "preview" ? (
        <section className="studio-catalogue__section" aria-labelledby="cat-preview">
          <h2 id="cat-preview">Preview & Save as PDF</h2>
          <p>
            No PDF library is installed in this project. Use your browser&apos;s{" "}
            <strong>Print → Save as PDF</strong> on the print-styled document
            below. This is a real browser export — not a simulated download.
          </p>
          <div className="studio-inline-actions studio-inline-actions--wrap">
            <button
              type="button"
              className="journey-btn"
              disabled={orderedProducts.length === 0}
              onClick={handlePrintPdf}
            >
              Print / Save as PDF
            </button>
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={() => {
                markCatalogueClean(draft);
                syncDraft(readCatalogueDraft());
              }}
            >
              Save draft
            </button>
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={handlePrepareEnquiry}
            >
              Sync to gifting brief
            </button>
            <Link className="journey-btn" href="/gifts/brief">
              Request a Quote
            </Link>
            <Link className="journey-btn journey-btn--ghost" href="/#enquire">
              Talk to Monkcraft
            </Link>
            <button
              type="button"
              className="journey-btn journey-btn--ghost"
              onClick={() => setStep("fields")}
            >
              Back to fields
            </button>
          </div>

          {orderedProducts.length === 0 ? (
            <p className="studio-error" role="status">
              Add at least one product before exporting.
            </p>
          ) : (
            <CataloguePrintDocument draft={draft} products={orderedProducts} />
          )}

          <button
            type="button"
            className="studio-link-btn"
            onClick={() => {
              if (
                window.confirm(
                  "Clear the white-label catalogue draft? Shortlist and box drafts are kept.",
                )
              ) {
                clearCatalogueDraft();
                syncDraft(readCatalogueDraft());
                setStep("select");
              }
            }}
          >
            Clear catalogue draft
          </button>
        </section>
      ) : null}
    </div>
  );
}
