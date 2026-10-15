"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { scrollToHash } from "@/lib/scroll";

/**
 * Smooth, reduced-motion-aware scroll for in-page hashes (#enquire, etc.)
 * after client navigations and native hashchange.
 */
export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    function run() {
      const hash = window.location.hash;
      if (!hash || hash === "#") return;
      // Wait one frame so the destination section is laid out.
      window.requestAnimationFrame(() => {
        scrollToHash(hash);
      });
    }

    // Defer slightly so Suspense / client islands can mount (e.g. #enquire).
    const timer = window.setTimeout(run, 40);
    window.addEventListener("hashchange", run);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", run);
    };
  }, [pathname]);

  return null;
}
