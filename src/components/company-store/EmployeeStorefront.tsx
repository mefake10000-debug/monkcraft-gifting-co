"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { StoreOrderLine } from "@/data/companyStore/types";
import type { StudioProductSummary } from "@/data/catalogue/studioTypes";
import { StoreDemoBanner } from "@/components/company-store/StoreDemoBanner";
import { buildCompanyStoreRulesLabel } from "@/lib/companyStore/enquiry";
import {
  clearStoreOrderDraft,
  normalizeStoreOrderLines,
  prepareStoreOrderRequest,
  readStoreOrderDraft,
  removeStoreOrderLine,
  setStoreOrderQuantity,
  STORE_ORDER_EVENT,
  storeOrderEstimatedTotal,
  writeStoreOrderDraft,
  addStoreOrderLine,
  MIN_EMPLOYEE_REDEMPTION_QUANTITY,
} from "@/lib/companyStore/orderDraft";
import { useStoreDraft } from "@/lib/companyStore/useStoreDraft";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";
import { formatInrAmount } from "@/lib/pricing";
import { extractSelectableVariants } from "@/lib/companyStore/variants";

function orderLineIdentity(productId: string, variants: { label: string; value: string }[]) {
  const variantKey = variants
    .map((variant) => `${variant.label}:${variant.value}`)
    .sort()
    .join("|");
  return `${productId}::${variantKey}`;
}

export function EmployeeStorefront() {
  const searchParams = useSearchParams();
  const showcase = searchParams.get("showcase") === "1";
  const embedded = searchParams.get("embed") === "1";
  const requestedReturnTo = searchParams.get("returnTo");
  const returnTo = requestedReturnTo?.startsWith("/company-stores/configure") && !requestedReturnTo.startsWith("//")
    ? requestedReturnTo
    : "/company-stores/configure?view=preview";
  const { draft, ready } = useStoreDraft();
  const [products, setProducts] = useState<StudioProductSummary[]>([]);
  const [showcaseDraft, setShowcaseDraft] = useState<typeof draft | null>(null);
  const [loadError, setLoadError] = useState("");
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [order, setOrder] = useState(readStoreOrderDraft());
  const [showcaseOrder, setShowcaseOrder] = useState<typeof order | null>(null);
  const [prepStatus, setPrepStatus] = useState("");
  const [prepError, setPrepError] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState({
    fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "",
  });

  useEffect(() => {
    const sync = () => setOrder(readStoreOrderDraft());
    sync();
    window.addEventListener(STORE_ORDER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STORE_ORDER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!showcase || !showcaseOrder) return;
    localStorage.setItem("monkcraft-company-store-showcase-cart-v1", JSON.stringify(showcaseOrder.lines));
  }, [showcase, showcaseOrder]);

  useEffect(() => {
    if (!showcase) return;
    const syncShowcaseCart = () => {
      try {
        const saved = localStorage.getItem("monkcraft-company-store-showcase-cart-v1");
        const lines = normalizeStoreOrderLines(saved ? JSON.parse(saved) : []);
        setShowcaseOrder((current) => current ? { ...current, lines } : current);
      } catch { /* Keep the current demo cart if its local snapshot is unreadable. */ }
    };
    window.addEventListener("monkcraft:company-store-showcase-cart", syncShowcaseCart);
    return () => window.removeEventListener("monkcraft:company-store-showcase-cart", syncShowcaseCart);
  }, [showcase]);

  useEffect(() => {
    if (!showcase || !ready) return;
    let cancelled = false;
    async function loadShowcase() {
      try {
        const samples = await fetchStudioProducts({ limit: 6 });
        if (cancelled) return;
        const ids = samples.map((product) => product.id);
        const sampleCategories = [{ id: "showcase-featured", name: "Featured gifts", productIds: ids }];
        setProducts(samples);
        setShowcaseDraft({
          ...draft,
          identity: {
            companyName: "Monkcraft Demo",
            storeName: "Team Appreciation Store",
            storeTitle: "A little thank-you, chosen for your team.",
            welcomeMessage: "Choose a gift from this curated collection as a thank-you for all you do.",
            accentColor: "#662F90",
            logo: null,
          },
          productIds: ids,
          categories: sampleCategories,
          rules: {
            ...draft.rules,
            ordering: { ...draft.rules.ordering, allowanceMode: "none", allowanceCapInr: null },
          },
        });
        let showcaseLines: StoreOrderLine[] = [];
        try {
          const saved = localStorage.getItem("monkcraft-company-store-showcase-cart-v1");
          showcaseLines = normalizeStoreOrderLines(saved ? JSON.parse(saved) : []);
        } catch { showcaseLines = []; }
        setShowcaseOrder({ ...readStoreOrderDraft(), lines: showcaseLines, notes: "", updatedAt: new Date().toISOString() });
      } catch {
        if (!cancelled) setLoadError("Could not load the sample catalogue. Please try the configurator instead.");
      }
    }
    void loadShowcase();
    return () => { cancelled = true; };
  }, [showcase, ready, draft]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (showcase) return;
      if (!ready) return;
      if (draft.productIds.length === 0) {
        setProducts([]);
        return;
      }
      try {
        const list = await fetchStudioProducts({ ids: draft.productIds });
        if (cancelled) return;
        const byId = new Map(list.map((p) => [p.id, p]));
        setProducts(
          draft.productIds
            .map((id) => byId.get(id))
            .filter((p): p is StudioProductSummary => Boolean(p)),
        );
        setLoadError("");
      } catch {
        if (!cancelled) {
          setLoadError("Could not load store merchandise from the catalogue.");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [draft.productIds, ready, showcase]);

  const activeDraft = showcase ? showcaseDraft : draft;
  const activeOrder = showcase && showcaseOrder ? showcaseOrder : order;

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of activeDraft?.categories ?? []) {
      for (const id of cat.productIds) map.set(id, cat.id);
    }
    return map;
  }, [activeDraft?.categories]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryId !== "all") {
        const cat = categoryMap.get(product.id);
        if (cat !== categoryId) return false;
      }
      if (!needle) return true;
      const hay = [
        product.name,
        product.summary,
        product.sku,
        product.catalogueSku,
        product.categoryName,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [products, q, categoryId, categoryMap]);

  const storefrontDraft = activeDraft ?? draft;
  const accent = storefrontDraft.identity.accentColor || "#662F90";
  const companyName = storefrontDraft.identity.companyName.trim() || "Company Store";
  const programmeName = storefrontDraft.identity.storeName.trim() || "Gift collection";
  const storeTitle = storefrontDraft.identity.storeTitle.trim() || "Choose a gift";
  const estimated = storeOrderEstimatedTotal(activeOrder.lines);
  const rulesLabel = buildCompanyStoreRulesLabel(storefrontDraft);
  const ordering = storefrontDraft.rules.ordering;
  const allowanceSummary = ordering.allowanceMode === "allowance-cap" && ordering.allowanceCapInr != null
    ? `Demo cap · ${formatInrAmount(ordering.allowanceCapInr)}`
    : ordering.allowanceMode === "company-funded"
      ? "Company-funded · proposed"
      : "Credits to be agreed";

  function prepareRequest() {
    setPrepError("");
    setPrepStatus("");
    if (activeOrder.lines.length === 0) {
      setPrepError("Add at least one product before preparing a request.");
      return;
    }
    if (
      !deliveryAddress.fullName.trim() ||
      !deliveryAddress.phone.trim() ||
      !deliveryAddress.line1.trim() ||
      !deliveryAddress.city.trim() ||
      !deliveryAddress.state.trim() ||
      !deliveryAddress.postalCode.trim()
    ) {
      setPrepError("Add your name, phone, and complete delivery address to continue.");
      return;
    }
    if (!/^[1-9]\d{5}$/.test(deliveryAddress.postalCode.trim())) {
      setPrepError("Enter a six-digit Indian PIN code.");
      return;
    }
    if (
      ordering.maxItemsPerOrder != null &&
      activeOrder.lines.length > ordering.maxItemsPerOrder
    ) {
      setPrepError(
        `Draft rule: max ${ordering.maxItemsPerOrder} line items per order.`,
      );
      return;
    }
    for (const line of activeOrder.lines) {
      if (
        ordering.maxUnitsPerProduct != null &&
        line.quantity > ordering.maxUnitsPerProduct
      ) {
        setPrepError(
          `Draft rule: max ${ordering.maxUnitsPerProduct} units for “${line.name}”.`,
        );
        return;
      }
    }
    if (
      ordering.allowanceMode === "allowance-cap" &&
      ordering.allowanceCapInr != null &&
      estimated != null &&
      estimated > ordering.allowanceCapInr
    ) {
      setPrepError(
        `Draft rule: estimated total exceeds draft allowance cap of ${formatInrAmount(ordering.allowanceCapInr)}. This is not a live balance.`,
      );
      return;
    }

    prepareStoreOrderRequest({
      lines: activeOrder.lines,
      notes: activeOrder.notes,
      deliveryAddress,
      rulesLabel,
    });
    if (showcase) {
      localStorage.removeItem("monkcraft-company-store-showcase-cart-v1");
      setShowcaseOrder({ ...activeOrder, lines: [] });
    } else clearStoreOrderDraft();
    setPrepStatus(
      "Demo checkout complete. Your order summary and delivery details were saved in this browser; no real order was submitted.",
    );
  }

  function quickAdd(product: StudioProductSummary) {
    const line = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageSrc: product.imageSrc,
      priceLabel: product.priceLabel,
      amountInr: product.amountInr,
      quantity: MIN_EMPLOYEE_REDEMPTION_QUANTITY,
      variants: [],
    };
    if (showcase) {
      const lines = [...activeOrder.lines];
      const existing = lines.find((item) => item.productId === line.productId && item.variants.length === 0);
      const next = existing ? lines.map((item) => item === existing ? { ...item, quantity: item.quantity + line.quantity } : item) : [...lines, line];
      setShowcaseOrder({ ...activeOrder, lines: next });
    } else addStoreOrderLine(line);
    setPrepStatus(`Added “${product.name}” to your bag.`);
  }

  if (!ready) {
    return (
      <div className={embedded ? "cs-storefront cs-storefront--embedded" : "cs-storefront"}>
        <StoreDemoBanner context="employee" showBackLink={!embedded} />
        <p style={{ padding: "2rem" }}>Loading store preview…</p>
      </div>
    );
  }

  return (
    <div className={embedded ? "cs-storefront cs-storefront--embedded" : "cs-storefront"} style={{ ["--accent" as string]: accent }}>
      <StoreDemoBanner context="employee" showBackLink={!embedded} />
      <header className="cs-storefront__top">
        <div className="cs-storefront__top-inner">
          <div className="cs-storefront__brand">
            {storefrontDraft.identity.logo?.dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={storefrontDraft.identity.logo.dataUrl}
                alt=""
                width={44}
                height={44}
              />
            ) : (
              <div className="cs-storefront__monogram"
                aria-hidden
                style={{
                  background: accent,
                }}
              >{(storefrontDraft.identity.companyName || storefrontDraft.identity.storeName || "M").slice(0, 1).toUpperCase()}</div>
            )}
            <div>
              <h1>{companyName}</h1>
              <p>
                {programmeName}{showcase ? " · Guided demo" : " · Preview"}
              </p>
            </div>
          </div>
          {!embedded ? <div className="cs-landing__actions">
            {!showcase ? <Link
              className="cs-btn cs-btn--ghost cs-btn--small"
              href={returnTo}
            >
              Back to configurator
            </Link> : <Link className="cs-btn cs-btn--ghost cs-btn--small" href="/company-stores">Company Store overview</Link>}
          </div> : null}
        </div>
      </header>

      <section className="cs-storefront__hero">
        <h2>{storeTitle}</h2>
        <p>{storefrontDraft.identity.welcomeMessage}</p>
        <p className="cs-store-credit"><strong>Programme</strong> · {allowanceSummary}</p>
        <p className="cs-field__hint">Demo only · Prices are catalogue references; credits and orders are not live.</p>
      </section>

      {storefrontDraft.productIds.length === 0 ? (
        <div className="cs-empty" style={{ margin: "1.5rem 1.15rem" }}>
          <h3>Your gift edit starts here.</h3>
          {embedded ? <p className="cs-field__hint">Choose gifts in the Gifts step to preview this store.</p> : <p>
            Add products in the configurator before employees can browse a
            collection here.
          </p>}
          {!embedded ? <Link
            className="cs-btn cs-btn--primary cs-btn--small"
            href="/company-stores/configure?view=merchandise"
          >
            Select merchandise
          </Link> : null}
        </div>
      ) : (
        <div className="cs-storefront__layout">
          <div>
            <div className="cs-storefront__toolbar">
              <input
                type="search"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search this store’s collection"
                aria-label="Search store collection"
              />
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                aria-label="Filter by store category"
              >
                <option value="all">All categories</option>
                {storefrontDraft.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            {prepStatus ? <p className="cs-status cs-storefront__notice" role="status">{prepStatus}</p> : null}
            {loadError ? (
              <p className="cs-error" role="alert" style={{ padding: "0 1.15rem" }}>
                {loadError}
              </p>
            ) : null}
            {filtered.length === 0 ? (
              <div className="cs-empty">
                <h3>No matching products</h3>
                <p>Try another search or category filter.</p>
              </div>
            ) : (
              <div className="cs-store-grid">
                {filtered.map((product) => (
                  <article key={product.id} className="cs-store-card">
                    <Link aria-label={`View ${product.name} details`} href={showcase ? `/company-stores/preview/${product.slug}?showcase=1${embedded ? "&embed=1" : ""}` : `/company-stores/preview/${product.slug}?returnTo=${encodeURIComponent(returnTo)}${embedded ? "&embed=1" : ""}`} className="cs-store-card__link">
                    <div className="cs-store-card__media">
                      {product.imageSrc ? (
                        <Image
                          src={product.imageSrc}
                          alt=""
                          fill
                          sizes="180px"
                          className="cs-store-card__image"
                        />
                      ) : null}
                    </div>
                    </Link>
                    <div className="cs-store-card__body">
                      <p className="cs-store-card__cat">
                        {storefrontDraft.categories.find((c) =>
                          c.productIds.includes(product.id),
                        )?.name || product.categoryName}
                      </p>
                      <h3>{product.name}</h3>
                      <p className="cs-store-card__price">
                        {product.priceLabel}
                      </p>
                      {extractSelectableVariants(product.attributes).length === 0 ? <button type="button" className="cs-btn cs-btn--primary cs-btn--small cs-store-card__add" onClick={() => quickAdd(product)}>Add to bag</button> : <Link className="cs-store-card__choose" href={showcase ? `/company-stores/preview/${product.slug}?showcase=1${embedded ? "&embed=1" : ""}` : `/company-stores/preview/${product.slug}?returnTo=${encodeURIComponent(returnTo)}${embedded ? "&embed=1" : ""}`}>Choose options</Link>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className={`cs-cart${activeOrder.lines.length ? " cs-cart--has-items" : ""}`} aria-label="Your bag and delivery details">
            <h2>Your bag</h2>
            <div className="cs-rules-box">
              <strong>Demo purchasing rules</strong>
              {rulesLabel}
              {ordering.allowanceMode === "allowance-cap" &&
              ordering.allowanceCapInr != null ? (
                <p style={{ margin: "0.5rem 0 0" }}>
                  Cap reference: {formatInrAmount(ordering.allowanceCapInr)}
                </p>
              ) : null}
              {ordering.requireApproval ? (
                <p style={{ margin: "0.35rem 0 0" }}>
                  Approval would be required in a provisioned store.
                </p>
              ) : null}
            </div>

            {activeOrder.lines.length === 0 ? (
              <p className="cs-field__hint">
                Something catch your eye? Open a gift and add it to your bag.
              </p>
            ) : (
              <ul className="cs-cart__list">
                {activeOrder.lines.map((line) => (
                  <li key={`${line.productId}-${JSON.stringify(line.variants)}`}>
                    <strong>{line.name}</strong>
                    {line.variants.length > 0 ? (
                      <span>
                        {line.variants
                          .map((v) => `${v.label}: ${v.value}`)
                          .join(" · ")}
                      </span>
                    ) : null}
                    <span>
                      {line.priceLabel}
                      {typeof line.amountInr === "number"
                        ? ` · line ${formatInrAmount(line.amountInr * line.quantity)}`
                        : ""}
                    </span>
                    <div className="cs-cart__qty">
                      <button
                        type="button"
                        aria-label={`Decrease ${line.name}`}
                        disabled={line.quantity <= MIN_EMPLOYEE_REDEMPTION_QUANTITY}
                        onClick={() => showcase
                          ? setShowcaseOrder({ ...activeOrder, lines: activeOrder.lines.map((item) => orderLineIdentity(item.productId, item.variants) === orderLineIdentity(line.productId, line.variants) ? { ...item, quantity: Math.max(MIN_EMPLOYEE_REDEMPTION_QUANTITY, item.quantity - 1) } : item) })
                          : setStoreOrderQuantity(
                            line.productId,
                            line.variants,
                            line.quantity - 1,
                          )
                        }
                      >
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase ${line.name}`}
                        onClick={() => showcase
                          ? setShowcaseOrder({ ...activeOrder, lines: activeOrder.lines.map((item) => orderLineIdentity(item.productId, item.variants) === orderLineIdentity(line.productId, line.variants) ? { ...item, quantity: item.quantity + 1 } : item) })
                          : setStoreOrderQuantity(
                            line.productId,
                            line.variants,
                            line.quantity + 1,
                          )
                        }
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="cs-btn cs-btn--ghost cs-btn--small"
                        onClick={() => showcase
                          ? setShowcaseOrder({ ...activeOrder, lines: activeOrder.lines.filter((item) => orderLineIdentity(item.productId, item.variants) !== orderLineIdentity(line.productId, line.variants)) })
                          : removeStoreOrderLine(line.productId, line.variants)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

              {activeOrder.lines.length > 0 ? (
              <>
            <p style={{ margin: "0 0 0.75rem", fontWeight: 600 }}>
              Estimated catalogue value:{" "}
              {estimated != null ? formatInrAmount(estimated) : "Quote items"}
            </p>

            <div className="cs-checkout-fields">
              <h3 className="cs-checkout-heading">Delivery details</h3>
              <p className="cs-field__hint">Demo only: these details stay in this browser and will not create a shipment.</p>
              <button
                type="button"
                className="cs-btn cs-btn--ghost cs-btn--small"
                style={{ margin: "0.5rem 0 0.75rem" }}
                onClick={() => setDeliveryAddress({ fullName: "Demo Employee", phone: "0000000000", line1: "100 Demo Street", line2: "Demo address only", city: "Mumbai", state: "Maharashtra", postalCode: "400001" })}
              >
                Fill sample delivery details
              </button>
              <div className="cs-address-grid">
                <label>Full name<input autoComplete="name" required value={deliveryAddress.fullName} onChange={(e) => setDeliveryAddress({...deliveryAddress, fullName:e.target.value})} /></label>
                <label>Phone<input type="tel" autoComplete="tel" required value={deliveryAddress.phone} onChange={(e) => setDeliveryAddress({...deliveryAddress, phone:e.target.value})} /></label>
                <label className="cs-address-grid__wide">Address<input autoComplete="street-address" required value={deliveryAddress.line1} onChange={(e) => setDeliveryAddress({...deliveryAddress, line1:e.target.value})} /></label>
                <label className="cs-address-grid__wide">Apartment, suite, etc. <span>(optional)</span><input autoComplete="address-line2" value={deliveryAddress.line2} onChange={(e) => setDeliveryAddress({...deliveryAddress, line2:e.target.value})} /></label>
                <label>City<input autoComplete="address-level2" required value={deliveryAddress.city} onChange={(e) => setDeliveryAddress({...deliveryAddress, city:e.target.value})} /></label>
                <label>State<input autoComplete="address-level1" required value={deliveryAddress.state} onChange={(e) => setDeliveryAddress({...deliveryAddress, state:e.target.value})} /></label>
                <label className="cs-address-grid__wide">PIN code<input autoComplete="postal-code" inputMode="numeric" maxLength={6} pattern="[1-9][0-9]{5}" required value={deliveryAddress.postalCode} onChange={(e) => setDeliveryAddress({...deliveryAddress, postalCode:e.target.value.replace(/\D/g, "").slice(0, 6)})} /></label>
              </div>
            </div>

            <div className="cs-field" style={{ marginBottom: "0.75rem" }}>
              <label htmlFor="store-order-notes">Order notes <span>(optional)</span></label>
              <textarea
                id="store-order-notes"
                rows={2}
                  value={activeOrder.notes}
                  onChange={(event) =>
                    showcase
                      ? setShowcaseOrder({ ...activeOrder, notes: event.target.value })
                      : writeStoreOrderDraft({ ...activeOrder, notes: event.target.value })
                }
                placeholder="Delivery preference, sizing notes…"
              />
            </div>

            {prepError ? (
              <p className="cs-error" role="alert">
                {prepError}
              </p>
            ) : null}
            {prepStatus ? (
              <p className="cs-status" role="status">
                {prepStatus}
              </p>
            ) : null}

            <div className="cs-actions">
              <button
                type="button"
                className="cs-btn cs-btn--primary cs-btn--small"
                onClick={prepareRequest}
              >
                Continue to demo checkout
              </button>
              <button
                type="button"
                className="cs-btn cs-btn--ghost cs-btn--small"
                onClick={() => showcase ? setShowcaseOrder({ ...activeOrder, lines: [] }) : clearStoreOrderDraft()}
              >
                Clear cart
              </button>
            </div>
            <p className="cs-field__hint" style={{ marginTop: "0.75rem" }}>
              Your demo checkout saves a preview order and address in this browser.
              No live credits are deducted and no shipment is created.
            </p>
              </>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}
