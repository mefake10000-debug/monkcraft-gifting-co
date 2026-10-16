/**
 * Facet definitions derived from the website-export taxonomy.
 * Category facet counts use classifier `filterCategorySlug` (product TYPE),
 * not raw export labels — so Drinkware does not count candles.
 * Occasions use source_match segments only (never inferred).
 */

import fs from "node:fs";
import path from "node:path";

import {
  compareCategoryDisplayOrder,
  subcategoryDisplayRank,
} from "./categoryOrder";
import { getExportDataDir } from "./exportPath";
import {
  getAllProducts,
  setCatalogueCacheClearedListener,
  slugifyFacet,
} from "./products";
import type { CatalogueFacet } from "./types";

setCatalogueCacheClearedListener(() => {
  clearFacetCaches();
});

type CategoriesFile = {
  categories: {
    id: string;
    slug: string;
    name: string;
    subcategories: { slug: string; name: string }[];
  }[];
};

type SegmentsFile = {
  segments: {
    id: string;
    label: string;
    sourceMatchedProductCount: number;
  }[];
};

let cachedCategories: CatalogueFacet[] | null = null;
let cachedBrands: CatalogueFacet[] | null = null;
let cachedOccasions: CatalogueFacet[] | null = null;
let cachedBranding: CatalogueFacet[] | null = null;
let cachedColours: CatalogueFacet[] | null = null;
let cachedMaterials: CatalogueFacet[] | null = null;
let cachedSubcategories: Map<string, CatalogueFacet[]> | null = null;

export function clearFacetCaches(): void {
  cachedCategories = null;
  cachedBrands = null;
  cachedOccasions = null;
  cachedBranding = null;
  cachedColours = null;
  cachedMaterials = null;
  cachedSubcategories = null;
}

/** Catalogue manufacturer / label filter, ranked by available product count. */
export function getBrandFacets(): CatalogueFacet[] {
  if (cachedBrands) return cachedBrands;
  const counts = new Map<string, { label: string; count: number }>();
  for (const product of getAllProducts()) {
    const label = product.brandName?.trim();
    if (!label) continue;
    const id = slugifyFacet(label);
    const value = counts.get(id);
    if (value) value.count += 1;
    else counts.set(id, { label, count: 1 });
  }
  cachedBrands = [...counts.entries()]
    .map(([id, { label, count }]) => ({ id, label, count }))
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0) || a.label.localeCompare(b.label));
  return cachedBrands;
}

export function getCategoryFacets(): CatalogueFacet[] {
  if (cachedCategories) return cachedCategories;

  const filePath = path.join(getExportDataDir(), "categories.json");
  if (!fs.existsSync(filePath)) {
    cachedCategories = [];
    return cachedCategories;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as CategoriesFile;
  const counts = new Map<string, number>();
  for (const p of getAllProducts()) {
    counts.set(
      p.filterCategorySlug,
      (counts.get(p.filterCategorySlug) ?? 0) + 1,
    );
  }

  cachedCategories = (data.categories ?? []).map((c) => ({
    id: c.slug,
    label: c.name,
    count: counts.get(c.slug) ?? 0,
  }));

  const otherCount = counts.get("other") ?? 0;
  if (otherCount > 0) {
    cachedCategories.push({
      id: "other",
      label: "Other",
      count: otherCount,
    });
  }

  // Buyer-facing order (not export sortOrder) — drinkware first, executive down
  cachedCategories.sort((a, b) => compareCategoryDisplayOrder(a.id, b.id));

  return cachedCategories;
}

export function getSubcategoryFacets(categorySlug?: string): CatalogueFacet[] {
  if (!cachedSubcategories) {
    const filePath = path.join(getExportDataDir(), "categories.json");
    cachedSubcategories = new Map();
    const labelBySub = new Map<string, string>();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(
        fs.readFileSync(filePath, "utf8"),
      ) as CategoriesFile;
      for (const c of data.categories ?? []) {
        for (const s of c.subcategories) {
          labelBySub.set(s.slug, s.name);
        }
      }
    }

    // Build from classified products so noisy export subs (e.g. Coffee)
    // do not appear under Drinkware when emptied by the type overlay.
    const counts = new Map<string, number>();
    for (const p of getAllProducts()) {
      const key = `${p.filterCategorySlug}/${p.subcategorySlug}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const byFilter = new Map<string, CatalogueFacet[]>();
    for (const [key, count] of counts) {
      if (count <= 0) continue;
      const [filterSlug, subSlug] = key.split("/");
      if (!filterSlug || !subSlug) continue;
      const list = byFilter.get(filterSlug) ?? [];
      list.push({
        id: subSlug,
        label: labelBySub.get(subSlug) ?? pSubLabel(subSlug),
        count,
      });
      byFilter.set(filterSlug, list);
    }
    for (const [slug, list] of byFilter) {
      list.sort((a, b) => {
        const rankDelta =
          subcategoryDisplayRank(slug, a.id) -
          subcategoryDisplayRank(slug, b.id);
        if (rankDelta !== 0) return rankDelta;
        return (b.count ?? 0) - (a.count ?? 0);
      });
      cachedSubcategories.set(slug, list);
    }
  }

  if (!categorySlug) return [];
  return cachedSubcategories.get(categorySlug) ?? [];
}

function pSubLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getOccasionFacets(): CatalogueFacet[] {
  if (cachedOccasions) return cachedOccasions;

  const filePath = path.join(getExportDataDir(), "gifting-segments.json");
  if (!fs.existsSync(filePath)) {
    cachedOccasions = [];
    return cachedOccasions;
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as SegmentsFile;
  // Only expose segments that have source matches (honest public facets)
  cachedOccasions = (data.segments ?? [])
    .filter((s) => (s.sourceMatchedProductCount ?? 0) > 0)
    .map((s) => ({
      id: s.id,
      label: s.label,
      count: s.sourceMatchedProductCount,
    }));
  return cachedOccasions;
}

export function getBrandingFacets(): CatalogueFacet[] {
  if (cachedBranding) return cachedBranding;

  const counts = new Map<string, { label: string; count: number }>();
  for (const p of getAllProducts()) {
    if (!p.customization) continue;
    const id = slugifyFacet(p.customization);
    const existing = counts.get(id);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(id, { label: p.customization, count: 1 });
    }
  }

  cachedBranding = [...counts.entries()]
    .map(([id, { label, count }]) => ({ id, label, count }))
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  return cachedBranding;
}

export function getColourFacets(): CatalogueFacet[] {
  if (cachedColours) return cachedColours;

  const counts = new Map<string, { label: string; count: number }>();
  for (const p of getAllProducts()) {
    for (let i = 0; i < p.colours.length; i += 1) {
      const label = p.colours[i];
      const id = p.colourIds[i] ?? slugifyFacet(label);
      const existing = counts.get(id);
      if (existing) existing.count += 1;
      else counts.set(id, { label, count: 1 });
    }
  }

  cachedColours = [...counts.entries()]
    .map(([id, { label, count }]) => ({ id, label, count }))
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  return cachedColours;
}

export function getMaterialFacets(): CatalogueFacet[] {
  if (cachedMaterials) return cachedMaterials;

  const counts = new Map<string, { label: string; count: number }>();
  for (const p of getAllProducts()) {
    for (let i = 0; i < p.materials.length; i += 1) {
      const label = p.materials[i];
      const id = p.materialIds[i] ?? slugifyFacet(label);
      const existing = counts.get(id);
      if (existing) existing.count += 1;
      else counts.set(id, { label, count: 1 });
    }
  }

  cachedMaterials = [...counts.entries()]
    .map(([id, { label, count }]) => ({ id, label, count }))
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  return cachedMaterials;
}

/** Homepage gift-idea keys → catalogue URL params (honest mapping). */
export const HOMEPAGE_OCCASION_MAP: Record<
  string,
  { occasion?: string; category?: string }
> = {
  "employee-onboarding": { occasion: "employee-onboarding" },
  "client-appreciation": {
    occasion: "client-appreciation-event-and-conference",
  },
  "festive-gifting": { occasion: "festival-gifting" },
  "events-conferences": {
    occasion: "client-appreciation-event-and-conference",
  },
  "rewards-recognition": { occasion: "workplace-recognition" },
  "custom-merchandise": { category: "drinkware-barware" },
};
