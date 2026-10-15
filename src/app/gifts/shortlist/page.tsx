import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShortlistView } from "@/components/catalogue/ShortlistView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Shortlist | Monkcraft Gifts",
  description:
    "Review shortlisted Monkcraft gifts, set quantities, and continue to your gifting brief.",
};

export default function ShortlistPage() {
  return (
    <main className="catalogue-page">
      <SiteHeader />
      <div className="journey-page">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Gifts", href: "/gifts" },
            { label: "Shortlist" },
          ]}
        />
        <ShortlistView />
      </div>
      <SiteFooter />
    </main>
  );
}
