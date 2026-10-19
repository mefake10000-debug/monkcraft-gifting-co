/** Editorial mood lines only. Product names, descriptions and specifications stay source-backed. */
const categoryMoods: Record<string, string> = {
  "executive-writing": "For the next big idea.",
  "drinkware-barware": "Good sips. Good company.",
  "tech-gadgets": "A little tech energy.",
  "bags-travel": "Take the good energy with you.",
  "apparel-lifestyle": "Team spirit, your way.",
  "wellness-organic": "A moment for you.",
  "eco-friendly": "A thoughtful little gesture.",
  "hampers-gifting": "Cue the unboxing.",
  "office-stationery": "Fresh ideas, meet fresh stationery.",
  "awards-trophies": "Big win. Well earned.",
  packaging: "The first impression starts here.",
};

export function productMoodLine(categorySlug?: string): string {
  const key = (categorySlug ?? "").toLowerCase().trim().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-");
  return categoryMoods[key] ?? "A little something, a lot of thought.";
}

const IMPORTED_GENERIC_SUFFIX = " — personalise with your logo. Corporate & bulk gifting by Monkcraft with pan-India delivery and volume pricing.";

/** Replace only the exact imported marketing template; preserve genuine product copy verbatim. */
export function buyerProductIntro(summary: string, name: string, category?: string): string {
  return summary.trim() === `${name.trim()}${IMPORTED_GENERIC_SUFFIX}`
    ? productMoodLine(category)
    : summary;
}
