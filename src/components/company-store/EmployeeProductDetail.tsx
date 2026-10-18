"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { StudioProductSummary } from "@/data/catalogue/studioTypes";
import { companyStoreQuantityFloor } from "@/lib/shortlist";
import type { StoreVariantSelection } from "@/data/companyStore/types";
import { StoreDemoBanner } from "@/components/company-store/StoreDemoBanner";
import { addStoreOrderLine } from "@/lib/companyStore/orderDraft";
import { useStoreDraft } from "@/lib/companyStore/useStoreDraft";
import {
  displayAttributes,
  extractProductVariants,
  variantsComplete,
} from "@/lib/companyStore/variants";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";

export function EmployeeProductDetail({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const showcase = searchParams.get("showcase") === "1";
  const embedded = searchParams.get("embed") === "1";
  const requestedReturnTo = searchParams.get("returnTo");
  const returnTo = requestedReturnTo?.startsWith("/company-stores/configure") && !requestedReturnTo.startsWith("//")
    ? requestedReturnTo
    : "/company-stores/configure?view=preview";
  const previewHref = showcase ? `/company-stores/preview?showcase=1${embedded ? "&embed=1" : ""}` : `/company-stores/preview?returnTo=${encodeURIComponent(returnTo)}${embedded ? "&embed=1" : ""}`;
  const { draft, ready } = useStoreDraft();
  const [product, setProduct] = useState<StudioProductSummary | null>(null);
  const [missing, setMissing] = useState(false);
  const [notInStore, setNotInStore] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<StoreVariantSelection[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!ready) return;
      try {
        const list = await fetchStudioProducts({ slug });
        const found = list[0] ?? null;
        if (cancelled) return;
        if (!found) {
          setMissing(true);
          setProduct(null);
          return;
        }
        if (!showcase && !draft.productIds.includes(found.id)) {
          setNotInStore(true);
          setProduct(found);
          return;
        }
        setProduct(found);
        setMissing(false);
        setNotInStore(false);
        const min = companyStoreQuantityFloor(found.minQuantity);
        setQuantity(min);
      } catch {
        if (!cancelled) setMissing(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, ready, draft.productIds, showcase]);

  const accent = draft.identity.accentColor || "#662F90";

  function setVariant(label: string, value: string) {
    setVariants((prev) => {
      const others = prev.filter((v) => v.label !== label);
      return [...others, { label, value }];
    });
  }

  function addToDraft() {
    setError("");
    setStatus("");
    if (!product) return;
    if (!variantsComplete(product, variants)) {
      setError("Select all available options before adding.");
      return;
    }
    const maxUnits = showcase ? null : draft.rules.ordering.maxUnitsPerProduct;
    if (maxUnits != null && quantity > maxUnits) {
      setError(`Draft rule: max ${maxUnits} units per product.`);
      return;
    }
    const line = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageSrc: activeImageSrc,
      priceLabel: product.priceLabel,
      amountInr: product.amountInr,
      quantity,
      variants,
    };
    if (showcase) {
      const key = `${line.productId}::${line.variants.map((variant) => `${variant.label}:${variant.value}`).sort().join("|")}`;
      const raw = localStorage.getItem("monkcraft-company-store-showcase-cart-v1");
      const lines = raw ? JSON.parse(raw) as typeof line[] : [];
      const existing = lines.find((item) => `${item.productId}::${item.variants.map((variant) => `${variant.label}:${variant.value}`).sort().join("|")}` === key);
      localStorage.setItem("monkcraft-company-store-showcase-cart-v1", JSON.stringify(existing
        ? lines.map((item) => item === existing ? { ...item, quantity: item.quantity + line.quantity } : item)
        : [...lines, line]));
      window.dispatchEvent(new CustomEvent("monkcraft:company-store-showcase-cart"));
    } else {
      addStoreOrderLine(line);
    }
    setStatus("Added to your bag.");
  }

  if (!ready || (!product && !missing)) {
    return (
      <div className={embedded ? "cs-storefront cs-storefront--embedded" : "cs-storefront"}>
        <StoreDemoBanner context="employee" showBackLink={!embedded} />
        <p style={{ padding: "2rem" }}>Loading product…</p>
      </div>
    );
  }

  if (missing || !product) {
    return (
      <div className={embedded ? "cs-storefront cs-storefront--embedded" : "cs-storefront"}>
        <StoreDemoBanner context="employee" showBackLink={!embedded} />
        <div className="cs-empty" style={{ margin: "2rem 1.15rem" }}>
          <h3>Product not found</h3>
          <p>No verified catalogue product matches this link.</p>
          <Link
            className="cs-btn cs-btn--primary cs-btn--small"
            href={previewHref}
          >
            Back to store preview
          </Link>
        </div>
      </div>
    );
  }

  if (notInStore) {
    return (
      <div className={embedded ? "cs-storefront cs-storefront--embedded" : "cs-storefront"}>
        <StoreDemoBanner context="employee" showBackLink={!embedded} />
        <div className="cs-empty" style={{ margin: "2rem 1.15rem" }}>
          <h3>Not in this store draft</h3>
          <p>
            “{product.name}” exists in the catalogue but is not selected for this
            Company Store draft.
          </p>
          <Link
            className="cs-btn cs-btn--primary cs-btn--small"
            href={previewHref}
          >
            Back to store preview
          </Link>
        </div>
      </div>
    );
  }

  const selectable = extractProductVariants(product);
  const attrs = displayAttributes(product.attributes).slice(0, 8);
  const minQty = companyStoreQuantityFloor(product.minQuantity);
  const selectedColour = variants.find((variant) =>
    /^(colour|color)$/i.test(variant.label),
  )?.value;
  const selectedColourImage = selectedColour
    ? product.imageVariants?.find(
        (variant) =>
          variant.label.trim().toLocaleLowerCase() ===
          selectedColour.trim().toLocaleLowerCase(),
      )
    : undefined;
  const activeImageSrc = selectedColourImage?.imageSrc ?? product.imageSrc;
  const activeImageAlt =
    selectedColourImage?.imageAlt ?? product.imageAlt ?? product.name;

  return (
      <div className={embedded ? "cs-storefront cs-storefront--embedded" : "cs-storefront"} style={{ ["--accent" as string]: accent }}>
      <StoreDemoBanner context="employee" showBackLink={!embedded} />
      <div style={{ padding: "1rem 1.15rem 0" }}>
        <Link href={previewHref} onClick={(event) => { if (showcase) { event.preventDefault(); window.location.assign(previewHref); } }}>← Back to store</Link>
      </div>
      <article className="cs-product-detail">
        <div className="cs-product-detail__media">
          {activeImageSrc ? (
            <Image
              key={activeImageSrc}
              src={activeImageSrc}
              alt={activeImageAlt}
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
              className="cs-product-detail__image"
            />
          ) : (
            <div className="cs-product-row__ph" style={{ width: "100%", height: "100%" }}>
              No image
            </div>
          )}
        </div>
        <div className="cs-product-detail__body">
          <p className="cs-store-card__cat">{product.categoryName}</p>
          <h1>{product.name}</h1>
          <p className="cs-store-card__price">{product.priceLabel}</p>
          <p>{product.summary}</p>

          {attrs.length > 0 ? (
            <ul className="cs-attr-list">
              {attrs.map((attr) => (
                <li key={attr.label}>
                  <span>{attr.label}</span>
                  <span>{attr.value}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {selectable.map((group) => (
            <fieldset key={group.label} className="cs-variant-group">
              <legend>{group.label}</legend>
              <div className="cs-variant-options">
                {group.options.map((option) => {
                  const checked = variants.some(
                    (v) => v.label === group.label && v.value === option,
                  );
                  return (
                    <label key={option}>
                      <input
                        type="radio"
                        name={`variant-${group.label}`}
                        checked={checked}
                        onChange={() => setVariant(group.label, option)}
                      />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="cs-qty-row">
            <label htmlFor="emp-qty">Quantity</label>
            <input
              id="emp-qty"
              type="number"
              min={minQty}
              value={quantity}
              onChange={(event) =>
                setQuantity(
                  Math.max(minQty, Math.floor(Number(event.target.value)) || minQty),
                )
              }
            />
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
            <button
              type="button"
              className="cs-btn cs-btn--primary"
              onClick={addToDraft}
            >
                Add to bag
            </button>
            <Link
              className="cs-btn cs-btn--ghost"
              href={previewHref}
              onClick={(event) => { if (showcase) { event.preventDefault(); window.location.assign(previewHref); } }}
            >
              Review cart
            </Link>
          </div>
        </div>
        <div className="cs-product-detail__return">
          {!embedded ? (showcase ? <Link href="/company-stores">Back to Company Stores</Link> : <Link href={returnTo}>Back to setup</Link>) : null}
        </div>
      </article>
    </div>
  );
}
