/**
 * Buyer-facing display order for catalogue category filters and
 * featured/recommended sort (full catalogue + within-type heroes).
 *
 * Does NOT change `filterCategorySlug` classification — only order/rank.
 * Rules use genuine name / subcategory fields only.
 *
 * Unfiltered featured sort: FILTER_CATEGORY_DISPLAY_ORDER, then
 * categoryHeroRank within each type. Filter rail uses the same order.
 */

/** Product-type filter rail order (drinkware first; executive near end). */
export const FILTER_CATEGORY_DISPLAY_ORDER: readonly string[] = [
  "drinkware-barware",
  "apparel-lifestyle",
  "bags-travel",
  "tech-gadgets",
  "office-stationery",
  "hampers-gifting",
  "awards-trophies",
  "wellness-organic",
  "eco-friendly",
  "packaging",
  "executive-writing",
  "other",
] as const;

const categoryRank = new Map(
  FILTER_CATEGORY_DISPLAY_ORDER.map((slug, index) => [slug, index]),
);

export function categoryDisplayRank(slug: string): number {
  return categoryRank.get(slug) ?? FILTER_CATEGORY_DISPLAY_ORDER.length + 50;
}

export function compareCategoryDisplayOrder(a: string, b: string): number {
  const delta = categoryDisplayRank(a) - categoryDisplayRank(b);
  if (delta !== 0) return delta;
  return a.localeCompare(b);
}

/**
 * Preferred subcategory facet order within each filter category.
 * Unknown subs sort after known ones (by count still applied as secondary).
 */
export const SUBCATEGORY_DISPLAY_ORDER: Readonly<
  Record<string, readonly string[]>
> = {
  "drinkware-barware": ["bottles", "mugs", "tumblers", "barware", "coffee"],
  "apparel-lifestyle": [
    "polos-tees",
    "formal",
    "scarves-stoles",
    "accessories",
  ],
  "tech-gadgets": ["audio", "chargers", "desk-tech", "wearables"],
  "bags-travel": ["backpacks", "totes", "travel", "wallets"],
  "executive-writing": ["pens", "notebooks", "journals", "desk-companions"],
  "office-stationery": [
    "notebooks-planners",
    "stationery",
    "organisers",
    "office-essentials",
  ],
  "hampers-gifting": [
    "gift-sets",
    "festive-hampers",
    "gourmet",
    "chocolate-confectionery",
  ],
  "awards-trophies": [
    "trophies",
    "shields",
    "custom-awards",
    "certificates-frames",
  ],
  "wellness-organic": ["self-care", "tea-infusions", "plants-green"],
  "eco-friendly": ["recycled", "upcycled"],
  packaging: ["gift-boxes", "food-bakery-boxes"],
};

export function subcategoryDisplayRank(
  categorySlug: string,
  subSlug: string,
): number {
  const order = SUBCATEGORY_DISPLAY_ORDER[categorySlug];
  if (!order) return 100;
  const idx = order.indexOf(subSlug);
  return idx === -1 ? 80 : idx;
}

/** Avoid colourway false-positives like "Bottle Green". */
const BOTTLE_NAME_RE =
  /\bbottles?(?!\s+(?:green|blue|black|white|red|pink|grey|gray|navy|olive|maroon|orange|yellow|purple|teal|warmer))\b/;

export type HeroRankProduct = {
  filterCategorySlug: string;
  subcategorySlug: string;
  subcategoryName: string;
  name: string;
};

/**
 * Lower = earlier in featured results within that product type.
 * Deterministic keyword / subcategory rules on verified fields only.
 */
export function categoryHeroRank(product: HeroRankProduct): number {
  const cat = product.filterCategorySlug;
  const name = product.name.toLowerCase();
  const sub = product.subcategorySlug.toLowerCase();
  const subName = product.subcategoryName.toLowerCase();
  const blob = `${name} ${sub} ${subName}`;

  switch (cat) {
    case "drinkware-barware": {
      if (
        sub === "bottles" ||
        BOTTLE_NAME_RE.test(name) ||
        /\bwater\s?bottle\b/.test(name)
      ) {
        return 0;
      }
      if (/\bcoasters?\b/.test(blob)) return 10;
      if (sub === "mugs" || /\bmugs?\b/.test(name)) return 20;
      if (sub === "tumblers" || /\btumblers?\b/.test(name)) return 30;
      if (/\b(flask|thermos|canteen|sipper)\b/.test(name)) return 40;
      return 50;
    }
    case "apparel-lifestyle": {
      if (/\bpolos?\b/.test(name)) return 0;
      if (sub === "polos-tees") return 10;
      if (/\b(hoodie|sweatshirt)\b/.test(name)) return 20;
      if (sub === "formal" || /\b(shirt|blazer)\b/.test(name)) return 30;
      if (/\b(cap|hat|beanie)\b/.test(name)) return 40;
      return 50;
    }
    case "tech-gadgets": {
      if (/\bspeakers?\b/.test(name)) return 0;
      if (
        sub === "audio" ||
        /\b(earbud|earbuds|headphone|headphones|earphone)\b/.test(name)
      ) {
        return 10;
      }
      if (sub === "chargers" || /\b(charger|power\s?bank)\b/.test(name)) {
        return 20;
      }
      if (sub === "desk-tech") return 30;
      if (sub === "wearables") return 40;
      return 50;
    }
    case "bags-travel": {
      if (sub === "backpacks" || /\bbackpack\b/.test(name)) return 0;
      if (sub === "totes" || /\btote\b/.test(name)) return 10;
      if (sub === "travel" || /\b(duffel|duffle|luggage|cabin\s?bag)\b/.test(name)) {
        return 20;
      }
      if (sub === "wallets" || /\bwallet\b/.test(name)) return 30;
      return 40;
    }
    case "executive-writing":
    case "office-stationery": {
      if (
        sub === "pens" ||
        /\b(pens?|ballpoint|rollerball|fountain)\b/.test(name)
      ) {
        return 0;
      }
      if (
        sub === "notebooks" ||
        sub === "notebooks-planners" ||
        /\bnotebook\b/.test(name)
      ) {
        return 10;
      }
      if (sub === "journals" || /\bjournal\b/.test(name)) return 20;
      if (sub === "desk-companions") return 30;
      return 40;
    }
    case "hampers-gifting": {
      if (sub === "gift-sets" || /\bgift\s?set\b/.test(name)) return 0;
      if (sub === "festive-hampers" || /\bhamper\b/.test(name)) return 10;
      if (sub === "gourmet") return 20;
      return 30;
    }
    case "awards-trophies": {
      if (sub === "trophies" || /\btroph(y|ies)\b/.test(name)) return 0;
      if (sub === "shields") return 10;
      if (sub === "custom-awards") return 20;
      return 30;
    }
    case "wellness-organic": {
      if (sub === "self-care") return 0;
      if (sub === "tea-infusions") return 10;
      if (sub === "plants-green") return 20;
      return 30;
    }
    case "eco-friendly": {
      if (sub === "recycled") return 0;
      if (sub === "upcycled") return 10;
      return 20;
    }
    case "packaging": {
      if (sub === "gift-boxes" || /\bgift\s?box(?:es)?\b/.test(name)) return 0;
      return 10;
    }
    default:
      return 100;
  }
}
