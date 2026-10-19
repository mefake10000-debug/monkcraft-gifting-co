"use client";

import Link from "next/link";
import { BackToResults } from "@/components/catalogue/BackToResults";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { StudioMode } from "@/data/catalogue/studioTypes";
import { BrandingEditor } from "./BrandingEditor";
import { CatalogueBuilder } from "./CatalogueBuilder";
import { SwagStarter } from "./SwagStarter";

type StudioShellProps = {
  initialMode: StudioMode;
  productSlug?: string;
  from?: string;
  seedFromShortlist?: boolean;
  seedMonkcraftLogo?: boolean;
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
    return { href: "/gifts", label: "Back to catalogue" };
  }
  if (from === "swag") {
    return { href: "/studio?mode=swag", label: "Back to company swag" };
  }
  return null;
}

export function StudioShell({
  initialMode,
  productSlug,
  from,
  seedFromShortlist = false,
  seedMonkcraftLogo = false,
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
      if (next === "customize" && seedMonkcraftLogo) params.set("logo", "monkcraft");
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
              mode === "customize" ? "Make it yours" : mode === "swag" ? "Company swag" : "Share a catalogue",
          },
        ]}
      />
      <header className="studio-shell__header">
        <div className="studio-shell__intro">
          <p className="studio-shell__eyebrow">Monkcraft Studio</p>
          <h1>{mode === "customize" ? "Make it yours." : mode === "swag" ? "Build your company swag." : "Good picks. Ready to share."}</h1>
          <p className="studio-shell__lede">
            {mode === "customize"
              ? "Pick a real product, add your mark and save the preview."
              : mode === "swag"
                ? "Black, white and full of possibility. Pick a concept and make it your team’s thing."
                : "Your gift picks, your branding, one client-ready catalogue."}
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
          <button
            type="button"
            aria-pressed={mode === "swag"}
            className={mode === "swag" ? "studio-switcher__tab studio-switcher__tab--active" : "studio-switcher__tab"}
            onClick={() => switchMode("swag")}
          >
            Company swag
          </button>
        </div>
        <nav className="studio-shell__links" aria-label="Studio related journeys">
          {back ? <Link href={back.href}>{back.label}</Link> : null}
          <BackToResults label="Browse products" />
          <Link href="/gifts/shortlist">My quote</Link>

        </nav>
      </header>

      <div
        className="studio-shell__body"
        role="region"
        aria-label={mode === "customize" ? "Make a product preview" : mode === "swag" ? "Build company swag" : "Make a gift list"}
      >
        {mode === "customize" ? (
          <BrandingEditor
            initialProductSlug={productSlug}
            returnHref={back?.href}
            returnLabel={back?.label}
            seedMonkcraftLogo={seedMonkcraftLogo}
            hidePrice={from === "swag"}
          />
        ) : mode === "swag" ? (
          <SwagStarter />
        ) : (
          <CatalogueBuilder seedFromShortlist={seedFromShortlist} />
        )}
      </div>
    </div>
  );
}
