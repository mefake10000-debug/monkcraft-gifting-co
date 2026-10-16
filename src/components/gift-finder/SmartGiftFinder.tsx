"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import type { CatalogueFacet } from "@/data/catalogue/types";
import { readBrief } from "@/lib/brief";
import { syncGiftFinderToBrief } from "@/lib/giftFinder/briefBridge";
import { parseBudgetInr } from "@/lib/giftFinder/budget";
import {
  clearGiftFinderDraft,
  EMPTY_GIFT_FINDER_SNAPSHOT,
  giftFinderHasRequirements,
  GIFT_FINDER_EVENT,
  mergeBriefIntoFinderDraft,
  readGiftFinderDraft,
  writeGiftFinderDraft,
} from "@/lib/giftFinder/draft";
import {
  BRANDING_OPTIONS,
  PREFERENCE_PRESETS,
} from "@/lib/giftFinder/presets";
import type {
  GiftFinderRecommendResult,
  GiftFinderRequirements,
} from "@/lib/giftFinder/types";
import {
  EMPTY_SHORTLIST_IDS,
  readShortlistIds,
  SHORTLIST_EVENT,
} from "@/lib/shortlist";
import {
  bookingCtaHref,
  bookingCtaLabel,
  getContactChannels,
} from "@/lib/contactConfig";
import { scrollToElement } from "@/lib/scroll";
import { FinderMatchCard } from "./FinderMatchCard";

export type SmartGiftFinderProps = {
  occasions: CatalogueFacet[];
  categories: CatalogueFacet[];
  productCount: number;
};

type Phase = "describe" | "results";

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function applyPreferencePreset(
  draft: GiftFinderRequirements,
  presetId: string,
): GiftFinderRequirements {
  const preset = PREFERENCE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return draft;

  const hasCat =
    preset.categorySlug != null &&
    draft.categorySlugs.includes(preset.categorySlug);
  const hasKw =
    (preset.keywords ?? []).length > 0 &&
    (preset.keywords ?? []).every((k) =>
      draft.preferenceKeywords.includes(k),
    );
  const active = hasCat || hasKw;

  let categorySlugs = [...draft.categorySlugs];
  let preferenceKeywords = [...draft.preferenceKeywords];

  if (active) {
    if (preset.categorySlug) {
      categorySlugs = categorySlugs.filter((c) => c !== preset.categorySlug);
    }
    for (const kw of preset.keywords ?? []) {
      preferenceKeywords = preferenceKeywords.filter((k) => k !== kw);
    }
  } else {
    if (preset.categorySlug && !categorySlugs.includes(preset.categorySlug)) {
      categorySlugs.push(preset.categorySlug);
    }
    for (const kw of preset.keywords ?? []) {
      if (!preferenceKeywords.includes(kw)) preferenceKeywords.push(kw);
    }
  }

  return { ...draft, categorySlugs, preferenceKeywords };
}

function presetActive(draft: GiftFinderRequirements, presetId: string) {
  const preset = PREFERENCE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return false;
  if (
    preset.categorySlug &&
    draft.categorySlugs.includes(preset.categorySlug)
  ) {
    return true;
  }
  return (preset.keywords ?? []).some((k) =>
    draft.preferenceKeywords.includes(k),
  );
}

function summaryLines(
  draft: GiftFinderRequirements,
  occasions: CatalogueFacet[],
): string[] {
  const lines: string[] = [];
  if (draft.occasionIds.length) {
    const labels = draft.occasionIds.map(
      (id) => occasions.find((o) => o.id === id)?.label ?? id,
    );
    lines.push(`Occasion: ${labels.join(", ")}`);
  }
  if (draft.audience.trim()) lines.push(`Audience: ${draft.audience}`);
  if (draft.recipientCount.trim()) {
    lines.push(`Recipients: ${draft.recipientCount}`);
  }
  if (draft.budgetPerRecipientLabel.trim() || draft.budgetPerRecipientInr) {
    lines.push(
      `Budget / recipient: ${
        draft.budgetPerRecipientLabel ||
        `₹${draft.budgetPerRecipientInr?.toLocaleString("en-IN")}`
      }`,
    );
  }
  if (draft.categorySlugs.length) {
    lines.push(`Categories: ${draft.categorySlugs.length} selected`);
  }
  if (draft.preferenceKeywords.length) {
    lines.push(`Preferences: ${draft.preferenceKeywords.join(", ")}`);
  }
  if (draft.brandingPreference) {
    const label =
      BRANDING_OPTIONS.find((b) => b.id === draft.brandingPreference)
        ?.label ?? draft.brandingPreference;
    lines.push(`Branding: ${label}`);
  }
  if (draft.deliveryDate.trim() || draft.deliveryLocation.trim()) {
    lines.push(
      `Delivery: ${[draft.deliveryDate, draft.deliveryLocation].filter(Boolean).join(" · ")}`,
    );
  }
  return lines;
}

function subscribeFinder(onStoreChange: () => void) {
  window.addEventListener(GIFT_FINDER_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(GIFT_FINDER_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function subscribeShortlist(onStoreChange: () => void) {
  window.addEventListener(SHORTLIST_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(SHORTLIST_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function SmartGiftFinder({
  occasions,
  categories,
  productCount,
}: SmartGiftFinderProps) {
  const formId = useId();
  const draft = useSyncExternalStore(
    subscribeFinder,
    readGiftFinderDraft,
    () => EMPTY_GIFT_FINDER_SNAPSHOT,
  );
  const shortlistIds = useSyncExternalStore(
    subscribeShortlist,
    readShortlistIds,
    () => EMPTY_SHORTLIST_IDS,
  );
  const [phase, setPhase] = useState<Phase>("describe");
  /** null = follow draft; boolean = user override */
  const [optionalOverride, setOptionalOverride] = useState<boolean | null>(
    null,
  );
  const [result, setResult] = useState<GiftFinderRecommendResult | null>(null);
  const [error, setError] = useState("");
  const [briefSynced, setBriefSynced] = useState(false);
  const [pending, setPending] = useState(false);

  // One-time: fill empty finder draft from unified brief (storage write + event).
  useEffect(() => {
    const occasionMap = new Map(
      occasions.map((o) => [o.label.toLowerCase(), o.id]),
    );
    mergeBriefIntoFinderDraft(readBrief(), occasionMap);
  }, [occasions]);

  const persist = useCallback(
    (next: GiftFinderRequirements) => {
      const budgetLabel = next.budgetPerRecipientLabel;
      const saved = writeGiftFinderDraft({
        ...next,
        budgetPerRecipientInr: parseBudgetInr(budgetLabel),
      });
      // Keep My Gifting Brief aligned when requirements change (incl. after search).
      if (giftFinderHasRequirements(saved)) {
        syncGiftFinderToBrief(saved, occasions, {
          fieldMode: "merge-nonempty",
        });
        setBriefSynced(true);
      } else {
        setBriefSynced(false);
      }
    },
    [occasions],
  );

  const runSearch = useCallback(
    async (requirements: GiftFinderRequirements) => {
      setError("");
      setPending(true);
      try {
        const res = await fetch("/api/gift-finder/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requirements,
            limit: 24,
            alternativeLimit: 12,
          }),
        });
        if (!res.ok) {
          setError("Could not load recommendations. Please try again.");
          return;
        }
        const data = (await res.json()) as GiftFinderRecommendResult;
        setResult(data);
        setPhase("results");
        syncGiftFinderToBrief(requirements, occasions, {
          fieldMode: "merge-nonempty",
        });
        setBriefSynced(true);
        window.setTimeout(() => {
          scrollToElement(document.getElementById("finder-results"), {
            smooth: true,
            offset: 84,
          });
        }, 60);
      } catch {
        setError("Could not load recommendations. Please try again.");
      } finally {
        setPending(false);
      }
    },
    [occasions],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    const next = writeGiftFinderDraft({
      ...draft,
      budgetPerRecipientInr: parseBudgetInr(draft.budgetPerRecipientLabel),
    });
    void runSearch(next);
  };

  const lines = summaryLines(draft, occasions);
  const optionalSuggested = Boolean(
    draft.brandingPreference ||
      draft.brandingNotes ||
      draft.packagingNotes ||
      draft.deliveryDate ||
      draft.deliveryLocation ||
      draft.specialInstructions,
  );
  const optionalOpen = optionalOverride ?? optionalSuggested;

  return (
    <section className="finder" aria-labelledby="finder-heading">
      <header className="finder__header">
        <p className="finder__eyebrow">Smart Gift Finder</p>
        <h1 id="finder-heading" className="finder__title">
          Find gifts that fit your brief
        </h1>
        <p className="finder__lede">
          Guided recommendations from Monkcraft&apos;s verified catalogue (
          {productCount.toLocaleString("en-IN")} products). Rule-based matching
          — not generative AI. Refine anytime; your requirements stay saved in
          this browser.
        </p>
      </header>

      <div className="finder__layout">
        <aside className="finder__summary" aria-label="What we understood">
          <h2 className="finder__summary-title">Your requirements</h2>
          {lines.length === 0 ? (
            <p className="finder__summary-empty">
              Nothing captured yet — answer a few questions to start.
            </p>
          ) : (
            <ul className="finder__summary-list">
              {lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {phase === "results" ? (
            <button
              type="button"
              className="journey-btn journey-btn--ghost finder__summary-edit"
              onClick={() => setPhase("describe")}
            >
              Edit requirements
            </button>
          ) : null}
          {giftFinderHasRequirements(draft) ? (
            <button
              type="button"
              className="finder__clear"
              onClick={() => {
                clearGiftFinderDraft();
                setResult(null);
                setPhase("describe");
                setBriefSynced(false);
                setOptionalOverride(null);
              }}
            >
              Clear finder draft
            </button>
          ) : null}
        </aside>

        <div className="finder__main">
          {phase === "describe" ? (
            <form id={formId} className="finder__form" onSubmit={onSubmit}>
              <fieldset className="finder__fieldset">
                <legend>What&apos;s the occasion?</legend>
                <p className="finder__hint">
                  Only occasions with verified catalogue matches are listed.
                </p>
                <div className="finder__chips" role="group" aria-label="Occasions">
                  {occasions.map((occ) => {
                    const active = draft.occasionIds.includes(occ.id);
                    return (
                      <button
                        key={occ.id}
                        type="button"
                        className={`finder-chip${active ? " finder-chip--active" : ""}`}
                        aria-pressed={active}
                        onClick={() =>
                          persist({
                            ...draft,
                            occasionIds: toggleId(draft.occasionIds, occ.id),
                          })
                        }
                      >
                        {occ.label}
                        {typeof occ.count === "number" ? (
                          <span className="finder-chip__count">
                            {occ.count.toLocaleString("en-IN")}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="finder__fieldset">
                <legend>Who are you gifting?</legend>
                <label className="finder__field">
                  <span>Audience</span>
                  <input
                    type="text"
                    value={draft.audience}
                    placeholder="e.g. new joiners, clients, managers"
                    onChange={(e) =>
                      persist({ ...draft, audience: e.target.value })
                    }
                  />
                </label>
                <label className="finder__field">
                  <span>Number of recipients</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={draft.recipientCount}
                    placeholder="e.g. 150"
                    onChange={(e) =>
                      persist({ ...draft, recipientCount: e.target.value })
                    }
                  />
                </label>
              </fieldset>

              <fieldset className="finder__fieldset">
                <legend>Budget per recipient</legend>
                <label className="finder__field">
                  <span>Amount (INR)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={draft.budgetPerRecipientLabel}
                    placeholder="e.g. 2000"
                    onChange={(e) =>
                      persist({
                        ...draft,
                        budgetPerRecipientLabel: e.target.value,
                      })
                    }
                  />
                </label>
                <p className="finder__hint">
                  Only products with verified catalogue prices at or below this
                  amount count as in-budget. Unknown prices are never treated as
                  free.
                </p>
              </fieldset>

              <fieldset className="finder__fieldset">
                <legend>Preferred styles (optional)</legend>
                <div
                  className="finder__chips"
                  role="group"
                  aria-label="Preferences"
                >
                  {PREFERENCE_PRESETS.map((preset) => {
                    const active = presetActive(draft, preset.id);
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`finder-chip${active ? " finder-chip--active" : ""}`}
                        aria-pressed={active}
                        onClick={() =>
                          persist(applyPreferencePreset(draft, preset.id))
                        }
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <label className="finder__field">
                  <span>Anything else to match?</span>
                  <textarea
                    rows={2}
                    value={draft.freeText}
                    placeholder="e.g. useful desk items, eco materials, no apparel"
                    onChange={(e) =>
                      persist({ ...draft, freeText: e.target.value })
                    }
                  />
                </label>
              </fieldset>

              <div className="finder__optional-toggle">
                <button
                  type="button"
                  className="finder__link-btn"
                  aria-expanded={optionalOpen}
                  onClick={() => setOptionalOverride(!optionalOpen)}
                >
                  {optionalOpen
                    ? "Hide branding & delivery"
                    : "Add branding, packaging & delivery (optional)"}
                </button>
              </div>

              {optionalOpen ? (
                <fieldset className="finder__fieldset">
                  <legend>Branding, packaging & delivery</legend>
                  <div
                    className="finder__chips"
                    role="group"
                    aria-label="Branding preference"
                  >
                    {BRANDING_OPTIONS.map((opt) => {
                      const active = draft.brandingPreference === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`finder-chip${active ? " finder-chip--active" : ""}`}
                          aria-pressed={active}
                          onClick={() =>
                            persist({
                              ...draft,
                              brandingPreference: active ? "" : opt.id,
                            })
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <label className="finder__field">
                    <span>Branding notes</span>
                    <input
                      type="text"
                      value={draft.brandingNotes}
                      onChange={(e) =>
                        persist({ ...draft, brandingNotes: e.target.value })
                      }
                    />
                  </label>
                  <label className="finder__field">
                    <span>Packaging preferences</span>
                    <input
                      type="text"
                      value={draft.packagingNotes}
                      onChange={(e) =>
                        persist({ ...draft, packagingNotes: e.target.value })
                      }
                    />
                  </label>
                  <label className="finder__field">
                    <span>Desired delivery date</span>
                    <input
                      type="text"
                      value={draft.deliveryDate}
                      placeholder="e.g. before 1 Nov"
                      onChange={(e) =>
                        persist({ ...draft, deliveryDate: e.target.value })
                      }
                    />
                  </label>
                  <label className="finder__field">
                    <span>Delivery city / destinations</span>
                    <input
                      type="text"
                      value={draft.deliveryLocation}
                      onChange={(e) =>
                        persist({
                          ...draft,
                          deliveryLocation: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="finder__field">
                    <span>Special instructions</span>
                    <textarea
                      rows={2}
                      value={draft.specialInstructions}
                      onChange={(e) =>
                        persist({
                          ...draft,
                          specialInstructions: e.target.value,
                        })
                      }
                    />
                  </label>
                </fieldset>
              ) : null}

              {categories.length > 0 && optionalOpen ? (
                <fieldset className="finder__fieldset">
                  <legend>Catalogue categories (optional)</legend>
                  <div
                    className="finder__chips finder__chips--wrap"
                    role="group"
                    aria-label="Categories"
                  >
                    {categories.map((cat) => {
                      const active = draft.categorySlugs.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          className={`finder-chip${active ? " finder-chip--active" : ""}`}
                          aria-pressed={active}
                          onClick={() =>
                            persist({
                              ...draft,
                              categorySlugs: toggleId(
                                draft.categorySlugs,
                                cat.id,
                              ),
                            })
                          }
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}

              {error ? <p className="journey-error">{error}</p> : null}

              <div className="finder__actions">
                <button
                  type="submit"
                  className="journey-btn"
                  disabled={pending}
                >
                  {pending ? "Finding gifts…" : "Show recommendations"}
                </button>
                <Link className="journey-btn journey-btn--ghost" href="/gifts">
                  Browse catalogue instead
                </Link>
              </div>
            </form>
          ) : null}

          {phase === "results" && result ? (
            <div id="finder-results" className="finder__results">
              <div className="finder__results-banner" role="status">
                <p>{result.meta.explanation}</p>
                {result.meta.missingHints.length > 0 ? (
                  <ul>
                    {result.meta.missingHints.map((hint) => (
                      <li key={hint}>{hint}</li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="finder__stats">
                <div className="finder__stat">
                  <span className="finder__stat-value">
                    {result.meta.considered.toLocaleString("en-IN")}
                  </span>
                  <span className="finder__stat-label">Products considered</span>
                </div>
                <div className="finder__stat">
                  <span className="finder__stat-value">
                    {result.meta.matchCount}
                  </span>
                  <span className="finder__stat-label">Strong matches</span>
                </div>
                <div className="finder__stat">
                  <span className="finder__stat-value">
                    {result.meta.alternativeCount}
                  </span>
                  <span className="finder__stat-label">Near alternatives</span>
                </div>
                <div className="finder__stat">
                  <span className="finder__stat-value">
                    {result.meta.budgetApplied ? "Yes" : "No"}
                  </span>
                  <span className="finder__stat-label">Budget filter applied</span>
                </div>
              </div>

              {result.matches.length === 0 &&
              result.alternatives.length === 0 ? (
                <div className="finder__empty">
                  <h2>No verified matches</h2>
                  <p>
                    We could not find catalogue products that honestly fit these
                    constraints. Try broadening budget or occasion, or talk to
                    Monkcraft.
                  </p>
                  <div className="finder__actions">
                    <button
                      type="button"
                      className="journey-btn"
                      onClick={() => setPhase("describe")}
                    >
                      Broaden filters
                    </button>
                    <Link
                      className="journey-btn journey-btn--ghost"
                      href="/gifts/brief"
                    >
                      Prepare a quotation brief
                    </Link>
                    {getContactChannels().hasBookingUrl ? (
                      <a
                        className="journey-btn journey-btn--ghost"
                        href={bookingCtaHref()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {bookingCtaLabel()}
                      </a>
                    ) : (
                      <Link
                        className="journey-btn journey-btn--ghost"
                        href="/#enquire"
                      >
                        Talk to Monkcraft
                      </Link>
                    )}
                  </div>
                </div>
              ) : null}

              {result.matches.length > 0 ? (
                <div className="finder__result-block">
                  <h2>Recommended ({result.matches.length})</h2>
                  <div className="finder__match-grid">
                    {result.matches.map((match) => (
                      <FinderMatchCard
                        key={match.product.id}
                        match={match}
                        shortlisted={shortlistIds.includes(match.product.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {result.alternatives.length > 0 ? (
                <div className="finder__result-block">
                  <h2>Near alternatives ({result.alternatives.length})</h2>
                  <p className="finder__hint">
                    Partial fits — labelled clearly. Your original requirements
                    are unchanged.
                  </p>
                  <div className="finder__match-grid">
                    {result.alternatives.map((match) => (
                      <FinderMatchCard
                        key={match.product.id}
                        match={match}
                        shortlisted={shortlistIds.includes(match.product.id)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="finder__next">
                <h2>Next steps</h2>
                <p>
                  Add products to your cart or Build a Box, then open My
                  Gifting Brief for quotation prep.
                  {briefSynced
                    ? " Requirements are merged into your gifting brief."
                    : " Brief is out of date — save requirements or edit fields above to sync."}
                </p>
                <div className="finder__actions">
                  <button
                    type="button"
                    className="journey-btn journey-btn--ghost"
                    onClick={() => {
                      syncGiftFinderToBrief(draft, occasions, {
                        fieldMode: "merge-nonempty",
                      });
                      setBriefSynced(true);
                    }}
                  >
                    Save requirements to brief
                  </button>
                  <Link className="journey-btn" href="/gifts/brief">
                    Open My Gifting Brief
                  </Link>
                  <Link
                    className="journey-btn journey-btn--ghost"
                    href="/gifts/box"
                  >
                    Build a Box
                  </Link>
                  <Link
                    className="journey-btn journey-btn--ghost"
                    href="/gifts/shortlist"
                  >
                    View cart
                  </Link>
                  <Link
                    className="journey-btn journey-btn--ghost"
                    href="/#enquire"
                  >
                    Consultation
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
