/**
 * Corporate-buyer taxonomy: product types vs gifting occasions.
 *
 * Product TYPE = physical merchandise group. Runtime filters use the
 * deterministic classifier in `productType.ts` (`filterCategorySlug`),
 * not raw export labels (which can park candles under Drinkware → Coffee).
 *
 * Occasion = buyer journey / use-case (from source-matched gifting segments).
 * Never confuse type filters with occasion filters.
 *
 * Products are NOT duplicated per occasion — occasion membership is a
 * many-to-many mapping via segment slug lists in gifting-segments.json.
 */

export type ProductTypeGroup = {
  id: string;
  label: string;
  /** Export category slugs that belong to this buyer-facing product type. */
  categorySlugs: string[];
  blurb: string;
};

export type OccasionGroup = {
  id: string;
  label: string;
  /** Segment ids from gifting-segments.json (source_match only for public UI). */
  segmentIds: string[];
  blurb: string;
};

/**
 * Recommended product-type groups for corporate buyers.
 * Preserves export category slugs for traceability — does not rename source data.
 */
export const PRODUCT_TYPE_GROUPS: ProductTypeGroup[] = [
  {
    id: "drinkware",
    label: "Drinkware & barware",
    categorySlugs: ["drinkware-barware"],
    blurb: "Bottles, mugs, tumblers and bar accessories.",
  },
  {
    id: "apparel",
    label: "Apparel & lifestyle",
    categorySlugs: ["apparel-lifestyle"],
    blurb: "Polos, tees, outerwear and everyday branded wearables.",
  },
  {
    id: "bags",
    label: "Bags & travel",
    categorySlugs: ["bags-travel"],
    blurb: "Backpacks, totes, travel kits and organisers.",
  },
  {
    id: "tech",
    label: "Tech & gadgets",
    categorySlugs: ["tech-gadgets"],
    blurb: "Chargers, audio, desk tech and branded gadgets.",
  },
  {
    id: "desk-writing",
    label: "Desk & writing",
    // office-stationery leads the group; executive-writing stays available but lower in filter rail
    categorySlugs: ["office-stationery", "executive-writing"],
    blurb: "Pens, notebooks, desk companions and stationery.",
  },
  {
    id: "hampers",
    label: "Hampers & curated sets",
    categorySlugs: ["hampers-gifting"],
    blurb: "Gift sets, festive hampers and gourmet selections.",
  },
  {
    id: "recognition",
    label: "Awards & recognition",
    categorySlugs: ["awards-trophies"],
    blurb: "Trophies, certificates and milestone keepsakes.",
  },
  {
    id: "wellness-eco",
    label: "Wellness & eco",
    categorySlugs: ["wellness-organic", "eco-friendly"],
    blurb: "Self-care, organic and eco-forward merchandise.",
  },
  {
    id: "packaging",
    label: "Packaging",
    categorySlugs: ["packaging"],
    blurb: "Standalone gift boxes and packaging products.",
  },
];

/**
 * Buyer-facing occasion groups. Empty source-match segments stay listed here
 * for IA completeness but must not appear as public facets until verified.
 */
export const OCCASION_GROUPS: OccasionGroup[] = [
  {
    id: "onboarding",
    label: "Employee onboarding",
    segmentIds: ["employee-onboarding"],
    blurb: "Welcome kits and joining gifts for new hires.",
  },
  {
    id: "recognition",
    label: "Rewards & recognition",
    segmentIds: ["workplace-recognition", "employee-recognition"],
    blurb: "Appreciation and achievement gifting.",
  },
  {
    id: "client-events",
    label: "Client appreciation & events",
    segmentIds: ["client-appreciation-event-and-conference"],
    blurb: "Client gifts, conferences and event merchandise.",
  },
  {
    id: "festive",
    label: "Festive & seasonal",
    segmentIds: [
      "festival-gifting",
      "diwali",
      "christmas",
      "new-year",
      "eid",
      "ganesh-chaturthi",
    ],
    blurb: "Festival programmes and seasonal corporate gifting.",
  },
  {
    id: "leadership-premium",
    label: "Leadership & premium",
    segmentIds: [
      "premium-gifting-options",
      "leadership-and-ceo",
      "senior-client-gifting",
    ],
    blurb: "Executive and high-touch relationship gifts.",
  },
  {
    id: "milestones",
    label: "Milestones & farewells",
    segmentIds: [
      "milestone-moment",
      "company-milestone",
      "retirement",
      "retirement-and-farewell",
      "visiting-team-welcome",
    ],
    blurb: "Tenure, farewell and visiting-team moments.",
  },
];

/** Resolve which product-type group owns an export category slug. */
export function productTypeGroupForCategory(
  categorySlug: string,
): ProductTypeGroup | undefined {
  return PRODUCT_TYPE_GROUPS.find((g) =>
    g.categorySlugs.includes(categorySlug),
  );
}

/** Flat list of export category slugs for a product-type group id. */
export function categorySlugsForProductType(typeId: string): string[] {
  return (
    PRODUCT_TYPE_GROUPS.find((g) => g.id === typeId)?.categorySlugs ?? []
  );
}
