"use client";

import Link from "next/link";
import { BackToResults } from "@/components/catalogue/BackToResults";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { StudioMode } from "@/data/catalogue/studioTypes";
import { BrandingEditor } from "./BrandingEditor";
import { CatalogueBuilder } from "./CatalogueBuilder";

type StudioShellProps = {
  initialMode: StudioMode;
  productSlug?: string;
  from?: string;
  seedFromShortlist?: boolean;
};

function returnTarget(
  from?: string,
  productSlug?: string,
): { href: string; label: string } | null {
  if (from === "box") {
    return { href: "/gifts/box", label: "Back to Build a Box" };
  }
  if (from === "shortlist") {
    return { href: "/gifts/shortlist", label: "Back to quote selections" };
  }
  if (from === "product") {
    if (productSlug) {
      return {
        href: `/gifts/${productSlug}`,
        label: "Back to product",
      };
    }
    return { href: "/gifts", label: "Back to catalog" };
  }
  return null;
}

export function StudioShell({
  initialMode,
  productSlug,
  from,
  seedFromShortlist = false,
}: StudioShellProps) {
  const router = useRouter();
  // Mode is URL-driven; local mirror only updates via intentional switcher actions.
  const mode = initialMode;
  const switchMode = (next: StudioMode) => {
      if (next === mode) return;
      const params = new URLSearchParams();
      params.set("mode", next);
      if (next === "customize" && productSlug) {
        params.set("product", productSlug);
      }
      if (from) params.set("from", from);
      if (next === "catalogue" && seedFromShortlist) {
        params.set("fromShortlist", "1");
      }
      router.replace(`/studio?${params.toString()}`, { scroll: false });
  };

  const back = returnTarget(from, productSlug);

  return (
    <div className="studio-shell">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Studio" },
          {
            label:
              mode === "customize" ? "Customize a product" : "Build a catalogue",
          },
        ]}
      />
      <header className="studio-shell__header">
        <div className="studio-shell__intro">
          <p className="studio-shell__eyebrow">Monkcraft Studio</p>
          <h1>{mode === "customize" ? "Product branding" : "Client catalogue"}</h1>
          <p className="studio-shell__lede">
            {mode === "customize"
              ? "Preview your logo on a product."
              : "Select gifts and prepare a shareable catalogue."}
          </p>
        </div>

        <div
          className="studio-switcher"
          role="group"
          aria-label="Studio tools"
        >
          <button
            type="button"
            aria-pressed={mode === "customize"}
            className={
              mode === "customize"
                ? "studio-switcher__tab studio-switcher__tab--active"
                : "studio-switcher__tab"
            }
            onClick={() => switchMode("customize")}
          >
            Product branding
          </button>
          <button
            type="button"
            aria-pressed={mode === "catalogue"}
            className={
              mode === "catalogue"
                ? "studio-switcher__tab studio-switcher__tab--active"
                : "studio-switcher__tab"
            }
            onClick={() => switchMode("catalogue")}
          >
            Client catalogue
          </button>
        </div>
        <p className="studio-shell__save-note">Drafts save in this browser.</p>

        <nav className="studio-shell__links" aria-label="Studio related journeys">
          {back ? <Link href={back.href}>{back.label}</Link> : null}
          <BackToResults label="Browse catalogue" />
          <Link href="/gifts/shortlist">Review quote selections</Link>

        </nav>
      </header>

      <div
        className="studio-shell__body"
        role="region"
        aria-label={
          mode === "customize" ? "Customize a Product" : "Build a Catalogue"
        }
      >
        {mode === "customize" ? (
          <BrandingEditor
            initialProductSlug={productSlug}
            returnHref={back?.href}
            returnLabel={back?.label}
          />
        ) : (
          <CatalogueBuilder seedFromShortlist={seedFromShortlist} />
        )}
      </div>
    </div>
  );
}
