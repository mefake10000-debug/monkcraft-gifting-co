"use client";

import Image from "next/image";
import Link from "next/link";
import { CatalogueBrowseLink } from "@/components/catalogue/BackToResults";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
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
  buildCompanyStoreRulesLabel,
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

const VIEWS = [
  { id: "overview", label: "Overview" },
  { id: "branding", label: "Branding" },
  { id: "merchandise", label: "Merchandise" },
  { id: "rules", label: "Access & rules" },
  { id: "preview", label: "Employee preview" },
  { id: "orders", label: "Draft order requests" },
  { id: "summary", label: "Configuration summary" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

function isView(value: string | null): value is ViewId {
  return VIEWS.some((v) => v.id === value);
}

export function StoreAdminShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get("view");
  const view: ViewId = isView(viewParam) ? viewParam : "overview";
  const { draft, ready } = useStoreDraft();

  function setView(next: ViewId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.replace(`/company-stores/configure?${params.toString()}`, {
      scroll: false,
    });
  }

  return (
    <div className="cs-page">
      <StoreDemoBanner context="demo" />
      <div className="cs-admin">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Company Stores", href: "/company-stores" },
            { label: "Configurator (demo)" },
          ]}
        />
        <header className="cs-admin__header">
          <div>
            <p className="cs-landing__eyebrow" style={{ marginBottom: "0.35rem" }}>
              Company Store configurator
            </p>
            <h1>Draft a proposed store</h1>
            <p>
              For Monkcraft reps and prospective customers. Everything saves in
              this browser only — not a provisioned live store.
            </p>
          </div>
          <div className="cs-landing__actions">
            <Link className="cs-btn cs-btn--ghost cs-btn--small" href="/company-stores">
              Landing
            </Link>
            <Link
              className="cs-btn cs-btn--primary cs-btn--small"
              href="/company-stores/preview"
            >
              Open employee preview
            </Link>
          </div>
        </header>

        <div className="cs-admin__layout">
          <nav className="cs-admin__nav" aria-label="Store admin sections">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-current={view === item.id ? "true" : undefined}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="cs-admin__panel">
            {!ready ? (
              <p>Loading draft…</p>
            ) : view === "overview" ? (
              <OverviewPanel draft={draft} onNavigate={setView} />
            ) : view === "branding" ? (
              <BrandingPanel />
            ) : view === "merchandise" ? (
              <MerchandisePanel draft={draft} />
            ) : view === "rules" ? (
              <RulesPanel />
            ) : view === "preview" ? (
              <PreviewPanel draft={draft} />
            ) : view === "orders" ? (
              <OrdersPanel />
            ) : (
              <SummaryPanel draft={draft} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({
  draft,
  onNavigate,
}: {
  draft: CompanyStoreDraft;
  onNavigate: (view: ViewId) => void;
}) {
  const name =
    draft.identity.storeName ||
    draft.identity.companyName ||
    "Untitled store draft";

  return (
    <div>
      <h2>Store overview</h2>
      <p className="cs-panel-lede">
        Snapshot of your local draft. No employee accounts, revenue, or live
        analytics are shown — those need a production backend.
      </p>
      <div className="cs-stat-row">
        <div className="cs-stat">
          <strong>{draft.productIds.length}</strong>
          <span>Products selected</span>
        </div>
        <div className="cs-stat">
          <strong>{draft.categories.length}</strong>
          <span>Store categories</span>
        </div>
        <div className="cs-stat">
          <strong>
            {draft.identity.logo ? "Logo" : "No logo"}
          </strong>
          <span>Draft branding</span>
        </div>
      </div>
      <article className="cs-tile">
        <h3>{name}</h3>
        <p>
          {draft.identity.storeTitle || "No store title yet."}{" "}
          {draft.updatedAt
            ? `Last saved ${new Date(draft.updatedAt).toLocaleString("en-IN")}.`
            : "Not saved yet."}
        </p>
        <p className="cs-field__hint" style={{ marginTop: "0.65rem" }}>
          Rules: {buildCompanyStoreRulesLabel(draft)}
        </p>
      </article>
      <div className="cs-actions">
        <button
          type="button"
          className="cs-btn cs-btn--primary cs-btn--small"
          onClick={() => onNavigate("branding")}
        >
          Edit branding
        </button>
        <button
          type="button"
          className="cs-btn cs-btn--secondary cs-btn--small"
          onClick={() => onNavigate("merchandise")}
        >
          Select merchandise
        </button>
        <Link
          className="cs-btn cs-btn--ghost cs-btn--small"
          href="/company-stores/preview"
        >
          Employee preview
        </Link>
      </div>
    </div>
  );
}

function BrandingPanel() {
  const { draft } = useStoreDraft();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const formId = useId();

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
    patchCompanyStoreDraft({
      identity: {
        ...draft.identity,
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
      <h2>Store identity</h2>
      <p className="cs-panel-lede">
        Draft branding for the proposed storefront. Logo files stay in local
        storage only (size-limited) and are never uploaded to a server here.
      </p>
      <form className="cs-form-grid" onSubmit={saveIdentity}>
        <div className="cs-form-grid cs-form-grid--2">
          <div className="cs-field">
            <label htmlFor={`${formId}-company`}>Company name</label>
            <input
              id={`${formId}-company`}
              name="companyName"
              defaultValue={draft.identity.companyName}
              autoComplete="organization"
            />
          </div>
          <div className="cs-field">
            <label htmlFor={`${formId}-store`}>Store name</label>
            <input
              id={`${formId}-store`}
              name="storeName"
              defaultValue={draft.identity.storeName}
              placeholder="e.g. Acme Merch Store"
            />
          </div>
        </div>
        <div className="cs-field">
          <label htmlFor={`${formId}-title`}>Store title / headline</label>
          <input
            id={`${formId}-title`}
            name="storeTitle"
            defaultValue={draft.identity.storeTitle}
            placeholder="Optional headline for employees"
          />
        </div>
        <div className="cs-field">
          <label htmlFor={`${formId}-welcome`}>Welcome message</label>
          <textarea
            id={`${formId}-welcome`}
            name="welcomeMessage"
            defaultValue={draft.identity.welcomeMessage}
            rows={3}
          />
        </div>
        <div className="cs-field">
          <label htmlFor={`${formId}-accent`}>Accent colour</label>
          <input
            id={`${formId}-accent`}
            name="accentColor"
            type="color"
            defaultValue={draft.identity.accentColor}
          />
        </div>
        <div className="cs-field">
          <label htmlFor={`${formId}-logo`}>Logo preview (optional)</label>
          <input
            id={`${formId}-logo`}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(event) => onLogo(event.target.files?.[0] ?? null)}
          />
          <p className="cs-field__hint">
            PNG, JPG, WebP, or SVG under 400KB for local draft storage.
          </p>
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
          <button type="submit" className="cs-btn cs-btn--primary">
            Save branding draft
          </button>
        </div>
      </form>
    </div>
  );
}

function MerchandisePanel({ draft }: { draft: CompanyStoreDraft }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudioProductSummary[]>([]);
  const [selected, setSelected] = useState<StudioProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [status, setStatus] = useState("");

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

  async function search(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const products = await fetchStudioProducts({
        q: query.trim(),
        limit: 24,
      });
      setResults(products);
      if (products.length === 0) {
        setStatus("No catalogue matches for that search.");
      } else {
        setStatus(`${products.length} result(s) from the live catalogue.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
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
      <h2>Merchandise</h2>
      <p className="cs-panel-lede">
        Search the genuine Monkcraft catalogue and organise selections into store
        categories. No invented products or stock levels.
      </p>

      <form className="cs-search-row" onSubmit={search}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search catalogue by name, SKU, category…"
          aria-label="Search catalogue"
        />
        <button
          type="submit"
          className="cs-btn cs-btn--primary cs-btn--small"
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
        <CatalogueBrowseLink className="cs-btn cs-btn--ghost cs-btn--small" label="Open full catalogue" />
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
        <ul className="cs-product-list" style={{ marginBottom: "1.5rem" }}>
          {results.map((product) => {
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
                  <h3>{product.name}</h3>
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
      ) : null}

      <h3 style={{ fontFamily: "var(--font-display)", margin: "0 0 0.75rem" }}>
        Selected for this store ({selected.length})
      </h3>
      {selected.length === 0 ? (
        <div className="cs-empty">
          <h3>No merchandise yet</h3>
          <p>
            Search above or browse the public catalogue, then add products you
            want employees to see in this draft store.
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

      <form
        className="cs-search-row"
        style={{ marginTop: "1.5rem" }}
        onSubmit={addCategory}
      >
        <input
          type="text"
          value={categoryName}
          onChange={(event) => setCategoryName(event.target.value)}
          placeholder="New store category name"
          aria-label="New store category"
        />
        <button type="submit" className="cs-btn cs-btn--secondary cs-btn--small">
          Add category
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

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
    setStatus("Draft rules saved. These are configuration notes — not live enforcement.");
  }

  const o = draft.rules.ordering;
  const a = draft.rules.access;

  return (
    <div>
      <h2>Access &amp; purchasing rules</h2>
      <p className="cs-panel-lede">
        <span className="cs-chip cs-chip--draft">Draft rules</span>{" "}
        Configuration for a proposed store only. This demo does not enforce
        security, payments, or real allowance balances.
      </p>
      <form className="cs-form-grid" onSubmit={onSave}>
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
        <div className="cs-field">
          <label htmlFor={`${formId}-access`}>Access requirements note</label>
          <textarea
            id={`${formId}-access`}
            name="accessNote"
            defaultValue={a.accessNote}
            placeholder="e.g. @company.com emails, manager invite…"
            rows={2}
          />
        </div>
        <div className="cs-field">
          <label htmlFor={`${formId}-vis`}>Product visibility note</label>
          <textarea
            id={`${formId}-vis`}
            name="visibilityNote"
            defaultValue={a.visibilityNote}
            rows={2}
          />
        </div>
        <div className="cs-form-grid cs-form-grid--2">
          <div className="cs-field">
            <label htmlFor={`${formId}-max-items`}>Max line items / order</label>
            <input
              id={`${formId}-max-items`}
              name="maxItemsPerOrder"
              type="number"
              min={1}
              defaultValue={o.maxItemsPerOrder ?? ""}
              placeholder="Optional"
            />
          </div>
          <div className="cs-field">
            <label htmlFor={`${formId}-max-units`}>Max units / product</label>
            <input
              id={`${formId}-max-units`}
              name="maxUnitsPerProduct"
              type="number"
              min={1}
              defaultValue={o.maxUnitsPerProduct ?? ""}
              placeholder="Optional"
            />
          </div>
        </div>
        <div className="cs-field">
          <label htmlFor={`${formId}-allowance`}>Allowance / funding mode</label>
          <select
            id={`${formId}-allowance`}
            name="allowanceMode"
            defaultValue={o.allowanceMode}
          >
            <option value="none">None / employee-funded discussion</option>
            <option value="company-funded">Company-funded (draft)</option>
            <option value="allowance-cap">Allowance cap (draft INR)</option>
          </select>
        </div>
        <div className="cs-field">
          <label htmlFor={`${formId}-cap`}>
            Draft allowance cap (INR) — not a live balance
          </label>
          <input
            id={`${formId}-cap`}
            name="allowanceCapInr"
            type="number"
            min={1}
            defaultValue={o.allowanceCapInr ?? ""}
            placeholder="Only used when allowance cap is selected"
          />
        </div>
        <div className="cs-field">
          <label htmlFor={`${formId}-allow-note`}>Allowance note</label>
          <textarea
            id={`${formId}-allow-note`}
            name="allowanceNote"
            defaultValue={o.allowanceNote}
            rows={2}
          />
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
        <div className="cs-field">
          <label htmlFor={`${formId}-approval`}>Approval note</label>
          <textarea
            id={`${formId}-approval`}
            name="approvalNote"
            defaultValue={o.approvalNote}
            rows={2}
          />
        </div>
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
          <label htmlFor={`${formId}-del-note`}>Delivery notes</label>
          <textarea
            id={`${formId}-del-note`}
            name="deliveryNote"
            defaultValue={o.deliveryNote}
            rows={2}
          />
        </div>
        {status ? (
          <p className="cs-status" role="status">
            {status}
          </p>
        ) : null}
        <div className="cs-actions">
          <button type="submit" className="cs-btn cs-btn--primary">
            Save draft rules
          </button>
        </div>
      </form>
    </div>
  );
}

function PreviewPanel({ draft }: { draft: CompanyStoreDraft }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const title =
    draft.identity.storeName ||
    draft.identity.companyName ||
    "Untitled store";

  return (
    <div>
      <h2>Employee-facing preview</h2>
      <p className="cs-panel-lede">
        Opens the employee storefront demo with your draft branding and
        merchandise. Clearly labelled as preview — not a live private store.
      </p>
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
        style={{ padding: "1rem" }}
      >
        <p>
          <span className="cs-chip cs-chip--demo">Preview / Demo</span>
        </p>
        <h3 style={{ fontFamily: "var(--font-display)", margin: "0.75rem 0 0.35rem" }}>
          {title}
        </h3>
        <p style={{ margin: "0 0 1rem", fontSize: "0.92rem" }}>
          {draft.identity.welcomeMessage || "No welcome message yet."}
        </p>
        <p className="cs-field__hint">
          {draft.productIds.length} product(s) · {draft.categories.length}{" "}
          categor{draft.categories.length === 1 ? "y" : "ies"}
        </p>
        <div className="cs-actions">
          <Link
            className="cs-btn cs-btn--primary"
            href="/company-stores/preview"
          >
            Launch employee preview
          </Link>
        </div>
      </div>
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
        Local “prepared request” snapshots from the employee preview. Not real
        orders, not revenue, and not employee accounts.
      </p>
      {requests.length === 0 ? (
        <div className="cs-empty">
          <h3>No draft requests yet</h3>
          <p>
            Use the employee preview to build a draft cart and prepare an order
            request. Nothing is submitted to a backend.
          </p>
          <Link
            className="cs-btn cs-btn--primary cs-btn--small"
            href="/company-stores/preview"
          >
            Open employee preview
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
  const text = useMemo(() => buildCompanyStoreEnquiryText(draft), [draft]);

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
      <h2>Configuration summary</h2>
      <p className="cs-panel-lede">
        Serializable proposal text for enquiry / quotation prep. Also saved in
        localStorage as your store draft. Copying links this proposal into My
        Gifting Brief without wiping shortlist or box details.
      </p>
      <pre className="cs-pre">{text}</pre>
      {error ? (
        <p className="cs-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="cs-actions">
        <button type="button" className="cs-btn cs-btn--primary" onClick={copy}>
          {copied ? "Copied" : "Copy proposal summary"}
        </button>
        <Link className="cs-btn cs-btn--secondary" href="/gifts/brief">
          Request a Quote
        </Link>
        <Link
          className="cs-btn cs-btn--secondary"
          href="/?interest=company-store#enquire"
        >
          Talk to Monkcraft
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
