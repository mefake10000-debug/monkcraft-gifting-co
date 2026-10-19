import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BrandVideoBand } from "@/components/BrandVideoBand";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StoreAdminShell } from "@/components/company-store/StoreAdminShell";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

/** Original Company Store explainer artwork, kept visible on the landing page. */
const overviewImages = [
  {
    id: "merchandise",
    title: "Selected gifts",
    src: "/marketing/company-stores/cs-merchandise-selection-v3.jpg",
    alt: "A company store collection of selected gifts",
  },
  {
    id: "access",
    title: "Team access",
    src: "/marketing/company-stores/cs-employee-access-v3.jpg",
    alt: "Employees access a private company storefront",
  },
  {
    id: "ordering",
    title: "Ordering & delivery",
    src: "/marketing/company-stores/cs-ordering-fulfilment-v3.jpg",
    alt: "An employee gift request moves to delivery",
  },
  {
    id: "branding",
    title: "Company branding",
    src: "/marketing/company-stores/cs-store-branding-v3.jpg",
    alt: "A company store styled with its logo, colours and welcome message",
  },
] as const;

export default function CompanyStoresLandingPage() {
  return (
    <div className="cs-page">
      <SiteHeader />
      <main className="cs-landing cs-company-landing">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Company Stores" },
          ]}
        />
        <header className="cs-company-landing__hero">
          <div className="cs-company-landing__copy">
            <h1 className="cs-landing__title">Your team. Your company store.</h1>
            <p className="cs-landing__lede">
              Pick the gifts. Set the credits. Let your people choose. Explore how it works in the demo below.
            </p>
            <div className="cs-landing__actions cs-company-landing__actions">
              <Link className="cs-btn cs-btn--primary" href="#company-demo">Open company demo</Link>
              <Link className="cs-btn cs-btn--secondary" href="/?interest=company-store#enquire">Discuss a programme</Link>
            </div>
          </div>
        </header>
        <section id="company-demo" className="cs-company-landing__demo" aria-label="Company Store manager demo">
          <Suspense
            fallback={
              <div className="cs-admin-embedded cs-admin">
                <p className="mc-loading">
                  <span className="mc-loading__dot" aria-hidden="true" />
                  Loading company demo…
                </p>
              </div>
            }
          >
            <StoreAdminShell embedded />
          </Suspense>
        </section>

        <section className="cs-company-overview cs-company-landing__showcase" aria-labelledby="cs-company-overview-heading">
          <h2 id="cs-company-overview-heading" className="cs-section__title">Your brand. Their kind of gifts.</h2>
          <BrandVideoBand
            id="company-store-brief"
            title="See the Company Store experience"
            durationLabel="The Company Store brief · 57 sec"
            src="/videos/monkcraft-company-store-brief-mobile.mp4"
            desktopSrc="/videos/monkcraft-company-store-brief-desktop.mp4"
            poster="/videos/monkcraft-company-store-brief-mobile-poster.jpg"
            desktopPoster="/videos/monkcraft-company-store-brief-desktop-hook.jpg"
            tone="apricot"
            ariaLabel="How a Monkcraft Company Store works"
          />
          <div className="cs-grid cs-grid--2 cs-how-posters">
            {overviewImages.map((image) => (
              <article key={image.id} className="cs-tile cs-tile--poster">
                <div className="cs-tile__media cs-tile__media--poster">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 720px) 100vw, 28rem"
                    style={{ objectFit: "contain", objectPosition: "center" }}
                  />
                </div>
                <div className="cs-how-poster__footer">
                  <h2 className="cs-how-poster__title">{image.title}</h2>
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
