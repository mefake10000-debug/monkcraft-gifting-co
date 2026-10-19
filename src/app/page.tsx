import Link from "next/link";
import { BrandLogoMarquee } from "@/components/BrandLogoMarquee";
import { Consultation } from "@/components/Consultation";
import { Faq } from "@/components/Faq";
import { GiftIdeas } from "@/components/GiftIdeas";
import { HeroLandingMedia } from "@/components/HeroLandingMedia";
import { HeroNav } from "@/components/HeroNav";
import { RotatingHeroHeadline } from "@/components/RotatingHeroHeadline";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatWeDo } from "@/components/WhatWeDo";
import { getHomepagePartnerBrands } from "@/data/partnerBrands";

/**
 * Catalogue brand scroll (BrandLogoMarquee).
 *
 * Catalogue brands with verified marks (`src/data/partnerBrands.ts`).
 */
const partnerBrands = getHomepagePartnerBrands();

export default function Home() {
  return (
    <main className="home-page">
      <a className="skip-link" href="#gift-ideas">
        Skip to gifting occasions
      </a>

      <section className="hero" aria-label="Monkcraft homepage hero">
        <HeroLandingMedia />

        <HeroNav />

        <div className="hero__copy">
          <div className="hero__copy-inner">
            <p className="hero__eyebrow">Monkcraft · Corporate gifting</p>
            <RotatingHeroHeadline />
            <p className="hero__subtitle">
              Pick a gift, build a box or make your own swag.
            </p>
            <div className="hero__actions">
              <Link className="hero__btn hero__btn--primary" href="/gifts">
                Browse gifts
              </Link>
              <Link className="hero__btn hero__btn--secondary" href="/gifts/box">
                Build a Box
              </Link>
            </div>
          </div>
        </div>

      </section>
      <BrandLogoMarquee
        brands={partnerBrands}
        ariaLabel={`Explore ${partnerBrands.length} catalogue brands`}
        className="brand-marquee--home"
      />
      <GiftIdeas />
      <WhatWeDo />
      <Consultation />
      <Faq />
      <SiteFooter />
    </main>
  );
}
