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
    return { href: "/gifts/shortlist", label: "Back to cart" };
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
          <h1>Creative workspace</h1>
          <p className="studio-shell__lede">
            {mode === "customize"
              ? "Choose a catalogue product, check logo placement and branding notes, then add it to your cart for production review."
              : "Build a branded product selection from your cart. Download a clean PDF with one indicative price per item."}
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
            Customize a Product
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
            Build a Catalogue
          </button>
        </div>
        <p className="studio-shell__save-note">Your Studio drafts save in this browser as you work. You can switch tools without losing them.</p>

        <nav className="studio-shell__links" aria-label="Studio related journeys">
          {back ? <Link href={back.href}>{back.label}</Link> : null}
          <BackToResults label="Continue browsing catalog" />
          <Link href="/gifts/shortlist">Open cart</Link>

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
          <CatalogueBuilder
            seedFromShortlist={seedFromShortlist}
          />
        )}
      </div>
    </div>
  );
}
