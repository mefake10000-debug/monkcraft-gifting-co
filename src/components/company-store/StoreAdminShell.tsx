"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { StudioProductSummary } from "@/data/catalogue/studioTypes";
import type {
  CompanyStoreDraft,
  StoreCategory,
} from "@/data/companyStore/types";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StoreDemoBanner } from "@/components/company-store/StoreDemoBanner";
import {
  addStoreProduct,
  assignProductToCategory,
  clearCompanyStoreDraft,
  moveStoreProduct,
  newCategoryId,
  patchCompanyStoreDraft,
  readCompanyStoreDraft,
  removeStoreCategory,
  removeStoreProduct,
  upsertStoreCategory,
  writeCompanyStoreDraft,
} from "@/lib/companyStore/draft";
import { syncCompanyStoreDraftToBrief } from "@/lib/companyStore/briefSync";
import {
  buildCompanyStoreEnquiryText,
} from "@/lib/companyStore/enquiry";
import {
  clearStoreOrderRequests,
  readStoreOrderRequests,
  STORE_REQUESTS_EVENT,
} from "@/lib/companyStore/orderDraft";
import { useStoreDraft } from "@/lib/companyStore/useStoreDraft";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";
import {
  logoNeedsReattach,
  readStudioLogoAsAsset,
} from "@/lib/studio/logo";
import { formatInrAmount } from "@/lib/pricing";
import { getPaginationItems } from "@/lib/pagination";

const STEPS = [
  { id: "branding", label: "Company details", shortLabel: "Company" },
  { id: "merchandise", label: "Choose gifts", shortLabel: "Gifts" },
  { id: "rules", label: "Set programme rules", shortLabel: "Rules" },
  { id: "preview", label: "Present the store", shortLabel: "Present" },
] as const;

const TOOLS = [
  { id: "orders", label: "Demo order requests" },
] as const;

type ViewId = (typeof STEPS)[number]["id"] | (typeof TOOLS)[number]["id"] | "summary";

function isView(value: string | null): value is ViewId {
  return value === "summary" || [...STEPS, ...TOOLS].some((v) => v.id === value);
}

export function focusCompanyStorePanelHeading(panel: HTMLElement | null) {
  const heading = panel?.querySelector<HTMLElement>("h2");
  if (!heading) return;

  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  heading.scrollIntoView({ block: "center", behavior: "smooth" });
}

export function revealCompanyStoreStep(
  nav: HTMLElement | null,
  prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
) {
  const activeStep = nav?.querySelector<HTMLElement>('[aria-current="step"]');
  if (!nav || !activeStep) return;

  const navRect = nav.getBoundingClientRect();
  const stepRect = activeStep.getBoundingClientRect();
  const left = Math.max(
    0,
    nav.scrollLeft +
      stepRect.left -
      navRect.left -
      (nav.clientWidth - activeStep.offsetWidth) / 2,
  );
  nav.scrollTo({ left, behavior: prefersReducedMotion ? "auto" : "smooth" });
}

export function parseCompanyStoreCataloguePage(value: string | null): number {
  const page = Number(value);
  return Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
}

export function buildCompanyStoreCataloguePageHref(
  routeBase: string,
  currentSearchParams: string,
  page: number,
): string {
  const params = new URLSearchParams(currentSearchParams);
  if (page <= 1) params.delete("cataloguePage");
  else params.set("cataloguePage", String(Math.floor(page)));
  const query = params.toString();
  return query ? `${routeBase}?${query}` : routeBase;
}

export function focusCompanyStoreCatalogueResult(heading: HTMLElement | null) {
  if (!heading) return;
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  heading.scrollIntoView({
    block: "start",
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

export function StoreAdminShell({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const view: ViewId = isView(viewParam) ? viewParam : "branding";
  const { draft, ready } = useStoreDraft();
  const stepNavRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousViewRef = useRef(view);
  const routeBase = embedded ? "/company-stores" : "/company-stores/configure";
  const summaryHref = `${routeBase}?view=summary`;
  const cataloguePage = parseCompanyStoreCataloguePage(searchParams.get("cataloguePage"));
  function setCataloguePage(page: number) {
    router.push(
      buildCompanyStoreCataloguePageHref(routeBase, searchParams.toString(), page),
      { scroll: false },
    );
  }
  function setView(next: ViewId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.push(`${routeBase}?${params.toString()}`, {
      scroll: false,
    });
  }
  const stepIndex = STEPS.findIndex((step) => step.id === view);
  const hasIdentity = Boolean(draft.identity.companyName.trim() || draft.identity.storeName.trim());
  const hasCollection = draft.productIds.length > 0;
  const o = draft.rules.ordering;
  const hasProgramme = o.allowanceMode !== "none" || o.deliveryPreference !== "undecided" || o.maxItemsPerOrder !== null || o.requireApproval;
  const completeCount = [hasIdentity, hasCollection, hasProgramme].filter(Boolean).length;
  const stepComplete = [hasIdentity, hasCollection, hasProgramme, false];
  const returnTo = `${routeBase}?view=preview`;
  const previewUrl = `/company-stores/preview?returnTo=${encodeURIComponent(returnTo)}`;

  useEffect(() => {
    if (previousViewRef.current !== view) {
      previousViewRef.current = view;
      focusCompanyStorePanelHeading(panelRef.current);
    }
    if (stepIndex >= 0) {
      revealCompanyStoreStep(stepNavRef.current);
    }
  }, [stepIndex, view]);

  function resetDemoDraft() {
    if (!window.confirm("Reset this Company Store demo draft in this browser?")) return;
    clearCompanyStoreDraft();
    clearStoreOrderRequests();
    window.localStorage.removeItem("monkcraft-company-store-showcase-cart-v1");
    window.dispatchEvent(new CustomEvent("monkcraft:company-store-showcase-cart"));
  }

  return (
    <div className={embedded ? "cs-admin-embedded" : "cs-page"}>
      <StoreDemoBanner context="demo" />
      <div className="cs-admin">
        {!embedded ? <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Company Stores", href: "/company-stores" },
            { label: "Company demo" },
          ]}
        /> : null}
        <header className="cs-admin__header">
          <div>
            <p className="cs-landing__eyebrow" style={{ marginBottom: "0.35rem" }}>
              COMPANY STORE · MANAGER DEMO
            </p>
            {embedded ? <h2>Set up your company store</h2> : <h1>Set up your company store</h1>}
            <p>Choose gifts and set the rules, then present the employee view.</p>
          </div>
          <Link
            className="cs-btn cs-btn--ghost cs-btn--small"
            href="/?interest=company-store#enquire"
          >
            Discuss a programme
          </Link>
        </header>

        <div className="cs-admin__progress" aria-live="polite">
          <div>
            <strong>Setup choices: {completeCount} of 3</strong>
            <span>Company · gifts · programme rules. Then present the employee view.</span>
            {completeCount > 0 ? <button type="button" className="cs-admin__reset" onClick={resetDemoDraft}>Start fresh demo</button> : null}
          </div>
          <div className="cs-admin__progress-track" role="progressbar" aria-label="Company Store setup choices" aria-valuemin={0} aria-valuemax={3} aria-valuenow={completeCount}><span style={{ width: `${Math.round(completeCount / 3 * 100)}%` }} /></div>
        </div>
        <details className="cs-admin__summary">
          <summary>
            <strong>Proposal at a glance</strong>
            <span>{draft.identity.companyName || "Add company name"} · {draft.productIds.length} gift{draft.productIds.length === 1 ? "" : "s"}</span>
          </summary>
          <DraftSidebar draft={draft} view={view} onNavigate={setView} />
        </details>
        <nav ref={stepNavRef} className="cs-admin__nav" aria-label="Company Store proposal steps">
            {STEPS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-current={view === item.id ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${item.label}`}
                onClick={() => setView(item.id)}
              >
                <span className="cs-admin__step-number">{stepComplete[index] ? "✓" : index + 1}</span>
                <span><strong>{item.shortLabel}</strong><small>{item.label}</small></span>
              </button>
            ))}
        </nav>
        <div className="cs-admin__layout">
          <div className="cs-admin__panel" ref={panelRef}>
            {!ready ? (
              <p>Loading draft…</p>
            ) : view === "branding" ? (
              <BrandingPanel />
            ) : view === "merchandise" ? (
              <MerchandisePanel
                draft={draft}
                cataloguePage={cataloguePage}
                onCataloguePageChange={setCataloguePage}
              />
            ) : view === "rules" ? (
              <RulesPanel />
            ) : view === "preview" ? (
              <PreviewPanel draft={draft} previewUrl={previewUrl} summaryHref={summaryHref} />
            ) : view === "orders" ? (
              <OrdersPanel />
            ) : (
              <SummaryPanel draft={draft} />
            )}
            {stepIndex >= 0 && stepIndex < STEPS.length - 1 ? (
              <div className="cs-wizard-actions">
                {stepIndex > 0 ? (
                  <button type="button" className="cs-btn cs-btn--ghost" onClick={() => setView(STEPS[stepIndex - 1].id)}>
                    Back
                  </button>
                ) : <span />}
                <button type="button" className="cs-btn cs-btn--primary" onClick={() => setView(STEPS[stepIndex + 1].id)}>
                  Continue to {STEPS[stepIndex + 1].shortLabel.toLowerCase()}
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <details className="cs-admin__tools">
          <summary>Demo tools</summary>
          <div className="cs-actions">
            {TOOLS.map((tool) => (
              <button key={tool.id} type="button" className="cs-btn cs-btn--ghost cs-btn--small" onClick={() => setView(tool.id)}>
                {tool.label}
              </button>
            ))}
          </div>
          <p className="cs-field__hint">Demo requests stay in this browser; they are not orders or analytics.</p>
        </details>
      </div>
    </div>
  );
}

function DraftSidebar({
  draft,
  view,
  onNavigate,
}: {
  draft: CompanyStoreDraft;
  view: ViewId;
  onNavigate: (view: ViewId) => void;
}) {
  const o = draft.rules.ordering;
  const funding = o.allowanceMode === "allowance-cap" && o.allowanceCapInr
    ? `${formatInrAmount(o.allowanceCapInr)} demo cap`
    : o.allowanceMode === "company-funded"
      ? "Company-funded · to confirm"
      : "To discuss";
  const delivery = { undecided: "To discuss", office: "One office", home: "Employee addresses", either: "Office or home" }[o.deliveryPreference];
  const activeStep = STEPS.find((step) => step.id === view);

  return (
    <aside className="cs-admin__overview" aria-label="Company proposal at a glance">
      <div className="cs-admin__overview-head">
        <span>COMPANY PROPOSAL</span>
        <span className="cs-chip cs-chip--draft">Draft</span>
      </div>
      {activeStep ? <p className="cs-admin__overview-current">You’re working on <strong>{activeStep.shortLabel.toLowerCase()}</strong>.</p> : null}
      <dl className="cs-admin__overview-list">
        <div><dt>Company</dt><dd>{draft.identity.companyName || "Add company name"}</dd></div>
        <div><dt>Programme</dt><dd>{draft.identity.storeName || "Name the programme"}</dd></div>
        <div><dt>Gift collection</dt><dd>{draft.productIds.length} selected</dd></div>
        <div><dt>Credit approach</dt><dd>{funding}</dd></div>
        <div><dt>Delivery</dt><dd>{delivery}</dd></div>
      </dl>
      <p className="cs-admin__overview-note">This proposal saves in this browser. No employee access, credit balances, or orders are live.</p>
      <button type="button" className="cs-btn cs-btn--ghost cs-btn--small" onClick={() => onNavigate("summary")}>Review proposal</button>
    </aside>
  );
}

function BrandingPanel() {
  const { draft } = useStoreDraft();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const formId = useId();

  function updateIdentity(key: "companyName" | "storeName" | "storeTitle" | "welcomeMessage" | "accentColor", value: string) {
    const current = readCompanyStoreDraft();
    patchCompanyStoreDraft({ identity: { ...current.identity, [key]: value } });
  }

  function saveIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const companyName = String(form.get("companyName") || "").trim();
    const storeName = String(form.get("storeName") || "").trim();
    if (!companyName && !storeName) {
      setError("Add at least a company name or store name.");
      return;
    }
    const accentColor = String(form.get("accentColor") || "#662F90");
    const current = readCompanyStoreDraft();
    patchCompanyStoreDraft({
      identity: {
        ...current.identity,
        companyName,
        storeName,
        storeTitle: String(form.get("storeTitle") || "").trim(),
        welcomeMessage: String(form.get("welcomeMessage") || "").trim(),
        accentColor: /^#[0-9A-Fa-f]{6}$/.test(accentColor)
          ? accentColor
          : draft.identity.accentColor,
      },
    });
    setStatus("Branding draft saved in this browser.");
  }

  async function onLogo(file: File | null) {
    setError("");
    setStatus("");
    if (!file) return;
    try {
      const logo = await readStudioLogoAsAsset(file);
      const current = readCompanyStoreDraft();
      writeCompanyStoreDraft({
        ...current,
        identity: { ...current.identity, logo },
      });
      setStatus("Logo preview attached to local draft.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read logo.");
    }
  }

  function clearLogo() {
    const current = readCompanyStoreDraft();
    writeCompanyStoreDraft({
      ...current,
      identity: { ...current.identity, logo: null },
    });
    setStatus("Logo removed from draft.");
  }

  return (
    <div>
      <p className="cs-panel-step">STEP 1 · COMPANY SETUP</p>
      <h2>Company identity</h2>
      <p className="cs-panel-lede">Name the store. Your choices appear in the employee preview.</p>
      <form className="cs-form-grid" onSubmit={saveIdentity}>
        <div className="cs-form-grid cs-form-grid--2">
          <div className="cs-field">
            <label htmlFor={`${formId}-company`}>Company or organisation</label>
            <input
              id={`${formId}-company`}
              name="companyName"
              defaultValue={draft.identity.companyName}
              autoComplete="organization"
              onChange={(event) => updateIdentity("companyName", event.target.value)}
            />
          </div>
          <div className="cs-field">
            <label htmlFor={`${formId}-store`}>Programme name</label>
            <input
              id={`${formId}-store`}
              name="storeName"
              defaultValue={draft.identity.storeName}
              placeholder="e.g. Welcome Kit 2026"
              onChange={(event) => updateIdentity("storeName", event.target.value)}
            />
          </div>
        </div>
        <div className="cs-form-grid cs-form-grid--2">
          <div className="cs-field">
            <label htmlFor={`${formId}-welcome`}>Employee welcome</label>
            <select
              id={`${formId}-welcome`}
              name="welcomeMessage"
              value={draft.identity.welcomeMessage}
              onChange={(event) => updateIdentity("welcomeMessage", event.target.value)}
            >
              <option value="Welcome to your company merchandise store. Browse approved items and prepare a draft order request.">Browse your selected gifts</option>
              <option value="Choose a gift from this collection as a thank-you for all you do.">A thank-you for your team</option>
              <option value="Pick a welcome gift selected for your first days with the team.">Welcome to the team</option>
              <option value="Celebrate the milestone with a gift chosen for you.">Celebrate a milestone</option>
            </select>
          </div>
          <div className="cs-field">
            <label htmlFor={`${formId}-accent`}>Store accent</label>
            <select
              id={`${formId}-accent`}
              name="accentColor"
              value={draft.identity.accentColor}
              onChange={(event) => updateIdentity("accentColor", event.target.value)}
            >
              <option value="#662F90">Monkcraft violet</option>
              <option value="#245B73">Ocean blue</option>
              <option value="#38634D">Forest green</option>
              <option value="#A74F3E">Warm terracotta</option>
            </select>
          </div>
        </div>
        <details className="cs-identity-advanced">
          <summary>Optional store details</summary>
          <div className="cs-form-grid cs-form-grid--2">
            <div className="cs-field">
              <label htmlFor={`${formId}-title`}>Store headline</label>
              <input id={`${formId}-title`} name="storeTitle" defaultValue={draft.identity.storeTitle} placeholder="A short message at the top" onChange={(event) => updateIdentity("storeTitle", event.target.value)} />
            </div>
            <div className="cs-field">
              <label htmlFor={`${formId}-logo`}>Company logo (optional)</label>
          <input
            id={`${formId}-logo`}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(event) => onLogo(event.target.files?.[0] ?? null)}
          />
              <p className="cs-field__hint">PNG, JPG, WebP, or SVG under 400KB; stored in this browser only.</p>
          {draft.identity.logo ? (
            <div className="cs-logo-preview">
              {draft.identity.logo.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.identity.logo.dataUrl}
                  alt=""
                  width={72}
                  height={72}
                />
              ) : null}
              <div>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  {draft.identity.logo.fileName}
                </p>
                {logoNeedsReattach(draft.identity.logo) ? (
                  <p className="cs-field__hint">
                    Preview data missing after refresh — re-attach the file.
                  </p>
                ) : null}
                <button
                  type="button"
                  className="cs-btn cs-btn--ghost cs-btn--small"
                  style={{ marginTop: "0.5rem" }}
                  onClick={clearLogo}
                >
                  Remove logo
                </button>
              </div>
            </div>
          ) : null}
            </div>
          </div>
        </details>
        {error ? (
          <p className="cs-error" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="cs-status" role="status">
            {status}
          </p>
        ) : null}
        <div className="cs-actions">
          <button type="submit" className="cs-btn cs-btn--ghost">
            Save draft
          </button>
        </div>
      </form>
    </div>
  );
}

function MerchandisePanel({
  draft,
  cataloguePage,
  onCataloguePageChange,
}: {
  draft: CompanyStoreDraft;
  cataloguePage: number;
  onCataloguePageChange: (page: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudioProductSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [catalogueCategory, setCatalogueCategory] = useState("");
  const [selected, setSelected] = useState<StudioProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [status, setStatus] = useState("");
  const firstProductHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusResultsAfterLoadRef = useRef(false);
  const hasSearchedRef = useRef(cataloguePage > 1);
  const searchRequestRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function loadSelected() {
      if (draft.productIds.length === 0) {
        setSelected([]);
        return;
      }
      try {
        const products = await fetchStudioProducts({ ids: draft.productIds });
        if (cancelled) return;
        const byId = new Map(products.map((p) => [p.id, p]));
        setSelected(
          draft.productIds
            .map((id) => byId.get(id))
            .filter((p): p is StudioProductSummary => Boolean(p)),
        );
      } catch {
        if (!cancelled) setError("Could not load selected products.");
      }
    }
    void loadSelected();
    return () => {
      cancelled = true;
    };
  }, [draft.productIds]);

  const searchPage = useCallback(async (pageNumber: number) => {
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setLoading(true);
    setError("");
    setStatus("Loading catalogue page…");
    setResults([]);
    try {
      const params = new URLSearchParams({ q: query.trim(), category: catalogueCategory, page: String(pageNumber), limit: "24" });
      const response = await fetch(`/api/catalogue/search?${params.toString()}`);
      if (!response.ok) throw new Error("Catalogue search failed. Try again in a moment.");
      const data = await response.json() as { products?: StudioProductSummary[]; totalPages?: number; total?: number };
      if (requestId !== searchRequestRef.current) return;
      const products = Array.isArray(data.products) ? data.products : [];
      setResults(products);
      setTotalPages(Math.max(1, Number(data.totalPages) || 1));
      if (products.length === 0) {
        setStatus("No catalogue matches for that search.");
      } else {
        setStatus(`${Number(data.total) || products.length} catalogue products found.`);
      }
    } catch (err) {
      if (requestId === searchRequestRef.current) {
        setError(err instanceof Error ? err.message : "Search failed.");
        setStatus("");
      }
    } finally {
      if (requestId === searchRequestRef.current) setLoading(false);
    }
  }, [catalogueCategory, query]);

  useEffect(() => {
    if (cataloguePage > 1) hasSearchedRef.current = true;
    if (!hasSearchedRef.current) return;
    focusResultsAfterLoadRef.current = true;
    void searchPage(cataloguePage);
  }, [cataloguePage, searchPage]);

  useEffect(() => {
    if (!results.length || !focusResultsAfterLoadRef.current) return;
    focusResultsAfterLoadRef.current = false;
    focusCompanyStoreCatalogueResult(firstProductHeadingRef.current);
  }, [results]);

  function goToCataloguePage(pageNumber: number) {
    hasSearchedRef.current = true;
    focusResultsAfterLoadRef.current = true;
    if (pageNumber === cataloguePage) {
      void searchPage(pageNumber);
      return;
    }
    onCataloguePageChange(pageNumber);
  }

  function search(event?: FormEvent) {
    event?.preventDefault();
    goToCataloguePage(1);
  }

  function addProduct(product: StudioProductSummary) {
    addStoreProduct(product.id, draft.categories[0]?.id);
    setStatus(`Added “${product.name}”.`);
  }

  function addCategory(event: FormEvent) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return;
    const cat: StoreCategory = {
      id: newCategoryId(),
      name,
      productIds: [],
    };
    upsertStoreCategory(cat);
    setCategoryName("");
    setStatus(`Category “${name}” added.`);
  }

  return (
    <div>
      <p className="cs-panel-step">STEP 2 · GIFT COLLECTION</p>
      <h2>Choose gifts</h2>
      <p className="cs-panel-lede">Search the catalogue and add the gifts employees can choose.</p>

      <form className="cs-search-row cs-catalogue-picker" onSubmit={search}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products by name or SKU"
          aria-label="Search catalogue"
        />
        <select aria-label="Filter catalogue category" value={catalogueCategory} onChange={(event) => setCatalogueCategory(event.target.value)}>
          <option value="">All product types</option>
          <option value="Drinkware & Barware">Drinkware &amp; Barware</option>
          <option value="Bags & Travel">Bags &amp; Travel</option>
          <option value="Apparel & Lifestyle">Apparel &amp; Lifestyle</option>
          <option value="Tech & Gadgets">Tech &amp; Gadgets</option>
          <option value="Office & Stationery">Office &amp; Stationery</option>
          <option value="Hampers & Gifting">Hampers &amp; Gifting</option>
          <option value="Eco-Friendly">Eco-Friendly</option>
          <option value="Wellness & Organic">Wellness &amp; Organic</option>
        </select>
        <button
          type="submit"
          className="cs-btn cs-btn--primary cs-btn--small"
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
        <button type="button" className="cs-btn cs-btn--ghost cs-btn--small" onClick={() => goToCataloguePage(1)}>
          Browse catalogue
        </button>
      </form>
      {error ? (
        <p className="cs-error" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="cs-status" role="status">
          {status}
        </p>
      ) : null}

      {results.length > 0 ? (
        <section id="company-store-catalogue-results" className="cs-catalogue-results" aria-label="Catalogue products">
        <div className="cs-catalogue-results__heading"><h3>Monkcraft catalogue</h3><span>{results.length} products · page {cataloguePage} of {totalPages}</span></div>
        <ul className="cs-product-list" style={{ marginBottom: "1.5rem" }}>
          {results.map((product, index) => {
            const inStore = draft.productIds.includes(product.id);
            return (
              <li key={product.id} className="cs-product-row">
                {product.imageSrc ? (
                  <Image
                    src={product.imageSrc}
                    alt=""
                    width={56}
                    height={56}
                  />
                ) : (
                  <div className="cs-product-row__ph">No image</div>
                )}
                <div>
                  <h3
                    ref={index === 0 ? firstProductHeadingRef : undefined}
                    tabIndex={index === 0 ? -1 : undefined}
                  >{product.name}</h3>
                  <p>
                    {product.categoryName}
                    {product.priceLabel ? ` · ${product.priceLabel}` : ""}
                  </p>
                </div>
                <div className="cs-product-row__actions">
                  <button
                    type="button"
                    className="cs-btn cs-btn--primary cs-btn--small"
                    disabled={inStore}
                    onClick={() => addProduct(product)}
                  >
                    {inStore ? "Added" : "Add"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {totalPages > 1 ? <nav className="cs-catalogue-pagination" aria-label="Catalogue pages">
          <button type="button" className="cs-btn cs-btn--ghost cs-btn--small" aria-label="Previous page" disabled={cataloguePage <= 1 || loading} onClick={() => goToCataloguePage(cataloguePage - 1)}>Previous</button>
          <div className="cs-catalogue-pagination__numbers" role="group" aria-label="Choose a page">
            {getPaginationItems(cataloguePage, totalPages).map((item, index) => item === "ellipsis"
              ? <span key={`ellipsis-${index}`} aria-hidden="true">…</span>
              : <button key={item} type="button" className="cs-btn cs-btn--ghost cs-btn--small" aria-label={`Page ${item}`} aria-current={item === cataloguePage ? "page" : undefined} disabled={loading} onClick={() => goToCataloguePage(item)}>{item}</button>)}
          </div>
          <span>Page {cataloguePage} of {totalPages}</span>
          <button type="button" className="cs-btn cs-btn--ghost cs-btn--small" aria-label="Next page" disabled={cataloguePage >= totalPages || loading} onClick={() => goToCataloguePage(cataloguePage + 1)}>Next</button>
        </nav> : null}
        </section>
      ) : null}

      <div className="cs-selected-heading"><div><h3>Selected gifts</h3><p>{selected.length} {selected.length === 1 ? "product" : "products"} in this company collection</p></div><span className="cs-chip">{selected.length}</span></div>
      {selected.length === 0 ? (
        <div className="cs-empty">
          <h3>No merchandise yet</h3>
          <p>
            Start with the catalogue above. Add products here to make them available to the team.
          </p>
        </div>
      ) : (
        <ul className="cs-product-list">
          {selected.map((product, index) => (
            <li key={product.id} className="cs-product-row">
              {product.imageSrc ? (
                <Image
                  src={product.imageSrc}
                  alt=""
                  width={56}
                  height={56}
                />
              ) : (
                <div className="cs-product-row__ph">No image</div>
              )}
              <div>
                <h3>{product.name}</h3>
                <p>
                  {product.categoryName}
                  {product.priceLabel ? ` · ${product.priceLabel}` : ""}
                </p>
                <label
                  className="cs-field__hint"
                  style={{ display: "block", marginTop: "0.35rem" }}
                >
                  Store category{" "}
                  <select
                    value={
                      draft.categories.find((c) =>
                        c.productIds.includes(product.id),
                      )?.id ?? draft.categories[0]?.id
                    }
                    onChange={(event) =>
                      assignProductToCategory(product.id, event.target.value)
                    }
                    aria-label={`Category for ${product.name}`}
                  >
                    {draft.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="cs-product-row__actions">
                <button
                  type="button"
                  className="cs-btn cs-btn--ghost cs-btn--small"
                  disabled={index === 0}
                  onClick={() => moveStoreProduct(product.id, "up")}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="cs-btn cs-btn--ghost cs-btn--small"
                  disabled={index === selected.length - 1}
                  onClick={() => moveStoreProduct(product.id, "down")}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="cs-btn cs-btn--secondary cs-btn--small"
                  onClick={() => {
                    removeStoreProduct(product.id);
                    setStatus(`Removed “${product.name}”.`);
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="cs-search-row cs-category-picker" style={{ marginTop: "1.5rem" }} onSubmit={addCategory}>
        <label htmlFor="company-store-category">Add a collection</label>
        <select id="company-store-category" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} aria-label="Choose a collection type">
          <option value="">Choose a collection type</option>
          {["Welcome gifts", "Apparel", "Drinkware", "Tech & desk", "Awards & recognition", "Festive gifting", "Other"].map((category) => <option key={category}>{category}</option>)}
        </select>
        <button type="submit" className="cs-btn cs-btn--secondary cs-btn--small" disabled={!categoryName || draft.categories.some((category) => category.name === categoryName)}>
          Add collection
        </button>
      </form>
      <ul className="cs-product-list">
        {draft.categories.map((cat) => (
          <li key={cat.id} className="cs-product-row" style={{ gridTemplateColumns: "1fr auto" }}>
            <div>
              <h3>{cat.name}</h3>
              <p>{cat.productIds.length} product(s)</p>
            </div>
            <div className="cs-product-row__actions">
              <button
                type="button"
                className="cs-btn cs-btn--ghost cs-btn--small"
                disabled={draft.categories.length <= 1}
                onClick={() => removeStoreCategory(cat.id)}
              >
                Remove category
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RulesPanel() {
  const { draft } = useStoreDraft();
  const formId = useId();
  const [status, setStatus] = useState("");

  function saveRules(formElement: HTMLFormElement) {
    const form = new FormData(formElement);
    const maxItems = Number(form.get("maxItemsPerOrder"));
    const maxUnits = Number(form.get("maxUnitsPerProduct"));
    const allowanceCap = Number(form.get("allowanceCapInr"));
    const allowanceMode = String(form.get("allowanceMode") || "none") as
      | "none"
      | "company-funded"
      | "allowance-cap";

    patchCompanyStoreDraft({
      rules: {
        access: {
          accessNote: String(form.get("accessNote") || "").trim(),
          requireWorkEmail: form.get("requireWorkEmail") === "on",
          visibilityNote: String(form.get("visibilityNote") || "").trim(),
        },
        ordering: {
          maxItemsPerOrder:
            Number.isFinite(maxItems) && maxItems > 0
              ? Math.floor(maxItems)
              : null,
          maxUnitsPerProduct:
            Number.isFinite(maxUnits) && maxUnits > 0
              ? Math.floor(maxUnits)
              : null,
          allowanceMode,
          allowanceCapInr:
            allowanceMode === "allowance-cap" &&
            Number.isFinite(allowanceCap) &&
            allowanceCap > 0
              ? Math.floor(allowanceCap)
              : null,
          allowanceNote: String(form.get("allowanceNote") || "").trim(),
          requireApproval: form.get("requireApproval") === "on",
          approvalNote: String(form.get("approvalNote") || "").trim(),
          deliveryPreference: String(
            form.get("deliveryPreference") || "undecided",
          ) as CompanyStoreDraft["rules"]["ordering"]["deliveryPreference"],
          deliveryNote: String(form.get("deliveryNote") || "").trim(),
        },
      },
    });
  }

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveRules(event.currentTarget);
    setStatus("Draft rules saved in this browser. These rules are not enforced.");
  }

  const o = draft.rules.ordering;
  const a = draft.rules.access;

  return (
    <div>
      <p className="cs-panel-step">STEP 3 · PROGRAMME DECISIONS</p>
      <h2>Set the rules</h2>
      <p className="cs-panel-lede">
        Draft settings for employee access, redemption and delivery. They do not activate a live programme.
      </p>
      <form
        className="cs-form-grid"
        onSubmit={onSave}
        onChange={(event) => saveRules(event.currentTarget)}
      >
        <section className="cs-decision-group" aria-labelledby={`${formId}-access-heading`}>
        <div className="cs-decision-group__intro"><h3 id={`${formId}-access-heading`}>1. Store access</h3><p>Decide who should see the company-selected gifts.</p></div>
        <div className="cs-field">
          <label className="cs-check">
            <input
              type="checkbox"
              name="requireWorkEmail"
              defaultChecked={a.requireWorkEmail}
            />
            <span>Draft: require work email for access (not enforced here)</span>
          </label>
        </div>
        <div className="cs-form-grid cs-form-grid--2">
          <div className="cs-field">
            <label htmlFor={`${formId}-access`}>How will employees get access?</label>
            <select id={`${formId}-access`} name="accessNote" defaultValue={a.accessNote || "Company work email"}>
              <option>Company work email</option>
              <option>Invitation from HR</option>
              <option>Open demo access</option>
              <option>To be decided</option>
            </select>
          </div>
          <div className="cs-field">
            <label htmlFor={`${formId}-vis`}>Who can see these products?</label>
            <select id={`${formId}-vis`} name="visibilityNote" defaultValue={a.visibilityNote || "Employees see only merchandise selected for this store."}>
              <option>Employees see only merchandise selected for this store.</option>
              <option>All invited employees</option>
              <option>Different collections for different teams</option>
              <option>To be decided</option>
            </select>
          </div>
        </div>
        </section>
        <section className="cs-decision-group" aria-labelledby={`${formId}-redemption-heading`}>
        <div className="cs-decision-group__intro"><h3 id={`${formId}-redemption-heading`}>2. Redemption policy</h3><p>Set the expected allowance and any review step. Final credit values can be agreed after the demo.</p></div>
        <div className="cs-form-grid cs-form-grid--2">
          <div className="cs-field">
            <label htmlFor={`${formId}-max-items`}>Max line items / order</label>
            <select id={`${formId}-max-items`} name="maxItemsPerOrder" defaultValue={o.maxItemsPerOrder ?? ""}>
              <option value="">No limit / discuss</option><option value="1">1 item</option><option value="2">2 items</option><option value="3">3 items</option><option value="5">5 items</option><option value="10">10 items</option>
            </select>
          </div>
          <div className="cs-field">
            <label htmlFor={`${formId}-max-units`}>Max units / product</label>
            <select id={`${formId}-max-units`} name="maxUnitsPerProduct" defaultValue={o.maxUnitsPerProduct ?? ""}>
              <option value="">No limit / discuss</option><option value="1">1 unit</option><option value="2">2 units</option><option value="3">3 units</option><option value="5">5 units</option>
            </select>
          </div>
        </div>
        <div className="cs-form-grid cs-form-grid--2">
        <div className="cs-field">
          <label htmlFor={`${formId}-allowance`}>How should the programme be funded?</label>
          <select
            id={`${formId}-allowance`}
            name="allowanceMode"
            defaultValue={o.allowanceMode}
          >
            <option value="none">No employee credits configured</option>
            <option value="company-funded">Company-funded programme (draft)</option>
            <option value="allowance-cap">Demo spending cap (INR reference only)</option>
          </select>
        </div>
        <div className="cs-field">
          <label htmlFor={`${formId}-cap`}>
            Demo spending cap in rupees — not employee credits
          </label>
          <input
            id={`${formId}-cap`}
            name="allowanceCapInr"
            type="number"
            min={1}
            defaultValue={o.allowanceCapInr ?? ""}
            placeholder="Only used when allowance cap is selected"
          />
          <p className="cs-field__hint">This is a rupee estimate for discussion. It is not a wallet balance or an employee credit ledger.</p>
        </div>
        <div className="cs-field">
          <label className="cs-check">
            <input
              type="checkbox"
              name="requireApproval"
              defaultChecked={o.requireApproval}
            />
            <span>Draft: require approval before fulfilment</span>
          </label>
        </div>
        </div>
        </section>
        <section className="cs-decision-group" aria-labelledby={`${formId}-delivery-heading`}>
        <div className="cs-decision-group__intro"><h3 id={`${formId}-delivery-heading`}>3. Delivery plan</h3><p>Choose a likely fulfilment route; confirm locations and shipping details with Monkcraft.</p></div>
        <div className="cs-field">
          <label htmlFor={`${formId}-delivery`}>Delivery preference</label>
          <select
            id={`${formId}-delivery`}
            name="deliveryPreference"
            defaultValue={o.deliveryPreference}
          >
            <option value="undecided">Undecided / discuss</option>
            <option value="office">Office / central</option>
            <option value="home">Home delivery</option>
            <option value="either">Either</option>
          </select>
        </div>
        <div className="cs-field">
          <label htmlFor={`${formId}-del-note`}>Delivery arrangement</label>
          <select id={`${formId}-del-note`} name="deliveryNote" defaultValue={o.deliveryNote || "Discuss locations and fulfilment with Monkcraft"}>
            <option>Discuss locations and fulfilment with Monkcraft</option>
            <option>One office delivery point</option>
            <option>Ship to each employee</option>
            <option>Multiple office locations</option>
          </select>
        </div>
        </section>
        <p className="cs-field__hint">This demo does not connect invitations, maps, shipment tracking, approvals or live credits. Employee details are samples.</p>
        {status ? (
          <p className="cs-status" role="status">
            {status}
          </p>
        ) : null}
        <div className="cs-actions">
          <button type="submit" className="cs-btn cs-btn--ghost">
            Save draft
          </button>
        </div>
      </form>
    </div>
  );
}

function PreviewPanel({ draft, previewUrl, summaryHref }: { draft: CompanyStoreDraft; previewUrl: string; summaryHref: string }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const title =
    draft.identity.storeName ||
    draft.identity.companyName ||
    "Untitled store";

  return (
    <div>
      <p className="cs-panel-step">STEP 4 · MANAGER PRESENTATION</p>
      <h2>Present the store</h2>
      <p className="cs-panel-lede">Review the proposal, then show the employee storefront.</p>
      <div className="cs-presentation-heading"><div><h3>{title}</h3><p>{draft.productIds.length} selected gifts · {draft.identity.companyName || "Company name to add"}</p></div><Link className="cs-btn cs-btn--ghost cs-btn--small" href={summaryHref}>Open proposal summary</Link></div>
      <div className="cs-device-toggle" role="group" aria-label="Preview width">
        <button
          type="button"
          aria-pressed={device === "desktop"}
          onClick={() => setDevice("desktop")}
        >
          Desktop
        </button>
        <button
          type="button"
          aria-pressed={device === "mobile"}
          onClick={() => setDevice("mobile")}
        >
          Mobile
        </button>
      </div>
      <div
        className={`cs-preview-frame cs-preview-frame--${device}`}
        aria-label={`${device} employee storefront, shown as part of manager presentation`}
      >
        <iframe title={`${title} employee storefront demo`} src={`${previewUrl}&embed=1`} loading="lazy" />
      </div>
      <div className="cs-actions" style={{ marginTop: "1rem" }}>
        <Link className="cs-btn cs-btn--primary" href={previewUrl} target="_blank" rel="noreferrer">
          Open employee storefront for presentation
        </Link>
        <Link className="cs-btn cs-btn--ghost" href={summaryHref}>
          Review proposal summary
        </Link>
      </div>
      <p className="cs-field__hint" style={{ marginTop: "0.75rem" }}>
        This draft is saved in this browser only. To present on another screen, use this browser profile or share your screen. A private cross-device link is not configured.
      </p>
    </div>
  );
}

function OrdersPanel() {
  const [requests, setRequests] = useState(readStoreOrderRequests());

  useEffect(() => {
    const sync = () => setRequests(readStoreOrderRequests());
    sync();
    window.addEventListener(STORE_REQUESTS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_REQUESTS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <div>
      <h2>Draft order requests</h2>
      <p className="cs-panel-lede">
        Sample requests prepared in the employee preview. They are not live orders.
      </p>
      {requests.length === 0 ? (
        <div className="cs-empty">
          <h3>No draft requests yet</h3>
          <p>Open the employee storefront, add sample gifts and prepare a request. Nothing is submitted.</p>
            <Link
              className="cs-btn cs-btn--primary cs-btn--small"
              href="/company-stores/preview?returnTo=%2Fcompany-stores%2Fconfigure%3Fview%3Dorders"
          >
            Open manager presentation
          </Link>
        </div>
      ) : (
        <ul className="cs-product-list">
          {requests.map((req) => (
            <li key={req.id} className="cs-tile">
              <p style={{ margin: "0 0 0.35rem" }}>
                <span className="cs-chip cs-chip--draft">Draft prepared</span>{" "}
                <span className="cs-field__hint">
                  {new Date(req.createdAt).toLocaleString("en-IN")}
                </span>
              </p>
              <h3 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem" }}>
                {req.lines.length} line item(s)
                {req.estimatedTotalInr != null
                  ? ` · est. ${formatInrAmount(req.estimatedTotalInr)}`
                  : " · total on quote"}
              </h3>
              <p className="cs-field__hint" style={{ margin: "0 0 0.5rem" }}>
                {req.rulesLabel}
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.88rem" }}>
                {req.lines.map((line) => (
                  <li key={`${req.id}-${line.productId}-${line.quantity}`}>
                    {line.name} × {line.quantity}
                    {line.variants.length > 0
                      ? ` (${line.variants.map((v) => `${v.label}: ${v.value}`).join(", ")})`
                      : ""}
                  </li>
                ))}
              </ul>
              {req.deliveryAddress ? (
                <p className="cs-field__hint" style={{ margin: "0.65rem 0 0" }}>
                  Deliver to: {req.deliveryAddress.fullName} · {req.deliveryAddress.line1}
                  {req.deliveryAddress.line2 ? `, ${req.deliveryAddress.line2}` : ""}, {req.deliveryAddress.city}, {req.deliveryAddress.state} {req.deliveryAddress.postalCode}
                  {req.deliveryAddress.phone ? ` · ${req.deliveryAddress.phone}` : ""}
                </p>
              ) : null}
              {req.notes ? <p className="cs-field__hint">Order notes: {req.notes}</p> : null}
            </li>
          ))}
        </ul>
      )}
      {requests.length > 0 ? (
        <div className="cs-actions">
          <button
            type="button"
            className="cs-btn cs-btn--secondary cs-btn--small"
            onClick={() => clearStoreOrderRequests()}
          >
            Clear local draft requests
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SummaryPanel({ draft }: { draft: CompanyStoreDraft }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [showCopy, setShowCopy] = useState(false);
  const text = useMemo(() => buildCompanyStoreEnquiryText(draft), [draft]);
  const orderedCategories = draft.categories.filter((category) => category.productIds.length > 0);
  const deliveryLabels: Record<string, string> = { undecided: "To be discussed", office: "Central office", home: "Employee home", either: "Office or home" };

  async function copy() {
    try {
      syncCompanyStoreDraftToBrief(draft);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setError("");
    } catch {
      setError("Could not copy — select the text below instead.");
    }
  }

  return (
    <div>
      <h2>Proposal overview</h2>
      <p className="cs-panel-lede">Review the draft and copy its brief to discuss with Monkcraft.</p>
      <div className="cs-summary-grid">
        <section className="cs-summary-card cs-summary-card--identity">
          <span className="cs-summary-card__eyebrow">Store identity</span>
          <h3>{draft.identity.storeName || "Name your programme"}</h3>
          <p>{draft.identity.companyName || "Company to be confirmed"}</p>
          {draft.identity.storeTitle ? <p className="cs-summary-card__detail">{draft.identity.storeTitle}</p> : null}
        </section>
        <section className="cs-summary-card">
          <span className="cs-summary-card__eyebrow">Selected merchandise</span>
          <strong className="cs-summary-card__number">{draft.productIds.length}</strong>
          <p>products across {orderedCategories.length} {orderedCategories.length === 1 ? "collection" : "collections"}</p>
          <ul className="cs-summary-categories">{orderedCategories.map((category) => <li key={category.id}><span>{category.name}</span><strong>{category.productIds.length}</strong></li>)}</ul>
        </section>
        <section className="cs-summary-card">
          <span className="cs-summary-card__eyebrow">Credits &amp; approvals</span>
          <h3>{draft.rules.ordering.allowanceMode === "allowance-cap" ? (draft.rules.ordering.allowanceCapInr ? `${formatInrAmount(draft.rules.ordering.allowanceCapInr)} demo cap` : "Demo cap to confirm") : draft.rules.ordering.allowanceMode === "company-funded" ? "Company-funded draft" : "Funding to discuss"}</h3>
          <p>{draft.rules.ordering.requireApproval ? "Approval step included in draft" : "No approval step proposed"}</p>
        </section>
        <section className="cs-summary-card">
          <span className="cs-summary-card__eyebrow">Delivery approach</span>
          <h3>{deliveryLabels[draft.rules.ordering.deliveryPreference] || "To be discussed"}</h3>
          <p>{draft.rules.access.requireWorkEmail ? "Work email access proposed" : "Access method to confirm"}</p>
        </section>
      </div>
      <details className="cs-summary-copy" open={showCopy} onToggle={(event) => setShowCopy(event.currentTarget.open)}>
        <summary>View copyable enquiry brief</summary>
        <pre className="cs-pre">{text}</pre>
      </details>
      {error ? (
        <p className="cs-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="cs-actions">
        <button type="button" className="cs-btn cs-btn--primary" onClick={copy}>
          {copied ? "Enquiry brief copied" : "Copy enquiry brief"}
        </button>
        <Link className="cs-btn cs-btn--secondary" href="/?interest=company-store#enquire">
          Discuss this proposal
        </Link>
        <button
          type="button"
          className="cs-btn cs-btn--ghost"
          onClick={() => {
            if (
              window.confirm(
                "Clear the entire Company Store draft from this browser?",
              )
            ) {
              clearCompanyStoreDraft();
            }
          }}
        >
          Reset draft
        </button>
      </div>
      <p className="cs-note" style={{ marginTop: "1rem" }}>
        Production still needs: authenticated multi-company isolation, admin
        permissions, live catalogues/allowances, order ingestion, fulfilment,
        and reporting. This UI does not provide those.
      </p>
    </div>
  );
}
