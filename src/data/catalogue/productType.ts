/**
 * Deterministic product-TYPE classifier (non-destructive overlay).
 *
 * Separates physical merchandise type from gifting OCCASION.
 * Export categorySlug/categoryName stay as provenance; UI filters and
 * Gift Finder use `filterCategorySlug` derived here.
 *
 * Rules use only verified fields: name, export category, subcategory.
 * Never invents products, prices, or occasion membership.
 */

export type ProductTypeId =
  | "apparel"
  | "drinkware"
  | "bags"
  | "tech"
  | "desk-writing"
  | "hampers"
  | "recognition"
  | "wellness-eco"
  | "packaging"
  | "other";

export type TypeConfidence = "high" | "medium" | "low";

/** Inputs needed from the export-mapped product (pre-overlay). */
export type ProductTypeInput = {
  name: string;
  categorySlug: string;
  categoryName: string;
  subcategorySlug: string;
  subcategoryName: string;
};

export type ProductTypeClassification = {
  typeId: ProductTypeId;
  /** Buyer-facing type label */
  typeLabel: string;
  /**
   * Category slug used by `?category=` filters and Gift Finder.
   * Matches export slugs where possible; `other` for weak/ambiguous SKUs.
   */
  filterCategorySlug: string;
  filterCategoryName: string;
  confidence: TypeConfidence;
  /** Stable rule id for audits */
  ruleId: string;
  /** True when filter category differs from export category */
  remapped: boolean;
};

type RuleMatch = {
  typeId: ProductTypeId;
  confidence: TypeConfidence;
  ruleId: string;
};

const TYPE_META: Record<
  ProductTypeId,
  { label: string; filterSlug: string; filterName: string }
> = {
  apparel: {
    label: "Apparel & lifestyle",
    filterSlug: "apparel-lifestyle",
    filterName: "Apparel & Lifestyle",
  },
  drinkware: {
    label: "Drinkware & barware",
    filterSlug: "drinkware-barware",
    filterName: "Drinkware & Barware",
  },
  bags: {
    label: "Bags & travel",
    filterSlug: "bags-travel",
    filterName: "Bags & Travel",
  },
  tech: {
    label: "Tech & gadgets",
    filterSlug: "tech-gadgets",
    filterName: "Tech & Gadgets",
  },
  "desk-writing": {
    label: "Desk & writing",
    filterSlug: "executive-writing",
    filterName: "Executive Writing",
  },
  hampers: {
    label: "Hampers & curated sets",
    filterSlug: "hampers-gifting",
    filterName: "Hampers & Gifting",
  },
  recognition: {
    label: "Awards & recognition",
    filterSlug: "awards-trophies",
    filterName: "Awards & Trophies",
  },
  "wellness-eco": {
    label: "Wellness & eco",
    filterSlug: "wellness-organic",
    filterName: "Wellness & Organic",
  },
  packaging: {
    label: "Packaging",
    filterSlug: "packaging",
    filterName: "Packaging",
  },
  other: {
    label: "Other",
    filterSlug: "other",
    filterName: "Other",
  },
};

/** Export category slug → default type when subcategory is trusted. */
const EXPORT_DEFAULT_TYPE: Record<string, ProductTypeId> = {
  "apparel-lifestyle": "apparel",
  "drinkware-barware": "drinkware",
  "bags-travel": "bags",
  "tech-gadgets": "tech",
  "executive-writing": "desk-writing",
  "office-stationery": "desk-writing",
  "hampers-gifting": "hampers",
  "awards-trophies": "recognition",
  "wellness-organic": "wellness-eco",
  "eco-friendly": "wellness-eco",
  packaging: "packaging",
};

/**
 * Subcategories trusted to inherit export category without a title keyword.
 * Noisy buckets (drinkware/coffee, drinkware/barware) are NOT listed.
 */
/** Actual export subcategory slugs (from categories.json / products). */
const TRUSTED_SUBCATEGORIES: Record<string, Set<string>> = {
  "drinkware-barware": new Set(["bottles", "mugs", "tumblers", "coffee"]),
  "apparel-lifestyle": new Set([
    "polos-tees",
    "formal",
    "accessories",
    "scarves-stoles",
  ]),
  "bags-travel": new Set(["backpacks", "totes", "travel", "wallets", "lunch-bags"]),
  "tech-gadgets": new Set(["chargers", "audio", "desk-tech", "wearables", "home-appliances"]),
  "executive-writing": new Set([
    "pens",
    "notebooks",
    "journals",
    "desk-companions",
  ]),
  "office-stationery": new Set([
    "notebooks-planners",
    "organisers",
    "stationery",
    "office-essentials",
  ]),
  "awards-trophies": new Set([
    "trophies",
    "shields",
    "custom-awards",
    "certificates-frames",
  ]),
  "hampers-gifting": new Set([
    "gift-sets",
    "festive-hampers",
    "gourmet",
    "chocolate-confectionery",
  ]),
  "wellness-organic": new Set([
    "self-care",
    "plants-green",
    "tea-infusions",
  ]),
  "eco-friendly": new Set(["recycled", "upcycled"]),
  packaging: new Set(["gift-boxes", "food-bakery-boxes"]),
};

/** Desk/stationery export slugs that share the desk-writing type. */
const DESK_EXPORT_SLUGS = new Set(["executive-writing", "office-stationery"]);
const WELLNESS_EXPORT_SLUGS = new Set(["wellness-organic", "eco-friendly"]);

function finalize(
  match: RuleMatch,
  input: ProductTypeInput,
): ProductTypeClassification {
  const typeId = match.typeId;
  let filterSlug = TYPE_META[typeId].filterSlug;
  let filterName = TYPE_META[typeId].filterName;

  // Preserve desk / wellness export split when type matches that family
  if (typeId === "desk-writing" && DESK_EXPORT_SLUGS.has(input.categorySlug)) {
    filterSlug = input.categorySlug;
    filterName = input.categoryName;
  }
  if (
    typeId === "wellness-eco" &&
    WELLNESS_EXPORT_SLUGS.has(input.categorySlug)
  ) {
    filterSlug = input.categorySlug;
    filterName = input.categoryName;
  }

  // Remapped desk-writing with no desk export home → office-stationery
  if (
    typeId === "desk-writing" &&
    !DESK_EXPORT_SLUGS.has(input.categorySlug) &&
    filterSlug === "executive-writing"
  ) {
    // Prefer office-stationery for remapped desk items unless pen-like
    if (/\b(pen|pencil|fountain|ballpoint|rollerball)\b/i.test(input.name)) {
      filterSlug = "executive-writing";
      filterName = "Executive Writing";
    } else {
      filterSlug = "office-stationery";
      filterName = "Office & Stationery";
    }
  }

  const remapped = filterSlug !== input.categorySlug;

  return {
    typeId,
    typeLabel: TYPE_META[typeId].label,
    filterCategorySlug: filterSlug,
    filterCategoryName: filterName,
    confidence: match.confidence,
    ruleId: match.ruleId,
    remapped,
  };
}

function matchKeywordRules(name: string): RuleMatch | null {
  const t = name.toLowerCase();

  // --- Explicit exclusions / multi-signal combos (order matters) ---

  // Resolve the physical item before its printed theme. "Plant a Tree" and
  // "Garden" are common artwork names on ordinary coasters, books and pens.
  if (/\bcoasters?\b/.test(t)) {
    return { typeId: "drinkware", confidence: "high", ruleId: "kw-product-form-coaster" };
  }
  if (/\b(visionbooks?|calendars?|notebooks?|journals?|planners?|diaries|pencils?|pens?)\b/.test(t)) {
    return { typeId: "desk-writing", confidence: "high", ruleId: "kw-product-form-desk-writing" };
  }

  // Electric coffee makers and grinders are appliances. Manual presses remain
  // in drinkware because they are beverage service products.
  if (/\b(coffee\s?(?:makers?|machines?|grinders?)|espresso\s?(?:makers?|machines?)|electric\s?frothers?)\b/.test(t)) {
    return { typeId: "tech", confidence: "high", ruleId: "kw-coffee-appliance" };
  }

  // Food containers belong with lunch bags, not drinkware or stationery.
  if (/\b(lunch\s?box(?:es)?|lunchbox|tiffin|bento|meal\s?box(?:es)?)\b/.test(t)) {
    return { typeId: "bags", confidence: "high", ruleId: "kw-lunch-container" };
  }
  if (/\b(glasafe.*combo|carry\s?and\s?go\s?combo|eat\s?light\s?combo)\b/.test(t)) {
    return { typeId: "bags", confidence: "high", ruleId: "kw-meal-kit" };
  }

  // Coffee preparation and service products are drinkware-adjacent.
  if (/\b(coffee\s?(?:makers?|machines?|grinders?|frothers?)|espresso|french\s?press|pour[- ]over|mixology|vacuum\s?canister)\b/.test(t)) {
    return { typeId: "drinkware", confidence: "high", ruleId: "kw-coffee-service" };
  }

  // Small desk accessories were frequently exported under unrelated types.
  if (/\b(fridge\s?magnets?|snapdot|pin\s?badges?)\b/.test(t)) {
    return { typeId: "desk-writing", confidence: "high", ruleId: "kw-desk-accessory" };
  }

  // Artwork names such as “Plant a Tree” must not override the physical item.
  if (/\b(canvas\s+)?tote\s+bags?\b/.test(t)) {
    return { typeId: "bags", confidence: "high", ruleId: "kw-product-form-tote" };
  }
  if (/\bpixel\s?pads?\b/.test(t)) {
    return { typeId: "desk-writing", confidence: "high", ruleId: "kw-product-form-pixelpad" };
  }

  if (/\b(full\s?body\s?trimmers?|beard\s?trimmers?|groin\s?trimmers?|headshavers?|shavers?)\b/.test(t)) {
    return { typeId: "wellness-eco", confidence: "high", ruleId: "kw-personal-care" };
  }

  if (/\b(stress\s?balls?|cork\s?stress)\b/.test(t)) {
    return { typeId: "wellness-eco", confidence: "high", ruleId: "kw-stress-relief" };
  }

  if (/\b(baby\s?rattles?|rattle\s?gift\s?set)\b/.test(t)) {
    return { typeId: "hampers", confidence: "high", ruleId: "kw-baby-gift-set" };
  }

  if (/\b(tic\s?tac\s?toe|brainvita|game\s?box|desk\s?game)\b/.test(t)) {
    return { typeId: "desk-writing", confidence: "high", ruleId: "kw-desk-game" };
  }

  if (/\b(ring\s?lights?|video\s?lights?|string\s?lights?|chain\s?lights?|led\s?lamps?|desk\s?lamps?|desk\s?vacuums?|golden\s?crystal)\b/.test(t)) {
    return { typeId: "tech", confidence: "high", ruleId: "kw-tech-lighting" };
  }

  if (/\b(trophy|award|plaque|medal|certificate|memento)\b/.test(t)) {
    return { typeId: "recognition", confidence: "high", ruleId: "kw-award" };
  }

  // Desk combos that mention tumbler/mug but are lamps / hubs / organisers
  if (
    /\b(lamp|usb\s?hub|wireless\s?charger|mobile\s?stand|power\s?glow|pen\s?zen|podium)\b/.test(
      t,
    ) &&
    /\b(tumbler|mug)\b/.test(t)
  ) {
    return {
      typeId: "desk-writing",
      confidence: "high",
      ruleId: "kw-desk-combo-tumbler",
    };
  }

  // Cup warmer + charger gadgets → tech
  if (/\bcup\s?warmer\b/.test(t) && /\bcharg/.test(t)) {
    return { typeId: "tech", confidence: "high", ruleId: "kw-cup-warmer-tech" };
  }

  // Lunch bags → bags (not drinkware)
  if (/\blunch\s?bag\b/.test(t)) {
    return { typeId: "bags", confidence: "high", ruleId: "kw-lunch-bag" };
  }

  // Candles and diyas are home / wellness products, never drinkware.
  if (/\b(candle|candles|diya)\b/.test(t)) {
    return { typeId: "wellness-eco", confidence: "high", ruleId: "kw-candle-wellness" };
  }

  // Plants / grow kits → wellness-eco
  if (
    /\b(plant|grow\s?kit|seed\s?starter|garden|syngonium|sansevieria|money\s?plant|jade\s?plant|bamboo\s?plant|planter|vase)\b/.test(
      t,
    ) && !/\bmugs?\b/.test(t)
  ) {
    return {
      typeId: "wellness-eco",
      confidence: "high",
      ruleId: "kw-plant-wellness",
    };
  }

  // Home appliances wrongly parked in drinkware or office stationery.
  if (
    /\b(air\s?fryer|airfryer|vacuum\s?cleaner|garment\s?steamer|hair\s?dryer|trimmer|shaver|microwave|oven\s?toaster|otg\b|cookware|chopper|sandwich\s?grill|toaster|juicer|mixer\s?grinder|nutri-?blend|nutri\s?mixer|blender|kettle|coffee\s?maker|coffee\s?machine|espresso|french\s?press|milk\s?frother|hand\s?blender|peeler|cook\s?pot|multicooker|steamer|fridge\s?magnet|string\s?light|chain\s?light|led\s|rattle|tic\s?tac\s?toe|stress\s?ball|headshaver|groin\s?trimmer)\b/.test(
      t,
    )
  ) {
    // Coffee makers were handled above as drinkware / coffee preparation.
    if (
      /\b(coffee\s?maker|coffee\s?machine|espresso|french\s?press|milk\s?frother)\b/.test(
        t,
      )
    ) {
      return { typeId: "drinkware", confidence: "high", ruleId: "kw-coffee-service" };
    }
    if (
      /\b(blender|kettle|juicer|mixer|chopper|toaster|air\s?fryer|airfryer|oven|microwave|cookware|steamer|vacuum|trimmer|shaver|dryer|purifier|peeler)\b/.test(
        t,
      )
    ) {
      return { typeId: "tech", confidence: "high", ruleId: "kw-home-appliance" };
    }
    return { typeId: "other", confidence: "high", ruleId: "kw-home-misc-other" };
  }

  // --- Strong merchandise types (bags before drinkware to avoid
  // "Bottle Green" / "Hydration Backpack" colour & bag false positives) ---

  if (
    /\b(trophy|award|plaque|medal|certificate|memento)\b/.test(t)
  ) {
    return {
      typeId: "recognition",
      confidence: "high",
      ruleId: "kw-award",
    };
  }

  if (
    /\b(polo|t-?shirt|tshirt|\btee\b|hoodie|sweatshirt|jacket|windcheater|raincoat|beanie|\bcaps?\b|\bhats?\b|socks?|jersey|apparel|kurta|blouse|apron|scarf|gloves?|shorts?|trouser)\b/.test(
      t,
    )
  ) {
    return { typeId: "apparel", confidence: "high", ruleId: "kw-apparel" };
  }

  if (
    /\b(backpack|tote|duffel|duffle|luggage|sling|messenger|briefcase|pouch|satchel|wallet|organiser\s?pouch|organizer\s?pouch|travel\s?kit|toiletry|trolley|suitcase|crossbody|cross\s?body|holdall|cabin\s?bag|laptop\s?sleeve|bottle\s?holder|\bbag\b)\b/.test(
      t,
    )
  ) {
    return { typeId: "bags", confidence: "high", ruleId: "kw-bags" };
  }

  // Drinkware: avoid colourways like "Bottle Green" and bag accessories
  if (
    /\b(mugs?|tumblers?|flasks?|sippers?|canteen|thermos|drinkware|barware|decanter|carafe|stemware|shot\s?glass|wine\s?glass|beer\s?mug|water\s?bottle|travel\s?mug|coffee\s?mug|coasters?|kulhad|chai\s?cup|tea\s?cup|husk\s?chai|jugmug)\b/.test(
      t,
    ) ||
    /\bbottles?(?!\s+(?:green|blue|black|white|red|pink|grey|gray|navy|olive|maroon|orange|yellow|purple|teal|warmer))\b/.test(
      t,
    )
  ) {
    return { typeId: "drinkware", confidence: "high", ruleId: "kw-drinkware" };
  }

  if (
    /\b(charger|power\s?bank|earbud|earbuds|headphone|headphones|speaker|bluetooth|webcam|gadget|wireless\s?mouse|keyboard|usb\s?hub|usb-c|adapter|smart\s?watch|earphone)\b/.test(
      t,
    )
  ) {
    return { typeId: "tech", confidence: "high", ruleId: "kw-tech" };
  }

  if (
    /\b(fountain\s?pen|ballpoint|rollerball|\bpens?\b|pencil|notebook|diary|journal|notepad|planner|stationery|mouse\s?pad|card\s?holder|lanyard|keychain|key\s?chain|highlighter|stapler)\b/.test(
      t,
    )
  ) {
    return {
      typeId: "desk-writing",
      confidence: "high",
      ruleId: "kw-desk",
    };
  }

  if (
    /\b(hamper|gift\s?set|gourmet|curated|festive\s?box|diwali\s+.*gift\s?box|\d+-in-1\s+gift\s?box)\b/.test(
      t,
    )
  ) {
    return { typeId: "hampers", confidence: "medium", ruleId: "kw-hamper" };
  }

  // Packaging is determined by the trusted source category below. Product
  // names often mention an included gift box or packaging, which must not
  // reclassify the actual gift as packaging.

  if (
    /\b(yoga|wellness|organic|aromatherapy|diffuser|massage|spa|self-?care|soap|lotion)\b/.test(
      t,
    )
  ) {
    return {
      typeId: "wellness-eco",
      confidence: "medium",
      ruleId: "kw-wellness",
    };
  }

  // Speakers / clocks without other signals
  if (/\b(speaker|digital\s?clock|desk\s?lamp|torch)\b/.test(t)) {
    return { typeId: "tech", confidence: "medium", ruleId: "kw-tech-soft" };
  }

  return null;
}

/**
 * Classify a product into a definite merchandise type for filtering.
 * Export labels are provenance only when they conflict with name evidence.
 */
export function classifyProductType(
  input: ProductTypeInput,
): ProductTypeClassification {
  const keyword = matchKeywordRules(input.name);
  const exportType = EXPORT_DEFAULT_TYPE[input.categorySlug];
  const trustedSubs = TRUSTED_SUBCATEGORIES[input.categorySlug];
  const subTrusted = Boolean(
    trustedSubs?.has(input.subcategorySlug),
  );

  // Keyword wins when it conflicts with export (fixes candles-in-drinkware)
  if (keyword) {
    if (!exportType || keyword.typeId === exportType) {
      return finalize(keyword, input);
    }
    // Conflict: prefer keyword (high/medium) over noisy export
    if (keyword.confidence === "high" || keyword.confidence === "medium") {
      return finalize(
        { ...keyword, ruleId: `${keyword.ruleId}+override-export` },
        input,
      );
    }
  }

  // Trusted subcategory + export → keep (bottles/mugs/tumblers etc.)
  if (exportType && subTrusted) {
    return finalize(
      {
        typeId: exportType,
        confidence: keyword ? "high" : "medium",
        ruleId: keyword
          ? `export-trusted-sub+${keyword.ruleId}`
          : "export-trusted-sub",
      },
      input,
    );
  }

  // Noisy export buckets without a confirming keyword → Other
  if (
    input.categorySlug === "drinkware-barware" &&
    (input.subcategorySlug === "coffee" ||
      input.subcategorySlug === "barware")
  ) {
    if (keyword && keyword.typeId === "drinkware") {
      return finalize(keyword, input);
    }
    return finalize(
      {
        typeId: keyword?.typeId ?? "other",
        confidence: keyword ? keyword.confidence : "low",
        ruleId: keyword
          ? `noisy-drinkware-sub+${keyword.ruleId}`
          : "noisy-drinkware-sub-other",
      },
      input,
    );
  }

  // Soft keyword agreeing with export
  if (keyword && exportType && keyword.typeId === exportType) {
    return finalize(keyword, input);
  }

  // Fall back to export type with low confidence when no keyword
  if (exportType && !keyword) {
    return finalize(
      {
        typeId: exportType,
        confidence: "low",
        ruleId: "export-fallback-low",
      },
      input,
    );
  }

  if (keyword) {
    return finalize(keyword, input);
  }

  return finalize(
    { typeId: "other", confidence: "low", ruleId: "unclassified-other" },
    input,
  );
}

/** Whether a product should appear in a strict `?category=` view. */
export function productMatchesCategoryFilter(
  filterCategorySlug: string,
  classification: Pick<
    ProductTypeClassification,
    "filterCategorySlug" | "confidence"
  >,
  options?: { includeLowConfidence?: boolean },
): boolean {
  if (classification.filterCategorySlug !== filterCategorySlug) {
    return false;
  }
  if (
    !options?.includeLowConfidence &&
    classification.confidence === "low" &&
    filterCategorySlug !== "other"
  ) {
    // Low-confidence keep-export items still appear in their filter slug,
    // but noisy remaps to other are already excluded above.
    // For strict major categories we allow medium+ and also low when
    // filter slug matches (export-fallback on clean categories).
    return true;
  }
  return true;
}

export function getProductTypeMeta(typeId: ProductTypeId) {
  return TYPE_META[typeId];
}

export const PRODUCT_TYPE_IDS = Object.keys(TYPE_META) as ProductTypeId[];
