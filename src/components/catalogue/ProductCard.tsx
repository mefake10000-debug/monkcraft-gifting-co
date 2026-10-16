"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/data/catalogue/types";
import { AddToBoxButton } from "@/components/box/AddToBoxButton";
import { formatGstBasis, formatPricing } from "@/lib/pricing";
import { productToBoxSnapshot, productToSnapshot } from "@/lib/productSnapshots";
import { ProductGallery } from "@/components/catalogue/ProductGallery";
import { ShortlistButton } from "./ShortlistButton";
import { FavouriteButton } from "./FavouriteButton";

type ProductCardProps = {
  product: Product;
  shortlisted?: boolean;
};

/**
 * Small / desk accessories often sit tiny in square packshots.
 * Extra frame padding keeps them readable without inventing new photos.
 */
function needsRoomyFrame(product: Product): boolean {
  const blob = [
    product.name,
    product.subcategoryName,
    product.filterCategoryName,
    product.categoryName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /place\s*card|placecard|card\s*holder|cardy|card\s*case|name\s*plate|tent\s*card|keychain|key\s*ring|badge|lapel|pin\b|coaster|organiser|organizer|pen\b|pencil|stylus|usb\b|dongle|adapter|clip\b|magnet|bookmark/.test(
    blob,
  );
}

export function ProductCard({ product, shortlisted = false }: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const image = product.images[0];
  const snapshot = productToSnapshot(product);
  const boxSnapshot = productToBoxSnapshot(product);
  const price =
    product.pricing.kind === "fixed"
      ? formatPricing(product.pricing)
      : null;
  const roomy = needsRoomyFrame(product);
  const typeLabel = product.filterCategoryName || product.categoryName;

  useEffect(() => {
    if (!quickViewOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuickViewOpen(false);
        openerRef.current?.focus();
      }
      if (event.key === "Tab" && dialogRef.current) {
        const controls = [...dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )].filter((element) => element.offsetParent !== null);
        if (!controls.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    dialogRef.current?.querySelector<HTMLElement>(".product-quickview__close")?.focus();
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [quickViewOpen]);

  return (
    <article
      className={
        roomy ? "product-card product-card--roomy-frame" : "product-card"
      }
    >
      <div className="product-card__media">
        {image ? (
          <button
            type="button"
            className="product-card__media-link"
            aria-label={`Quick view ${product.name}`}
            onClick={(event) => { openerRef.current = event.currentTarget; setQuickViewOpen(true); }}
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="(max-width: 639px) 92vw, (max-width: 1279px) 42vw, 28vw"
              className="product-card__image"
              style={{ objectFit: "contain", objectPosition: "center" }}
            />
          </button>
        ) : (
          <div className="product-card__media-empty" aria-hidden="true">
            No image
          </div>
        )}
      </div>

      <div className="product-card__body">
        {typeLabel ? <p className="product-card__type">{typeLabel}</p> : null}
        {product.colourVariantCount && product.colourVariantCount > 1 ? <p className="product-card__variants">{product.colourVariantCount} colours · view options</p> : null}
        <h3 className="product-card__title">
          <button type="button" className="product-card__title-button" onClick={(event) => { openerRef.current = event.currentTarget; setQuickViewOpen(true); }}>{product.name}</button>
        </h3>
        <div className="product-card__meta">
          {price ? (
            <span className="product-card__price">{price}</span>
          ) : (
            <span className="product-card__price product-card__price--quote">
              Quote on request
            </span>
          )}
          {product.minQuantity != null && product.minQuantity > 1 ? (
            <span className="product-card__moq">
              MOQ {product.minQuantity.toLocaleString("en-IN")}
            </span>
          ) : null}
        </div>
        <div className="product-card__actions">
          <button type="button" className="product-card__detail" onClick={() => setQuickViewOpen(true)}>View details</button>
          <ShortlistButton
            snapshot={snapshot}
            initiallyShortlisted={shortlisted}
            className="product-card__quote-action"
          />
          <FavouriteButton id={product.id} name={product.name} />
        </div>
      </div>
      {quickViewOpen ? (
        <div className="product-quickview" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setQuickViewOpen(false); openerRef.current?.focus(); } }}>
          <section ref={dialogRef} className="product-quickview__panel" role="dialog" aria-modal="true" aria-labelledby={`quickview-${product.id}`} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="product-quickview__close" aria-label="Close product details" onClick={() => { setQuickViewOpen(false); openerRef.current?.focus(); }}>×</button>
            <div className="product-quickview__image"><ProductGallery images={product.images} productName={product.name} /></div>
            <div className="product-quickview__content">
              <p className="product-card__type">{typeLabel}{product.brandName ? ` · ${product.brandName}` : ""}</p>
              <h2 id={`quickview-${product.id}`}>{product.name}</h2>
              {product.sku ? <p className="product-detail__sku">SKU {product.sku}</p> : null}
              <p className="product-detail__summary">{product.summary}</p>
              <p className="product-quickview__price">{price ?? "Quote on request"}{product.pricing.kind === "fixed" && formatGstBasis(product.pricing.gstBasis) ? ` · ${formatGstBasis(product.pricing.gstBasis)}` : ""}</p>
              <ul className="product-quickview__facts">
                {product.minQuantity ? <li><strong>Supplier minimum:</strong> {product.minQuantity} pcs</li> : null}
                {product.dispatchTimeline ? <li><strong>Dispatch:</strong> {product.dispatchTimeline}</li> : null}
                {product.availabilityStatus === "OUT" ? <li><strong>Availability:</strong> Currently marked out of stock</li> : null}
                {product.materials.length ? <li><strong>Material:</strong> {product.materials.join(", ")}</li> : null}
                {product.colours.length ? <li><strong>Colour:</strong> {product.colours.join(", ")}</li> : null}
              </ul>
              {product.description?.trim() && product.description.trim().toLowerCase() !== product.summary.trim().toLowerCase() ? <details className="product-quickview__disclosure" open><summary>About this product</summary><p>{product.description}</p></details> : null}
              {product.attributes.length ? <details className="product-quickview__disclosure" open><summary>Specifications</summary><dl>{product.attributes.map((attribute) => <div key={`${attribute.label}-${attribute.value}`}><dt>{attribute.label}</dt><dd>{attribute.value}</dd></div>)}</dl></details> : null}
              {product.customization ? <details className="product-quickview__disclosure"><summary>Branding options</summary><p>{product.customization}</p></details> : null}
              <div className="product-quickview__actions">
                <ShortlistButton snapshot={snapshot} />
                <FavouriteButton id={product.id} name={product.name} />
                <AddToBoxButton snapshot={boxSnapshot} variant="detail" />
                <Link className="product-card__detail" href={`/studio?mode=customize&product=${encodeURIComponent(product.slug)}&from=product`}>Customize in Studio</Link>
                <Link className="product-card__detail" href={`/gifts/${product.slug}`}>Full product page</Link>
              </div>
              <p className="product-quickview__hint">Add it to your box and keep browsing. Your selection stays saved.</p>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}
