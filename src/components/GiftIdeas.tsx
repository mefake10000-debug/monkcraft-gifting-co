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
            Choose a gifting moment.
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
                                style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
                              />
                            ) : (
                              <span className="gift-ideas__media-placeholder">Image coming soon</span>
                            )}
                          </div>
                        </div>
                        <div className="what-we-do__poster-action">
                          <h4 className="visually-hidden">{category.title}</h4>
                          <div className="what-we-do__poster-links">
                            <Link
                              className="what-we-do__link"
                              href={catalogueHref}
                              aria-label={`View ${category.title} gifts`}
                            >
                              View gifts
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

        <Link className="gift-ideas__customize" href="/studio" aria-label="Start customising your company swag in Studio">
          <span>
            <span className="gift-ideas__eyebrow">Make it yours</span>
            <strong>Customise your company swag</strong>
          </span>
          <span className="gift-ideas__customize-action">Start customising <span aria-hidden="true">→</span></span>
        </Link>
      </div>
    </section>
  );
}
