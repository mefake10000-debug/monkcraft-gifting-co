/**
 * Shared primary navigation for HeroNav + SiteHeader.
 * The catalogue and Build a Box share one Gifts destination; box mode starts from its catalogue.
 */

export type NavMatch = "exact" | "prefix" | "gifts-root" | "none";

export type NavLink = {
  href: string;
  label: string;
  match: NavMatch;
  /** Shown in mobile panel and footer-adjacent utility menus */
  secondary?: boolean;
};

/** Build a Box has a dedicated page and draft, separate from catalogue browsing. */
export const BOX_CATALOGUE_HREF = "/gifts/box";

/** Desktop primary + mobile primary list (secondary filtered out on desktop). */
export const PRIMARY_NAV: NavLink[] = [
  { href: "/gifts", label: "Catalogue", match: "gifts-root" },
  { href: "/studio", label: "Studio", match: "prefix" },
  { href: "/company-stores", label: "Company Stores", match: "prefix" },
];

/** Tools / secondary — mobile panel + utility; not desktop primary. */
export const UTILITY_NAV: NavLink[] = [
  { href: "/gifts/find", label: "Gift Finder", match: "exact", secondary: true },
  { href: "/gifts/brief", label: "My Brief", match: "exact", secondary: true },
  { href: "/#enquire", label: "Contact", match: "none", secondary: true },
];

/** Primary header CTA — My Brief is the only quote hub. */
export const QUOTE_CTA = {
  href: "/gifts/brief",
  emptyLabel: "My Brief",
  activeLabel: (count: number) => `My Brief (${count})`,
} as const;

export function isNavActive(
  pathname: string,
  href: string,
  match: NavMatch,
): boolean {
  if (match === "none") return false;
  if (match === "exact") return pathname === href;
  if (match === "prefix") {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  // gifts-root: catalogue + PDP + shortlist — not nested tools
  if (pathname === "/gifts" || pathname.startsWith("/gifts/")) {
    if (
      pathname.startsWith("/gifts/find") ||
      pathname.startsWith("/gifts/brief") ||
      pathname.startsWith("/gifts/shortlist") ||
      pathname.startsWith("/gifts/compare") ||
      pathname.startsWith("/gifts/favourites")
    ) {
      return false;
    }
    return true;
  }
  return false;
}

export function resolveNavHref(href: string, pathname: string): string {
  // On homepage, Contact is an in-page anchor; elsewhere go home + enquire.
  if (href === "/#enquire" && pathname === "/") return "#enquire";
  return href;
}
