"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { scrollToTop } from "@/lib/scroll";

/**
 * Scroll window to top when navigating between gift routes
 * (catalogue ↔ PDP ↔ finder / box / brief / shortlist).
 *
 * Catalogue filter updates keep the same pathname, so they are left alone —
 * CatalogueShell handles scrolling the results grid when needed.
 */
export function RouteScroll() {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname?.startsWith("/gifts")) return;

    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    // First paint of this layout: browser / Next already lands near top.
    // Avoid a redundant smooth scroll on hard loads.
    if (prev === null || prev === pathname) return;

    scrollToTop({ smooth: true });
  }, [pathname]);

  return null;
}
