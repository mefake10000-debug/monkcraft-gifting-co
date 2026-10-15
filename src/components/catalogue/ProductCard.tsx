import Image from "next/image";
import Link from "next/link";
import type { BoxProductSnapshot } from "@/data/catalogue/boxTypes";
import type { Product } from "@/data/catalogue/types";
import { AddToBoxButton } from "@/components/box/AddToBoxButton";
import { formatPricing } from "@/lib/pricing";
import { CompareButton } from "./CompareButton";
import { ShortlistButton } from "./ShortlistButton";

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

export function productToSnapshot(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    imageSrc: product.images[0]?.src,
    priceLabel: formatPricing(product.pricing),
    minQuantity: product.minQuantity,
    categoryName: product.filterCategoryName || product.categoryName,
  };
}

export function productToBoxSnapshot(product: Product): BoxProductSnapshot {
  return {
    ...productToSnapshot(product),
    amountInr:
      product.pricing.kind === "fixed" ? product.pricing.amountInr : undefined,
  };
}

export function ProductCard({ product, shortlisted = false }: ProductCardProps) {
  const image = product.images[0];
  const snapshot = productToSnapshot(product);
  const boxSnapshot = productToBoxSnapshot(product);
  const price =
    product.pricing.kind === "fixed"
      ? formatPricing(product.pricing)
      : null;
  const roomy = needsRoomyFrame(product);
  const typeLabel = product.filterCategoryName || product.categoryName;

  return (
    <article
      className={
        roomy ? "product-card product-card--roomy-frame" : "product-card"
      }
    >
      <div className="product-card__media">
        {image ? (
          <Link
            href={`/gifts/${product.slug}`}
            className="product-card__media-link"
            tabIndex={-1}
            aria-hidden
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="(max-width: 639px) 92vw, (max-width: 1279px) 42vw, 28vw"
              className="product-card__image"
              style={{ objectFit: "contain", objectPosition: "center" }}
            />
          </Link>
        ) : (
          <div className="product-card__media-empty" aria-hidden="true">
            No image
          </div>
        )}
        <ShortlistButton
          snapshot={snapshot}
          initiallyShortlisted={shortlisted}
          className="product-card__shortlist"
        />
        <CompareButton
          compact
          snapshot={snapshot}
          className="product-card__compare"
        />
      </div>

      <div className="product-card__body">
        {typeLabel ? <p className="product-card__type">{typeLabel}</p> : null}
        <h3 className="product-card__title">
          <Link href={`/gifts/${product.slug}`}>{product.name}</Link>
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
          <Link className="product-card__detail" href={`/gifts/${product.slug}`}>
            View
          </Link>
          <AddToBoxButton snapshot={boxSnapshot} variant="card" />
        </div>
      </div>
    </article>
  );
}
