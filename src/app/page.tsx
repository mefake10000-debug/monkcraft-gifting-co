import Link from "next/link";
import { BrandLogoMarquee } from "@/components/BrandLogoMarquee";
import { Consultation } from "@/components/Consultation";
import { Faq } from "@/components/Faq";
import { GiftIdeas } from "@/components/GiftIdeas";
import { HeroLandingMedia } from "@/components/HeroLandingMedia";
import { HeroNav } from "@/components/HeroNav";
import { JourneyStrip } from "@/components/JourneyStrip";
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
    <main>
      <a className="skip-link" href="#what-we-do">
        Skip to content
      </a>

      <section className="hero" aria-label="Monkcraft homepage hero">
        <HeroLandingMedia />

        <HeroNav />

        <div className="hero__copy">
          <div className="hero__copy-inner">
            <h1 className="hero__title">Gifting, made joyful.</h1>
            <p className="hero__subtitle">
              Choose a gift, build a box, or create a company store.
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
        ariaLabel={`Browse all ${partnerBrands.length} catalogue brands`}
      />
      <WhatWeDo />
      <GiftIdeas />
      <JourneyStrip />
      <Consultation />
      <Faq />
      <SiteFooter />
    </main>
  );
}
