import Image from "next/image";

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
      alt={interactive ? brand.name : ""}
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
      <a
        className="brand-marquee__item"
        href={brand.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
        {brand.src ? (
          <span className="brand-marquee__sr-only">{brand.name}</span>
        ) : null}
      </a>
    );
  }

  return (
    <div className="brand-marquee__item">
      {content}
      {interactive && brand.src ? (
        <span className="brand-marquee__sr-only">{brand.name}</span>
      ) : null}
    </div>
  );
}

/**
 * Horizontal brand marquee (homepage catalogue-brand scroll).
 *
 * Renders nothing when `brands` is empty.
 * Items with `src` show verified logos; items without `src` show the real
 * brand name in type only (no fake logo shapes). Drop files in
 * `public/brands/` — see README there and `src/data/partnerBrands.ts`.
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

  return (
    <section className={trackClassName} aria-label={ariaLabel}>
      <div className="brand-marquee__viewport">
        <div className="brand-marquee__track">
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
