import { BoxBuilder } from "@/components/box/BoxBuilder";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Build a Box | Monkcraft Gifts",
  description:
    "Assemble a Monkcraft corporate gift box from the live catalogue, capture branding needs, and prepare a quotation request.",
};

export default function BuildABoxPage() {
  return (
    <main className="catalogue-page">
      <SiteHeader />
      <div className="journey-page journey-page--wide">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Gifts", href: "/gifts" },
            { label: "Build a Box" },
          ]}
        />
        <BoxBuilder />
      </div>
      <SiteFooter />
    </main>
  );
}
