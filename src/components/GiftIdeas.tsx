import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { giftCategories } from "@/data/giftCategories";

const occasionCategories = giftCategories.filter(
  (category) => category.id !== "custom-merchandise",
);

const occasionGroups = [
  {
    id: "team",
    title: "For your team",
  },
  {
    id: "clients-events",
    title: "For clients & events",
  },
] as const;

/** Let buyers choose a gifting moment or browse by product type. */
export function GiftIdeas() {
  return (
    <section
      id="gift-ideas"
      className="gift-ideas"
      aria-labelledby="gift-ideas-heading"
    >
      <div className="gift-ideas__inner">
        <Reveal as="header" className="gift-ideas__intro">
          <p className="gift-ideas__eyebrow">Shop by occasion</p>
          <h2 id="gift-ideas-heading" className="gift-ideas__heading">
            Big moment? Good gifts.
          </h2>
        </Reveal>

        <div className="gift-ideas__groups">
          {occasionGroups.map((group) => {
            const categories = occasionCategories.filter(
              (category) => category.group === group.id,
            );

            return (
              <section
                className={`gift-ideas__group gift-ideas__group--${group.id}`}
                key={group.id}
                aria-labelledby={`gift-ideas-group-${group.id}`}
              >
                <h3
                  className="gift-ideas__group-title"
                  id={`gift-ideas-group-${group.id}`}
                >
                  {group.title}
                </h3>
                <ul className="gift-ideas__grid">
                  {categories.map((category, index) => {
                    const catalogueHref =
                      category.cataloguePath ?? `/gifts?occasion=${category.id}`;

                    return (
                      <Reveal
                        as="li"
                        key={category.id}
                        delayMs={index * 70}
                        className={`what-we-do__poster gift-ideas__card gift-ideas__card--${category.tone}`}
                      >
                        <div className="what-we-do__poster-frame">
                          <div className="what-we-do__poster-image">
                            {category.image ? (
                              <Image
                                src={category.image.src}
                                alt={category.image.alt}
                                width={1920}
                                height={1071}
                                sizes="(max-width: 719px) 100vw, (max-width: 1099px) 50vw, 560px"
                                className="gift-ideas__image"
                                style={{ width: "100%", height: "100%" }}
                              />
                            ) : (
                              <span className="gift-ideas__media-placeholder">Image coming soon</span>
                            )}
                          </div>
                        </div>
                        <div className="what-we-do__poster-action">
                          <h4 className="gift-ideas__card-title">{category.title}</h4>
                          <div className="what-we-do__poster-links">
                            <Link
                              className="what-we-do__link"
                              href={catalogueHref}
                              aria-label={`View ${category.title} gifts`}
                            >
                              Find gifts
                            </Link>
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        <Link className="gift-ideas__customize" href="/studio?mode=swag" aria-label="Build your company swag">
          <span className="gift-ideas__customize-image" aria-hidden="true">
            <Image src="/marketing/what-we-do/custom-merchandise-v3.jpg" alt="" fill sizes="(max-width: 720px) 100vw, 360px" />
          </span>
          <span className="gift-ideas__customize-copy">
            <span className="gift-ideas__eyebrow">Make it yours</span>
            <strong>Build your company swag</strong>
            <span className="gift-ideas__customize-action">Create your lineup <span aria-hidden="true">→</span></span>
          </span>
        </Link>
      </div>
    </section>
  );
}
