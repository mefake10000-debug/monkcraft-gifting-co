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
import type { ProductImage } from "@/data/catalogue/types";

type ProductGalleryProps = {
  images: ProductImage[];
  productName: string;
};

const SWIPE_THRESHOLD_PX = 40;

export function ProductGallery({ images, productName }: ProductGalleryProps) {
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
        className={`product-detail__hero-image${isLoaded ? " product-detail__hero-image--loaded" : ""}`}
        tabIndex={multi ? 0 : undefined}
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
    </div>
  );
}
