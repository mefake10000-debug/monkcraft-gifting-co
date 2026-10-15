/**
 * Reduced-motion-aware scroll helpers.
 * Centralises the scroll behaviour used by RouteScroll, the catalogue results
 * anchor, and in-page (#enquire) links so motion stays consistent + accessible.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function behavior(smooth = true): ScrollBehavior {
  return smooth && !prefersReducedMotion() ? "smooth" : "auto";
}

export function scrollToTop(options?: { smooth?: boolean }) {
  if (typeof window === "undefined") return;
  const scrollBehavior = behavior(options?.smooth);
  // Instant jump: force all scroll roots (Safari / legacy quirks).
  // Smooth: only window.scrollTo — setting scrollTop would cancel the animation.
  if (scrollBehavior === "auto") {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    return;
  }
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
}

export function scrollToElement(
  target: Element | null,
  options?: { smooth?: boolean; offset?: number },
) {
  if (typeof window === "undefined" || !target) return;
  const rect = target.getBoundingClientRect();
  const offset = options?.offset ?? 0;
  const top = Math.max(0, rect.top + window.scrollY - offset);
  window.scrollTo({ top, left: 0, behavior: behavior(options?.smooth) });
}

/** Scroll to a `#hash` target (id). Returns true when the target existed. */
export function scrollToHash(hash: string, options?: { offset?: number }) {
  if (typeof window === "undefined") return false;
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  scrollToElement(el, { offset: options?.offset ?? 84 });
  // Focus form fields / interactive targets (e.g. catalogue search #catalogue-q).
  if (
    el instanceof HTMLElement &&
    (el.matches("input, textarea, select, button, a[href]") || el.tabIndex >= 0)
  ) {
    try {
      el.focus({ preventScroll: true });
    } catch {
      /* ignore focus failures on non-focusable hosts */
    }
  }
  return true;
}
