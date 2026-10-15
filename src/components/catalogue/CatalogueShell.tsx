"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  buildCatalogueHref,
  countActiveFilters,
  emptyCatalogueQuery,
  sortOptions,
  toggleListValue,
} from "@/data/catalogue/queryParams";
import type {
  CatalogueFacet,
  CatalogueQuery,
  Product,
} from "@/data/catalogue/types";
import { boxProductCount, readBoxDraft } from "@/lib/box";
import { readShortlist, readShortlistIds } from "@/lib/shortlist";
import { CatalogueEmpty } from "./CatalogueEmpty";
import { ProductCard } from "./ProductCard";

const FACET_VISIBLE_LIMIT = 8;
const BUDGET_DEBOUNCE_MS = 400;

function applyQueryPatch(
  current: CatalogueQuery,
  patch: Partial<CatalogueQuery>,
): CatalogueQuery {
  const next: CatalogueQuery = {
    ...current,
    ...patch,
    page: patch.page ?? 1,
  };

  if ("shortlistedOnly" in patch) {
    if (patch.shortlistedOnly) {
      next.shortlistIds = readShortlistIds();
    } else {
      next.shortlistIds = [];
    }
  }

  if ("page" in patch && typeof patch.page === "number") {
    next.page = patch.page;
  } else if (!("page" in patch)) {
    next.page = 1;
  }

  return next;
}

function asFacetList(value: CatalogueFacet[] | undefined): CatalogueFacet[] {
  return Array.isArray(value) ? value : [];
}

/** Guard against incomplete RSC props (undefined arrays → .length crashes). */
function normalizeCatalogueQuery(
  value: CatalogueQuery | undefined,
): CatalogueQuery {
  const base = emptyCatalogueQuery();
  if (!value || typeof value !== "object") return base;
  return {
    ...base,
    ...value,
    q: typeof value.q === "string" ? value.q : "",
    occasions: Array.isArray(value.occasions) ? value.occasions : [],
    categories: Array.isArray(value.categories) ? value.categories : [],
    subcategories: Array.isArray(value.subcategories)
      ? value.subcategories
      : [],
    brandings: Array.isArray(value.brandings) ? value.brandings : [],
    colours: Array.isArray(value.colours) ? value.colours : [],
    materials: Array.isArray(value.materials) ? value.materials : [],
    shortlistIds: Array.isArray(value.shortlistIds) ? value.shortlistIds : [],
    page:
      typeof value.page === "number" && value.page > 0
        ? Math.floor(value.page)
        : 1,
  };
}

export type CatalogueShellProps = {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: CatalogueQuery;
  occasionFacets: CatalogueFacet[];
  categoryFacets: CatalogueFacet[];
  brandingFacets: CatalogueFacet[];
  colourFacets: CatalogueFacet[];
  materialFacets: CatalogueFacet[];
  cataloguePopulated: boolean;
  /** Buyer arrived from Build a Box — show resume banner */
  fromBox?: boolean;
};

export function CatalogueShell({
  products: productsProp,
  total,
  page,
  totalPages,
  query: queryProp,
  occasionFacets: occasionFacetsProp,
  categoryFacets: categoryFacetsProp,
  brandingFacets: brandingFacetsProp,
  colourFacets: colourFacetsProp,
  materialFacets: materialFacetsProp,
  cataloguePopulated,
  fromBox = false,
}: CatalogueShellProps) {
  const products = Array.isArray(productsProp) ? productsProp : [];
  // Memoize: normalizeCatalogueQuery returns a new object each call; putting an
  // unstable `query` in an effect dep caused a max-update-depth loop.
  const query = useMemo(
    () => normalizeCatalogueQuery(queryProp),
    [queryProp],
  );
  const occasionFacets = asFacetList(occasionFacetsProp);
  const categoryFacets = asFacetList(categoryFacetsProp);
  const brandingFacets = asFacetList(brandingFacetsProp);
  const colourFacets = asFacetList(colourFacetsProp);
  const materialFacets = asFacetList(materialFacetsProp);

  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabletFiltersOpen, setTabletFiltersOpen] = useState(false);
  const [shortlistCount, setShortlistCount] = useState(0);
  const [shortlistIds, setShortlistIds] = useState<string[]>([]);
  const [boxCount, setBoxCount] = useState(0);
  /** Optimistic filters so rapid clicks don’t apply against a stale URL query. */
  const [draftQuery, setDraftQuery] = useState(query);
  const draftRef = useRef(query);
  const pendingHrefRef = useRef<string | null>(null);
  const drawerId = useId();
  const tabletPanelId = useId();
  const path = pathname || "/gifts";

  useEffect(() => {
    const sync = () => {
      const items = readShortlist();
      setShortlistCount(items.length);
      setShortlistIds(items.map((item) => item.id));
      setBoxCount(boxProductCount(readBoxDraft()));
    };
    sync();
    window.addEventListener("monkcraft:shortlist", sync);
    window.addEventListener("monkcraft:box", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:shortlist", sync);
      window.removeEventListener("monkcraft:box", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Sync draft from the server URL — skip stale RSC responses while a newer
  // filter navigation is still in flight (prevents flicker / “stuck” checks).
  useEffect(() => {
    const href = buildCatalogueHref(query, path);
    if (
      isPending &&
      pendingHrefRef.current &&
      pendingHrefRef.current !== href
    ) {
      return;
    }
    pendingHrefRef.current = null;
    draftRef.current = query;
    setDraftQuery((prev) =>
      buildCatalogueHref(prev, path) === href ? prev : query,
    );
  }, [query, path, isPending]);

  useEffect(() => {
    const onPop = () => {
      pendingHrefRef.current = null;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  // Hard reset scroll lock if the shell unmounts mid-drawer (route change).
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const sync = () => {
      if (!mq.matches) setTabletFiltersOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const activeCount = countActiveFilters(draftQuery);

  function scrollResultsIntoView() {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = document.getElementById("catalogue-results");
    if (target) {
      target.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function updateQuery(
    patch: Partial<CatalogueQuery>,
    options?: { scrollToResults?: boolean },
  ) {
    const next = applyQueryPatch(draftRef.current, patch);
    draftRef.current = next;
    setDraftQuery(next);
    const href = buildCatalogueHref(next, path);
    pendingHrefRef.current = href;
    const shouldScroll =
      options?.scrollToResults === true ||
      ("page" in patch && typeof patch.page === "number");
    startTransition(() => {
      router.replace(href, { scroll: false });
      if (shouldScroll) {
        // After the URL updates, bring the grid back into view so “Next”
        // never looks like a no-op at the bottom of a long page.
        window.setTimeout(scrollResultsIntoView, 60);
      }
    });
  }

  /** Toggle a multi-select facet from the latest draft (not a stale render). */
  function toggleFacet(
    key:
      | "occasions"
      | "categories"
      | "brandings"
      | "colours"
      | "materials",
    id: string,
  ) {
    const current = draftRef.current;
    const nextList = toggleListValue(current[key], id);
    if (key === "categories") {
      updateQuery({ categories: nextList, subcategories: [] });
      return;
    }
    updateQuery({ [key]: nextList });
  }

  function clearFilters() {
    const cleared = emptyCatalogueQuery();
    draftRef.current = cleared;
    setDraftQuery(cleared);
    pendingHrefRef.current = path;
    startTransition(() => {
      router.replace(path, { scroll: false });
    });
    setDrawerOpen(false);
    setTabletFiltersOpen(false);
  }

  function handleFiltersButton() {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px) and (max-width: 1023px)").matches
    ) {
      setDrawerOpen(false);
      setTabletFiltersOpen((open) => !open);
      return;
    }
    // Phone / small screens: toggle drawer (was force-open → felt stuck).
    setTabletFiltersOpen(false);
    setDrawerOpen((open) => !open);
  }

  const filterProps = {
    query: draftQuery,
    onChange: updateQuery,
    onToggleFacet: toggleFacet,
    onClear: clearFilters,
    shortlistCount,
    occasionFacets,
    categoryFacets,
    brandingFacets,
    colourFacets,
    materialFacets,
  };

  return (
    <div
      className={
        isPending ? "catalogue-shell catalogue-shell--pending" : "catalogue-shell"
      }
    >
      <aside className="catalogue-shell__sidebar" aria-label="Catalogue filters">
        <div className="catalogue-shell__sidebar-inner">
          <CatalogueFilters idPrefix="desktop" {...filterProps} />
        </div>
      </aside>

      <div
        className="catalogue-shell__main"
        aria-busy={isPending ? true : undefined}
      >
        {fromBox || boxCount > 0 ? (
          <div className="box-resume-banner" role="status">
            <p>
              {fromBox
                ? "Adding to your gift box — quantities are per box."
                : "Gift box draft in progress."}
              {boxCount > 0 ? ` ${boxCount} item${boxCount === 1 ? "" : "s"} selected.` : ""}
            </p>
            <Link href="/gifts/box">Back to Build a Box</Link>
          </div>
        ) : null}

        <div className="catalogue-toolbar">
          <form
            className="catalogue-toolbar__search"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              updateQuery({ q: String(form.get("q") || "").trim() });
            }}
          >
            <label className="catalogue-toolbar__search-label" htmlFor="catalogue-q">
              Search gifts
            </label>
            <div className="catalogue-toolbar__search-row">
              <input
                id="catalogue-q"
                name="q"
                type="search"
                placeholder="Search products, SKU, brand…"
                defaultValue={draftQuery.q}
                key={draftQuery.q}
              />
              <button type="submit">Search</button>
            </div>
          </form>

          <div className="catalogue-toolbar__controls">
            <button
              type="button"
              className="catalogue-toolbar__filters-btn"
              aria-expanded={tabletFiltersOpen || drawerOpen}
              aria-controls={tabletFiltersOpen ? tabletPanelId : drawerId}
              onClick={handleFiltersButton}
            >
              Filters{activeCount ? ` (${activeCount})` : ""}
            </button>

            <label className="catalogue-toolbar__sort">
              <span>Sort</span>
              <select
                value={draftQuery.sort}
                onChange={(event) =>
                  updateQuery({
                    sort: event.target.value as CatalogueQuery["sort"],
                  })
                }
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <Link className="catalogue-toolbar__shortlist" href="/gifts/find">
              Help Me Choose
            </Link>
            <Link className="catalogue-toolbar__shortlist" href="/gifts/box">
              Box{boxCount ? ` (${boxCount})` : ""}
            </Link>
            <Link className="catalogue-toolbar__shortlist" href="/gifts/shortlist">
              Shortlist{shortlistCount ? ` (${shortlistCount})` : ""}
            </Link>
          </div>
        </div>

        {tabletFiltersOpen ? (
          <div
            id={tabletPanelId}
            className="catalogue-shell__tablet-filters"
            aria-label="Catalogue filters"
          >
            <CatalogueFilters idPrefix="tablet" {...filterProps} />
          </div>
        ) : null}

        <div className="catalogue-active" aria-live="polite">
          {activeCount > 0 ? (
            <div className="catalogue-active__chips">
              {draftQuery.q ? (
                <button
                  type="button"
                  className="catalogue-chip"
                  onClick={() => updateQuery({ q: "" })}
                >
                  <span>“{draftQuery.q}”</span>
                  <span aria-hidden="true">×</span>
                </button>
              ) : null}
              {draftQuery.occasions.map((id) => (
                <button
                  key={`occ-${id}`}
                  type="button"
                  className="catalogue-chip"
                  onClick={() => toggleFacet("occasions", id)}
                >
                  <span>
                    {occasionFacets.find((item) => item.id === id)?.label ?? id}
                  </span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              {draftQuery.categories.map((id) => (
                <button
                  key={`cat-${id}`}
                  type="button"
                  className="catalogue-chip"
                  onClick={() => toggleFacet("categories", id)}
                >
                  <span>
                    {categoryFacets.find((item) => item.id === id)?.label ?? id}
                  </span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              {draftQuery.brandings.map((id) => (
                <button
                  key={`brand-${id}`}
                  type="button"
                  className="catalogue-chip"
                  onClick={() => toggleFacet("brandings", id)}
                >
                  <span>
                    {brandingFacets.find((item) => item.id === id)?.label ?? id}
                  </span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              {draftQuery.colours.map((id) => (
                <button
                  key={`colour-${id}`}
                  type="button"
                  className="catalogue-chip"
                  onClick={() => toggleFacet("colours", id)}
                >
                  <span>
                    {colourFacets.find((item) => item.id === id)?.label ?? id}
                  </span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              {draftQuery.materials.map((id) => (
                <button
                  key={`mat-${id}`}
                  type="button"
                  className="catalogue-chip"
                  onClick={() => toggleFacet("materials", id)}
                >
                  <span>
                    {materialFacets.find((item) => item.id === id)?.label ?? id}
                  </span>
                  <span aria-hidden="true">×</span>
                </button>
              ))}
              {draftQuery.budgetMinInr != null ||
              draftQuery.budgetMaxInr != null ? (
                <button
                  type="button"
                  className="catalogue-chip"
                  onClick={() =>
                    updateQuery({ budgetMinInr: null, budgetMaxInr: null })
                  }
                >
                  <span>
                    Budget
                    {draftQuery.budgetMinInr != null
                      ? ` ≥ ₹${draftQuery.budgetMinInr.toLocaleString("en-IN")}`
                      : ""}
                    {draftQuery.budgetMaxInr != null
                      ? ` ≤ ₹${draftQuery.budgetMaxInr.toLocaleString("en-IN")}`
                      : ""}
                  </span>
                  <span aria-hidden="true">×</span>
                </button>
              ) : null}
              {draftQuery.shortlistedOnly ? (
                <button
                  type="button"
                  className="catalogue-chip"
                  onClick={() =>
                    updateQuery({ shortlistedOnly: false, shortlistIds: [] })
                  }
                >
                  <span>Shortlisted</span>
                  <span aria-hidden="true">×</span>
                </button>
              ) : null}
              <button
                type="button"
                className="catalogue-active__reset"
                onClick={clearFilters}
              >
                Clear all
              </button>
            </div>
          ) : null}
          <p className="catalogue-active__count">
            {isPending
              ? "Updating…"
              : `${total.toLocaleString("en-IN")} product${total === 1 ? "" : "s"}`}
            {!cataloguePopulated
              ? " · catalogue unavailable"
              : totalPages > 1
                ? ` · page ${page} of ${totalPages}`
                : null}
          </p>
        </div>

        {products.length > 0 ? (
          <ul className="catalogue-grid">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard
                  product={product}
                  shortlisted={shortlistIds.includes(product.id)}
                />
              </li>
            ))}
          </ul>
        ) : (
          <CatalogueEmpty
            hasActiveFilters={activeCount > 0}
            onClearHref="/gifts"
          />
        )}

        {totalPages > 1 ? (
          <nav className="catalogue-pagination" aria-label="Catalogue pages">
            <button
              type="button"
              disabled={page <= 1}
              aria-busy={isPending || undefined}
              onClick={() =>
                updateQuery({ page: page - 1 }, { scrollToResults: true })
              }
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
              {isPending ? " · loading…" : ""}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              aria-busy={isPending || undefined}
              onClick={() =>
                updateQuery({ page: page + 1 }, { scrollToResults: true })
              }
            >
              Next
            </button>
          </nav>
        ) : null}

        <div className="catalogue-journey-bar">
          <p>
            Next: build a box or open your brief — then prepare one quotation
            request.
          </p>
          <div>
            <Link href="/gifts/box">
              Build a Box{boxCount ? ` (${boxCount})` : ""}
            </Link>
            <Link href="/gifts/brief">Open My Brief</Link>
          </div>
        </div>
      </div>

      {drawerOpen ? (
        <div
          className="catalogue-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <div
            className="catalogue-drawer__backdrop"
            onClick={() => setDrawerOpen(false)}
          />
          <div id={drawerId} className="catalogue-drawer__panel">
            <div className="catalogue-drawer__head">
              <h2>Filters</h2>
              <button type="button" onClick={() => setDrawerOpen(false)}>
                Done
              </button>
            </div>
            <CatalogueFilters idPrefix="mobile" {...filterProps} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CatalogueFilters({
  idPrefix,
  query,
  onChange,
  onToggleFacet,
  onClear,
  shortlistCount,
  occasionFacets,
  categoryFacets,
  brandingFacets,
  colourFacets,
  materialFacets,
}: {
  idPrefix: string;
  query: CatalogueQuery;
  onChange: (patch: Partial<CatalogueQuery>) => void;
  onToggleFacet: (
    key:
      | "occasions"
      | "categories"
      | "brandings"
      | "colours"
      | "materials",
    id: string,
  ) => void;
  onClear: () => void;
  shortlistCount: number;
  occasionFacets: CatalogueFacet[];
  categoryFacets: CatalogueFacet[];
  brandingFacets: CatalogueFacet[];
  colourFacets: CatalogueFacet[];
  materialFacets: CatalogueFacet[];
}) {
  const hasOccasion = query.occasions.length > 0;
  const hasBranding = query.brandings.length > 0;
  const hasColour = query.colours.length > 0;
  const hasMaterial = query.materials.length > 0;
  const hasBudget =
    query.budgetMinInr != null || query.budgetMaxInr != null;

  return (
    <div className="catalogue-filters">
      <p className="catalogue-filters__heading">Refine</p>

      <FacetGroup
        id={`${idPrefix}-category`}
        title="Product type"
        defaultOpen
        showAll
        className="catalogue-filters__group--product-type"
        selectedCount={query.categories.length}
        facets={categoryFacets}
        selected={query.categories}
        searchable
        onToggle={(id) => onToggleFacet("categories", id)}
      />

      <FacetGroup
        id={`${idPrefix}-occasion`}
        title="Occasion"
        defaultOpen
        selectedCount={query.occasions.length}
        facets={occasionFacets}
        selected={query.occasions}
        searchable={occasionFacets.length > 8 || hasOccasion}
        onToggle={(id) => onToggleFacet("occasions", id)}
      />

      <BudgetFilterFields
        budgetMinInr={query.budgetMinInr}
        budgetMaxInr={query.budgetMaxInr}
        hasBudget={hasBudget}
        onChange={onChange}
      />

      <FacetGroup
        id={`${idPrefix}-branding`}
        title="Customisation"
        defaultOpen={hasBranding}
        selectedCount={query.brandings.length}
        facets={brandingFacets}
        selected={query.brandings}
        searchable={brandingFacets.length > 8}
        onToggle={(id) => onToggleFacet("brandings", id)}
      />

      {colourFacets.length > 0 ? (
        <FacetGroup
          id={`${idPrefix}-colour`}
          title="Colour"
          defaultOpen={hasColour}
          selectedCount={query.colours.length}
          facets={colourFacets}
          selected={query.colours}
          searchable={colourFacets.length > 8}
          onToggle={(id) => onToggleFacet("colours", id)}
        />
      ) : null}

      {materialFacets.length > 0 ? (
        <FacetGroup
          id={`${idPrefix}-material`}
          title="Material"
          defaultOpen={hasMaterial}
          selectedCount={query.materials.length}
          facets={materialFacets}
          selected={query.materials}
          searchable={materialFacets.length > 8}
          onToggle={(id) => onToggleFacet("materials", id)}
        />
      ) : null}

      <div className="catalogue-filters__shortlist">
        <p className="catalogue-filters__shortlist-title">Shortlist</p>
        <p className="catalogue-filters__shortlist-meta">
          {shortlistCount > 0
            ? `${shortlistCount} saved`
            : "No gifts saved yet"}
        </p>
        <Link className="catalogue-filters__shortlist-link" href="/gifts/shortlist">
          View shortlist
        </Link>
        <label className="catalogue-filters__check">
          <input
            type="checkbox"
            checked={query.shortlistedOnly}
            onChange={(event) =>
              onChange({ shortlistedOnly: event.target.checked })
            }
          />
          <span className="catalogue-filters__label">Show shortlisted only</span>
        </label>
      </div>

      {countActiveFilters(query) > 0 ? (
        <button type="button" className="catalogue-filters__clear" onClick={onClear}>
          Clear all
        </button>
      ) : null}
    </div>
  );
}

function BudgetFilterFields({
  budgetMinInr,
  budgetMaxInr,
  hasBudget,
  onChange,
}: {
  budgetMinInr: number | null;
  budgetMaxInr: number | null;
  hasBudget: boolean;
  onChange: (patch: Partial<CatalogueQuery>) => void;
}) {
  const [minText, setMinText] = useState(
    budgetMinInr != null ? String(budgetMinInr) : "",
  );
  const [maxText, setMaxText] = useState(
    budgetMaxInr != null ? String(budgetMaxInr) : "",
  );
  const [prevMin, setPrevMin] = useState(budgetMinInr);
  const [prevMax, setPrevMax] = useState(budgetMaxInr);
  const minTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resync the debounce buffer when the value changes elsewhere (URL/draft).
  // Render-time derivation keeps this out of an effect (react-hooks safe).
  if (budgetMinInr !== prevMin) {
    setPrevMin(budgetMinInr);
    setMinText(budgetMinInr != null ? String(budgetMinInr) : "");
  }
  if (budgetMaxInr !== prevMax) {
    setPrevMax(budgetMaxInr);
    setMaxText(budgetMaxInr != null ? String(budgetMaxInr) : "");
  }

  useEffect(() => {
    return () => {
      if (minTimer.current) clearTimeout(minTimer.current);
      if (maxTimer.current) clearTimeout(maxTimer.current);
    };
  }, []);

  function parseBudget(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }

  function scheduleMin(raw: string) {
    setMinText(raw);
    if (minTimer.current) clearTimeout(minTimer.current);
    minTimer.current = setTimeout(() => {
      onChange({ budgetMinInr: parseBudget(raw) });
    }, BUDGET_DEBOUNCE_MS);
  }

  function scheduleMax(raw: string) {
    setMaxText(raw);
    if (maxTimer.current) clearTimeout(maxTimer.current);
    maxTimer.current = setTimeout(() => {
      onChange({ budgetMaxInr: parseBudget(raw) });
    }, BUDGET_DEBOUNCE_MS);
  }

  function flushMin() {
    if (minTimer.current) clearTimeout(minTimer.current);
    onChange({ budgetMinInr: parseBudget(minText) });
  }

  function flushMax() {
    if (maxTimer.current) clearTimeout(maxTimer.current);
    onChange({ budgetMaxInr: parseBudget(maxText) });
  }

  return (
    <div className={`catalogue-filters__group${hasBudget ? " is-open" : ""}`}>
      <details open={hasBudget ? true : undefined}>
        <summary className="catalogue-filters__budget-summary">
          <span className="catalogue-filters__toggle-label">
            Budget (₹ per unit)
          </span>
          <span className="catalogue-filters__toggle-meta">
            {hasBudget ? (
              <span className="catalogue-filters__badge">On</span>
            ) : null}
          </span>
        </summary>
        <div className="catalogue-filters__budget">
          <label>
            <span className="catalogue-filters__budget-label">Min</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Any"
              value={minText}
              onChange={(event) => scheduleMin(event.target.value)}
              onBlur={flushMin}
            />
          </label>
          <label>
            <span className="catalogue-filters__budget-label">Max</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="Any"
              value={maxText}
              onChange={(event) => scheduleMax(event.target.value)}
              onBlur={flushMax}
            />
          </label>
          <p className="catalogue-filters__budget-note">
            Only products with a verified catalogue price. Quote / unknown
            prices are never treated as in-budget.
          </p>
        </div>
      </details>
    </div>
  );
}

function FacetGroup({
  id,
  title,
  facets,
  selected,
  onToggle,
  defaultOpen = false,
  selectedCount = 0,
  searchable = false,
  showAll: showAllFacets = false,
  className = "",
}: {
  id: string;
  title: string;
  facets: CatalogueFacet[];
  selected: string[];
  onToggle: (id: string) => void;
  defaultOpen?: boolean;
  selectedCount?: number;
  searchable?: boolean;
  /** When true, list every facet (no “Show more” truncation). */
  showAll?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen || selectedCount > 0);
  const [needle, setNeedle] = useState("");
  const [expanded, setExpanded] = useState(showAllFacets);
  const [prevSelectedCount, setPrevSelectedCount] = useState(selectedCount);

  // Keep groups with active selections visible after URL/draft updates.
  // Render-time derivation (react-hooks safe) instead of an effect.
  if (selectedCount !== prevSelectedCount) {
    setPrevSelectedCount(selectedCount);
    if (selectedCount > 0 && !open) setOpen(true);
  }

  const safeFacets = useMemo(
    () => (Array.isArray(facets) ? facets : []),
    [facets],
  );
  const safeSelected = Array.isArray(selected) ? selected : [];

  const filtered = useMemo(() => {
    const q = needle.trim().toLowerCase();
    if (!q) return safeFacets;
    return safeFacets.filter((facet) =>
      facet.label.toLowerCase().includes(q),
    );
  }, [safeFacets, needle]);

  const visible =
    showAllFacets || expanded
      ? filtered
      : filtered.slice(0, FACET_VISIBLE_LIMIT);
  const hiddenCount = filtered.length - visible.length;
  const showSearch =
    searchable &&
    (showAllFacets
      ? safeFacets.length > 10
      : safeFacets.length > FACET_VISIBLE_LIMIT);

  return (
    <div
      className={[
        "catalogue-filters__group",
        open ? "is-open" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="catalogue-filters__toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="catalogue-filters__toggle-label">{title}</span>
        <span className="catalogue-filters__toggle-meta">
          {selectedCount > 0 ? (
            <span className="catalogue-filters__badge">{selectedCount}</span>
          ) : null}
          <span className="catalogue-filters__chevron" aria-hidden="true" />
        </span>
      </button>

      <div
        id={id}
        className="catalogue-filters__panel"
        aria-hidden={!open}
        inert={open ? undefined : true}
      >
        <div className="catalogue-filters__panel-inner">
          {showSearch ? (
            <input
              type="search"
              className="catalogue-filters__search"
              placeholder={`Search ${title.toLowerCase()}…`}
              value={needle}
              onChange={(event) => {
                setNeedle(event.target.value);
                if (!showAllFacets) setExpanded(true);
              }}
              aria-label={`Search ${title}`}
            />
          ) : null}
          <ul>
            {visible.map((facet) => (
              <li key={facet.id}>
                <label className="catalogue-filters__check">
                  <input
                    type="checkbox"
                    checked={safeSelected.includes(facet.id)}
                    onChange={() => onToggle(facet.id)}
                  />
                  <span className="catalogue-filters__label">{facet.label}</span>
                  {typeof facet.count === "number" ? (
                    <span className="catalogue-filters__count">
                      {facet.count.toLocaleString("en-IN")}
                    </span>
                  ) : null}
                </label>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="catalogue-filters__empty">No matches</li>
            ) : null}
          </ul>
          {!showAllFacets && hiddenCount > 0 ? (
            <button
              type="button"
              className="catalogue-filters__more"
              onClick={() => setExpanded(true)}
            >
              Show {hiddenCount} more
            </button>
          ) : null}
          {!showAllFacets &&
          expanded &&
          filtered.length > FACET_VISIBLE_LIMIT &&
          !needle.trim() ? (
            <button
              type="button"
              className="catalogue-filters__more"
              onClick={() => setExpanded(false)}
            >
              Show less
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
