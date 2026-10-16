"use client";
import { BackToResults, CatalogueBrowseLink } from "@/components/catalogue/BackToResults";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { BoxDraft, BoxStep } from "@/data/catalogue/boxTypes";
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
    case "review":
      return canEnterStep(draft, "quote");
    case "quote":
      return false;
    default:
      return false;
  }
}

function nextStepCopy(step: BoxStep, draft: BoxDraft): {
  title: string;
  body: string;
} {
  switch (step) {
    case "packaging":
      return {
        title: "Choose your packaging",
        body: draft.packaging
          ? "Packaging saved. Review the complete box next."
          : "Choose a real catalogue box, or ask the team to recommend one. Review comes next.",
      };
    case "products":
      return draft.products.length === 0
        ? {
            title: "Start with the gifts",
            body: "Search the catalogue below and add gifts directly to your kit.",
          }
        : {
            title: "Shape your kit",
            body: "Set the units per kit here. Use Kit preferences to set order size, packaging and branding.",
          };
    case "review":
      return {
        title: "Final check",
        body: "Check your products, box size, and packaging. Then prepare the quote request.",
      };
    case "quote":
      return {
        title: "Hand off to Monkcraft",
        body: "Prepare a quotation request, copy or send via a channel, and open My Brief anytime — nothing auto-submits.",
      };
    default:
      return { title: "", body: "" };
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
            ? "No products yet"
            : `${draft.products.length} item${draft.products.length === 1 ? "" : "s"} · ${units} unit${units === 1 ? "" : "s"} / box`}
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
      <p className="box-kit-summary__packaging-price">
        Packaging price: <strong>confirmed in quote</strong>
      </p>

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
        <h4>Kit preferences</h4>
        <label>
          Number of complete kits
          <input type="number" min={MIN_BOXES} step={1} value={boxes} onChange={(event) => updateBoxCustomization({ numberOfBoxes: Number(event.target.value) })} />
          <small>Minimum {MIN_BOXES} kits</small>
        </label>
        <label>
          Packaging style
          <select value={draft.packaging?.kind === "selected" ? draft.packaging.optionId : draft.packaging?.kind === "pending" ? "pending" : ""} onChange={(event) => {
            const value = event.target.value;
            if (value === "pending") setBoxPackaging({ kind: "pending", note: "" });
            else { const option = APPROVED_PACKAGING.find((item) => item.id === value); if (option) setBoxPackaging({ kind: "selected", optionId: option.id, name: option.name, summary: option.summary, dimensionsLabel: option.dimensionsLabel, priceLabel: option.priceLabel, imageSrc: option.imageSrc, packagingKind: option.packagingKind }); }
          }}>
            <option value="">Choose packaging</option>
            {APPROVED_PACKAGING.map((option) => <option value={option.id} key={option.id}>{option.name}</option>)}
            <option value="pending">Recommend packaging</option>
          </select>
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

      <div className="box-kit-summary__maths" aria-label="Programme maths">
        <p>
          <span>Units / box</span>
          <strong>{units || "—"}</strong>
        </p>
        <p>
          <span>× Boxes</span>
          <strong>{boxes}</strong>
        </p>
        <p className="box-kit-summary__maths-total">
          <span>Programme units</span>
          <strong>{units > 0 ? units * boxes : "—"}</strong>
        </p>
      </div>

      {draft.step !== "products" && draft.products.length === 0 ? (
        <CatalogueBrowseLink className="box-kit-summary__cta" label="Browse catalogue" fromBox />
      ) : null}
    </aside>
  );
}

function StepGuide({
  step,
  draft,
}: {
  step: BoxStep;
  draft: BoxDraft;
}) {
  const copy = nextStepCopy(step, draft);
  return (
    <div className="box-step-guide" role="status">
      <p className="box-step-guide__title">{copy.title}</p>
      <p>{copy.body}</p>
    </div>
  );
}

export function BoxBuilder() {
  const draft = useBoxDraft();
  const shortlistItems = useShortlistItems();
  const [error, setError] = useState("");
  const [prepText, setPrepText] = useState("");
  const [catalogueQuery, setCatalogueQuery] = useState("");
  const [catalogueCategory, setCatalogueCategory] = useState("");
  const [catalogueItems, setCatalogueItems] = useState<StudioProductSummary[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState("");
  const [logoError, setLogoError] = useState("");
  const activeStep = draft?.step;

  useEffect(() => {
    if (activeStep !== "products") return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setCatalogueLoading(true);
      setCatalogueError("");
      fetch(`/api/catalogue/search?${new URLSearchParams({ q: catalogueQuery, category: catalogueCategory, limit: "18" })}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("Could not load gifts. Please try again.");
          const data = await response.json() as { products?: StudioProductSummary[] };
          setCatalogueItems(Array.isArray(data.products) ? data.products : []);
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) setCatalogueError(error instanceof Error ? error.message : "Could not load gifts.");
        })
        .finally(() => { if (!controller.signal.aborted) setCatalogueLoading(false); });
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [activeStep, catalogueQuery, catalogueCategory]);

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
      <BackToResults label="Continue browsing gifts" />
      <header className="box-builder__head">
        <div>
          <p className="journey-eyebrow">Build a Box</p>
          <h1>Assemble your gift kit</h1>
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

      <div className="box-kit-summary-mobile">
        <KitSummary draft={draft} compact logoError={logoError} setLogoError={setLogoError} />
      </div>

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
                <h2 id="box-packaging-heading">Finish with packaging</h2>
                <p>
                  Choose a packaging style. The team will confirm packaging, branding and assembly costs in your quote.
                </p>
              </header>

              <StepGuide step="packaging" draft={draft} />

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
                            Selected · saved
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
                          Price confirmed in quote
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
                        Selected · saved
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
                    ? "Continue to final review"
                    : "Choose packaging to continue",
                  disabled: !packagingChosen,
                  onClick: () => {
                    if (!canEnterStep(draft, "review")) {
                      setError("Choose packaging before the final review.");
                      return;
                    }
                    setError("");
                    setBoxStep("review");
                  },
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
                <h2 id="box-products-heading">Add products</h2>
                <p>
                  Add gifts to your kit. Each starts at <strong>1 per box</strong>; the programme starts at <strong>25 boxes</strong>. Supplier minimums are checked across the full programme.
                </p>
              </header>

              <StepGuide step="products" draft={draft} />

              <div className="box-qty-callout" role="note">
                <p>
                  <strong>Qty per box</strong> = units inside one gift kit (starts at 1 per product).{" "}
                  <strong>Total boxes</strong> = {boxes} (minimum {MIN_BOXES}; set in Kit preferences).
                  {units > 0 ? (
                    <>
                      {" "}
                      Programme-wide ≈ <strong>{units * boxes}</strong> units.
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
                <aside className="box-catalogue-picker__filters" aria-label="Filter box products">
                  <h3>Find gifts</h3>
                  <label htmlFor="box-gift-search">Search products</label>
                  <input id="box-gift-search" type="search" value={catalogueQuery} onChange={(event) => setCatalogueQuery(event.target.value)} placeholder="Try ‘bottle’ or ‘notebook’" />
                  <label htmlFor="box-gift-category">Product type</label>
                  <select id="box-gift-category" value={catalogueCategory} onChange={(event) => setCatalogueCategory(event.target.value)}>
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
                    {catalogueItems.map((item) => {
                      const added = draft.products.some((product) => product.id === item.id);
                      return <li key={item.id} className="box-catalogue-card">
                        <Link href={`/gifts/${item.slug}?from=box`} aria-label={`View ${item.name}`} className="box-catalogue-card__image">
                          {item.imageSrc ? <Image src={item.imageSrc} alt={item.imageAlt ?? ""} fill sizes="(max-width: 700px) 40vw, 180px" style={{ objectFit: "contain" }} /> : <span>Image unavailable</span>}
                        </Link>
                        <p>{item.categoryName}</p><h4><Link href={`/gifts/${item.slug}?from=box`}>{item.name}</Link></h4>
                        <small>{item.minQuantity ? `Supplier minimum ${item.minQuantity}` : "Minimum 25 complete kits"}</small>
                        <button type="button" disabled={added} onClick={() => addToBox({ id: item.id, slug: item.slug, name: item.name, imageSrc: item.imageSrc, priceLabel: item.priceLabel, amountInr: item.amountInr, minQuantity: item.minQuantity, categoryName: item.categoryName })}>{added ? "Added to kit" : "Add to kit"}</button>
                      </li>;
                    })}
                  </ul>
                </div>
              </div>

              {productCount > 0 ? (
                <ul className="shortlist-list box-product-list">
                  {draft.products.map((item) => {
                    const lineTotal = item.quantityPerBox * boxes;
                    const moqShort =
                      item.minQuantity &&
                      item.minQuantity > 0 &&
                      programmeUnitTotal(item.quantityPerBox, boxes) <
                        item.minQuantity;
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
                              Supplier MOQ is{" "}
                              {item.minQuantity!.toLocaleString("en-IN")} units
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
                  label:
                    productCount === 0
                      ? "Add a product to continue"
                    : "Choose packaging",
                  disabled: productCount === 0,
                  onClick: () =>
                    goNext(
                      "packaging",
                      "Add at least one product before choosing packaging.",
                    ),
                }}
              />
            </section>
          ) : null}

          {step === "review" ? (
            <section
              className="box-section box-step-panel"
              aria-labelledby="box-review-heading"
            >
              <header className="box-section__intro">
                <h2 id="box-review-heading">Review box</h2>
                <p>
                  Confirm the kit. Catalogue unit prices are estimates only —
                  not a final quotation.
                </p>
              </header>

              <StepGuide step="review" draft={draft} />

              <div className="box-maths-card" aria-label="Kit maths">
                <h3>Kit maths</h3>
                <dl>
                  <div>
                    <dt>Units inside one gift box</dt>
                    <dd>{units}</dd>
                  </div>
                  <div>
                    <dt>Complete gift boxes</dt>
                    <dd>
                      × {boxes}
                      <button
                        type="button"
                        className="box-summary__edit"
                        onClick={() => setBoxStep("products")}
                      >
                        Change
                      </button>
                    </dd>
                  </div>
                  <div className="box-maths-card__total">
                    <dt>Programme-wide units</dt>
                    <dd>{units * boxes}</dd>
                  </div>
                </dl>
              </div>

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
                  <dt>Company</dt>
                  <dd>
                    {draft.customization.companyName || "—"}
                    <button
                      type="button"
                      className="box-summary__edit"
                      onClick={() => setBoxStep("products")}
                    >
                      Edit
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>Occasion</dt>
                  <dd>
                    {draft.customization.occasion || "—"}
                    <button
                      type="button"
                      className="box-summary__edit"
                      onClick={() => setBoxStep("products")}
                    >
                      Edit
                    </button>
                  </dd>
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
                  <dt>Dispatch plan</dt>
                  <dd>{draft.customization.dispatchType === "single-city" ? "One delivery point in one city" : draft.customization.dispatchType === "multi-point" ? "Multiple delivery points" : draft.customization.dispatchType === "international" ? "International dispatch" : "To be confirmed"}</dd>
                </div>
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
              <ul className="brief-products box-review-products">
                {draft.products.map((item) => (
                  <li key={item.id}>
                    <Link href={`/gifts/${item.slug}?from=box`}>{item.name}</Link>
                    <span>
                      {item.quantityPerBox}/box × {boxes} ={" "}
                      <strong>
                        {item.quantityPerBox * boxes} units
                      </strong>{" "}
                      · {item.priceLabel}
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
                <h3>Quote details</h3>
                {estimate &&
                estimate.pricedLineCount > 0 &&
                estimate.pricedSubtotalInr !== null ? (
                  <p>
                  Catalogue reference subtotal (unit prices × qty
                    per box × {boxes} {boxes === 1 ? "box" : "boxes"}):{" "}
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
                <p>Packaging, custom branding, assembly, delivery, taxes and any volume pricing are confirmed in your quote.</p>
                <p>
                  Product subtotal and packaging are estimates. Quantity discounts, taxes/GST, shipping, and
                  customisation are <strong>not included</strong>. This is not a
                  final price.
                </p>
              </div>

              <StepFooter
                back={{ onClick: () => setBoxStep("packaging") }}
                primary={{
                  label: "Continue to quote",
                  onClick: () => goNext("quote"),
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
                <h2 id="box-quote-heading">Request quote</h2>
                <p>
                  Add what you know, then prepare your request. Company, occasion, budget and contact details are all here and optional.
                </p>
              </header>

              <StepGuide step="quote" draft={draft} />

              {prepText ? (
                <div className="box-quote-handoff">
                  <div className="box-quote-handoff__banner" role="status">
                    <p>
                      <strong>Quotation prep ready.</strong> Copy the text or
                      use a channel below. Your box draft and My Brief stay
                      saved in this browser.
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
                            setBoxStep("review");
                          }}
                        >
                          Back to review
                        </button>
                      </>
                    }
                  />
                </div>
              ) : (
                <form className="brief-form" onSubmit={onPrepareQuote}>
                  <div className="box-quote-prep" role="note">
                    <ol>
                      <li>Optional: add contact details for the message.</li>
                      <li>
                        Prepare the quotation request (syncs into My Brief).
                      </li>
                      <li>
                        Copy / WhatsApp / email — or open My Brief to continue
                        later.
                      </li>
                    </ol>
                  </div>
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
                    back={{ onClick: () => setBoxStep("review") }}
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
          <KitSummary draft={draft} logoError={logoError} setLogoError={setLogoError} />
        </div>
      </div>
    </div>
  );
}
