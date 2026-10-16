import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

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
