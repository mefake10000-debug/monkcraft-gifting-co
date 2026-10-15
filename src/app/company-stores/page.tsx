import Image from "next/image";
import Link from "next/link";
import { BrandVideoBand } from "@/components/BrandVideoBand";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

/** How-it-works slides from PDF — title/copy live in the artwork */
const howSteps = [
  {
    id: "merchandise",
    title: "1. Merchandise selection",
    tone: "lilac",
    image: {
      src: "/marketing/company-stores/cs-merchandise-selection-v3.jpg",
      alt: "1. Merchandise selection — curated products for a company store",
    },
  },
  {
    id: "access",
    title: "2. Employee access",
    tone: "mint",
    image: {
      src: "/marketing/company-stores/cs-employee-access-v3.jpg",
      alt: "2. Employee access — private company storefront invite",
    },
  },
  {
    id: "ordering",
    title: "3. Ordering & fulfilment",
    tone: "blue",
    image: {
      src: "/marketing/company-stores/cs-ordering-fulfilment-v3.jpg",
      alt: "3. Ordering & fulfilment — from storefront selection to delivery",
    },
  },
  {
    id: "branding",
    title: "4. Store branding",
    tone: "apricot",
    image: {
      src: "/marketing/company-stores/cs-store-branding-v3.jpg",
      alt: "4. Store branding — logo, colours, and welcome message",
    },
  },
] as const;

export default function CompanyStoresLandingPage() {
  return (
    <div className="cs-page">
      <SiteHeader />
      <main className="cs-landing">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Company Stores" },
          ]}
        />
        <header className="cs-landing__hero">
          <div>
            <p className="cs-landing__eyebrow">Company Stores</p>
            <h1 className="cs-landing__title">
              Branded merchandise stores for your company.
            </h1>
            <p className="cs-landing__lede">
              A private store for approved company merchandise — so your team
              can choose what they want without another public catalogue.
            </p>
            <div className="cs-landing__actions">
              <Link
                className="cs-btn cs-btn--primary"
                href="/?interest=company-store#enquire"
              >
                Request a Company Store
              </Link>
              <Link
                className="cs-btn cs-btn--secondary"
                href="/company-stores/configure"
              >
                Open store configurator
              </Link>
            </div>
          </div>
          <aside className="cs-landing__aside" aria-label="Business benefits">
            <h2>Why teams use a store</h2>
            <ul>
              <li>One branded place for approved swag and merch</li>
              <li>Clearer employee self-serve without ad-hoc requests</li>
              <li>Catalogue curated to your brand and programme</li>
              <li>Rules for access, limits, and company-funded options</li>
              <li>Scales across teams without rebuilding a public shop</li>
            </ul>
          </aside>
        </header>

        <figure className="cs-overview">
          <div className="cs-overview__media">
            <Image
              src="/marketing/company-stores/cs-overview-v3.jpg"
              alt="Company Stores — branded storefront on a laptop with merchandise"
              fill
              sizes="(max-width: 900px) 100vw, 72rem"
              style={{ objectFit: "contain", objectPosition: "center" }}
              priority
            />
          </div>
        </figure>

        <section className="cs-section" aria-labelledby="cs-how-heading">
          <h2 id="cs-how-heading" className="cs-section__title">
            How a Company Store works
          </h2>
          <p className="cs-section__lede">
            Four clear steps from curation to branded storefront. Exact
            fulfilment SLAs and live authentication are scoped with Monkcraft
            when your store is provisioned — they are not claimed as live on this
            demo.
          </p>

          <BrandVideoBand
            title="How it works"
            durationLabel="About 60 seconds"
            src="/videos/monkcraft-company-store-brief.mp4"
            poster="/videos/monkcraft-company-store-brief-poster.jpg"
            tone="apricot"
            ariaLabel="How a Monkcraft Company Store works"
          />

          <div className="cs-grid cs-grid--2 cs-how-posters">
            {howSteps.map((step) => (
              <article
                key={step.id}
                className={`cs-tile cs-tile--${step.tone} cs-tile--poster`}
              >
                <div className="cs-tile__media cs-tile__media--poster">
                  <Image
                    src={step.image.src}
                    alt={step.image.alt}
                    fill
                    sizes="(max-width: 720px) 100vw, 28rem"
                    style={{ objectFit: "contain", objectPosition: "center" }}
                  />
                </div>
                <div className="cs-how-poster__footer">
                  <h3 className="cs-how-poster__title">{step.title}</h3>
                  <Link
                    className="cs-how-poster__cta"
                    href="/company-stores/configure"
                  >
                    Try in configurator
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="cs-section" aria-labelledby="cs-journey-heading">
          <h2 id="cs-journey-heading" className="cs-section__title">
            From interest to proposal
          </h2>
          <p className="cs-section__lede">
            A practical corporate journey — request first, then shape a draft
            with a Monkcraft specialist.
          </p>
          <ol className="cs-steps">
            <li>
              <div>
                <h3>Understand &amp; request</h3>
                <p>
                  Share company goals, team size, and merchandise intent via the
                  consultation enquiry.
                </p>
              </div>
            </li>
            <li>
              <div>
                <h3>Configure a draft</h3>
                <p>
                  Use the demo configurator (or work with us) to set identity,
                  select catalogue products, and note ordering rules.
                </p>
              </div>
            </li>
            <li>
              <div>
                <h3>Preview as an employee</h3>
                <p>
                  Check how the storefront feels before anything is provisioned
                  in production.
                </p>
              </div>
            </li>
            <li>
              <div>
                <h3>Prepare a proposal / enquiry</h3>
                <p>
                  Export a clear summary for quotation — no fake live store is
                  created by the demo alone.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="cs-cta-band" aria-labelledby="cs-request-heading">
          <div>
            <h2 id="cs-request-heading">Ready to talk about a store?</h2>
            <p>
              Request a Company Store through the same consultation flow used for
              gifting programmes. Inbox routing is not automated yet — you will
              get a ready-to-send enquiry to share with Monkcraft.
            </p>
          </div>
          <div className="cs-landing__actions">
            <Link
              className="cs-btn cs-btn--primary"
              href="/?interest=company-store#enquire"
            >
              Request a Company Store
            </Link>
            <Link
              className="cs-btn cs-btn--secondary"
              href="/gifts"
            >
              Browse catalogue
            </Link>
          </div>
        </section>

        <p className="cs-note" style={{ marginTop: "1.5rem" }}>
          Related tools:{" "}
          <Link href="/gifts">Gifts catalogue</Link>
          {" · "}
          <Link href="/gifts/box">Build a Box</Link>
          {" · "}
          <Link href="/studio">Studio</Link>
          {" · "}
          <Link href="/gifts/brief">Gifting brief</Link>
          {" · "}
          <Link href="/#what-we-do">What we do</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
