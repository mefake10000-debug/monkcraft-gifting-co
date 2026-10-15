import Image from "next/image";
import Link from "next/link";
import { giftCategories } from "@/data/giftCategories";

/**
 * Gift Ideas — PDF deck slides 6–11 as full poster frames.
 * Slide art already includes title + blurb; UI keeps CTAs only.
 */
export function GiftIdeas() {
  return (
    <section
      id="gift-ideas"
      className="gift-ideas"
      aria-labelledby="gift-ideas-heading"
    >
      <div className="gift-ideas__inner">
        <header className="gift-ideas__intro">
          <p className="gift-ideas__eyebrow">Gift ideas</p>
          <div className="gift-ideas__intro-row">
            <h2 id="gift-ideas-heading" className="gift-ideas__heading">
              Start with the moment.{" "}
              <span className="gift-ideas__heading-accent">
                We&apos;ll shape the gift.
              </span>
            </h2>
            <p className="gift-ideas__lede">
              Explore gifting directions for Indian teams. Browse the live
              catalogue by occasion, then gather picks in My Brief when you are
              ready to quote.
            </p>
          </div>
        </header>

        <ul className="gift-ideas__grid">
          {giftCategories.map((category) => {
            const enquireHref = `/?gift=${category.id}#enquire`;
            const catalogueHref =
              category.cataloguePath ?? `/gifts?occasion=${category.id}`;

            return (
              <li
                key={category.id}
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
                  <div className="gift-ideas__body gift-ideas__body--cta-only">
                    <h3 className="visually-hidden">{category.title}</h3>
                    <div className="gift-ideas__cta-row">
                      <Link className="gift-ideas__cta" href={catalogueHref}>
                        Browse catalogue
                      </Link>
                    </div>
                    <p className="gift-ideas__curate-hint">
                      Prefer a curated shortlist?{" "}
                      <Link href={enquireHref}>Talk to Monkcraft</Link>
                      {" · "}
                      <Link href="/gifts/brief">Open My Brief</Link>
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
