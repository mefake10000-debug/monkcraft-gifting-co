"use client";

import Image from "next/image";
import Link from "next/link";
import { CatalogueBrowseLink } from "@/components/catalogue/BackToResults";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CATALOGUE_FIELD_LABELS,
  type CatalogueFieldKey,
  type StudioProductSummary,
  type WhiteLabelCatalogueDraft,
} from "@/data/catalogue/studioTypes";
import { productMinimumOrderLabel, readShortlist } from "@/lib/shortlist";
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

export function focusStudioCatalogueStepHeading(section: HTMLElement | null) {
  const heading = section?.querySelector<HTMLElement>("h2");
  if (!heading) return;

  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  heading.scrollIntoView({
    block: "center",
    behavior: reducedMotion ? "auto" : "smooth",
  });
}

export function CatalogueBuilder({
  seedFromShortlist = false,
  onDirtyChange,
}: CatalogueBuilderProps) {
  const logoInputId = useId();
  const [draft, setDraft] = useState<WhiteLabelCatalogueDraft | null>(null);
  const [products, setProducts] = useState<StudioProductSummary[]>([]);
  const [loadError, setLoadError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [importError, setImportError] = useState("");
  const [step, setStep] = useState<"select" | "brand" | "fields" | "preview">(
    "select",
  );
  const seededRef = useRef(false);
  const stepPanelRef = useRef<HTMLElement>(null);
  const previousStepRef = useRef(step);

  useEffect(() => {
    if (previousStepRef.current === step) return;
    previousStepRef.current = step;
    focusStudioCatalogueStepHeading(stepPanelRef.current);
  }, [step]);

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
      <aside className="studio-catalogue__help" aria-label="Catalogue help">
        <span className="studio-catalogue__help-icon" aria-hidden="true">✦</span>
        <span><strong>Build your catalogue</strong><small>Select gifts, add your brand, then preview and save as PDF. Drafts save automatically.</small></span>
        <Link href="/gifts/brief">Open My Brief →</Link>
      </aside>
      <nav className="studio-steps" aria-label="Catalogue builder steps">
        {(
          [
            ["select", "Products"],
            ["brand", "Brand"],
            ["fields", "Details"],
            ["preview", "Preview"],
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
            aria-current={step === id ? "step" : undefined}
            onClick={() => setStep(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {step === "select" ? (
        <section ref={stepPanelRef} className="studio-catalogue__section" aria-labelledby="cat-select">
          <h2 id="cat-select">Pick the good stuff</h2>
          <p>Find gifts in the catalogue or bring over your quote picks.</p>
          {orderedProducts.length === 0 ? (
            <p className="studio-empty-guide" role="status">Add at least one product to continue.</p>
          ) : null}
          <div className="studio-inline-actions">
            <button
              type="button"
              className="journey-btn"
              onClick={() => {
                const ids = readShortlist().map((item) => item.id);
                if (ids.length === 0) {
                  setImportError("Your quote selections are empty. Add gifts from the catalogue first.");
                  return;
                }
                setImportError("");
                syncDraft(mergeShortlistIntoCatalogue(ids));
              }}
            >
              Import quote selections
            </button>
            <CatalogueBrowseLink className="journey-btn journey-btn--ghost" label="Browse catalogue" />
          </div>
          {importError ? <p className="studio-error" role="alert">{importError}</p> : null}

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
                      {product.categoryName}{product.subcategoryName ? ` · ${product.subcategoryName}` : ""}
                      {product.catalogueSku ? ` · SKU ${product.catalogueSku}` : ""}
                    </p>
                    <p className="studio-selected-list__summary">{product.summary}</p>
                    <div className="studio-selected-list__facts">
                      <span>MOQ: {productMinimumOrderLabel(product.minQuantity)}</span>
                      <span>{product.priceLabel}</span>
                      {product.customization ? <span>Branding: {product.customization}</span> : null}
                    </div>
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
          ) : null}

          <ProductPicker
            mode="multi"
            selectedIds={draft.productIds}
            heading="Search and add gifts"
            emptyHint="Search by product, SKU or category."
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
              Continue
            </button>
          </div>
        </section>
      ) : null}

      {step === "brand" ? (
        <section ref={stepPanelRef} className="studio-catalogue__section" aria-labelledby="cat-brand">
          <h2 id="cat-brand">Add your brand</h2>
          <p>
            Give the catalogue your name, logo and look. Every page uses the branding you choose.
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
              <span>Company name</span>
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
        <section ref={stepPanelRef} className="studio-catalogue__section" aria-labelledby="cat-fields">
          <h2 id="cat-fields">Keep the details that matter</h2>
          <p>Select which product details and prices appear.</p>
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
              value={draft.pricingMode === "hide" ? "hide" : "base"}
              onChange={(event) =>
                applyPatch({
                  pricingMode: event.target.value === "hide" ? "hide" : "base",
                  markupValue: 0,
                })
              }
            >
              <option value="hide">Hide prices</option>
              <option value="base">Show one catalogue price</option>
            </select>
          </label>
          <p className="studio-hint">
            Prices are indicative; Monkcraft confirms final amounts. Unpriced products show as quote on request, or are hidden when prices are hidden. Taxes, branding and shipping are excluded.
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
        <section ref={stepPanelRef} className="studio-catalogue__section" aria-labelledby="cat-preview">
          <h2 id="cat-preview">Give it one last look</h2>
          <p>
            Choose <strong>Print / Save as PDF</strong> to export this document from your browser.
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
            <Link className="journey-btn journey-btn--outline" href="/gifts/brief">
              Open My Brief
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
                  "Clear this client catalogue draft? Quote selections and box drafts stay saved.",
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
