import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CompareBar } from "@/components/catalogue/CompareBar";
import { CompareView } from "@/components/catalogue/CompareView";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getProductBySlug } from "@/data/catalogue/products";
import { MAX_COMPARE } from "@/lib/compareConfig";
import type { Product } from "@/data/catalogue/types";

/** Request-time slug resolution; opt out of instant-navigation validation. */
export const instant = false;

export const metadata = {
  title: "Compare gifts | Monkcraft",
  description:
    "Compare shortlisted Monkcraft gifts side by side — pricing, branding, materials, and dispatch.",
};

type ComparePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const raw = params.slugs;
  const slugString = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  const slugs = Array.from(
    new Set(
      slugString
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  ).slice(0, MAX_COMPARE);

  const products = slugs
    .map((slug) => getProductBySlug(slug))
    .filter((product): product is Product => Boolean(product));

  return (
    <main className="catalogue-page">
      <SiteHeader />
      <div className="journey-page">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Gifts", href: "/gifts" },
            { label: "Compare" },
          ]}
        />
        <CompareView products={products} />
      </div>
      <SiteFooter />
      <CompareBar />
    </main>
  );
}
