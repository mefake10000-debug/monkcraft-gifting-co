import { Breadcrumbs } from "@/components/Breadcrumbs";
import { GiftingBrief } from "@/components/catalogue/GiftingBrief";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "My Gifting Brief | Monkcraft Gifts",
  description:
    "Bring your selected gifts, quantities, branding and delivery needs into one quote request for Monkcraft. Review it before sending; preparing a brief does not place an order.",
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
            { label: "Cart", href: "/gifts/shortlist" },
            { label: "My Gifting Brief" },
          ]}
        />
        <GiftingBrief />
      </div>
      <SiteFooter />
    </main>
  );
}
