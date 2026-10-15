"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { BoxDraft, BoxStep } from "@/data/catalogue/boxTypes";
import { BOX_STEP_LABELS, BOX_STEPS } from "@/data/catalogue/boxTypes";
import {
  APPROVED_PACKAGING,
  PACKAGING_CONCEPT_PREVIEWS,
  hasApprovedPackaging,
} from "@/data/catalogue/packaging";
import { ConversionChannels } from "@/components/conversion/ConversionChannels";
import {
  boxUnitsPerBox,
  buildBoxQuotationPrepText,
  canEnterStep,
  clearBoxDraft,
  clearBoxProducts,
  estimateBoxPricing,
  formatInr,
  packagingSummary,
  readBoxDraft,
  readLogoAsDraft,
  removeFromBox,
  setBoxPackaging,
  setBoxProductQuantity,
  setBoxStep,
  stepIndex,
  syncBoxDraftToBrief,
  updateBoxContact,
  updateBoxCustomization,
  writeBoxDraft,
} from "@/lib/box";
import { buildWhatsAppPrefillMessage } from "@/lib/whatsapp";

function useBoxDraft() {
  const [draft, setDraft] = useState<BoxDraft | null>(null);

  useEffect(() => {
    const sync = () => setDraft(readBoxDraft());
    sync();
    // Seed an honest pending packaging choice so the first step never feels empty.
    const current = readBoxDraft();
    if (!current.packaging) {
      setBoxPackaging({ kind: "pending", note: "" });
    }
    window.addEventListener("monkcraft:box", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:box", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return draft;
}

function StepProgress({
  current,
  draft,
}: {
  current: BoxStep;
  draft: BoxDraft;
}) {
  const currentIndex = stepIndex(current);

  return (
    <div className="box-progress">
      <p className="box-progress__status" aria-live="polite">
        Step {currentIndex + 1} of {BOX_STEPS.length} · {BOX_STEP_LABELS[current]}
      </p>
      <ol className="box-steps" aria-label="Build a Box progress">
        {BOX_STEPS.map((step, index) => {
          const active = step === current;
          const past = index < currentIndex;
          const reachable =
            canEnterStep(draft, step) || index <= currentIndex;
          const done = past && reachable;
          return (
            <li
              key={step}
              className={[
                "box-steps__item",
                active ? "box-steps__item--active" : "",
                done ? "box-steps__item--done" : "",
                !reachable && !active ? "box-steps__item--locked" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                disabled={!reachable && !active}
                aria-current={active ? "step" : undefined}
                onClick={() => {
                  if (reachable || active) setBoxStep(step);
                }}
              >
                <span className="box-steps__num" aria-hidden="true">
                  {done && !active ? "✓" : index + 1}
                </span>
                <span className="box-steps__label">{BOX_STEP_LABELS[step]}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepFooter({
  back,
  primary,
  secondary,
}: {
  back?: { label?: string; onClick: () => void };
  primary: { label: string; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean };
  secondary?: ReactNode;
}) {
  return (
    <div className="box-sticky-actions">
      <div className="box-sticky-actions__inner">
        {back ? (
          <button
            type="button"
            className="journey-btn journey-btn--ghost"
            onClick={back.onClick}
          >
            {back.label ?? "Back"}
          </button>
        ) : (
          <span className="box-sticky-actions__spacer" aria-hidden="true" />
        )}
        <div className="box-sticky-actions__primary">
          {secondary}
          <button
            type={primary.type ?? "button"}
            className="journey-btn"
            onClick={primary.onClick}
            disabled={primary.disabled}
          >
            {primary.label}
          </button>
        </div>
      </div>
    </div>
  );
}

function KitSummary({ draft }: { draft: BoxDraft }) {
  const units = boxUnitsPerBox(draft);
  const boxes = draft.customization.numberOfBoxes;

  return (
    <aside className="box-kit-summary" aria-label="Selected box contents">
      <header className="box-kit-summary__head">
        <h3>In this box</h3>
        <p>
          {draft.products.length === 0
            ? "No products yet"
            : `${draft.products.length} item${draft.products.length === 1 ? "" : "s"} · ${units} unit${units === 1 ? "" : "s"} / box`}
        </p>
      </header>
      {draft.products.length > 0 ? (
        <ul className="box-kit-summary__list">
          {draft.products.map((item) => (
            <li key={item.id}>
              <span className="box-kit-summary__name">{item.name}</span>
              <span className="box-kit-summary__qty">
                {item.quantityPerBox}/box
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="box-kit-summary__empty">
          Browse the catalogue and tap <strong>Add to Box</strong>. Your draft
          stays saved.
        </p>
      )}
      <p className="box-kit-summary__meta">
        Programme: <strong>{boxes}</strong> complete gift box
        {boxes === 1 ? "" : "es"}
        {boxes > 1 && units > 0
          ? ` · ${units * boxes} units total`
          : ""}
      </p>
      <p className="box-kit-summary__hint">
        Qty on product lines = per gift box. Total boxes are set in Customize.
      </p>
    </aside>
  );
}

export function BoxBuilder() {
  const draft = useBoxDraft();
  const [error, setError] = useState("");
  const [prepText, setPrepText] = useState("");
  const [logoError, setLogoError] = useState("");
  const [showOptionalCustomize, setShowOptionalCustomize] = useState(false);

  const estimate = useMemo(
    () => (draft ? estimateBoxPricing(draft) : null),
    [draft],
  );

  if (!draft) {
    return (
      <div className="journey-panel" aria-busy="true">
        <p>Loading your gift box draft…</p>
      </div>
    );
  }

  const step = draft.step;
  const productCount = draft.products.length;

  function goNext(next: BoxStep, guardMessage?: string) {
    setError("");
    if (!canEnterStep(draft!, next)) {
      setError(guardMessage ?? "Complete the current step before continuing.");
      return;
    }
    setBoxStep(next);
  }

  function onStartOver() {
    const ok = window.confirm(
      "Start over? This clears your packaging choice, products, and customisation saved in this browser.",
    );
    if (!ok) return;
    clearBoxDraft();
    setBoxPackaging({ kind: "pending", note: "" });
    setError("");
    setPrepText("");
  }

  async function onPrepareQuote(event: FormEvent) {
    event.preventDefault();
    setError("");
    const current = readBoxDraft();
    if (!current.packaging) {
      setError("Choose packaging (or confirm it is pending) before requesting a quote.");
      setBoxStep("packaging");
      return;
    }
    if (current.products.length === 0) {
      setError("Add at least one catalogue product to the box.");
      setBoxStep("products");
      return;
    }
    if (!current.customization.companyName.trim()) {
      setError("Add a company name so we know who the programme is for.");
      setBoxStep("customize");
      return;
    }
    if (!current.customization.occasion.trim()) {
      setError("Add an occasion for this gift programme.");
      setBoxStep("customize");
      return;
    }

    writeBoxDraft({ ...current, step: "quote" });
    syncBoxDraftToBrief(current);
    const text = buildBoxQuotationPrepText(current);
    setPrepText(text);
    setBoxStep("quote");
  }

  const draftMeta = [
    packagingSummary(draft.packaging),
    productCount > 0
      ? `${productCount} product${productCount === 1 ? "" : "s"}`
      : "No products yet",
    `${draft.customization.numberOfBoxes} box${draft.customization.numberOfBoxes === 1 ? "" : "es"}`,
  ].join(" · ");

  return (
    <div className="journey-panel box-builder">
      <header className="box-builder__head">
        <div>
          <p className="journey-eyebrow">Build a Box</p>
          <h1>Assemble your gift kit</h1>
          <p className="box-builder__meta" aria-live="polite">
            {draftMeta}
            <span className="box-builder__save"> · Draft saved in this browser</span>
          </p>
        </div>
        <button
          type="button"
          className="journey-btn journey-btn--ghost box-builder__reset"
          onClick={onStartOver}
        >
          Start over
        </button>
      </header>

      <StepProgress current={step} draft={draft} />

      {error ? (
        <p className="journey-error" role="alert">
          {error}
        </p>
      ) : null}

      {step === "packaging" ? (
        <section className="box-section" aria-labelledby="box-packaging-heading">
          <header className="box-section__intro">
            <h2 id="box-packaging-heading">Choose packaging</h2>
            <p>
              Pick a style preference to start. Verified packaging SKUs and
              photos appear when Monkcraft supplies them — outer packaging is
              always finalised with your quote.
            </p>
          </header>

          {hasApprovedPackaging() ? (
            <ul className="box-packaging-grid">
              {APPROVED_PACKAGING.map((option) => {
                const selected =
                  draft.packaging?.kind === "selected" &&
                  draft.packaging.optionId === option.id;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      className={[
                        "box-packaging-card",
                        selected ? "box-packaging-card--selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-pressed={selected}
                      onClick={() => {
                        setBoxPackaging({
                          kind: "selected",
                          optionId: option.id,
                          name: option.name,
                          summary: option.summary,
                          dimensionsLabel: option.dimensionsLabel,
                          priceLabel: option.priceLabel,
                          imageSrc: option.imageSrc,
                        });
                        setError("");
                      }}
                    >
                      <span className="box-packaging-card__media">
                        {option.imageSrc ? (
                          <Image
                            src={option.imageSrc}
                            alt=""
                            fill
                            sizes="220px"
                            className="box-packaging-card__image"
                            style={{
                              objectFit: "contain",
                              objectPosition: "center",
                            }}
                          />
                        ) : (
                          <span className="box-packaging-card__media-empty">
                            Photo pending
                          </span>
                        )}
                      </span>
                      <strong>{option.name}</strong>
                      <span>{option.summary}</span>
                      {option.dimensionsLabel ? (
                        <span className="box-packaging-card__meta">
                          {option.dimensionsLabel}
                        </span>
                      ) : null}
                      {option.priceLabel ? (
                        <span className="box-packaging-card__meta">
                          {option.priceLabel}
                        </span>
                      ) : (
                        <span className="box-packaging-card__meta">
                          Packaging price to confirm
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div
              className={[
                "box-packaging-pending",
                draft.packaging?.kind === "pending"
                  ? "box-packaging-pending--selected"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                className="box-packaging-pending__select"
                aria-pressed={draft.packaging?.kind === "pending"}
                onClick={() => {
                  setBoxPackaging({
                    kind: "pending",
                    note:
                      draft.packaging?.kind === "pending"
                        ? draft.packaging.note
                        : "",
                  });
                  setError("");
                }}
              >
                <span className="box-packaging-pending__badge">
                  Current path
                </span>
                <strong>Confirm packaging with your quote</strong>
                <span>
                  Continue with real catalogue products now. No invented box
                  SKUs or stock photos — packaging is confirmed when we quote.
                </span>
              </button>

              {PACKAGING_CONCEPT_PREVIEWS.length > 0 ? (
                <div className="box-packaging-concepts">
                  <div className="box-packaging-concepts__head">
                    <p className="box-packaging-concepts__label">
                      Style preference (optional)
                    </p>
                    <p className="box-packaging-concepts__hint">
                      Illustrations only — not purchasable SKUs. Tap one to note
                      a preference.
                    </p>
                  </div>
                  <ul className="box-packaging-concepts__grid">
                    {PACKAGING_CONCEPT_PREVIEWS.map((concept) => {
                      const note =
                        draft.packaging?.kind === "pending"
                          ? draft.packaging.note
                          : "";
                      const preferred = note
                        .toLowerCase()
                        .includes(concept.label.toLowerCase());
                      return (
                        <li key={concept.id}>
                          <button
                            type="button"
                            className={[
                              "box-packaging-concepts__item",
                              preferred
                                ? "box-packaging-concepts__item--active"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            aria-pressed={preferred}
                            onClick={() => {
                              const preference = `Prefer ${concept.label.toLowerCase()}`;
                              setBoxPackaging({
                                kind: "pending",
                                note: preference,
                              });
                              setError("");
                            }}
                          >
                            <span className="box-packaging-concepts__media">
                              <Image
                                src={concept.src}
                                alt=""
                                fill
                                sizes="160px"
                                className="box-packaging-concepts__image"
                                style={{
                                  objectFit: "contain",
                                  objectPosition: "center",
                                }}
                              />
                            </span>
                            <span className="box-packaging-concepts__name">
                              {concept.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              <label>
                Optional packaging note
                <textarea
                  rows={2}
                  value={
                    draft.packaging?.kind === "pending"
                      ? draft.packaging.note
                      : ""
                  }
                  onChange={(event) => {
                    setBoxPackaging({
                      kind: "pending",
                      note: event.target.value,
                    });
                    setError("");
                  }}
                  placeholder="e.g. Prefer rigid gift box, eco wrap, or branded sleeve"
                />
              </label>
            </div>
          )}

          <StepFooter
            primary={{
              label: "Continue to products",
              onClick: () => {
                if (!draft.packaging) {
                  setBoxPackaging({ kind: "pending", note: "" });
                }
                setError("");
                setBoxStep("products");
              },
            }}
            secondary={
              <Link className="journey-btn journey-btn--ghost" href="/gifts?from=box">
                Browse catalogue
              </Link>
            }
          />
        </section>
      ) : null}

      {step === "products" ? (
        <section className="box-section" aria-labelledby="box-products-heading">
          <header className="box-section__intro">
            <h2 id="box-products-heading">Add products</h2>
            <p>
              Quantities are <strong>per gift box</strong>. Set how many complete
              boxes you need in the next step.
            </p>
          </header>

          <div className="box-products-layout">
            <div className="box-products-main">
              <div className="box-qty-callout" role="note">
                <p>
                  <strong>Qty per box</strong> = units inside one gift kit.{" "}
                  <strong>Total boxes</strong> ={" "}
                  {draft.customization.numberOfBoxes} (edit in Customize).
                </p>
              </div>

              <div className="box-products-toolbar">
                <Link className="journey-btn" href="/gifts?from=box">
                  {productCount === 0
                    ? "Browse catalogue to add"
                    : "Add more from catalogue"}
                </Link>
                {productCount > 0 ? (
                  <button
                    type="button"
                    className="journey-btn journey-btn--ghost"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Clear all products from this box draft?",
                        )
                      ) {
                        clearBoxProducts();
                      }
                    }}
                  >
                    Clear all
                  </button>
                ) : null}
              </div>

              {productCount === 0 ? (
                <div className="journey-callout" role="status">
                  <p>
                    Open the catalogue and use <strong>Add to Box</strong> on any
                    product. Your packaging choice and draft stay saved.
                  </p>
                </div>
              ) : (
                <ul className="shortlist-list box-product-list">
                  {draft.products.map((item) => {
                    const boxes = draft.customization.numberOfBoxes;
                    const lineTotal = item.quantityPerBox * boxes;
                    return (
                      <li key={item.id} className="shortlist-row">
                        <div className="shortlist-row__media">
                          {item.imageSrc ? (
                            <Image
                              src={item.imageSrc}
                              alt=""
                              width={96}
                              height={96}
                              className="shortlist-row__image"
                              style={{
                                objectFit: "contain",
                                objectPosition: "center",
                              }}
                            />
                          ) : (
                            <div className="shortlist-row__placeholder">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="shortlist-row__body">
                          <p className="shortlist-row__meta">
                            {item.categoryName}
                          </p>
                          <h3>
                            <Link href={`/gifts/${item.slug}`}>{item.name}</Link>
                          </h3>
                          <p className="shortlist-row__price">
                            {item.priceLabel}
                            {typeof item.amountInr !== "number"
                              ? " · confirm with quote"
                              : ""}
                          </p>
                          <p className="box-product-line-total">
                            {item.quantityPerBox}/box × {boxes}{" "}
                            {boxes === 1 ? "box" : "boxes"} ={" "}
                            <strong>{lineTotal}</strong> units programme-wide
                          </p>
                        </div>
                        <div className="shortlist-row__qty">
                          <label>
                            Qty per box
                            <input
                              type="number"
                              min={
                                item.minQuantity && item.minQuantity > 0
                                  ? item.minQuantity
                                  : 1
                              }
                              step={1}
                              value={item.quantityPerBox}
                              onChange={(event) =>
                                setBoxProductQuantity(
                                  item.id,
                                  Number(event.target.value),
                                )
                              }
                            />
                          </label>
                          <button
                            type="button"
                            className="shortlist-row__remove"
                            onClick={() => removeFromBox(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <KitSummary draft={draft} />
          </div>

          <StepFooter
            back={{ onClick: () => setBoxStep("packaging") }}
            primary={{
              label:
                productCount === 0
                  ? "Add a product to continue"
                  : "Continue to customize",
              disabled: productCount === 0,
              onClick: () =>
                goNext(
                  "customize",
                  "Add at least one product before customising the box.",
                ),
            }}
          />
        </section>
      ) : null}

      {step === "customize" ? (
        <section className="box-section" aria-labelledby="box-customize-heading">
          <header className="box-section__intro">
            <h2 id="box-customize-heading">Customize</h2>
            <p>
              Tell us who this programme is for and how many complete boxes you
              need. Optional branding details can wait.
            </p>
          </header>

          <form
            className="brief-form"
            onSubmit={(event) => {
              event.preventDefault();
              goNext(
                "review",
                "Add company name and occasion before reviewing the box.",
              );
            }}
          >
            <div className="brief-form__grid">
              <label>
                Company name
                <input
                  value={draft.customization.companyName}
                  onChange={(event) =>
                    updateBoxCustomization({ companyName: event.target.value })
                  }
                  autoComplete="organization"
                  required
                />
              </label>
              <label>
                Occasion
                <input
                  value={draft.customization.occasion}
                  onChange={(event) =>
                    updateBoxCustomization({ occasion: event.target.value })
                  }
                  placeholder="e.g. Employee onboarding, Diwali"
                  required
                />
              </label>
              <label>
                Number of complete gift boxes
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={draft.customization.numberOfBoxes}
                  onChange={(event) =>
                    updateBoxCustomization({
                      numberOfBoxes: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Target budget per box
                <input
                  value={draft.customization.budgetPerBox}
                  onChange={(event) =>
                    updateBoxCustomization({
                      budgetPerBox: event.target.value,
                    })
                  }
                  placeholder="e.g. ₹1,200–1,500"
                />
              </label>
            </div>

            <p className="box-qty-callout box-qty-callout--inline">
              Product quantities stay <strong>per box</strong>. Changing total
              boxes updates programme-wide unit counts on Review.
            </p>

            <button
              type="button"
              className="box-optional-toggle"
              aria-expanded={showOptionalCustomize}
              onClick={() => setShowOptionalCustomize((value) => !value)}
            >
              {showOptionalCustomize
                ? "Hide optional branding details"
                : "Add optional branding details"}
            </button>

            {showOptionalCustomize ? (
              <div className="box-optional-fields">
                <label>
                  Corporate branding requirements
                  <textarea
                    rows={3}
                    value={draft.customization.brandingRequirements}
                    onChange={(event) =>
                      updateBoxCustomization({
                        brandingRequirements: event.target.value,
                      })
                    }
                    placeholder="Logo placement, embroidery vs print, colours, compliance…"
                  />
                </label>

                <label>
                  Logo upload (local draft only)
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={async (event) => {
                      setLogoError("");
                      const file = event.target.files?.[0];
                      if (!file) {
                        updateBoxCustomization({ logo: null });
                        return;
                      }
                      try {
                        const logo = await readLogoAsDraft(file);
                        updateBoxCustomization({ logo });
                      } catch (err) {
                        updateBoxCustomization({ logo: null });
                        setLogoError(
                          err instanceof Error
                            ? err.message
                            : "Could not attach logo.",
                        );
                      }
                    }}
                  />
                </label>
                {logoError ? (
                  <p className="journey-error" role="alert">
                    {logoError}
                  </p>
                ) : null}
                {draft.customization.logo ? (
                  <div className="box-logo-preview">
                    {draft.customization.logo.dataUrl ? (
                      <Image
                        src={draft.customization.logo.dataUrl}
                        alt={`Preview of ${draft.customization.logo.fileName}`}
                        width={72}
                        height={72}
                        unoptimized
                      />
                    ) : null}
                    <p>
                      {draft.customization.logo.fileName} · stored locally only ·{" "}
                      <button
                        type="button"
                        className="shortlist-row__remove"
                        onClick={() => updateBoxCustomization({ logo: null })}
                      >
                        Remove logo
                      </button>
                    </p>
                  </div>
                ) : (
                  <p className="box-hint">
                    Optional. Max 400KB. PNG, JPG, WebP, or SVG. Not sent to a
                    server.
                  </p>
                )}

                <label>
                  Gift message / personalisation
                  <textarea
                    rows={3}
                    value={draft.customization.giftMessage}
                    onChange={(event) =>
                      updateBoxCustomization({
                        giftMessage: event.target.value,
                      })
                    }
                    placeholder="Message card copy, name list needs, QR insert…"
                  />
                </label>

                <label>
                  Extra personalisation notes
                  <textarea
                    rows={2}
                    value={draft.customization.personalizationNotes}
                    onChange={(event) =>
                      updateBoxCustomization({
                        personalizationNotes: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Special packaging instructions
                  <textarea
                    rows={2}
                    value={draft.customization.packagingInstructions}
                    onChange={(event) =>
                      updateBoxCustomization({
                        packagingInstructions: event.target.value,
                      })
                    }
                    placeholder="Tissue colour, sleeve, inserts, fragile items…"
                  />
                </label>

                <label>
                  Delivery requirements
                  <textarea
                    rows={2}
                    value={draft.customization.deliveryRequirements}
                    onChange={(event) =>
                      updateBoxCustomization({
                        deliveryRequirements: event.target.value,
                      })
                    }
                    placeholder="Cities, single ship-to vs multi-address, timeline…"
                  />
                </label>
              </div>
            ) : null}

            <StepFooter
              back={{ onClick: () => setBoxStep("products") }}
              primary={{
                label: "Continue to review",
                type: "submit",
              }}
            />
          </form>
        </section>
      ) : null}

      {step === "review" ? (
        <section className="box-section" aria-labelledby="box-review-heading">
          <header className="box-section__intro">
            <h2 id="box-review-heading">Review box</h2>
            <p>
              Confirm the kit. Catalogue unit prices are estimates only — not a
              final quotation.
            </p>
          </header>

          <dl className="box-summary">
            <div>
              <dt>Packaging</dt>
              <dd>
                {packagingSummary(draft.packaging)}
                <button
                  type="button"
                  className="box-summary__edit"
                  onClick={() => setBoxStep("packaging")}
                >
                  Change
                </button>
              </dd>
            </div>
            <div>
              <dt>Complete gift boxes</dt>
              <dd>
                {draft.customization.numberOfBoxes}
                <button
                  type="button"
                  className="box-summary__edit"
                  onClick={() => setBoxStep("customize")}
                >
                  Change
                </button>
              </dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{draft.customization.companyName || "—"}</dd>
            </div>
            <div>
              <dt>Occasion</dt>
              <dd>{draft.customization.occasion || "—"}</dd>
            </div>
            <div>
              <dt>Budget per box</dt>
              <dd>{draft.customization.budgetPerBox || "—"}</dd>
            </div>
            {draft.customization.brandingRequirements ? (
              <div>
                <dt>Branding</dt>
                <dd>{draft.customization.brandingRequirements}</dd>
              </div>
            ) : null}
            {draft.customization.giftMessage ? (
              <div>
                <dt>Gift message</dt>
                <dd>{draft.customization.giftMessage}</dd>
              </div>
            ) : null}
            {draft.customization.deliveryRequirements ? (
              <div>
                <dt>Delivery</dt>
                <dd>{draft.customization.deliveryRequirements}</dd>
              </div>
            ) : null}
            <div>
              <dt>Logo</dt>
              <dd>
                {draft.customization.logo
                  ? `${draft.customization.logo.fileName} (local draft only)`
                  : "None attached"}
              </dd>
            </div>
          </dl>

          <h3 className="box-subsection-title">Products per box</h3>
          <ul className="brief-products">
            {draft.products.map((item) => (
              <li key={item.id}>
                <Link href={`/gifts/${item.slug}`}>{item.name}</Link>
                <span>
                  {item.quantityPerBox}/box ·{" "}
                  {item.quantityPerBox * draft.customization.numberOfBoxes}{" "}
                  total · {item.priceLabel}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="journey-btn journey-btn--ghost"
            onClick={() => setBoxStep("products")}
          >
            Edit products
          </button>

          <div className="box-price-callout" role="note">
            <h3>Price estimate</h3>
            {estimate &&
            estimate.pricedLineCount > 0 &&
            estimate.pricedSubtotalInr !== null ? (
              <p>
                Verified product lines subtotal (catalogue unit prices × qty per
                box × {draft.customization.numberOfBoxes}{" "}
                {draft.customization.numberOfBoxes === 1 ? "box" : "boxes"}):{" "}
                <strong>{formatInr(estimate.pricedSubtotalInr)}</strong>
              </p>
            ) : (
              <p>No verified product subtotal is available yet.</p>
            )}
            {estimate && estimate.unpricedLineCount > 0 ? (
              <p>
                {estimate.unpricedLineCount} product line
                {estimate.unpricedLineCount === 1 ? "" : "s"} marked
                quote-on-request / unpriced.
              </p>
            ) : null}
            <p>
              Quantity discounts, taxes/GST, shipping, packaging, and
              customisation are <strong>not included</strong>. This is not a
              final price.
            </p>
          </div>

          <StepFooter
            back={{ onClick: () => setBoxStep("customize") }}
            primary={{
              label: "Continue to quote",
              onClick: () => setBoxStep("quote"),
            }}
          />
        </section>
      ) : null}

      {step === "quote" ? (
        <section className="box-section" aria-labelledby="box-quote-heading">
          <header className="box-section__intro">
            <h2 id="box-quote-heading">Request quote</h2>
          </header>
          {prepText ? (
            <>
              <p>
                Your quotation summary is ready — not automatically submitted.
                Draft and My Brief stay saved in this browser.
              </p>
              <pre className="journey-preview">{prepText}</pre>
              <ConversionChannels
                prepText={prepText}
                source="build-a-box"
                contact={{
                  name: draft.contact.name,
                  company:
                    draft.contact.company || draft.customization.companyName,
                  email: draft.contact.email,
                  phone: draft.contact.phone,
                }}
                programme={{
                  occasion: draft.customization.occasion,
                  recipientCount: String(draft.customization.numberOfBoxes),
                  budgetPerRecipient: draft.customization.budgetPerBox,
                  branding: draft.customization.brandingRequirements,
                  packagingPrefs: packagingSummary(draft.packaging),
                  deliveryLocation: draft.customization.deliveryRequirements,
                  notes: draft.customization.giftMessage,
                }}
                products={draft.products.map((item) => ({
                  id: item.id,
                  slug: item.slug,
                  name: item.name,
                  quantity: item.quantityPerBox,
                  priceLabel: item.priceLabel,
                }))}
                whatsappMessage={buildWhatsAppPrefillMessage({
                  company:
                    draft.contact.company || draft.customization.companyName,
                  occasion: draft.customization.occasion,
                  productLines: draft.products.map((item) => ({
                    name: item.name,
                    id: item.id,
                    quantity: item.quantityPerBox,
                  })),
                  quantity: String(draft.customization.numberOfBoxes),
                  budget: draft.customization.budgetPerBox,
                  branding: draft.customization.brandingRequirements,
                  notes: draft.customization.giftMessage,
                })}
                copyLabel="Copy quotation request"
                copiedLabel="Copied"
                secondaryActions={
                  <>
                    <Link
                      className="journey-btn journey-btn--ghost"
                      href="/gifts/brief"
                    >
                      Open My Brief
                    </Link>
                    <button
                      type="button"
                      className="journey-btn journey-btn--ghost"
                      onClick={() => {
                        setPrepText("");
                        setBoxStep("review");
                      }}
                    >
                      Back to review
                    </button>
                  </>
                }
              />
            </>
          ) : (
            <form className="brief-form" onSubmit={onPrepareQuote}>
              <p>
                Optional contact for the quotation message. Preparing a quote
                does not submit anything online — you copy the configuration
                next.
              </p>
              <fieldset className="brief-form__contact">
                <legend>Contact (optional)</legend>
                <div className="brief-form__grid">
                  <label>
                    Name
                    <input
                      value={draft.contact.name}
                      onChange={(event) =>
                        updateBoxContact({ name: event.target.value })
                      }
                      autoComplete="name"
                    />
                  </label>
                  <label>
                    Company
                    <input
                      value={draft.contact.company}
                      onChange={(event) =>
                        updateBoxContact({ company: event.target.value })
                      }
                      autoComplete="organization"
                    />
                  </label>
                  <label>
                    Work email
                    <input
                      type="email"
                      value={draft.contact.email}
                      onChange={(event) =>
                        updateBoxContact({ email: event.target.value })
                      }
                      autoComplete="email"
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      type="tel"
                      value={draft.contact.phone}
                      onChange={(event) =>
                        updateBoxContact({ phone: event.target.value })
                      }
                      autoComplete="tel"
                    />
                  </label>
                </div>
              </fieldset>

              <div className="journey-callout" role="status">
                <p>{draftMeta}</p>
              </div>

              <StepFooter
                back={{ onClick: () => setBoxStep("review") }}
                primary={{
                  label: "Prepare quotation request",
                  type: "submit",
                }}
              />
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}
