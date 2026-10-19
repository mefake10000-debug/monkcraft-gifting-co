import Link from "next/link";
import { BOX_CATALOGUE_HREF } from "@/lib/nav";

export function CatalogueIntro() {
  return (
    <section className="browse-intro" aria-labelledby="catalogue-heading">
      <div className="browse-intro__copy">
        <h1 id="catalogue-heading">Gifts worth giving.</h1>
        <p>For first days, big wins and a proper thank-you. Find their next favourite.</p>
        <p className="browse-intro__price-note">
          Prices are a guide. We confirm bulk pricing and availability in your quote.
        </p>
      </div>
      <Link className="browse-intro__box-cta" href={BOX_CATALOGUE_HREF}>
        Build a Box <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
