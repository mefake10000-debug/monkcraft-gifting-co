import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SmartGiftFinder } from "@/components/gift-finder/SmartGiftFinder";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getCategoryFacets,
  getOccasionFacets,
} from "@/data/catalogue/facets";

export const metadata = {
  title: "Smart Gift Finder | Monkcraft Gifts",
  description:
    "Describe your corporate gifting needs and get verified catalogue recommendations — occasion, budget, branding, and more.",
};

export default function GiftFinderPage() {
  const occasions = getOccasionFacets();
  const categories = getCategoryFacets();

  return (
    <main className="catalogue-page">
      <SiteHeader />
      <div className="journey-page">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Catalogue", href: "/gifts" },
            { label: "Gift Finder" },
          ]}
        />
        <SmartGiftFinder
          occasions={occasions}
          categories={categories}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
