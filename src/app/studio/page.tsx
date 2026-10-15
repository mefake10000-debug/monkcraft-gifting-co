import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StudioShell } from "@/components/studio/StudioShell";
import type { StudioMode } from "@/data/catalogue/studioTypes";

/** Request-time search params; opt out of instant-navigation validation. */
export const instant = false;

export const metadata = {
  title: "Studio | Monkcraft Gifting Co",
  description:
    "Customize branding previews on genuine merchandise or build a white-label client catalogue — Monkcraft Studio.",
};

type StudioPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function StudioPage({ searchParams }: StudioPageProps) {
  const params = await searchParams;
  const modeParam = first(params.mode);
  const mode: StudioMode =
    modeParam === "catalogue" ? "catalogue" : "customize";
  const productSlug = first(params.product);
  const from = first(params.from);
  const seedFromShortlist =
    first(params.fromShortlist) === "1" || from === "shortlist";

  return (
    <main className="catalogue-page studio-page">
      <a className="skip-link" href="#studio-workspace">
        Skip to Studio workspace
      </a>
      <SiteHeader />
      <div id="studio-workspace">
        <StudioShell
          initialMode={mode}
          productSlug={productSlug}
          from={from}
          seedFromShortlist={seedFromShortlist}
        />
      </div>
      <SiteFooter />
    </main>
  );
}
