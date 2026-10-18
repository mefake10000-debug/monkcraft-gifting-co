/**
 * Client-safe catalogue query helpers (no filesystem / product load).
 * Multi-select facets encode as comma-separated URL params (refresh-safe).
 */

import type { CatalogueQuery, CatalogueSort } from "./types";

const VALID_SORTS: CatalogueSort[] = [
  "featured",
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc",
  "newest",
];

export const sortOptions: { id: CatalogueSort; label: string }[] = [
  { id: "featured", label: "Recommended" },
  { id: "name-asc", label: "Name A–Z" },
  { id: "name-desc", label: "Name Z–A" },
  { id: "price-asc", label: "Price · low to high" },
  { id: "price-desc", label: "Price · high to low" },
  { id: "newest", label: "Newest" },
];

function pickRaw(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | string[] | undefined {
  return searchParams[key];
}

/** Parse multi-value param: repeated keys and/or comma-separated. */
export function parseListParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string[] {
  const raw = pickRaw(searchParams, key);
  if (!raw) return [];
  const parts = Array.isArray(raw) ? raw : [raw];
  const values: string[] = [];
  for (const part of parts) {
    for (const item of part.split(",")) {
      const trimmed = item.trim();
      if (trimmed && !values.includes(trimmed)) values.push(trimmed);
    }
  }
  return values;
}

function pickOne(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const v = pickRaw(searchParams, key);
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

/** Parse a positive INR amount from a query param; invalid → null. */
export function parseBudgetParam(raw: string): number | null {
  if (!raw.trim()) return null;
  const cleaned = raw.replace(/[₹,\s]/g, "").replace(/inr/gi, "");
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.floor(value);
}

export function parseCatalogueQuery(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogueQuery {
  const sortRaw = pickOne(searchParams, "sort") as CatalogueSort;
  const sort = VALID_SORTS.includes(sortRaw) ? sortRaw : "featured";
  const pageRaw = Number.parseInt(pickOne(searchParams, "page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const shortlistedOnly =
    pickOne(searchParams, "shortlist") === "1" ||
    pickOne(searchParams, "shortlisted") === "1";
  const shortlistIds = parseListParam(searchParams, "sl").slice(0, 200);

  // Legacy single keys still accepted and merged into multi-select arrays
  const occasions = parseListParam(searchParams, "occasion");
  const categories = [
    ...parseListParam(searchParams, "category"),
    ...parseListParam(searchParams, "type"),
  ].filter((v, i, arr) => arr.indexOf(v) === i);
  const subcategories = parseListParam(searchParams, "subcategory");
  const brands = parseListParam(searchParams, "brand");
  const colours = [
    ...parseListParam(searchParams, "colour"),
    ...parseListParam(searchParams, "color"),
  ].filter((v, i, arr) => arr.indexOf(v) === i);
  const materials = parseListParam(searchParams, "material");

  let budgetMinInr = parseBudgetParam(pickOne(searchParams, "budgetMin"));
  let budgetMaxInr = parseBudgetParam(pickOne(searchParams, "budgetMax"));
  // Also accept budget=max shorthand used by gift-finder deep links
  const budgetAlone = parseBudgetParam(pickOne(searchParams, "budget"));
  if (budgetAlone != null && budgetMaxInr == null) {
    budgetMaxInr = budgetAlone;
  }
  if (
    budgetMinInr != null &&
    budgetMaxInr != null &&
    budgetMinInr > budgetMaxInr
  ) {
    const swap = budgetMinInr;
    budgetMinInr = budgetMaxInr;
    budgetMaxInr = swap;
  }

  return {
    q: pickOne(searchParams, "q").trim(),
    occasions,
    categories,
    subcategories,
    brands,
    // `branding` is accepted as a legacy key but no longer filters the catalogue.
    brandings: [],
    colours,
    materials,
    budgetMinInr,
    budgetMaxInr,
    sort,
    shortlistedOnly,
    shortlistIds,
    page,
  };
}

export function countActiveFilters(query: CatalogueQuery): number {
  let count = 0;
  if (query.q) count += 1;
  count += query.occasions.length;
  count += query.categories.length;
  count += query.subcategories.length;
  count += query.brands.length;
  count += query.colours.length;
  count += query.materials.length;
  if (query.budgetMinInr != null) count += 1;
  if (query.budgetMaxInr != null) count += 1;
  if (query.shortlistedOnly) count += 1;
  return count;
}

export function toggleListValue(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function buildCatalogueHref(
  next: CatalogueQuery,
  pathname = "/gifts",
): string {
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.occasions.length) params.set("occasion", next.occasions.join(","));
  if (next.categories.length) params.set("category", next.categories.join(","));
  if (next.subcategories.length) {
    params.set("subcategory", next.subcategories.join(","));
  }
  if (next.brands.length) params.set("brand", next.brands.join(","));
  if (next.colours.length) params.set("colour", next.colours.join(","));
  if (next.materials.length) params.set("material", next.materials.join(","));
  if (next.budgetMinInr != null) {
    params.set("budgetMin", String(next.budgetMinInr));
  }
  if (next.budgetMaxInr != null) {
    params.set("budgetMax", String(next.budgetMaxInr));
  }
  if (next.sort && next.sort !== "featured") params.set("sort", next.sort);
  if (next.shortlistedOnly) {
    params.set("shortlist", "1");
    if (next.shortlistIds.length > 0) {
      params.set("sl", next.shortlistIds.join(","));
    }
  }
  if (next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function emptyCatalogueQuery(): CatalogueQuery {
  return {
    q: "",
    occasions: [],
    categories: [],
    subcategories: [],
    brands: [],
    brandings: [],
    colours: [],
    materials: [],
    budgetMinInr: null,
    budgetMaxInr: null,
    sort: "featured",
    shortlistedOnly: false,
    shortlistIds: [],
    page: 1,
  };
}

/** Budget inputs commit as one range; never silently swap an inverted edit. */
export function parseBudgetRange(minText: string, maxText: string): {valid: boolean; min: number | null; max: number | null} {
  const min = minText.trim() ? Number(minText) : null;
  const max = maxText.trim() ? Number(maxText) : null;
  const positiveWhole = (value: number | null) => value === null || (Number.isFinite(value) && Number.isInteger(value) && value > 0);
  return {valid: positiveWhole(min) && positiveWhole(max) && !(min !== null && max !== null && min > max), min, max};
}
