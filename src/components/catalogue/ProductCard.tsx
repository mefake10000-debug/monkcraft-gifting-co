"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/data/catalogue/types";
import { AddToBoxButton } from "@/components/box/AddToBoxButton";
import { formatGstBasis, formatPricing } from "@/lib/pricing";
import { productToBoxSnapshot, productToSnapshot } from "@/lib/productSnapshots";
import { ProductGallery } from "@/components/catalogue/ProductGallery";
import { colourSwatchStyle } from "@/data/catalogue/colourSwatches";
import { productMinimumOrderLabel } from "@/lib/shortlist";
import { ShortlistButton } from "./ShortlistButton";
import { FavouriteButton } from "./FavouriteButton";

type ProductCardProps = {
  product: Product;
  shortlisted?: boolean;
  fromBox?: boolean;
  eagerImage?: boolean;
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

export function ProductCard({ product, shortlisted = false, fromBox = false, eagerImage = false }: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(product);
  const [selectedCardProduct, setSelectedCardProduct] = useState(product);
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const eligibleVariantSignature = (
    product.colourVariantOptions?.length
      ? product.colourVariantOptions
      : product.designVariantOptions?.length
        ? product.designVariantOptions
        : [product]
  ).map((variant) => variant.id).join("|");
  const allowedVariantIds = new Set(eligibleVariantSignature.split("|"));
  const activeCardProduct = allowedVariantIds.has(selectedCardProduct.id)
    ? selectedCardProduct
    : product;
  const activeQuickViewProduct = allowedVariantIds.has(quickViewProduct.id)
    ? quickViewProduct
    : product;

  const image = activeCardProduct.images[0];
  const snapshot = productToSnapshot(activeCardProduct);
  const boxSnapshot = productToBoxSnapshot(activeCardProduct);
  const price =
    activeCardProduct.pricing.kind === "fixed"
      ? formatPricing(activeCardProduct.pricing)
      : null;
  const roomy = needsRoomyFrame(activeCardProduct);
  const typeLabel = product.filterCategoryName || product.categoryName;
  const quickSnapshot = productToSnapshot(activeQuickViewProduct);
  const quickBoxSnapshot = productToBoxSnapshot(activeQuickViewProduct);
  const quickPrice = activeQuickViewProduct.pricing.kind === "fixed" ? formatPricing(activeQuickViewProduct.pricing) : null;

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
            aria-label={`Quick view ${activeCardProduct.name}`}
            onClick={(event) => { openerRef.current = event.currentTarget; setQuickViewProduct(activeCardProduct); setQuickViewOpen(true); }}
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="(max-width: 639px) 92vw, (max-width: 1279px) 42vw, 28vw"
              className="product-card__image"
              style={{ objectFit: "contain", objectPosition: "center" }}
              loading={eagerImage ? "eager" : "lazy"}
            />
          </button>
        ) : (
          <div className="product-card__media-empty" role="img" aria-label={`Photo unavailable for ${activeCardProduct.name}`}>
            Photo unavailable
          </div>
        )}
        {product.colourVariantCount && product.colourVariantCount > 1 ? (
          <span className="product-card__family-badge" aria-label={`Available in ${product.colourVariantCount} colours`}>
            {product.colourVariantCount} colours
          </span>
        ) : product.designVariantCount && product.designVariantCount > 1 ? (
          <span className="product-card__family-badge" aria-label={`Available in ${product.designVariantCount} ${product.designFamilyOptionLabel === "design" ? "designs" : `${product.designFamilyOptionLabel} options`}`}>
            {product.designVariantCount} {product.designFamilyOptionLabel === "design" ? "designs" : `${product.designFamilyOptionLabel} options`}
          </span>
        ) : null}
      </div>

      <div className="product-card__body">
        {typeLabel ? <p className="product-card__type">{typeLabel}</p> : null}
        {product.colourVariantOptions && product.colourVariantOptions.length > 1 ? (
          <div className="product-card__colour-picker">
            <p className="product-card__colour-current">Colour: <strong>{activeCardProduct.colourOptionLabel ?? activeCardProduct.colours[0]}</strong>{activeCardProduct.availabilityStatus === "OUT" ? " · Out of stock" : ""}</p>
            <ul aria-label="Choose a colour">
              {product.colourVariantOptions.map((variant) => {
                const selected = variant.id === activeCardProduct.id;
                const outOfStock = variant.availabilityStatus === "OUT";
                const label = variant.colourOptionLabel ?? variant.colours[0];
                return <li key={variant.id}>
                  <button type="button" className={`product-card__colour-choice${selected ? " product-card__colour-choice--selected" : ""}${outOfStock ? " product-card__colour-choice--unavailable" : ""}`} aria-label={`Choose ${label}${outOfStock ? ", out of stock" : ""}`} aria-pressed={selected} title={`${label}${outOfStock ? " · Out of stock" : ""}`} onClick={() => setSelectedCardProduct(variant)}>
                  <span className="product-card__colour-dot" style={colourSwatchStyle(variant.colourOptionLabel ?? variant.colours[0])} aria-hidden="true" />
                  </button>
                </li>;
              })}
            </ul>
          </div>
        ) : null}
        {product.designVariantOptions && product.designVariantOptions.length > 1 ? (
          <div className="product-card__design-picker">
            <p>{product.designFamilyOptionLabel === "design" ? "Designs" : `${product.designFamilyOptionLabel} options`}<span className="visually-hidden" aria-live="polite">. Selected: {activeCardProduct.designOptionLabel}</span></p>
            <ul aria-label={`Choose ${product.designFamilyOptionLabel === "design" ? "a design" : `${product.designFamilyOptionLabel} options`}`}>
              {product.designVariantOptions.map((variant) => {
                const selected = variant.id === activeCardProduct.id;
                const thumb = variant.images[0];
                const label = variant.designOptionLabel || variant.name;
                return <li key={variant.id}>
                  <button type="button" className={`product-card__design-choice${selected ? " product-card__design-choice--selected" : ""}`} aria-label={`Choose ${label}`} aria-pressed={selected} title={label} onClick={() => setSelectedCardProduct(variant)}>
                    <span className="product-card__design-thumb">{thumb ? <Image src={thumb.src} alt="" width={40} height={40} style={{ objectFit: "contain" }} /> : null}</span>
                  </button>
                </li>;
              })}
            </ul>
          </div>
        ) : null}
        <h3 className="product-card__title">
          <button type="button" className="product-card__title-button" onClick={(event) => { openerRef.current = event.currentTarget; setQuickViewProduct(activeCardProduct); setQuickViewOpen(true); }}>{activeCardProduct.name}</button>
        </h3>
        <div className="product-card__meta">
          {price ? (
            <span className="product-card__price">{price}</span>
          ) : (
            <span className="product-card__price product-card__price--quote">
              Quote on request
            </span>
          )}
          {(
            <span className="product-card__moq">
              MOQ {productMinimumOrderLabel(activeCardProduct.minQuantity)}
            </span>
          )}
        </div>
        <div className="product-card__actions">
          <button type="button" className="product-card__detail" onClick={(event) => { openerRef.current = event.currentTarget; setQuickViewProduct(activeCardProduct); setQuickViewOpen(true); }}>View details</button>
          {fromBox ? (
            <AddToBoxButton snapshot={boxSnapshot} variant="card" />
          ) : (
            <ShortlistButton
              snapshot={snapshot}
              initiallyShortlisted={shortlisted}
              className="product-card__quote-action"
            />
          )}
          <FavouriteButton id={activeCardProduct.id} name={activeCardProduct.name} />
        </div>
      </div>
      {quickViewOpen ? (
        <div className="product-quickview" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setQuickViewOpen(false); openerRef.current?.focus(); } }}>
          <section ref={dialogRef} className="product-quickview__panel" role="dialog" aria-modal="true" aria-labelledby={`quickview-${product.id}`} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="product-quickview__close" aria-label="Close product details" onClick={() => { setQuickViewOpen(false); openerRef.current?.focus(); }}>×</button>
            <div className="product-quickview__image"><ProductGallery key={activeQuickViewProduct.id} images={activeQuickViewProduct.images} productName={activeQuickViewProduct.name} selectedVariantId={activeQuickViewProduct.id} colourVariants={product.colourVariantOptions ?? []} designVariants={product.designVariantOptions ?? []} designVariantLabel={product.designFamilyOptionLabel} onSelectVariant={setQuickViewProduct} /></div>
            <div className="product-quickview__content">
              <p className="product-card__type">{typeLabel}{activeQuickViewProduct.brandName ? ` · ${activeQuickViewProduct.brandName}` : ""}</p>
              <h2 id={`quickview-${product.id}`}>{activeQuickViewProduct.name}</h2>
              {activeQuickViewProduct.catalogueSku ? <p className="product-detail__sku">SKU {activeQuickViewProduct.catalogueSku}</p> : null}
              <p className="product-detail__summary">{activeQuickViewProduct.summary}</p>
              <p className="product-quickview__price">{quickPrice ?? "Quote on request"}{activeQuickViewProduct.pricing.kind === "fixed" && formatGstBasis(activeQuickViewProduct.pricing.gstBasis) ? ` · ${formatGstBasis(activeQuickViewProduct.pricing.gstBasis)}` : ""}</p>
              <ul className="product-quickview__facts">
                <li><strong>Minimum order quantity:</strong> {productMinimumOrderLabel(activeQuickViewProduct.minQuantity)}</li>
                {activeQuickViewProduct.availabilityStatus === "OUT" ? <li><strong>Availability:</strong> Currently marked out of stock</li> : null}
                {activeQuickViewProduct.materials.length ? <li><strong>Material:</strong> {activeQuickViewProduct.materials.join(", ")}</li> : null}
                {activeQuickViewProduct.colours.length ? <li><strong>Colour:</strong> {activeQuickViewProduct.colours.join(", ")}</li> : null}
              </ul>
              {activeQuickViewProduct.description?.trim() && activeQuickViewProduct.description.trim().toLowerCase() !== activeQuickViewProduct.summary.trim().toLowerCase() ? <details className="product-quickview__disclosure" open><summary>About this product</summary><p>{activeQuickViewProduct.description}</p></details> : null}
              {activeQuickViewProduct.attributes.length ? <details className="product-quickview__disclosure" open><summary>Specifications</summary><dl>{activeQuickViewProduct.attributes.map((attribute) => <div key={`${attribute.label}-${attribute.value}`}><dt>{attribute.label}</dt><dd>{attribute.value}</dd></div>)}</dl></details> : null}
              {activeQuickViewProduct.customization ? <details className="product-quickview__disclosure"><summary>Branding options</summary><p>{activeQuickViewProduct.customization}</p></details> : null}
              <div className="product-quickview__actions">
                <ShortlistButton snapshot={quickSnapshot} />
                <FavouriteButton id={activeQuickViewProduct.id} name={activeQuickViewProduct.name} />
                <AddToBoxButton snapshot={quickBoxSnapshot} variant="detail" />
                <Link className="product-card__detail" href={`/studio?mode=customize&product=${encodeURIComponent(activeQuickViewProduct.slug)}&from=product`}>Customize in Studio</Link>
              </div>
              <p className="product-quickview__hint">Add it to your box and keep browsing. Your selection stays saved.</p>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}
