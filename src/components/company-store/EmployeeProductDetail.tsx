"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { StudioProductSummary } from "@/data/catalogue/studioTypes";
import type { StoreVariantSelection } from "@/data/companyStore/types";
import { StoreDemoBanner } from "@/components/company-store/StoreDemoBanner";
import { addStoreOrderLine } from "@/lib/companyStore/orderDraft";
import { useStoreDraft } from "@/lib/companyStore/useStoreDraft";
import {
  displayAttributes,
  extractSelectableVariants,
  variantsComplete,
} from "@/lib/companyStore/variants";
import { fetchStudioProducts } from "@/lib/studio/fetchProducts";

export function EmployeeProductDetail({ slug }: { slug: string }) {
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
        if (!draft.productIds.includes(found.id)) {
          setNotInStore(true);
          setProduct(found);
          return;
        }
        setProduct(found);
        setMissing(false);
        setNotInStore(false);
        const min = found.minQuantity && found.minQuantity > 0 ? found.minQuantity : 1;
        setQuantity(min);
      } catch {
        if (!cancelled) setMissing(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, ready, draft.productIds]);

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
    const maxUnits = draft.rules.ordering.maxUnitsPerProduct;
    if (maxUnits != null && quantity > maxUnits) {
      setError(`Draft rule: max ${maxUnits} units per product.`);
      return;
    }
    addStoreOrderLine({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageSrc: product.imageSrc,
      priceLabel: product.priceLabel,
      amountInr: product.amountInr,
      quantity,
      variants,
    });
    setStatus("Added to draft order.");
  }

  if (!ready || (!product && !missing)) {
    return (
      <div className="cs-storefront">
        <StoreDemoBanner context="employee" />
        <p style={{ padding: "2rem" }}>Loading product…</p>
      </div>
    );
  }

  if (missing || !product) {
    return (
      <div className="cs-storefront">
        <StoreDemoBanner context="employee" />
        <div className="cs-empty" style={{ margin: "2rem 1.15rem" }}>
          <h3>Product not found</h3>
          <p>No verified catalogue product matches this link.</p>
          <Link
            className="cs-btn cs-btn--primary cs-btn--small"
            href="/company-stores/preview"
          >
            Back to store preview
          </Link>
        </div>
      </div>
    );
  }

  if (notInStore) {
    return (
      <div className="cs-storefront">
        <StoreDemoBanner context="employee" />
        <div className="cs-empty" style={{ margin: "2rem 1.15rem" }}>
          <h3>Not in this store draft</h3>
          <p>
            “{product.name}” exists in the catalogue but is not selected for this
            Company Store draft.
          </p>
          <Link
            className="cs-btn cs-btn--primary cs-btn--small"
            href="/company-stores/preview"
          >
            Back to store preview
          </Link>
        </div>
      </div>
    );
  }

  const selectable = extractSelectableVariants(product.attributes);
  const attrs = displayAttributes(product.attributes).slice(0, 8);
  const minQty =
    product.minQuantity && product.minQuantity > 0 ? product.minQuantity : 1;

  return (
    <div className="cs-storefront" style={{ ["--accent" as string]: accent }}>
      <StoreDemoBanner context="employee" />
      <div style={{ padding: "1rem 1.15rem 0" }}>
        <Link href="/company-stores/preview">← Back to store</Link>
      </div>
      <article className="cs-product-detail">
        <div className="cs-product-detail__media">
          {product.imageSrc ? (
            <Image
              src={product.imageSrc}
              alt={product.imageAlt || product.name}
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
              Add to draft order
            </button>
            <Link
              className="cs-btn cs-btn--ghost"
              href="/company-stores/preview"
            >
              Review cart
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
