import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { buildBrandMarqueeSequence } from "@/lib/brandMarqueeSequence";

export type BrandLogoItem = {
  name: string;
  /** Verified logo mark under /public (e.g. /brands/{slug}-logo.svg). */
  src?: string;
  href?: string;
  source?: "hustlemad";
  /** Source artwork is white-only and needs a black treatment on light backgrounds. */
  darkOnLight?: boolean;
};

export type BrandLogoMarqueeProps = {
  brands?: BrandLogoItem[];
  /** Accessible label for the strip when brands are present */
  ariaLabel?: string;
  className?: string;
};

function BrandLogoMark({
  brand,
  interactive = true,
  decorative = false,
}: {
  brand: BrandLogoItem;
  /** Set false for the duplicated loop track (aria-hidden, non-focusable) */
  interactive?: boolean;
  /** Extra Monkcraft mark in the visual loop, hidden from assistive technology. */
  decorative?: boolean;
}) {
  const content = (
    <Image
      className={`brand-marquee__image${brand.darkOnLight ? " brand-marquee__image--dark-on-light" : ""}`}
      src={brand.src!}
      alt={interactive && !brand.href ? brand.name : ""}
      width={480}
      height={144}
      sizes="(max-width: 640px) 128px, 160px"
      quality={100}
      unoptimized={brand.src?.toLowerCase().endsWith(".svg")}
    />
  );

  if (decorative) {
    return (
      <span className="brand-marquee__item" aria-hidden="true">
        {content}
      </span>
    );
  }

  if (brand.href) {
    return (
      <Link
        className="brand-marquee__item"
        href={brand.href}
        aria-label={`Browse ${brand.name} gifts`}
        tabIndex={interactive ? undefined : -1}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="brand-marquee__item">
      {content}
    </div>
  );
}

/**
 * Horizontal brand marquee (homepage catalogue-brand scroll).
 *
 * Renders only supplied logo marks; each one links to catalogue search.
 */
export function BrandLogoMarquee({
  brands = [],
  ariaLabel = "Brands in our catalogue",
  className,
}: BrandLogoMarqueeProps) {
  // A logo-only row should never substitute a text wordmark for a missing mark.
  const logoBrands = brands.filter((brand) => Boolean(brand.src));
  if (logoBrands.length === 0) {
    return null;
  }

  const trackClassName = [
    "brand-marquee",
    "brand-marquee--logos",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const trackBrands = buildBrandMarqueeSequence(logoBrands);
  const trackStyle = {
    "--brand-marquee-duration": `${Math.max(42, trackBrands.length * 2.2)}s`,
  } as CSSProperties;
  const shouldLoop = logoBrands.length >= 8;

  return (
    <section className={trackClassName} aria-label={ariaLabel}>
      <div className="brand-marquee__viewport">
        <div className={`brand-marquee__track${shouldLoop ? "" : " brand-marquee__track--static"}`} style={trackStyle}>
          <div className="brand-marquee__group">
            {trackBrands.map(({ brand, decorative }, index) => (
              <BrandLogoMark
                key={`a-${index}-${brand.name}-${brand.src ?? "name"}`}
                brand={brand}
                decorative={decorative}
              />
            ))}
          </div>
          {/* Duplicate for seamless loop; hidden from AT */}
          {shouldLoop && (
            <div className="brand-marquee__group" aria-hidden="true">
              {trackBrands.map(({ brand }, index) => (
                <BrandLogoMark
                  key={`b-${index}-${brand.name}-${brand.src ?? "name"}`}
                  brand={brand}
                  interactive={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
