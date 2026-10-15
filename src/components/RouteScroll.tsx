"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Scroll window to top when the gifts product slug changes. */
export function RouteScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/gifts/")) return;
    // Skip tool routes that keep their own scroll position
    if (
      pathname.startsWith("/gifts/box") ||
      pathname.startsWith("/gifts/brief") ||
      pathname.startsWith("/gifts/find") ||
      pathname.startsWith("/gifts/shortlist") ||
      pathname === "/gifts"
    ) {
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: reduce ? "auto" : "smooth" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
}
