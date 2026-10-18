"use client";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { BoxDraft, BoxStep } from "@/data/catalogue/boxTypes";
import type { ReadyBoxCombo } from "@/data/catalogue/readyBoxCombos";
import type { StudioProductSummary } from "@/data/catalogue/studioTypes";
import { BOX_STEP_LABELS, BOX_STEPS } from "@/data/catalogue/boxTypes";
import {
  APPROVED_PACKAGING,
} from "@/data/catalogue/packaging";
import { ConversionChannels } from "@/components/conversion/ConversionChannels";
import {
  boxUnitsPerBox,
  boxSupplierMinimumShortfalls,
  buildBoxQuotationPrepText,
  canEnterStep,
  clearBoxDraft,
  clearBoxProducts,
  estimateBoxPricing,
  formatInr,
  packagingSummary,
  MIN_BOXES,
  programmeUnitTotal,
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
  addToBox,
} from "@/lib/box";
import { SHORTLIST_EVENT, readShortlist } from "@/lib/shortlist";
import type { ShortlistItem } from "@/data/catalogue/types";
import { buildWhatsAppPrefillMessage } from "@/lib/whatsapp";

function useShortlistItems(): ShortlistItem[] {
  const [items, setItems] = useState<ShortlistItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readShortlist());
    sync();
    window.addEventListener(SHORTLIST_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SHORTLIST_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return items;
}

function useBoxDraft() {
  const [draft, setDraft] = useState<BoxDraft | null>(null);

  useEffect(() => {
    const sync = () => setDraft(readBoxDraft());
    sync();
    window.addEventListener("monkcraft:box", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:box", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return draft;
}

function stepDone(draft: BoxDraft, step: BoxStep): boolean {
  switch (step) {
    case "packaging":
      return Boolean(draft.packaging);
    case "products":
      return draft.products.length > 0;
    case "quote":
      return false;
    default:
      return false;
  }
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
      <div className="box-progress__bar" aria-hidden="true">
        <span
          className="box-progress__fill"
          style={{
            width: `${((currentIndex + 1) / BOX_STEPS.length) * 100}%`,
          }}
        />
      </div>
      <p className="box-progress__status" aria-live="polite">
        Step {currentIndex + 1} of {BOX_STEPS.length} · {BOX_STEP_LABELS[current]}
      </p>
      <ol className="box-steps" aria-label="Build a Box progress">
        {BOX_STEPS.map((step, index) => {
          const active = step === current;
          const past = index < currentIndex;
          const reachable =
            canEnterStep(draft, step) || index <= currentIndex;
          const done = past && stepDone(draft, step);
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
  primary: {
    label: string;
    onClick?: () => void;
    type?: "button" | "submit";
    disabled?: boolean;
  };
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

function KitSummary({
  draft,
  compact = false,
  logoError,
  setLogoError,
}: {
  draft: BoxDraft;
  compact?: boolean;
  logoError: string;
  setLogoError: (message: string) => void;
}) {
  const units = boxUnitsPerBox(draft);
  const boxes = draft.customization.numberOfBoxes;
  const packagingLabel = packagingSummary(draft.packaging);

  return (
    <aside
      className={[
        "box-kit-summary",
        compact ? "box-kit-summary--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Selected box contents"
    >
      <header className="box-kit-summary__head">
        <h3>Kit summary</h3>
        <p>
          {draft.products.length === 0
            ? "No gifts selected"
            : `${draft.products.length} product${draft.products.length === 1 ? "" : "s"} selected`}
        </p>
      </header>

      <p className="box-kit-summary__packaging">
        <span className="box-kit-summary__pack-label">Packaging</span>
        <span
          className={
            draft.packaging?.kind === "pending"
              ? "box-kit-summary__pack-value box-kit-summary__pack-value--pending"
              : "box-kit-summary__pack-value"
          }
        >
          {packagingLabel}
        </span>
      </p>
      {draft.packaging?.kind === "selected" || draft.packaging?.kind === "pending" ? (
        <p className="box-kit-summary__packaging-price">
          Packaging price is confirmed with your quote.
        </p>
      ) : null}

      {draft.products.length > 0 ? (
        <ul className="box-kit-summary__list">
          {draft.products.map((item) => (
            <li key={item.id}>
              {item.imageSrc ? (
                <span className="box-kit-summary__image">
                  <Image src={item.imageSrc} alt="" fill sizes="52px" />
                </span>
              ) : null}
              <span className="box-kit-summary__line">
                <span className="box-kit-summary__name">{item.name}</span>
                <span className="box-kit-summary__qty">{item.quantityPerBox} / box</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <section className="box-kit-options" aria-label="Kit preferences">
        <h4>Kit size</h4>
        <label>
          Number of complete kits
          <input type="number" min={MIN_BOXES} step={1} value={boxes} onChange={(event) => updateBoxCustomization({ numberOfBoxes: Number(event.target.value) })} />
          <small>Minimum {MIN_BOXES} kits</small>
        </label>
        <details>
          <summary>Branding and delivery details</summary>
          <div className="box-kit-options__more">
            <label>Company name<input value={draft.customization.companyName} onChange={(event) => updateBoxCustomization({ companyName: event.target.value })} placeholder="Your company" /></label>
            <label>Occasion<input value={draft.customization.occasion} onChange={(event) => updateBoxCustomization({ occasion: event.target.value })} placeholder="e.g. New joiner welcome" /></label>
            <label>Budget per kit<input value={draft.customization.budgetPerBox} onChange={(event) => updateBoxCustomization({ budgetPerBox: event.target.value })} placeholder="Optional" /></label>
            <label>Branding notes<textarea rows={3} value={draft.customization.brandingRequirements} onChange={(event) => updateBoxCustomization({ brandingRequirements: event.target.value })} placeholder="Logo placement, print or embroidery…" /></label>
            <label>Gift message<textarea rows={2} value={draft.customization.giftMessage} onChange={(event) => updateBoxCustomization({ giftMessage: event.target.value })} placeholder="Optional message for the kit" /></label>
            <label>Add a logo (optional)<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={async (event) => { setLogoError(""); const file = event.target.files?.[0]; if (!file) return; try { updateBoxCustomization({ logo: await readLogoAsDraft(file) }); } catch (error) { setLogoError(error instanceof Error ? error.message : "Could not attach the logo."); } }} /></label>
            {draft.customization.logo ? <p>{draft.customization.logo.fileName} saved in this browser <button type="button" className="shortlist-row__remove" onClick={() => updateBoxCustomization({ logo: null })}>Remove</button></p> : null}
            {logoError ? <p className="journey-error" role="alert">{logoError}</p> : null}
          </div>
        </details>
      </section>

      {units > 0 ? (
        <div className="box-kit-summary__maths" aria-label="Kit quantities">
          <p>
            <span>Gifts per kit</span>
            <strong>{units}</strong>
          </p>
          <p className="box-kit-summary__maths-total">
            <span>Total gifts across {boxes} kits</span>
            <strong>{units * boxes}</strong>
          </p>
        </div>
      ) : null}

      {draft.step !== "products" && draft.products.length === 0 ? (
        <button type="button" className="box-kit-summary__cta" onClick={() => setBoxStep("products")}>Choose gifts</button>
      ) : null}
    </aside>
  );
}

export function BoxBuilder({ combos }: { combos: ReadyBoxCombo[] }) {
  const draft = useBoxDraft();
  const shortlistItems = useShortlistItems();
  const [error, setError] = useState("");
  const [prepText, setPrepText] = useState("");
  const [catalogueQuery, setCatalogueQuery] = useState("");
  const [catalogueCategory, setCatalogueCategory] = useState("");
  const [cataloguePage, setCataloguePage] = useState(1);
  const [catalogueTotalPages, setCatalogueTotalPages] = useState(1);
  const [catalogueItems, setCatalogueItems] = useState<StudioProductSummary[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [comboStatus, setComboStatus] = useState("");

  useEffect(() => {
    if (draft?.step !== "products") return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCatalogueLoading(true);
      setCatalogueError("");
      const params = new URLSearchParams({
        q: catalogueQuery,
        category: catalogueCategory,
        page: String(cataloguePage),
        limit: "18",
      });
      fetch(`/api/catalogue/search?${params}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("Could not load gifts. Please try again.");
          return response.json() as Promise<{ products?: StudioProductSummary[]; totalPages?: number }>;
        })
        .then((data) => {
          setCatalogueItems(Array.isArray(data.products) ? data.products : []);
          setCatalogueTotalPages(Math.max(1, data.totalPages ?? 1));
        })
        .catch((reason: unknown) => {
          if (!controller.signal.aborted) {
            setCatalogueError(reason instanceof Error ? reason.message : "Could not load gifts.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setCatalogueLoading(false);
        });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [draft?.step, catalogueQuery, catalogueCategory, cataloguePage]);

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
  const units = boxUnitsPerBox(draft);
  const boxes = draft.customization.numberOfBoxes;

  const shortlistAddable = shortlistItems.filter(
    (item) => !draft.products.some((product) => product.id === item.id),
  );

  async function onAddShortlistToBox() {
    if (shortlistItems.length === 0) return;
    let prices: Map<string, number | undefined>;
    try {
      const verified = await fetchStudioProducts({ids: shortlistItems.map(item => item.id)});
      prices = new Map(verified.map(item => [item.id, item.amountInr ?? undefined]));
    } catch {
      setError('Could not check catalogue prices. Please try again.');
      return;
    }
    for (const item of shortlistItems) {
      addToBox({
        id: item.id,
        slug: item.slug,
        name: item.name,
        imageSrc: item.imageSrc,
        priceLabel: item.priceLabel,
        amountInr: prices.get(item.id),
        minQuantity: item.minQuantity,
        categoryName: item.categoryName,
      });
    }
    setBoxStep("products");
  }

  function goNext(next: BoxStep, guardMessage?: string) {
    setError("");
    if (next === "quote") {
      const shortfalls = boxSupplierMinimumShortfalls(draft!);
      if (shortfalls.length > 0) {
        setError(`Increase the programme quantity to meet supplier minimums for ${shortfalls.map((item) => item.name).join(", ")}.`);
        setBoxStep("products");
        return;
      }
    }
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
    setError("");
    setPrepText("");
    setComboStatus("");
  }

  function onUseCombo(combo: ReadyBoxCombo) {
    const current = readBoxDraft();
    if ((current.products.length > 0 || current.packaging) &&
      !window.confirm("Replace the gifts and packaging in your current box? Your company and contact details will stay saved.")) {
      return;
    }
    writeBoxDraft({
      ...current,
      step: "products",
      packaging: {
        kind: "selected",
        optionId: combo.packaging.id,
        name: combo.packaging.name,
        summary: combo.packaging.summary,
        dimensionsLabel: combo.packaging.dimensionsLabel,
        priceLabel: combo.packaging.priceLabel,
        imageSrc: combo.packaging.imageSrc,
        packagingKind: combo.packaging.packagingKind,
      },
      products: combo.products.map((product) => ({ ...product, quantityPerBox: 1 })),
      customization: {
        ...current.customization,
        occasion: current.customization.occasion || combo.occasion,
      },
    });
    setError("");
    setComboStatus(`${combo.name} added. Review the gifts below or continue to your quote.`);
  }

  function enterQuoteStep(current: BoxDraft = readBoxDraft()): boolean {
    setError("");
    if (!current.packaging) {
      setError(
        "Choose packaging (or confirm it is pending) before requesting a quote.",
      );
      setBoxStep("packaging");
      return false;
    }
    if (current.products.length === 0) {
      setError("Add at least one catalogue product to the box.");
      setBoxStep("products");
      return false;
    }
    const shortfalls = boxSupplierMinimumShortfalls(current);
    if (shortfalls.length > 0) {
      setError(`Increase the programme quantity to meet supplier minimums for ${shortfalls.map((item) => item.name).join(", ")}.`);
      setBoxStep("products");
      return false;
    }
    writeBoxDraft({ ...current, step: "quote" });
    syncBoxDraftToBrief(current);
    setPrepText(buildBoxQuotationPrepText(current));
    setBoxStep("quote");
    return true;
  }

  async function onPrepareQuote(event: FormEvent) {
    event.preventDefault();
    enterQuoteStep();
  }

  const draftMeta = [
    packagingSummary(draft.packaging),
    productCount > 0
      ? `${productCount} product${productCount === 1 ? "" : "s"}`
      : "No products yet",
    `${draft.customization.numberOfBoxes} box${draft.customization.numberOfBoxes === 1 ? "" : "es"}`,
  ].join(" · ");

  const packagingChosen =
    draft.packaging?.kind === "selected" ||
    (draft.packaging?.kind === "pending" && Boolean(draft.packaging));

  return (
    <div className="journey-panel box-builder">
      <header className="box-builder__head">
        <div>
          <p className="journey-eyebrow">Build a Box</p>
          <h1>Build a gift box</h1>
          <p className="box-builder__meta" aria-live="polite">
            {draftMeta}
            <span className="box-builder__save">
              {" "}
              · Draft saved in this browser
            </span>
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

      {productCount > 0 || draft.packaging ? (
        <div className="box-kit-summary-mobile">
          <KitSummary draft={draft} compact={step === "quote"} logoError={logoError} setLogoError={setLogoError} />
        </div>
      ) : null}

      {error ? (
        <p className="journey-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="box-builder__layout">
        <div className="box-builder__main" key={step}>
          {step === "packaging" ? (
            <section
              className="box-section box-step-panel"
              aria-labelledby="box-packaging-heading"
            >
              <header className="box-section__intro">
                <h2 id="box-packaging-heading">Choose packaging</h2>
                <p>Choose a style or ask us to recommend one. Final fit and price are confirmed in your quote.</p>
              </header>

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
                            packagingKind: option.packagingKind,
                          });
                          setError("");
                        }}
                      >
                        {selected ? (
                          <span className="box-packaging-card__chosen">
                            ✓ Selected
                          </span>
                        ) : null}
                        <span className="box-packaging-card__media">
                          {option.imageSrc ? (
                            <Image
                              src={option.imageSrc}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 45vw, 220px"
                              className="box-packaging-card__image"
                              style={{
                                objectFit: "contain",
                                objectPosition: "center",
                              }}
                            />
                          ) : null}
                        </span>
                        <strong>{option.name}</strong>
                        <span>{option.summary}</span>
                        <span className="box-packaging-card__meta">
                          Fit and price confirmed in your quote
                        </span>
                      </button>
                    </li>
                  );
                })}
                <li>
                  <button
                    type="button"
                    className={[
                      "box-packaging-card",
                      "box-packaging-card--pending",
                      draft.packaging?.kind === "pending"
                        ? "box-packaging-card--selected"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={draft.packaging?.kind === "pending"}
                    onClick={() => {
                      setBoxPackaging({
                        kind: "pending",
                        note: "Recommend packaging with the quote",
                      });
                      setError("");
                    }}
                  >
                    {draft.packaging?.kind === "pending" ? (
                      <span className="box-packaging-card__chosen">
                        ✓ Selected
                      </span>
                    ) : null}
                    <span className="box-packaging-card__media box-packaging-card__media--recommend">
                      <span aria-hidden="true">✦</span>
                    </span>
                    <strong>Recommend a box for me</strong>
                    <span>Let the Monkcraft team suggest a suitable option.</span>
                    <span className="box-packaging-card__meta">
                      Confirmed with your quote
                    </span>
                  </button>
                </li>
              </ul>

              <StepFooter
                back={{ onClick: () => setBoxStep("products") }}
                primary={{
                  label: packagingChosen
                    ? "Review & request"
                    : "Choose packaging to continue",
                  disabled: !packagingChosen,
                  onClick: () => goNext("quote", "Choose packaging before continuing."),
                }}
              />
            </section>
          ) : null}

          {step === "products" ? (
            <section
              className="box-section box-step-panel"
              aria-labelledby="box-products-heading"
            >
              <header className="box-section__intro">
                <h2 id="box-products-heading">Choose gifts</h2>
                <p>Select gifts from the catalogue and set the quantity per box. Minimum order is {MIN_BOXES} boxes.</p>
              </header>

              {combos.length > 0 ? (
                <section className="box-ready-combos" aria-labelledby="box-ready-combos-heading">
                  <div className="box-ready-combos__head">
                    <div>
                      <p className="journey-eyebrow">A quicker start</p>
                      <h3 id="box-ready-combos-heading">Ready-made combinations</h3>
                    </div>
                    <p>Choose a starting set, then change any gift or packaging.</p>
                  </div>
                  <div className="box-ready-combos__grid">
                    {combos.map((combo) => (
                      <article className="box-ready-combo" key={combo.id}>
                        <div className="box-ready-combo__top">
                          <div>
                            <span className="box-ready-combo__occasion">{combo.occasion}</span>
                            <h4>{combo.name}</h4>
                            <p>{combo.description}</p>
                          </div>
                          <div className="box-ready-combo__package-image">
                            <Image src={combo.packaging.imageSrc!} alt={`${combo.packaging.name} packaging option`} fill sizes="96px" style={{ objectFit: "contain" }} />
                          </div>
                        </div>
                        <ul className="box-ready-combo__products" aria-label={`${combo.name} contents`}>
                          {combo.products.map((product, index) => (
                            <li key={product.id}>
                              <span className="box-ready-combo__product-image">
                                <Image src={product.imageSrc!} alt="" fill sizes="44px" style={{ objectFit: "contain" }} />
                              </span>
                              <Link href={`/gifts/${product.slug}?from=box`} aria-label={`View ${product.name}`} title={product.name}>{combo.productLabels[index]}</Link>
                            </li>
                          ))}
                        </ul>
                        <p className="box-ready-combo__packaging" title={combo.packaging.name}>Packaging: {combo.packagingLabel}</p>
                        <button type="button" className="journey-btn journey-btn--primary" onClick={() => onUseCombo(combo)}>
                          Use this combination
                        </button>
                      </article>
                    ))}
                  </div>
                  <p className="box-ready-combos__note">Draft suggestions using catalogue products. We confirm packaging fit, availability, branding and final price in your quote.</p>
                  <p className="box-ready-combos__status" role="status" aria-live="polite">{comboStatus}</p>
                </section>
              ) : null}

              <div className="box-qty-callout" role="note">
                <p>
                  <strong>Qty per box</strong> = units inside one kit. Total boxes: {boxes}.
                  {units > 0 ? (
                    <>
                      {" "}
                      Total units: <strong>{units * boxes}</strong>.
                    </>
                  ) : null}
                </p>
              </div>

              <div className="box-products-toolbar">
                {shortlistAddable.length > 0 ? (
                  <button
                    type="button"
                    className="journey-btn journey-btn--ghost"
                    onClick={onAddShortlistToBox}
                  >
                    Add shortlist ({shortlistAddable.length})
                  </button>
                ) : null}
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

              <div className="box-catalogue-picker">
                <aside className="box-catalogue-picker__filters" aria-label="Find gifts for your box">
                  <h3>Find gifts</h3>
                  <label htmlFor="box-gift-search">Search the catalogue</label>
                  <input
                    id="box-gift-search"
                    type="search"
                    value={catalogueQuery}
                    onChange={(event) => {
                      setCatalogueLoading(true);
                      setCatalogueQuery(event.target.value);
                      setCataloguePage(1);
                    }}
                    placeholder="Try bottle or notebook"
                  />
                  <label htmlFor="box-gift-category">Product type</label>
                  <select
                    id="box-gift-category"
                    value={catalogueCategory}
                    onChange={(event) => {
                      setCatalogueLoading(true);
                      setCatalogueCategory(event.target.value);
                      setCataloguePage(1);
                    }}
                  >
                    <option value="">All product types</option>
                    <option value="drinkware-barware">Drinkware &amp; Barware</option>
                    <option value="apparel-lifestyle">Apparel &amp; Lifestyle</option>
                    <option value="bags-travel">Bags &amp; Travel</option>
                    <option value="tech-gadgets">Tech &amp; Gadgets</option>
                    <option value="office-stationery">Office &amp; Stationery</option>
                    <option value="hampers-gifting">Hampers &amp; Gifting</option>
                    <option value="awards-trophies">Awards &amp; Trophies</option>
                    <option value="wellness-organic">Wellness &amp; Organic</option>
                    <option value="eco-friendly">Eco-Friendly</option>
                    <option value="executive-writing">Executive Writing</option>
                  </select>
                </aside>
                <div className="box-catalogue-picker__results" aria-busy={catalogueLoading}>
                  {catalogueLoading ? <p role="status">Finding gifts…</p> : null}
                  {catalogueError ? <p role="alert">{catalogueError}</p> : null}
                  {!catalogueLoading && !catalogueError && catalogueItems.length === 0 ? <p>No gifts match those filters. Try a broader search.</p> : null}
                  <ul className="box-catalogue-picker__grid">
                    {!catalogueLoading && !catalogueError ? catalogueItems.map((item) => {
                      const added = draft.products.some((product) => product.id === item.id);
                      return (
                        <li key={item.id} className="box-catalogue-card">
                          <Link href={`/gifts/${item.slug}?from=box`} aria-label={`View ${item.name}`} className="box-catalogue-card__image">
                            {item.imageSrc ? <Image src={item.imageSrc} alt={item.imageAlt ?? ""} fill sizes="(max-width: 700px) 40vw, 180px" style={{ objectFit: "contain" }} /> : <span>Image unavailable</span>}
                          </Link>
                          <p>{item.categoryName}</p>
                          <h4><Link href={`/gifts/${item.slug}?from=box`}>{item.name}</Link></h4>
                          <small>{item.minQuantity ? `Supplier minimum ${item.minQuantity}` : "Minimum 25 complete kits"}</small>
                          <button
                            type="button"
                            disabled={added}
                            onClick={() => addToBox({
                              id: item.id,
                              slug: item.slug,
                              name: item.name,
                              imageSrc: item.imageSrc,
                              priceLabel: item.priceLabel,
                              amountInr: item.amountInr,
                              minQuantity: item.minQuantity,
                              categoryName: item.categoryName,
                            })}
                          >
                            {added ? "Added to kit" : "Add to kit"}
                          </button>
                        </li>
                      );
                    }) : null}
                  </ul>
                  {catalogueTotalPages > 1 ? (
                    <nav className="box-catalogue-pagination" aria-label="Box gifts pages">
                      <button type="button" disabled={catalogueLoading || cataloguePage <= 1} onClick={() => { setCatalogueLoading(true); setCataloguePage((page) => page - 1); }}>Previous</button>
                      <span>Page {cataloguePage} of {catalogueTotalPages}</span>
                      <button type="button" disabled={catalogueLoading || cataloguePage >= catalogueTotalPages} onClick={() => { setCatalogueLoading(true); setCataloguePage((page) => page + 1); }}>Next</button>
                    </nav>
                  ) : null}
                </div>
              </div>

              {productCount > 0 ? (
                <ul className="shortlist-list box-product-list">
                  {draft.products.map((item) => {
                    const lineTotal = item.quantityPerBox * boxes;
                    const minimum = item.minQuantity;
                    const moqShort =
                      typeof minimum === "number" &&
                      programmeUnitTotal(item.quantityPerBox, boxes) < minimum;
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
                            <Link href={`/gifts/${item.slug}?from=box`}>
                              {item.name}
                            </Link>
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
                          {moqShort ? (
                            <p className="box-moq-note" role="status">
                              Minimum order quantity is{" "}
                              {minimum?.toLocaleString("en-IN") ?? "confirmed"} units
                              across the programme (currently {lineTotal}). Qty
                              per box stays a kit count — raise per-box qty or
                              number of boxes to meet MOQ.
                            </p>
                          ) : null}
                        </div>
                        <div className="shortlist-row__qty box-product-controls">
                          <label>
                            Qty per box (min 1)
                            <div className="box-qty-stepper">
                              <button
                                type="button"
                                className="box-qty-stepper__btn"
                                aria-label={`Decrease ${item.name} qty per box`}
                                onClick={() =>
                                  setBoxProductQuantity(
                                    item.id,
                                    item.quantityPerBox - 1,
                                  )
                                }
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min={1}
                                step={1}
                                value={item.quantityPerBox}
                                onChange={(event) =>
                                  setBoxProductQuantity(
                                    item.id,
                                    Number(event.target.value),
                                  )
                                }
                              />
                              <button
                                type="button"
                                className="box-qty-stepper__btn"
                                aria-label={`Increase ${item.name} qty per box`}
                                onClick={() =>
                                  setBoxProductQuantity(
                                    item.id,
                                    item.quantityPerBox + 1,
                                  )
                                }
                              >
                                +
                              </button>
                            </div>
                          </label>
                          <div className="box-product-controls__actions">
                            <Link
                              className="box-product-edit"
                              href={`/gifts/${item.slug}?from=box`}
                            >
                              View product
                            </Link>
                            <button
                              type="button"
                              className="shortlist-row__remove"
                              onClick={() => removeFromBox(item.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <StepFooter
                primary={{
                  label: productCount === 0
                    ? "Add a product to continue"
                    : packagingChosen ? "Review & request" : "Choose packaging",
                  disabled: productCount === 0,
                  onClick: () =>
                    goNext(
                      packagingChosen ? "quote" : "packaging",
                      "Add at least one product before continuing.",
                    ),
                }}
              />
            </section>
          ) : null}

          {step === "quote" ? (
            <section
              className="box-section box-step-panel"
              aria-labelledby="box-quote-heading"
            >
              <header className="box-section__intro">
                <h2 id="box-quote-heading">Review &amp; request</h2>
                <p>Check your gifts and packaging, then prepare a quote request.</p>
              </header>

              <section className="box-final-review" aria-label="Gift box summary">
                <div className="box-maths-card" aria-label="Kit quantities">
                  <h3>Your kit</h3>
                  <dl>
                    <div><dt>Gifts per box</dt><dd>{units}</dd></div>
                    <div><dt>Number of boxes</dt><dd>{boxes}</dd></div>
                    <div className="box-maths-card__total"><dt>Total gift units</dt><dd>{units * boxes}</dd></div>
                  </dl>
                </div>
                <dl className="box-summary box-final-review__details">
                  <div>
                    <dt>Packaging</dt>
                    <dd>
                      {packagingSummary(draft.packaging)}
                      <button type="button" className="box-summary__edit" onClick={() => setBoxStep("packaging")}>Change</button>
                    </dd>
                  </div>
                </dl>
                <div className="box-final-review__products">
                  <h3>Gifts in this box</h3>
                  <ul className="brief-products box-review-products">
                    {draft.products.map((item) => (
                      <li key={item.id}>
                        <Link href={`/gifts/${item.slug}?from=box`}>{item.name}</Link>
                        <span>{item.quantityPerBox}/box × {boxes} = <strong>{item.quantityPerBox * boxes} units</strong> · {item.priceLabel}</span>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="journey-btn journey-btn--ghost" onClick={() => setBoxStep("products")}>Edit gifts</button>
                </div>
                <div className="box-price-callout" role="note">
                  <h3>Price guidance</h3>
                  {estimate && estimate.pricedLineCount > 0 && estimate.pricedSubtotalInr !== null ? (
                    <p>Catalogue reference subtotal: <strong>{formatInr(estimate.pricedSubtotalInr)}</strong></p>
                  ) : <p>Product prices are confirmed in your quote.</p>}
                  {estimate && estimate.unpricedLineCount > 0 ? <p>{estimate.unpricedLineCount} product line{estimate.unpricedLineCount === 1 ? " is" : "s are"} quote-on-request.</p> : null}
                  <p>Catalogue prices are estimates. Packaging, branding, assembly, delivery, taxes and volume pricing are confirmed in your quote.</p>
                </div>
              </section>

              {prepText ? (
                <div className="box-quote-handoff">
                  <div className="box-quote-handoff__banner" role="status">
                    <p>
                      <strong>Quote request prepared.</strong> Copy it or choose a channel below. The draft stays saved in this browser.
                    </p>
                  </div>
                  <pre className="journey-preview">{prepText}</pre>
                  <ConversionChannels
                    prepText={prepText}
                    source="build-a-box"
                    contact={{
                      name: draft.contact.name,
                      company:
                        draft.contact.company ||
                        draft.customization.companyName,
                      email: draft.contact.email,
                      phone: draft.contact.phone,
                    }}
                    programme={{
                      occasion: draft.customization.occasion,
                      recipientCount: String(
                        draft.customization.numberOfBoxes,
                      ),
                      budgetPerRecipient: draft.customization.budgetPerBox,
                      branding: draft.customization.brandingRequirements,
                      packagingPrefs: packagingSummary(draft.packaging),
                      deliveryLocation:
                        draft.customization.deliveryRequirements,
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
                        draft.contact.company ||
                        draft.customization.companyName,
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
                          className="journey-btn"
                          href="/gifts/brief"
                        >
                          Open My Brief
                        </Link>
                        <button
                          type="button"
                          className="journey-btn journey-btn--ghost"
                          onClick={() => {
                            setPrepText("");
                          }}
                        >
                          Edit kit details
                        </button>
                      </>
                    }
                  />
                </div>
              ) : (
                <form className="brief-form" onSubmit={onPrepareQuote}>
                  <p className="box-quote-prep">All details are optional. Preparing creates a draft in My Brief; choose a channel to send it.</p>
                  <fieldset className="brief-form__contact">
                    <legend>About this order (optional)</legend>
                    <div className="brief-form__grid">
                      <label>
                        Where should we dispatch?
                        <select
                          value={draft.customization.dispatchType}
                          onChange={(event) => updateBoxCustomization({ dispatchType: event.target.value as BoxDraft["customization"]["dispatchType"] })}
                        >
                          <option value="">Choose a delivery plan</option>
                          <option value="single-city">One delivery point in one city</option>
                          <option value="multi-point">Multiple delivery points</option>
                          <option value="international">International dispatch</option>
                        </select>
                      </label>
                      <label>
                        City, delivery points or countries
                        <textarea
                          rows={2}
                          value={draft.customization.deliveryRequirements}
                          onChange={(event) => updateBoxCustomization({ deliveryRequirements: event.target.value })}
                          placeholder="Add city or country names, number of delivery points, or timing"
                        />
                      </label>
                      <label>
                        Company
                        <input
                          value={draft.customization.companyName}
                          onChange={(event) => updateBoxCustomization({ companyName: event.target.value })}
                          autoComplete="organization"
                          placeholder="Company name"
                        />
                      </label>
                      <label>
                        Occasion
                        <input
                          value={draft.customization.occasion}
                          onChange={(event) => updateBoxCustomization({ occasion: event.target.value })}
                          placeholder="e.g. New joiners, Diwali"
                        />
                      </label>
                      <label>
                        Budget per box
                        <input
                          value={draft.customization.budgetPerBox}
                          onChange={(event) => updateBoxCustomization({ budgetPerBox: event.target.value })}
                          placeholder="Optional range, e.g. ₹1,200–1,500"
                        />
                      </label>
                    </div>
                  </fieldset>
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
                    back={{ onClick: () => setBoxStep("packaging") }}
                    primary={{
                      label: "Prepare quotation request",
                      type: "submit",
                    }}
                    secondary={
                      <Link
                        className="journey-btn journey-btn--ghost"
                        href="/gifts/brief"
                      >
                        Open My Brief
                      </Link>
                    }
                  />
                </form>
              )}
            </section>
          ) : null}
        </div>

        <div className="box-builder__sidebar">
          <KitSummary draft={draft} compact={step === "quote"} logoError={logoError} setLogoError={setLogoError} />
        </div>
      </div>
    </div>
  );
}
