import Image from "next/image";
import Link from "next/link";
import { BrandVideoBand } from "@/components/BrandVideoBand";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

/** The original visual walkthrough tiles stay part of the landing page. */
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
              A dedicated, branded merchandise experience, shaped around your
              team, your product range, and the credits you choose to offer.
            </p>
            <div className="cs-landing__actions">
              <Link
                className="cs-btn cs-btn--primary"
                href="/?interest=company-store#enquire"
              >
                Discuss your store
              </Link>
              <Link
                className="cs-btn cs-btn--secondary"
                href="/company-stores/configure"
              >
                Design a sample store
              </Link>
            </div>
          </div>
        </header>

        <section className="cs-store-art" aria-labelledby="cs-store-art-heading">
          <Image
            src="/marketing/company-stores/company-store-value-v1.png"
            alt="A branded employee merchandise store across laptop and phone"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 72rem"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          <div className="cs-store-art__copy">
            <p className="cs-landing__eyebrow">Your company store</p>
            <h2 id="cs-store-art-heading">A brilliant branded merchandise experience.</h2>
          </div>
        </section>

        <section className="cs-store-flow" aria-labelledby="cs-store-flow-title">
          <div className="cs-store-flow__heading">
            <p className="cs-landing__eyebrow">Simple by design</p>
            <h2 id="cs-store-flow-title">A brilliant branded merchandise experience.</h2>
            <p>
              You choose the products and set the credit allowance. Your employees
              get a familiar online store, then we brand, pack, and deliver their
              choices to the address they provide.
            </p>
          </div>
          <ol className="cs-store-flow__steps">
            <li><span>01</span><h3>Choose the range</h3><p>You and our team agree a focused collection of 1–30 products.</p></li>
            <li><span>02</span><h3>Set employee credits</h3><p>Choose the credit amount employees can redeem against the collection.</p></li>
            <li><span>03</span><h3>Shop and redeem</h3><p>Employees browse the branded store and choose products within their allowance.</p></li>
            <li><span>04</span><h3>We brand and deliver</h3><p>They enter a delivery address; we personalise the products and ship to them.</p></li>
          </ol>
          <Link className="cs-btn cs-btn--primary" href="/company-stores/configure">Explore the store demo</Link>
        </section>

        <section className="cs-section" aria-labelledby="cs-how-heading">
          <h2 id="cs-how-heading" className="cs-section__title">
            How a Company Store works
          </h2>
          <p className="cs-section__lede">
            From curating the merchandise to branding, employee ordering, and
            delivery, each part of the store is shaped around your programme.
          </p>
          <BrandVideoBand
            id="company-store-brief"
            title="Watch the film"
            durationLabel="The Company Store brief · 57 sec"
            src="/videos/monkcraft-company-store-brief-mobile.mp4"
            desktopSrc="/videos/monkcraft-company-store-brief-desktop.mp4"
            poster="/videos/monkcraft-company-store-brief-mobile-poster.jpg"
            desktopPoster="/videos/monkcraft-company-store-brief-desktop-hook.jpg"
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
                    Design this step
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
            Start with a sample or tell us your requirements. Both paths lead
            to a reviewed proposal before your store goes live.
          </p>
          <ol className="cs-steps">
            <li><div><h3>Understand &amp; request</h3><p>Share company goals, team size, merchandise range, and employee credit allowance via the consultation enquiry.</p></div></li>
            <li><div><h3>Configure a draft</h3><p>Set your store identity, select the 1–30 catalogue products, and note ordering rules.</p></div></li>
            <li><div><h3>Preview as an employee</h3><p>Browse the curated collection, add products to the bag, and try the delivery details flow.</p></div></li>
            <li><div><h3>Review and prepare</h3><p>Agree the final programme and fulfilment details with Monkcraft before the store goes live.</p></div></li>
          </ol>
        </section>

        <section className="cs-cta-band" aria-labelledby="cs-request-heading">
          <div>
            <h2 id="cs-request-heading">Ready to talk about a store?</h2>
            <p>
              Tell us about the people, products and ordering rules you need.
              We will review your brief and reply with a scoped proposal.
            </p>
          </div>
          <div className="cs-landing__actions">
            <Link
              className="cs-btn cs-btn--primary"
              href="/?interest=company-store#enquire"
            >
              Send store requirements
            </Link>
            <Link
              className="cs-btn cs-btn--secondary"
              href="/gifts"
            >
              Explore products first
            </Link>
          </div>
        </section>

        <p className="cs-note" style={{ marginTop: "1.5rem" }}>
          Related tools:{" "}
          <Link href="/gifts">Product catalog</Link>
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
