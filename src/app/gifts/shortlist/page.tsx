import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShortlistView } from "@/components/catalogue/ShortlistView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Quote Selections | Monkcraft Gifts",
  description: "Review your product selections and quantities before requesting a bulk quote from Monkcraft.",
  alternates: { canonical: null },
  robots: { index: false, follow: false },
};

export default function ShortlistPage() {
  return (
    <main className="catalogue-page">
      <SiteHeader />
      <div className="journey-page">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Catalogue", href: "/gifts" },
            { label: "Quote selections" },
          ]}
        />
        <ShortlistView />
      </div>
      <SiteFooter />
    </main>
  );
}
