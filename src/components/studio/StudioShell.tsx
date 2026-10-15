"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { StudioMode } from "@/data/catalogue/studioTypes";
import { readBrandingDraft } from "@/lib/studio/brandingDraft";
import { readCatalogueDraft } from "@/lib/studio/catalogueDraft";
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
    return { href: "/gifts/shortlist", label: "Back to shortlist" };
  }
  if (from === "product") {
    if (productSlug) {
      return {
        href: `/gifts/${productSlug}`,
        label: "Back to product",
      };
    }
    return { href: "/gifts", label: "Back to gifts" };
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
  const [brandingDirty, setBrandingDirty] = useState(false);
  const [catalogueDirty, setCatalogueDirty] = useState(false);

  useEffect(() => {
    const sync = () => {
      setBrandingDirty(readBrandingDraft().dirty);
      setCatalogueDirty(readCatalogueDraft().dirty);
    };
    sync();
    window.addEventListener("monkcraft:studio-branding", sync);
    window.addEventListener("monkcraft:studio-catalogue", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("monkcraft:studio-branding", sync);
      window.removeEventListener("monkcraft:studio-catalogue", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const activeDirty = mode === "customize" ? brandingDirty : catalogueDirty;

  useEffect(() => {
    if (!activeDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [activeDirty]);

  const switchMode = useCallback(
    (next: StudioMode) => {
      if (next === mode) return;
      const leavingDirty =
        mode === "customize" ? brandingDirty : catalogueDirty;
      if (leavingDirty) {
        const ok = window.confirm(
          "You have unsaved changes in this Studio tool. Switch anyway? Your last saved draft stays in this browser; unsaved edits in the current session may be lost if you clear them later.",
        );
        if (!ok) return;
      }
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
    },
    [
      brandingDirty,
      catalogueDirty,
      from,
      mode,
      productSlug,
      router,
      seedFromShortlist,
    ],
  );

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
            Place a logo on genuine product photos for a conceptual preview, or
            assemble a white-label catalogue PDF in the browser. Drafts stay on
            this device — exports are not print proofs.
          </p>
        </div>

        <div
          className="studio-switcher"
          role="tablist"
          aria-label="Studio tools"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "customize"}
            className={
              mode === "customize"
                ? "studio-switcher__tab studio-switcher__tab--active"
                : "studio-switcher__tab"
            }
            onClick={() => switchMode("customize")}
          >
            Customize a Product
            {brandingDirty ? (
              <span className="studio-switcher__dot" aria-label="Unsaved changes" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "catalogue"}
            className={
              mode === "catalogue"
                ? "studio-switcher__tab studio-switcher__tab--active"
                : "studio-switcher__tab"
            }
            onClick={() => switchMode("catalogue")}
          >
            Build a Catalogue
            {catalogueDirty ? (
              <span className="studio-switcher__dot" aria-label="Unsaved changes" />
            ) : null}
          </button>
        </div>

        <nav className="studio-shell__links" aria-label="Studio related journeys">
          {back ? <Link href={back.href}>{back.label}</Link> : null}
          <Link href="/gifts">Gifts catalogue</Link>
          <Link href="/gifts/box">Build a Box</Link>
          <Link href="/gifts/shortlist">Shortlist</Link>
          <Link href="/gifts/brief">My Gifting Brief</Link>
        </nav>
      </header>

      <div
        className="studio-shell__body"
        role="tabpanel"
        aria-label={
          mode === "customize" ? "Customize a Product" : "Build a Catalogue"
        }
      >
        {mode === "customize" ? (
          <BrandingEditor
            initialProductSlug={productSlug}
            returnHref={back?.href}
            returnLabel={back?.label}
            onDirtyChange={setBrandingDirty}
          />
        ) : (
          <CatalogueBuilder
            seedFromShortlist={seedFromShortlist}
            onDirtyChange={setCatalogueDirty}
          />
        )}
      </div>
    </div>
  );
}
