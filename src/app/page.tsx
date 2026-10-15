import Image from "next/image";
import Link from "next/link";
import { BrandLogoMarquee } from "@/components/BrandLogoMarquee";
import { Consultation } from "@/components/Consultation";
import { Faq } from "@/components/Faq";
import { GiftIdeas } from "@/components/GiftIdeas";
import { HeroNav } from "@/components/HeroNav";
import { JourneyStrip } from "@/components/JourneyStrip";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatWeDo } from "@/components/WhatWeDo";
import { getHomepagePartnerBrands } from "@/data/partnerBrands";

/**
 * Catalogue brand scroll (BrandLogoMarquee).
 *
 * Top brands by catalogue volume (`src/data/partnerBrands.ts`). No verified
 * partner logo files exist yet under `public/brands/` — until they do, the
 * strip shows real brand names in type only (no invented marks). Drop
 * `{slug}-logo.svg|png|webp` into `public/brands/` (see README there);
 * `public/brand/` is Monkcraft’s own marks only — do not reuse those here.
 */
const partnerBrands = getHomepagePartnerBrands();

export default function Home() {
  return (
    <main>
      <a className="skip-link" href="#what-we-do">
        Skip to content
      </a>

      <section className="hero" aria-label="Monkcraft homepage hero">
        <div className="hero__media">
          <Image
            className="hero__media-image"
            src="/hero/monkcraft-hero-v5.jpg"
            alt="Monkcraft curated corporate gifts with apparel, drinkware, and a gift box presentation"
            fill
            priority
            quality={92}
            sizes="100vw"
          />
        </div>

        <HeroNav />

        <div className="hero__copy">
          <div className="hero__copy-inner">
            <h1 className="hero__title">Gifting, made joyful.</h1>
            <p className="hero__subtitle">
              Curated corporate gifting for modern Indian teams.
            </p>
            <div className="hero__actions">
              <Link className="hero__btn hero__btn--primary" href="/gifts/find">
                Find My Gifts
              </Link>
              <Link className="hero__btn hero__btn--secondary" href="/gifts">
                Explore Gifts
              </Link>
            </div>
          </div>
        </div>
      </section>

      <BrandLogoMarquee brands={partnerBrands} />
      <WhatWeDo />
      <GiftIdeas />
      <JourneyStrip />
      <Consultation />
      <Faq />
      <SiteFooter />
    </main>
  );
}
