import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { giftCategories } from "@/data/giftCategories";

/**
 * Help teams start from a real gifting occasion, then browse relevant products.
 */
export function GiftIdeas() {
  return (
    <section
      id="gift-ideas"
      className="gift-ideas"
      aria-labelledby="gift-ideas-heading"
    >
      <div className="gift-ideas__inner">
        <Reveal as="header" className="gift-ideas__intro">
          <p className="gift-ideas__eyebrow">Gift ideas</p>
          <div className="gift-ideas__intro-row">
            <h2 id="gift-ideas-heading" className="gift-ideas__heading">
              Start with the moment.{" "}
              <span className="gift-ideas__heading-accent">
                We&apos;ll shape the gift.
              </span>
            </h2>
            <p className="gift-ideas__lede">
              Choose onboarding, Diwali, recognition, events, client appreciation
              or custom merchandise to see relevant products for your team in
              India. Add your favourites to your cart when you are ready.
            </p>
          </div>
        </Reveal>

        <ul className="gift-ideas__grid">
          {giftCategories.map((category, index) => {
            const catalogueHref =
              category.cataloguePath ?? `/gifts?occasion=${category.id}`;

            return (
              <Reveal
                as="li"
                key={category.id}
                delayMs={(index % 3) * 80}
                className={`gift-ideas__card gift-ideas__card--${category.tone}`}
              >
                <div className="gift-ideas__card-link">
                  <Link
                    className="gift-ideas__media-link"
                    href={catalogueHref}
                    aria-label={`Browse ${category.title} in catalogue`}
                  >
                    <div
                      className={`gift-ideas__media${
                        category.image ? "" : " gift-ideas__media--empty"
                      }`}
                    >
                      {category.image ? (
                        <Image
                          className="gift-ideas__image"
                          src={category.image.src}
                          alt={category.image.alt}
                          fill
                          sizes="(max-width: 719px) 100vw, (max-width: 1099px) 50vw, 33vw"
                          style={{
                            objectFit: "contain",
                            objectPosition: "center",
                          }}
                        />
                      ) : (
                        <span className="gift-ideas__media-placeholder">
                          Image coming soon
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="gift-ideas__body">
                    <h3 className="gift-ideas__title">{category.title}</h3>
                    <p className="gift-ideas__blurb">{category.blurb}</p>
                    <div className="gift-ideas__cta-row">
                      <Link className="gift-ideas__cta" href={catalogueHref}>
                        Explore gifts
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
