import Link from "next/link";
import { BOX_CATALOGUE_HREF } from "@/lib/nav";

export function CatalogueIntro() {
  return (
    <section className="browse-intro" aria-labelledby="catalogue-heading">
      <h1 id="catalogue-heading">Gifts worth giving.</h1>
      <p>Find something thoughtful for your team, clients, or next occasion.</p>
      <p className="browse-intro__price-note">Prices are indicative. Bulk pricing and availability are confirmed with your quote.</p>
      <Link className="browse-intro__box-cta" href={BOX_CATALOGUE_HREF}>
        Build a Box <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
