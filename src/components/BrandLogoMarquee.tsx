import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

export type BrandLogoItem = {
  name: string;
  /**
   * Verified logo under /public (e.g. /brands/{slug}-logo.svg).
   * Omit for typography-only interim — never invent or fake a mark.
   */
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
  const content = brand.src ? (
    <Image
      className="brand-marquee__image"
      src={brand.src}
      alt={interactive && !brand.href ? brand.name : ""}
      width={140}
      height={48}
      sizes="(max-width: 640px) 100px, 140px"
    />
  ) : (
    <span className="brand-marquee__name" aria-hidden={!interactive}>
      {brand.name}
    </span>
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
  if (brands.length === 0) {
    return null;
  }

  const hasAnyLogo = brands.some((brand) => Boolean(brand.src));
  const trackClassName = [
    "brand-marquee",
    hasAnyLogo ? "brand-marquee--logos" : "brand-marquee--names",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const trackStyle = {
    "--brand-marquee-duration": `${Math.max(64, brands.length * 1.5)}s`,
  } as CSSProperties;

  return (
    <section className={trackClassName} aria-label={ariaLabel}>
      <div className="brand-marquee__viewport">
        <div className="brand-marquee__track" style={trackStyle}>
          <div className="brand-marquee__group">
            {brands.map((brand) => (
              <BrandLogoMark
                key={`a-${brand.name}-${brand.src ?? "name"}`}
                brand={brand}
              />
            ))}
          </div>
          {/* Duplicate for seamless loop; hidden from AT */}
          <div className="brand-marquee__group" aria-hidden="true">
            {brands.map((brand) => (
              <BrandLogoMark
                key={`b-${brand.name}-${brand.src ?? "name"}`}
                brand={brand}
                interactive={false}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
