/**
 * Homepage Gift Ideas category IA.
 * Imagery from Monkcraft_Corporate_Gifting.pdf slides 6–11.
 * Keep ids stable so enquiry deep-links and catalogue routes stay valid.
 */
export type GiftCategoryImage = {
  src: string;
  alt: string;
};

export type GiftCategory = {
  id: string;
  title: string;
  blurb: string;
  tone: "mint" | "lilac" | "apricot" | "blue" | "buttercream" | "rose";
  /** Omit or set null for a text-led card until an approved asset exists */
  image: GiftCategoryImage | null;
  /** Catalogue deep-link when inventory is live */
  cataloguePath?: string;
};

export const giftCategories: GiftCategory[] = [
  {
    id: "employee-onboarding",
    title: "Employee Onboarding",
    blurb:
      "Branded essentials, thoughtful packaging and a personal welcome.",
    tone: "mint",
    image: {
      src: "/categories/employee-onboarding-v3.jpg",
      alt: "New hire opening a Monkcraft welcome box with hoodie, notebook, and card",
    },
    cataloguePath: "/gifts?occasion=employee-onboarding",
  },
  {
    id: "client-appreciation",
    title: "Client Appreciation",
    blurb:
      "Thoughtful gifts for the relationship, occasion and budget.",
    tone: "lilac",
    image: {
      src: "/categories/client-appreciation-v3.jpg",
      alt: "Client appreciation gift arrangement with premium boxes and branded items",
    },
    cataloguePath:
      "/gifts?occasion=client-appreciation-event-and-conference",
  },
  {
    id: "festive-gifting",
    title: "Festive Gifting",
    blurb:
      "Diwali hampers, personal messages and planned team delivery.",
    tone: "apricot",
    image: {
      src: "/categories/festive-gifting-v3.jpg",
      alt: "Festive corporate hamper with ribboned gift boxes and greeting cards",
    },
    cataloguePath: "/gifts?occasion=festival-gifting",
  },
  {
    id: "events-conferences",
    title: "Events & Conferences",
    blurb:
      "Branded kits for conferences, launches and team gatherings.",
    tone: "blue",
    image: {
      src: "/categories/events-conferences-v3.jpg",
      alt: "Event attendee with branded tote, bottle, and notebook",
    },
    cataloguePath:
      "/gifts?occasion=client-appreciation-event-and-conference",
  },
  {
    id: "rewards-recognition",
    title: "Rewards & Recognition",
    blurb:
      "Recognise milestones with gifts suited to each person and budget.",
    tone: "buttercream",
    image: {
      src: "/categories/rewards-recognition-v3.jpg",
      alt: "Recognition moment with a gift box and certificate celebration",
    },
    cataloguePath: "/gifts?occasion=workplace-recognition",
  },
  {
    id: "custom-merchandise",
    title: "Custom Merchandise",
    blurb:
      "Branded apparel, drinkware and essentials, with options by product.",
    tone: "rose",
    image: {
      src: "/categories/custom-merchandise-v3.jpg",
      alt: "Custom merchandise studio with backpack, jacket, and mug",
    },
    cataloguePath: "/gifts?category=apparel-lifestyle,bags-travel,drinkware-barware",
  },
];

export function getGiftCategoryById(id: string | null | undefined) {
  if (!id) return undefined;
  return giftCategories.find((category) => category.id === id);
}

/**
 * Catalogue occasion facet ids → homepage Gift Ideas ids for enquiry deep-links.
 * Keeps `/?gift=` aligned with `getGiftCategoryById` (not raw facet slugs).
 */
const CATALOGUE_OCCASION_TO_HOMEPAGE_GIFT: Record<string, string> = {
  "employee-onboarding": "employee-onboarding",
  "client-appreciation-event-and-conference": "client-appreciation",
  "festival-gifting": "festive-gifting",
  "workplace-recognition": "rewards-recognition",
};

/** Resolve a homepage gift-idea id from a product occasion or known gift id. */
export function homepageGiftIdFromCatalogueOccasion(
  occasionOrGiftId: string | null | undefined,
): string {
  if (!occasionOrGiftId) return "custom-merchandise";
  if (getGiftCategoryById(occasionOrGiftId)) return occasionOrGiftId;
  return (
    CATALOGUE_OCCASION_TO_HOMEPAGE_GIFT[occasionOrGiftId] ?? "custom-merchandise"
  );
}
