/** Session-only browsing context. Never accepts external return destinations. */
export type CatalogueBrowseState = { scrollY: number; anchorId?: string; anchorOffset?: number; groups: Record<string, boolean> };
const PREFIX = 'monkcraft:browse:';
export function safeCatalogueHref(value: string | null | undefined): string {
  if (!value || !/^\/gifts(?:\/box)?(?:\?|$)/.test(value)) return '/gifts';
  return value;
}
export function catalogueReturnHref(options?: {fromBox?: boolean}): string {
  let href: string;
  try { href = safeCatalogueHref(sessionStorage.getItem(PREFIX + 'last')); } catch { href = '/gifts'; }
  if (!options?.fromBox) return href;
  const url = new URL(href, 'https://monkcraft.local');
  url.searchParams.set('from', 'box');
  return url.pathname + url.search;
}
export function readCatalogueBrowse(href: string): CatalogueBrowseState | null {
  try { const value = JSON.parse(sessionStorage.getItem(PREFIX + safeCatalogueHref(href)) || 'null'); return value && Number.isFinite(value.scrollY) && value.groups && typeof value.groups === 'object' ? value : null; } catch { return null; }
}
export function saveCatalogueBrowse(href: string, state: CatalogueBrowseState) {
  try { sessionStorage.setItem(PREFIX + safeCatalogueHref(href), JSON.stringify(state)); sessionStorage.setItem(PREFIX + 'last', safeCatalogueHref(href)); } catch { /* Browsing remains available without storage. */ }
}
