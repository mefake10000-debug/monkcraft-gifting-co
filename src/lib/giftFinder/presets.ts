/** Client-safe preference / branding presets for Smart Gift Finder. */

export const PREFERENCE_PRESETS: {
  id: string;
  label: string;
  categorySlug?: string;
  keywords?: string[];
}[] = [
  {
    id: "drinkware",
    label: "Drinkware",
    categorySlug: "drinkware-barware",
  },
  {
    id: "apparel",
    label: "Apparel",
    categorySlug: "apparel-lifestyle",
  },
  {
    id: "bags",
    label: "Bags & travel",
    categorySlug: "bags-travel",
  },
  {
    id: "tech",
    label: "Tech",
    categorySlug: "tech-gadgets",
  },
  {
    id: "stationery",
    label: "Stationery",
    categorySlug: "office-stationery",
    keywords: ["notebook", "pen"],
  },
  {
    id: "hampers",
    label: "Hampers",
    categorySlug: "hampers-gifting",
  },
  {
    id: "wellness",
    label: "Wellness",
    categorySlug: "wellness-organic",
  },
  {
    id: "eco",
    label: "Eco-friendly",
    categorySlug: "eco-friendly",
  },
];

export const BRANDING_OPTIONS = [
  { id: "none", label: "No branding needed" },
  { id: "logo", label: "Company logo" },
  { id: "print", label: "Print / embroidery / engraving" },
  { id: "undecided", label: "Not sure yet" },
] as const;
