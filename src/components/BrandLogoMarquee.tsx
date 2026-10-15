import Image from "next/image";

export type BrandLogoItem = {
  name: string;
  src: string;
  href?: string;
};

export type BrandLogoMarqueeProps = {
  brands?: BrandLogoItem[];
  /** Accessible label for the logo strip when logos are present */
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
  const image = (
    <Image
      className="brand-marquee__image"
      src={brand.src}
      alt={interactive ? brand.name : ""}
      width={140}
      height={48}
      sizes="(max-width: 640px) 100px, 140px"
    />
  );

  if (interactive && brand.href) {
    return (
      <a
        className="brand-marquee__item"
        href={brand.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {image}
        <span className="brand-marquee__sr-only">{brand.name}</span>
      </a>
    );
  }

  return (
    <div className="brand-marquee__item">
      {image}
      {interactive ? (
        <span className="brand-marquee__sr-only">{brand.name}</span>
      ) : null}
    </div>
  );
}

/**
 * Horizontal brand-logo marquee.
 * Renders nothing when `brands` is empty — no heading, placeholders, or spacing.
 */
export function BrandLogoMarquee({
  brands = [],
  ariaLabel = "Brand partners",
  className,
}: BrandLogoMarqueeProps) {
  if (brands.length === 0) {
    return null;
  }

  const trackClassName = ["brand-marquee", className].filter(Boolean).join(" ");

  return (
    <section className={trackClassName} aria-label={ariaLabel}>
      <div className="brand-marquee__viewport">
        <div className="brand-marquee__track">
          <div className="brand-marquee__group">
            {brands.map((brand) => (
              <BrandLogoMark key={`a-${brand.name}-${brand.src}`} brand={brand} />
            ))}
          </div>
          {/* Duplicate for seamless loop; hidden from AT */}
          <div className="brand-marquee__group" aria-hidden="true">
            {brands.map((brand) => (
              <BrandLogoMark
                key={`b-${brand.name}-${brand.src}`}
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
