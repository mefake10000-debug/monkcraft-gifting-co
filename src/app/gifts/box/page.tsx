import { BoxBuilder } from "@/components/box/BoxBuilder";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getReadyBoxCombos } from "@/data/catalogue/readyBoxCombos";

export const metadata = {
  title: "Build a Corporate Gift Box | Monkcraft",
  description:
    "Assemble a Monkcraft corporate gift box from the live catalogue, capture branding needs, and prepare a quotation request.",
  alternates: { canonical: "/gifts/box" },
  openGraph: {
    type: "website" as const,
    title: "Build a Corporate Gift Box | Monkcraft",
    description:
      "Choose gifts and packaging for a corporate gift box, then prepare a quote request with Monkcraft.",
    url: "/gifts/box",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Build a Corporate Gift Box | Monkcraft",
    description:
      "Choose gifts and packaging for a corporate gift box, then prepare a quote request with Monkcraft.",
  },
};

export default function BuildABoxPage() {
  return (
    <main className="catalogue-page">
      <SiteHeader />
      <div className="journey-page journey-page--wide">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Catalogue", href: "/gifts" },
            { label: "Build a Box" },
          ]}
        />
        <BoxBuilder combos={getReadyBoxCombos()} />
      </div>
      <SiteFooter />
    </main>
  );
}
