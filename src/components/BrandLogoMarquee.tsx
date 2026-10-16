import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

export type BrandLogoItem = {
  name: string;
  /** Verified logo mark under /public (e.g. /brands/{slug}-logo.svg). */
  src?: string;
  href?: string;
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
}: {
  brand: BrandLogoItem;
  /** Set false for the duplicated loop track (aria-hidden, non-focusable) */
  interactive?: boolean;
}) {
  const content = (
    <Image
      className="brand-marquee__image"
      src={brand.src!}
      alt={interactive && !brand.href ? brand.name : ""}
      width={140}
      height={48}
      sizes="(max-width: 640px) 64px, 80px"
    />
  );

  if (interactive && brand.href) {
    return (
      <Link
        className="brand-marquee__item"
        href={brand.href}
        aria-label={`Browse ${brand.name} gifts`}
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
  const trackStyle = {
    "--brand-marquee-duration": `${Math.max(42, logoBrands.length * 2.2)}s`,
  } as CSSProperties;
  const shouldLoop = logoBrands.length >= 8;

  return (
    <section className={trackClassName} aria-label={ariaLabel}>
      <div className="brand-marquee__viewport">
        <div className={`brand-marquee__track${shouldLoop ? "" : " brand-marquee__track--static"}`} style={trackStyle}>
          <div className="brand-marquee__group">
            {logoBrands.map((brand) => (
              <BrandLogoMark
                key={`a-${brand.name}-${brand.src ?? "name"}`}
                brand={brand}
              />
            ))}
          </div>
          {/* Duplicate for seamless loop; hidden from AT */}
          {shouldLoop && (
            <div className="brand-marquee__group" aria-hidden="true">
              {logoBrands.map((brand) => (
                <BrandLogoMark
                  key={`b-${brand.name}-${brand.src ?? "name"}`}
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
