import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShortlistView } from "@/components/catalogue/ShortlistView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Cart | Monkcraft Gifts",
  description: "Review bulk product quantities and send your cart to Monkcraft for price verification and approval.",
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
            { label: "Cart" },
          ]}
        />
        <ShortlistView />
      </div>
      <SiteFooter />
    </main>
  );
}
