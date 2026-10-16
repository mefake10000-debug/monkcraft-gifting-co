import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { BrandVideoBand } from "@/components/BrandVideoBand";

/**
 * What We Do — brand story and service choices in one connected section.
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
        <Reveal
          as="header"
          className="what-we-do__intro what-we-do__intro--solo"
        >
          <p className="what-we-do__eyebrow">What we do</p>
          <h2 id="what-we-do-heading" className="what-we-do__heading">
            Thoughtful gifts, made personal.
          </h2>
          <p className="what-we-do__lede">
            Choose the way you want to work with Monkcraft, from individual gifts
            and branded merchandise to complete kits and company stores.
          </p>
        </Reveal>
        <BrandVideoBand
          id="brand-film"
          title="See the story behind the gift"
          durationLabel="The Monkcraft brand film"
          src="/videos/monkcraft-what-we-do-mobile.mp4"
          desktopSrc="/videos/monkcraft-what-we-do-desktop.mp4"
          poster="/videos/monkcraft-what-we-do-mobile-poster.jpg"
          desktopPoster="/videos/monkcraft-what-we-do-desktop-poster.jpg"
          tone="lilac"
          ariaLabel="The Monkcraft story, from choosing a gift to making it personal"
        />
      </div>

      <div className="what-we-do__inner what-we-do__inner--posters">
        <ul className="what-we-do__posters">
          {services.map((service, index) => (
            <Reveal
              as="li"
              key={service.id}
              delayMs={index * 70}
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
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
