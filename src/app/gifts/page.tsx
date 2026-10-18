import { HOMEPAGE_OCCASION_MAP } from "@/data/catalogue/facets";
import { getContextualFacets } from "@/data/catalogue/query";
import { CatalogueIntro } from "@/components/catalogue/CatalogueIntro";
import { CatalogueShell } from "@/components/catalogue/CatalogueShell";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isCataloguePopulated } from "@/data/catalogue/products";
import { getCategoryFacets, getSubcategoryFacets } from "@/data/catalogue/facets";
import {
  parseCatalogueQuery,
  queryCatalogue,
} from "@/data/catalogue/query";

/** Request-time catalogue filters; opt out of instant-navigation validation. */
export const instant = false;

export const metadata = {
  title: "Corporate Gift Catalogue | Monkcraft",
  description:
    "Explore corporate gifts, employee welcome kits, custom merchandise and client hampers for Indian teams. Request a bulk quote with Monkcraft.",
  alternates: { canonical: "/gifts" },
  openGraph: {
    type: "website" as const,
    title: "Corporate Gift Catalogue | Monkcraft",
    description:
      "Explore corporate gifts, employee welcome kits, custom merchandise and client hampers for Indian teams.",
    url: "/gifts",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Corporate Gift Catalogue | Monkcraft",
    description:
      "Explore corporate gifts, employee welcome kits, custom merchandise and client hampers for Indian teams.",
  },
};

type GiftsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function applyHomepageMapping(
  query: ReturnType<typeof parseCatalogueQuery>,
) {
  // Map legacy single homepage keys still present in the occasions array
  let occasions = [...query.occasions];
  const categories = [...query.categories];

  for (const key of [...occasions]) {
    const mapped = HOMEPAGE_OCCASION_MAP[key];
    if (!mapped) continue;
    occasions = occasions.filter((item) => item !== key);
    if (mapped.occasion && !occasions.includes(mapped.occasion)) {
      occasions.push(mapped.occasion);
    }
    if (mapped.category && !categories.includes(mapped.category)) {
      categories.push(mapped.category);
    }
  }

  return { ...query, occasions, categories };
}

export default async function GiftsPage({ searchParams }: GiftsPageProps) {
  const params = await searchParams;
  const query = applyHomepageMapping(parseCatalogueQuery(params));
  const result = queryCatalogue(query);
  const facets = getContextualFacets(result.query);
  const subcategoryFacetsByCategory = Object.fromEntries(
    getCategoryFacets().map((category) => [category.id, getSubcategoryFacets(category.id)]),
  );
  const fromParam = params.from;
  const fromBox =
    fromParam === "box" ||
    (Array.isArray(fromParam) && fromParam.includes("box"));

  return (
    <main className="catalogue-page">
      <a className="skip-link" href="#catalogue-results">
        Skip to products
      </a>
      <SiteHeader />
      <CatalogueIntro />
      <div id="catalogue-results" className="catalogue-page__body">
        <CatalogueShell
          products={result.products}
          total={result.total}
          page={result.page}
          pageSize={result.pageSize}
          totalPages={result.totalPages}
          query={result.query}
          occasionFacets={facets.occasions}
          categoryFacets={facets.categories}
          subcategoryFacetsByCategory={subcategoryFacetsByCategory}
          brandFacets={facets.brands}
          colourFacets={facets.colours}
          materialFacets={facets.materials}
          cataloguePopulated={isCataloguePopulated()}
          fromBox={fromBox}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
