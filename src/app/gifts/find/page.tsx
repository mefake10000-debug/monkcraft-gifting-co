import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SmartGiftFinder } from "@/components/gift-finder/SmartGiftFinder";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getCategoryFacets,
  getOccasionFacets,
} from "@/data/catalogue/facets";

export const metadata = {
  title: "Corporate Gift Finder | Monkcraft",
  description:
    "Describe your corporate gifting needs and get verified catalogue recommendations — occasion, budget, branding, and more.",
  alternates: { canonical: "/gifts/find" },
  openGraph: {
    type: "website" as const,
    title: "Corporate Gift Finder | Monkcraft",
    description:
      "Find corporate gift ideas by occasion, budget and product type from the Monkcraft catalogue.",
    url: "/gifts/find",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Corporate Gift Finder | Monkcraft",
    description:
      "Find corporate gift ideas by occasion, budget and product type from the Monkcraft catalogue.",
  },
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
