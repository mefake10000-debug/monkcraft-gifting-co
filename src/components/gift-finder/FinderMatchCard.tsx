"use client";

import Image from "next/image";
import Link from "next/link";
import { AddToBoxButton } from "@/components/box/AddToBoxButton";
import { ShortlistButton } from "@/components/catalogue/ShortlistButton";
import { formatPricing } from "@/lib/pricing";
import type { GiftFinderMatch } from "@/lib/giftFinder/types";

type FinderMatchCardProps = {
  match: GiftFinderMatch;
  shortlisted?: boolean;
};

export function FinderMatchCard({
  match,
  shortlisted = false,
}: FinderMatchCardProps) {
  const { product, reasons, notes, tier } = match;
  const priceLabel = formatPricing(product.pricing);
  const snapshot = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    imageSrc: product.imageSrc,
    priceLabel,
    minQuantity: product.minQuantity,
    categoryName: product.categoryName,
  };
  const boxSnapshot = {
    ...snapshot,
    amountInr:
      product.pricing.kind === "fixed" ? product.pricing.amountInr : undefined,
  };

  return (
    <article
      className={`finder-match${tier === "alternative" ? " finder-match--alt" : ""}`}
    >
      <div className="finder-match__media">
        {product.imageSrc ? (
          <Link
            href={`/gifts/${product.slug}`}
            className="finder-match__media-link"
            tabIndex={-1}
            aria-hidden
          >
            <Image
              src={product.imageSrc}
              alt=""
              fill
              sizes="(max-width: 639px) 40vw, 160px"
              className="finder-match__image"
              style={{ objectFit: "contain", objectPosition: "center" }}
            />
          </Link>
        ) : (
          <div className="finder-match__media-empty" aria-hidden="true">
            No image
          </div>
        )}
        <ShortlistButton
          snapshot={snapshot}
          initiallyShortlisted={shortlisted}
          className="finder-match__shortlist"
        />
      </div>

      <div className="finder-match__body">
        {tier === "alternative" ? (
          <p className="finder-match__tier">Alternative</p>
        ) : null}
        {product.categoryName ? (
          <p className="finder-match__type">{product.categoryName}</p>
        ) : null}
        <h3 className="finder-match__title">
          <Link href={`/gifts/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="finder-match__price">{priceLabel}</p>

        <ul className="finder-match__reasons">
          {reasons.slice(0, 3).map((reason) => (
            <li key={`${product.id}-${reason.code}-${reason.label}`}>
              {reason.label}
            </li>
          ))}
        </ul>

        {notes.length > 0 ? (
          <ul className="finder-match__notes">
            {notes.slice(0, 2).map((note) => (
              <li key={`${product.id}-${note}`}>{note}</li>
            ))}
          </ul>
        ) : null}

        <div className="finder-match__actions">
          <Link className="journey-btn journey-btn--ghost" href={`/gifts/${product.slug}`}>
            Details
          </Link>
          <AddToBoxButton snapshot={boxSnapshot} variant="card" />
        </div>
      </div>
    </article>
  );
}
