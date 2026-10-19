import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { BrandVideoBand } from "@/components/BrandVideoBand";
import { BOX_CATALOGUE_HREF } from "@/lib/nav";

/**
 * What We Do — brand story and service choices in one connected section.
 */
const services = [
  {
    id: "corporate-gifting",
    title: "For your people. From your brand.",
    tone: "lilac",
    images: [
      {
        src: "/marketing/what-we-do/corporate-gifting-v3.jpg",
        alt: "Corporate gifts — pen, notebook, and gift exchange illustration",
      },
    ],
    links: [
      { href: "/gifts", cta: "Explore the catalogue" },
      { href: BOX_CATALOGUE_HREF, cta: "Build a gift box" },
    ],
  },
  {
    id: "company-stores",
    title: "Your team’s own gift store",
    tone: "apricot",
    images: [
      {
        src: "/marketing/what-we-do/company-stores-v3.jpg",
        alt: "Company Store — branded storefront on a laptop with merchandise",
      },
    ],
    links: [{ href: "/company-stores", cta: "Explore Company Stores" }],
  },
  {
    id: "custom-merchandise",
    title: "Swag that feels like you",
    tone: "mint",
    images: [
      {
        src: "/marketing/what-we-do/custom-merchandise-v3.jpg",
        alt: "Custom merchandise studio illustration with a backpack, jacket and mug",
      },
    ],
    links: [{ href: "/studio?mode=swag", cta: "Build your company swag" }],
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
          <p className="what-we-do__eyebrow">Our services</p>
          <h2 id="what-we-do-heading" className="what-we-do__heading">
            Gifts, made more you.
          </h2>
          <p className="what-we-do__lede">
            Gifts, swag and team stores. All with your kind of energy.
          </p>
        </Reveal>
        <BrandVideoBand
          id="brand-film"
          title="The Monkcraft approach"
          durationLabel="Our story · 1 min"
          src="/videos/monkcraft-what-we-do-mobile.mp4"
          desktopSrc="/videos/monkcraft-what-we-do-desktop.mp4"
          poster="/videos/monkcraft-what-we-do-mobile-poster.jpg"
          desktopPoster="/videos/monkcraft-what-we-do-desktop-hook.jpg"
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
              <div className={`what-we-do__poster-frame${service.images.length > 1 ? " what-we-do__poster-frame--pair" : ""}${service.id === "custom-merchandise" ? " what-we-do__poster-frame--merch" : ""}`}>
                {service.images.map((image) => (
                  <div className="what-we-do__poster-image" key={image.src}>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={1920}
                      height={1071}
                      sizes="(max-width: 719px) 100vw, (max-width: 1099px) 50vw, 560px"
                      style={{ width: "100%", height: "100%", objectFit: service.id === "custom-merchandise" ? "cover" : "contain", objectPosition: "center bottom" }}
                    />
                  </div>
                ))}
              </div>
              <div className="what-we-do__poster-action">
                <h3 className="what-we-do__poster-title">{service.title}</h3>
                <div className="what-we-do__poster-links">
                  {service.links.map((link) => (
                    <Link className="what-we-do__link" href={link.href} key={link.href}>
                      {link.cta}
                      <span className="visually-hidden"> — {service.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
