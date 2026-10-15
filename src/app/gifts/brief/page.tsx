import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GiftingBrief } from "@/components/catalogue/GiftingBrief";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "My Gifting Brief | Monkcraft Gifts",
  description:
    "Review shortlisted products, box and Studio details, set programme needs, and prepare one quotation request — saved in this browser.",
};

export default function BriefPage() {
  return (
    <main className="catalogue-page">
      <SiteHeader />
      <div className="journey-page">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Gifts", href: "/gifts" },
            { label: "Shortlist", href: "/gifts/shortlist" },
            { label: "My Gifting Brief" },
          ]}
        />
        <GiftingBrief />
      </div>
      <SiteFooter />
    </main>
  );
}
