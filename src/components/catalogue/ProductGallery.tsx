"use client";

import Image from "next/image";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type TouchEvent,
} from "react";
import type { Product, ProductImage } from "@/data/catalogue/types";
import { colourSwatchStyle } from "@/data/catalogue/colourSwatches";

type ProductGalleryProps = {
  images: ProductImage[];
  productName: string;
  selectedVariantId?: string;
  colourVariants?: Product[];
  designVariants?: Product[];
  designVariantLabel?: string;
  onSelectVariant?: (variant: Product) => void;
};

const SWIPE_THRESHOLD_PX = 40;

export function ProductColourOptions({ variants, selectedVariantId, onSelectVariant, compact = false }: { variants: Product[]; selectedVariantId?: string; onSelectVariant?: (variant: Product) => void; compact?: boolean }) {
  if (variants.length < 2 || !onSelectVariant) return null;
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const selectedLabel = selectedVariant?.colourOptionLabel ?? selectedVariant?.colours[0];
  return <section className={`product-gallery__colour-options${compact ? " product-gallery__colour-options--compact" : ""}`} aria-label="Colour options">
    <p>{variants.length} colours{selectedLabel ? ` · Selected: ${selectedLabel}` : ""}</p>
    <ul>{variants.map((variant) => {
      const selected = variant.id === selectedVariantId;
      const unavailable = variant.availabilityStatus === "OUT";
      const label = variant.colourOptionLabel ?? variant.colours[0];
      return <li key={variant.id}>
        <button type="button" className={`product-gallery__colour-option${selected ? " product-gallery__colour-option--active" : ""}${unavailable ? " product-gallery__colour-option--unavailable" : ""}`} aria-label={`Select ${label}${unavailable ? ", out of stock" : ""}`} aria-pressed={selected} title={label} onClick={() => onSelectVariant(variant)}>
          <span className="product-gallery__colour-swatch" style={colourSwatchStyle(variant.colours[0])} aria-hidden="true" />
          <span className="product-gallery__colour-label">{label}{unavailable ? " · Out of stock" : ""}</span>
        </button>
      </li>;
    })}</ul>
  </section>;
}

export function ProductDesignOptions({ variants, selectedVariantId, onSelectVariant, variantLabel = "design" }: { variants: Product[]; selectedVariantId?: string; onSelectVariant?: (variant: Product) => void; variantLabel?: string }) {
  if (variants.length < 2 || !onSelectVariant) return null;
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const label = variantLabel === "design" ? "designs" : `${variantLabel} options`;
  return <section className="product-gallery__design-options" aria-label={label}>
    <p aria-live="polite">{variants.length} {label}{selectedVariant?.designOptionLabel ? ` · Selected: ${selectedVariant.designOptionLabel}` : ""}</p>
    <ul>{variants.map((variant) => {
      const selected = variant.id === selectedVariantId;
      const image = variant.images[0];
      const label = variant.designOptionLabel || variant.name;
      return <li key={variant.id}>
        <button type="button" className={`product-gallery__design-option${selected ? " product-gallery__design-option--active" : ""}`} aria-label={`Select ${label}`} aria-pressed={selected} title={label} onClick={() => onSelectVariant(variant)}>
          <span className="product-gallery__design-thumb">
            {image ? <Image src={image.src} alt="" fill sizes="64px" style={{ objectFit: "contain" }} /> : null}
          </span>
          <span className="product-gallery__design-label">{label}</span>
        </button>
      </li>;
    })}</ul>
  </section>;
}

export function ProductGallery({ images, productName, selectedVariantId, colourVariants = [], designVariants = [], designVariantLabel, onSelectVariant }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const labelId = useId();
  const safeIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));
  const active = images[safeIndex];
  const multi = images.length > 1;
  // When the active src changes, this becomes false until onLoad fires
  const isLoaded = Boolean(active && loadedSrc === active.src);

  const goTo = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      const next = ((index % images.length) + images.length) % images.length;
      setActiveIndex(next);
    },
    [images.length],
  );

  const goPrev = useCallback(() => goTo(safeIndex - 1), [goTo, safeIndex]);
  const goNext = useCallback(() => goTo(safeIndex + 1), [goTo, safeIndex]);

  function onGalleryKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!multi) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(images.length - 1);
    }
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (!multi) return;
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (!multi || touchStartX.current == null) return;
    const endX = event.changedTouches[0]?.clientX;
    const startX = touchStartX.current;
    touchStartX.current = null;
    if (endX == null) return;
    const dx = endX - startX;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (dx > 0) goPrev();
    else goNext();
  }

  if (!active) {
    return (
      <div className="product-detail__gallery">
        <div
          className="product-detail__hero-image product-detail__hero-image--empty"
          role="img"
          aria-label={`No image available for ${productName}`}
        >
          <span>No image</span>
        </div>
        <ProductColourOptions variants={colourVariants} selectedVariantId={selectedVariantId} onSelectVariant={onSelectVariant} />
        <ProductDesignOptions variants={designVariants} selectedVariantId={selectedVariantId} onSelectVariant={onSelectVariant} variantLabel={designVariantLabel} />
      </div>
    );
  }

  const statusText = multi
    ? `Image ${safeIndex + 1} of ${images.length}`
    : "Product image";

  return (
    <div
      className="product-detail__gallery"
      role="region"
      aria-roledescription="gallery"
      aria-labelledby={labelId}
    >
      <p id={labelId} className="product-detail__gallery-status">
        <span className="visually-hidden">{productName}. </span>
        {statusText}
      </p>

      <div
        role="group"
        tabIndex={multi ? 0 : undefined}
        className={`product-detail__hero-image${isLoaded ? " product-detail__hero-image--loaded" : ""}`}
        onKeyDown={onGalleryKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        aria-label={
          multi
            ? `${productName} gallery. Use left and right arrow keys to change images.`
            : undefined
        }
      >
        <div className="product-detail__hero-frame">
          <Image
            key={active.src}
            src={active.src}
            alt={active.alt || productName}
            fill
            priority={safeIndex === 0}
            sizes="(max-width: 900px) 100vw, 50vw"
            className="product-detail__hero-img"
            style={{ objectFit: "contain", objectPosition: "center" }}
            onLoad={() => setLoadedSrc(active.src)}
          />
        </div>
        {!isLoaded ? (
          <span className="product-detail__hero-loading" aria-hidden="true" />
        ) : null}
      </div>

      {multi ? (
        <ul className="product-detail__thumbs" aria-label="Product images">
          {images.map((image, index) => {
            const selected = index === safeIndex;
            return (
              <li key={`${image.src}-${index}`}>
                <button
                  type="button"
                  className={`product-detail__thumb${selected ? " product-detail__thumb--active" : ""}`}
                  aria-label={`View image ${index + 1} of ${images.length}`}
                  aria-current={selected ? "true" : undefined}
                  onClick={() => goTo(index)}
                >
                  <Image
                    src={image.src}
                    alt=""
                    fill
                    sizes="96px"
                    className="product-detail__thumb-img"
                    style={{ objectFit: "contain", objectPosition: "center" }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <ProductColourOptions variants={colourVariants} selectedVariantId={selectedVariantId} onSelectVariant={onSelectVariant} />
      <ProductDesignOptions variants={designVariants} selectedVariantId={selectedVariantId} onSelectVariant={onSelectVariant} variantLabel={designVariantLabel} />
    </div>
  );
}
