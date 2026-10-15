import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function CatalogueIntro() {
  return (
    <section className="catalogue-intro" aria-labelledby="catalogue-heading">
      <div className="catalogue-intro__band">
        <div className="catalogue-intro__copy">
          <Breadcrumbs
            items={[{ label: "Home", href: "/" }, { label: "Gifts" }]}
          />
          <p className="catalogue-intro__eyebrow">Discover</p>
          <h1 id="catalogue-heading" className="catalogue-intro__title">
            Gift catalogue
          </h1>
          <p className="catalogue-intro__lede">
            Browse verified merchandise, shortlist favourites, and prepare one
            quotation brief.
          </p>
        </div>
        <nav className="catalogue-intro__links" aria-label="Catalogue journey">
          <Link href="/gifts/find">Gift Finder</Link>
          <Link href="/gifts/box">Build a Box</Link>
          <Link href="/studio">Studio</Link>
          <Link href="/gifts/brief">Get a Quote</Link>
        </nav>
      </div>
    </section>
  );
}
