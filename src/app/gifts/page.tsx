import { CatalogueIntro } from "@/components/catalogue/CatalogueIntro";
import { CatalogueShell } from "@/components/catalogue/CatalogueShell";
import { CompareBar } from "@/components/catalogue/CompareBar";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getBrandingFacets,
  getCategoryFacets,
  getColourFacets,
  getMaterialFacets,
  getOccasionFacets,
  HOMEPAGE_OCCASION_MAP,
} from "@/data/catalogue/facets";
import { isCataloguePopulated } from "@/data/catalogue/products";
import {
  parseCatalogueQuery,
  queryCatalogue,
} from "@/data/catalogue/query";

/** Request-time catalogue filters; opt out of instant-navigation validation. */
export const instant = false;

export const metadata = {
  title: "Gifts Catalogue | Monkcraft Gifting Co",
  description:
    "Discover corporate gifts by occasion, category and branding. Shortlist favourites and prepare a Monkcraft quotation brief.",
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
          occasionFacets={getOccasionFacets()}
          categoryFacets={getCategoryFacets()}
          brandingFacets={getBrandingFacets()}
          colourFacets={getColourFacets()}
          materialFacets={getMaterialFacets()}
          cataloguePopulated={isCataloguePopulated()}
          fromBox={fromBox}
        />
      </div>
      <SiteFooter />
      <CompareBar />
    </main>
  );
}
