import { FavouritesView } from "@/components/catalogue/FavouritesView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Saved gifts | Monkcraft",
  description: "Revisit saved gift ideas and add them to a Monkcraft quote.",
  alternates: { canonical: null },
  robots: { index: false, follow: false },
};

export default function FavouritesPage() {
  return <main className="catalogue-page"><SiteHeader /><FavouritesView /><SiteFooter /></main>;
}
