"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { StudioProductSummary } from "@/data/catalogue/studioTypes";
import { StoreDemoBanner } from "@/components/company-store/StoreDemoBanner";
import { buildCompanyStoreRulesLabel } from "@/lib/companyStore/enquiry";
import {
  clearStoreOrderDraft,
  prepareStoreOrderRequest,
  readStoreOrderDraft,
  removeStoreOrderLine,
  setStoreOrderQuantity,
  STORE_ORDER_EVENT,
  storeOrderEstimatedTotal,
  writeStoreOrderDraft,
} from "@/lib/companyStore/orderDraft";
import { useStoreDraft } from "@/lib/companyStore/useStoreDraft";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";
import { formatInrAmount } from "@/lib/pricing";
import { readDemoEmployee, type CompanyStoreDemoEmployee } from "@/lib/companyStore/employeeProfile";

export function EmployeeStorefront() {
  const { draft, ready } = useStoreDraft();
  const [products, setProducts] = useState<StudioProductSummary[]>([]);
  const [loadError, setLoadError] = useState("");
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [order, setOrder] = useState(readStoreOrderDraft());
  const [prepStatus, setPrepStatus] = useState("");
  const [prepError, setPrepError] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState(() =>
    readStoreOrderDraft().deliveryAddress ?? {
      fullName: "", phone: "", line1: "", line2: "", city: "", state: "", postalCode: "",
    },
  );
  const [employee, setEmployee] = useState<CompanyStoreDemoEmployee | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setEmployee(readDemoEmployee());
    });
    const sync = () => setOrder(readStoreOrderDraft());
    sync();
    window.addEventListener(STORE_ORDER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      active = false;
      window.removeEventListener(STORE_ORDER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
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
  }, [draft.productIds, ready]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of draft.categories) {
      for (const id of cat.productIds) map.set(id, cat.id);
    }
    return map;
  }, [draft.categories]);

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
        product.categoryName,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [products, q, categoryId, categoryMap]);

  const accent = draft.identity.accentColor || "#662F90";
  const storeTitle =
    draft.identity.storeTitle ||
    draft.identity.storeName ||
    draft.identity.companyName ||
    "Company store preview";
  const estimated = storeOrderEstimatedTotal(order.lines);
  const rulesLabel = buildCompanyStoreRulesLabel(draft);
  const ordering = draft.rules.ordering;
  const bagCount = order.lines.reduce((sum, line) => sum + line.quantity, 0);

  function updateDeliveryAddress(field: keyof typeof deliveryAddress, value: string) {
    const nextAddress = { ...deliveryAddress, [field]: value };
    setDeliveryAddress(nextAddress);
    writeStoreOrderDraft({ ...readStoreOrderDraft(), deliveryAddress: nextAddress });
  }

  function updateOrderNotes(value: string) {
    const nextOrder = { ...readStoreOrderDraft(), notes: value, employeeId: employee?.id ?? order.employeeId };
    setOrder(nextOrder);
    writeStoreOrderDraft(nextOrder);
  }

  function prepareRequest() {
    setPrepError("");
    setPrepStatus("");
    if (order.lines.length === 0) {
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
    if (
      ordering.maxItemsPerOrder != null &&
      order.lines.length > ordering.maxItemsPerOrder
    ) {
      setPrepError(
        `Draft rule: max ${ordering.maxItemsPerOrder} line items per order.`,
      );
      return;
    }
    for (const line of order.lines) {
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
      lines: order.lines,
      notes: order.notes,
      deliveryAddress,
      employeeId: employee?.id ?? order.employeeId,
      rulesLabel,
    });
    clearStoreOrderDraft();
    setPrepStatus(
      "Demo checkout complete. Your order summary and delivery details were saved in this browser; no real order was submitted.",
    );
  }

  if (!ready) {
    return (
      <div className="cs-storefront">
        <StoreDemoBanner context="employee" />
        <p style={{ padding: "2rem" }}>Loading store preview…</p>
      </div>
    );
  }

  return (
    <div className="cs-storefront" style={{ ["--accent" as string]: accent }}>
      <StoreDemoBanner context="employee" />
      <header className="cs-storefront__top">
        <div className="cs-storefront__top-inner">
          <div className="cs-storefront__brand">
            {draft.identity.logo?.dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft.identity.logo.dataUrl}
                alt=""
                width={44}
                height={44}
              />
            ) : (
              <div
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: accent,
                }}
              />
            )}
            <div>
              <h1>{storeTitle}</h1>
              <p>
                {draft.identity.companyName || "Company"} ·{" "}
                <span className="cs-chip cs-chip--demo">Preview</span>
              </p>
            </div>
          </div>
          <nav className="cs-storefront__actions" aria-label="Shop navigation">
            {employee ? <p>Hi, <strong>{employee.name.split(" ")[0]}</strong><span className="cs-storefront__employee-id">ID {employee.id}</span></p> : null}
            <a className="cs-storefront__bag-link" href="#store-bag">Your bag <span>{bagCount}</span></a>
          </nav>
        </div>
      </header>

      <section className="cs-storefront__hero">
        <p className="cs-storefront__eyebrow">{draft.identity.companyName || "Company Store"}</p>
        <h2>{employee ? `Welcome, ${employee.name.split(" ")[0]}` : draft.identity.storeTitle || draft.identity.storeName || "Your merch store"}</h2>
        <p>{draft.identity.welcomeMessage}</p>
        <div className="cs-storefront__welcome-meta"><span>{products.length} curated products</span><span>{ordering.allowanceCapInr != null ? `Your allowance · ${formatInrAmount(ordering.allowanceCapInr)}` : "Chosen for your team"}</span></div>
      </section>

      {draft.productIds.length === 0 ? (
        <div className="cs-empty" style={{ margin: "1.5rem 1.15rem" }}>
          <h3>No merchandise in this draft store</h3>
          <p>
            Add products in the configurator before employees can browse a
            collection here.
          </p>
          <Link
            className="cs-btn cs-btn--primary cs-btn--small"
            href="/company-stores/configure?view=merchandise"
          >
            Select merchandise
          </Link>
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
                {draft.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
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
                  <Link
                    key={product.id}
                    href={`/company-stores/preview/${product.slug}`}
                    className="cs-store-card"
                  >
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
                    <div className="cs-store-card__body">
                      <p className="cs-store-card__cat">
                        {draft.categories.find((c) =>
                          c.productIds.includes(product.id),
                        )?.name || product.categoryName}
                      </p>
                      <h3>{product.name}</h3>
                      <p className="cs-store-card__price">
                        {product.priceLabel}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside id="store-bag" className="cs-cart" aria-label="Your bag and delivery details">
            <h2>Your bag</h2>
            <div className="cs-rules-box"><strong>{ordering.allowanceCapInr != null ? `Your allowance · ${formatInrAmount(ordering.allowanceCapInr)}` : "Selected for your team"}</strong><span>{rulesLabel}</span></div>

            {order.lines.length === 0 ? (
              <div className="cs-bag-empty"><span aria-hidden="true">＋</span><p>Your bag is ready when you are.</p><small>Choose something from the collection to get started.</small></div>
            ) : (
              <ul className="cs-cart__list">
                {order.lines.map((line) => (
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
                        onClick={() =>
                          setStoreOrderQuantity(
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
                        onClick={() =>
                          setStoreOrderQuantity(
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
                        aria-label={`Remove ${line.name} from your bag`}
                        onClick={() =>
                          removeStoreOrderLine(line.productId, line.variants)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {order.lines.length > 0 ? <><p className="cs-cart__total">
              Estimated catalogue value:{" "}
              {estimated != null ? formatInrAmount(estimated) : "Quote items"}
            </p>

            <div className="cs-checkout-fields">
              <h3 className="cs-checkout-heading">Delivery details</h3>
              <div className="cs-address-grid">
                <label>Full name<input autoComplete="name" required value={deliveryAddress.fullName} onChange={(e) => updateDeliveryAddress("fullName",e.target.value)} /></label>
                <label>Phone<input type="tel" autoComplete="tel" required value={deliveryAddress.phone} onChange={(e) => updateDeliveryAddress("phone",e.target.value)} /></label>
                <label className="cs-address-grid__wide">Address<input autoComplete="street-address" required value={deliveryAddress.line1} onChange={(e) => updateDeliveryAddress("line1",e.target.value)} /></label>
                <label className="cs-address-grid__wide">Apartment, suite, etc. <span>(optional)</span><input autoComplete="address-line2" value={deliveryAddress.line2} onChange={(e) => updateDeliveryAddress("line2",e.target.value)} /></label>
                <label>City<input autoComplete="address-level2" required value={deliveryAddress.city} onChange={(e) => updateDeliveryAddress("city",e.target.value)} /></label>
                <label>State<input autoComplete="address-level1" required value={deliveryAddress.state} onChange={(e) => updateDeliveryAddress("state",e.target.value)} /></label>
                <label className="cs-address-grid__wide">PIN code<input autoComplete="postal-code" inputMode="numeric" required value={deliveryAddress.postalCode} onChange={(e) => updateDeliveryAddress("postalCode",e.target.value)} /></label>
              </div>
            </div>

            <div className="cs-field" style={{ marginBottom: "0.75rem" }}>
              <label htmlFor="store-order-notes">Order notes <span>(optional)</span></label>
              <textarea
                id="store-order-notes"
                rows={2}
                value={order.notes}
                onChange={(event) => updateOrderNotes(event.target.value)}
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
                onClick={() => clearStoreOrderDraft()}
              >
                Clear cart
              </button>
            </div>
            <p className="cs-field__hint" style={{ marginTop: "0.75rem" }}>
              Your demo checkout saves a preview order and address in this browser.
              No live credits are deducted and no shipment is created.
            </p>
            </> : null}
          </aside>
        </div>
      )}
    </div>
  );
}
