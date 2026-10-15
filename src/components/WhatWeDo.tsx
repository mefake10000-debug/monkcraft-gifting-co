import Image from "next/image";
import Link from "next/link";

/**
 * What We Do — PDF deck slides 2–5 (full poster frames).
 * Slide art already includes title + body copy, so UI only adds CTAs.
 * Homepage hero must never be reused here.
 */
const services = [
  {
    id: "corporate-gifting",
    title: "Corporate Gifting",
    tone: "lilac",
    image: {
      src: "/marketing/what-we-do/corporate-gifting-v3.jpg",
      alt: "Corporate Gifting — premium pen, notebook, and gift exchange illustration",
    },
    href: "/gifts",
    cta: "Explore the catalogue",
  },
  {
    id: "custom-merchandise",
    title: "Custom-Branded Merchandise",
    tone: "mint",
    image: {
      src: "/marketing/what-we-do/custom-merchandise-v3.jpg",
      alt: "Custom-Branded Merchandise — hoodie, bottle, power bank, and tote",
    },
    href: "/studio",
    cta: "Open Studio",
  },
  {
    id: "kits-fulfilment",
    title: "Kits & Fulfilment",
    tone: "blue",
    image: {
      src: "/marketing/what-we-do/kits-fulfilment-v3.jpg",
      alt: "Kits & Fulfilment — gift kit packaging and multi-city delivery",
    },
    href: "/gifts/box",
    cta: "Build a gift box",
  },
  {
    id: "company-stores",
    title: "Company Stores",
    tone: "apricot",
    image: {
      src: "/marketing/what-we-do/company-stores-v3.jpg",
      alt: "Company Stores — branded storefront on a laptop with merchandise",
    },
    href: "/company-stores",
    cta: "Explore Company Stores",
  },
] as const;

export function WhatWeDo() {
  return (
    <section
      id="what-we-do"
      className="what-we-do"
      aria-labelledby="what-we-do-heading"
    >
      <div className="what-we-do__inner">
        <div className="what-we-do__lead">
          <header className="what-we-do__intro">
            <p className="what-we-do__eyebrow">What we do</p>
            <h2 id="what-we-do-heading" className="what-we-do__heading">
              Big ideas.{" "}
              <span className="what-we-do__heading-accent">Thoughtful gifts.</span>
            </h2>
            <p className="what-we-do__lede">
              From everyday appreciation to unforgettable milestones, we make
              corporate gifting feel personal, creative, and effortless.
            </p>
          </header>

          <figure className="what-we-do__video">
            <div className="what-we-do__video-frame">
              <video
                controls
                playsInline
                preload="metadata"
                poster="/videos/monkcraft-what-we-do-brand-film-poster.jpg"
                aria-label="Monkcraft What we do brand film"
              >
                <source
                  src="/videos/monkcraft-what-we-do-brand-film.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
            <figcaption className="what-we-do__video-caption">
              A short look at corporate gifting, merch, kits, and company stores.
            </figcaption>
          </figure>
        </div>

        <ul className="what-we-do__posters">
          {services.map((service) => (
            <li
              key={service.id}
              id={service.id === "company-stores" ? "company-stores" : undefined}
              className={`what-we-do__poster what-we-do__poster--${service.tone}`}
            >
              <div className="what-we-do__poster-frame">
                <Image
                  src={service.image.src}
                  alt={service.image.alt}
                  fill
                  sizes="(max-width: 719px) 100vw, (max-width: 1099px) 50vw, 560px"
                  style={{ objectFit: "contain", objectPosition: "center" }}
                />
              </div>
              <div className="what-we-do__poster-action">
                <Link className="what-we-do__link" href={service.href}>
                  {service.cta}
                  <span className="visually-hidden"> — {service.title}</span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
