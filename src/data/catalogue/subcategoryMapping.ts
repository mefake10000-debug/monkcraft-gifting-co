/** Buyer-facing subcategory cleanup for source taxonomy spillover. */
export type BuyerSubcategory = { slug: string; name: string };

const VALID_SUBCATEGORIES: Record<string, Set<string>> = {
  "drinkware-barware": new Set(["bottles", "mugs", "tumblers", "barware", "coffee", "coasters"]),
  "apparel-lifestyle": new Set(["polos-tees", "formal", "scarves-stoles", "accessories", "outerwear", "headwear", "hoodies-sweatshirts", "sportswear", "rainwear", "kids-schoolwear"]),
  "bags-travel": new Set(["backpacks", "totes", "wallets", "lunch-bags", "pouches-organisers", "laptop-bags", "luggage", "crossbody-bags", "travel-accessories", "travel-sets", "handbags", "briefcases", "sports-bags", "reusable-bags", "other-bags"]),
  "tech-gadgets": new Set(["audio", "chargers", "desk-tech", "wearables", "tech-bundles", "home-appliances"]),
  "office-stationery": new Set(["notebooks-planners", "stationery", "organisers", "office-essentials", "calendars", "card-holders", "keychains", "wristbands"]),
  "hampers-gifting": new Set(["gift-sets", "festive-hampers", "gourmet", "chocolate-confectionery", "gift-boxes"]),
  "awards-trophies": new Set(["trophies", "shields", "custom-awards", "certificates-frames"]),
  "wellness-organic": new Set(["self-care", "tea-infusions", "plants-green", "other-wellness"]),
  "eco-friendly": new Set(["recycled", "upcycled"]),
  packaging: new Set(["gift-boxes", "food-bakery-boxes", "gift-sets", "upcycled"]),
  "executive-writing": new Set(["pens", "notebooks", "journals", "desk-companions", "gift-sets"]),
  other: new Set(["seasonal-decor"]),
};

const LABELS: Record<string, string> = {
  "polos-tees": "Polos & Tees",
  "scarves-stoles": "Scarves & Stoles",
  "notebooks-planners": "Notebooks & Planners",
  coasters: "Coasters",
  "drinkware-accessories": "Drinkware Accessories",
  "lunch-bags": "Lunch Bags",
  "pouches-organisers": "Pouches & Organisers",
  "laptop-bags": "Laptop Bags & Sleeves",
  luggage: "Luggage & Duffels",
  "crossbody-bags": "Crossbody & Sling Bags",
  "travel-accessories": "Travel Accessories",
  "travel-sets": "Travel Sets & Kits",
  "other-bags": "Other Bags & Travel Gear",
  handbags: "Handbags",
  briefcases: "Briefcases & Messenger Bags",
  "sports-bags": "Sports & Equipment Bags",
  "reusable-bags": "Reusable & Fabric Bags",
  headwear: "Caps & Headwear",
  "hoodies-sweatshirts": "Hoodies & Sweatshirts",
  sportswear: "Sportswear & Jerseys",
  rainwear: "Rainwear",
  "kids-schoolwear": "Kids & Schoolwear",
  calendars: "Calendars",
  "card-holders": "Card & ID Holders",
  keychains: "Keychains",
  wristbands: "Wristbands",
  outerwear: "Outerwear",
  "tech-bundles": "Technology Sets",
  "other-wellness": "Wellness & Care",
  "home-appliances": "Home Appliances",
  "seasonal-decor": "Seasonal Décor",
};

function fromSlug(slug: string): BuyerSubcategory {
  return {
    slug,
    name: LABELS[slug] ?? slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
  };
}

/** Keep source taxonomy when it fits; repair obvious cross-category leakage by product identity. */
export function resolveBuyerSubcategory(
  category: string,
  sourceSubcategory: string,
  productName: string,
): BuyerSubcategory {
  const name = productName.toLocaleLowerCase();
  const valid = VALID_SUBCATEGORIES[category];

  if (category === "drinkware-barware") {
    if (/\b(coffee\s?(?:makers?|machines?|grinders?|frothers?)|espresso|french\s?press|pour[- ]over|mixology|vacuum\s?canister)\b/.test(name)) return fromSlug("coffee");
    if (/\bcoasters?\b/.test(name)) return fromSlug("coasters");
    if (/\b(wine\s+glass|whisky|whiskey|cocktail|decanter|bar\s+set|beer\s+glass|shaker)\b/.test(name)) return fromSlug("barware");
    if (/\bwater\s*bottles?\b|\bbottles?\b/.test(name)) return fromSlug("bottles");
    if (/\bmugs?\b|\bcups?\b/.test(name)) return fromSlug("mugs");
    if (/\btumblers?\b|\bsippers?\b/.test(name)) return fromSlug("tumblers");
  }

  if (category === "bags-travel") {
    if (/\blunch\s*(?:bags?|box(?:es)?)\b|\blunchbox\b|\btiffin\b|\bbento\b|\bmeal\s*box(?:es)?\b|\bcarry\s?and\s?go\s?combo\b|\beat\s?light\s?combo\b/.test(name) && !/\b(backpacks?|laptop\s+bags?)\b/.test(name)) return fromSlug("lunch-bags");
    if (/\b(wallets?|card\s*holders?)\b/.test(name)) return fromSlug("wallets");
    if (/\b(totes?|jute\s+bags?|cotton\s+bags?|canvas\s+bags?|drawstring\s+bags?|felt\s+bags?)\b/.test(name)) return fromSlug("totes");
    if (/\bbackpacks?\b/.test(name)) return fromSlug("backpacks");
    if (/\b(pouch(?:es)?|digipouches?|organi[sz]ers?|tech\s*roll|toiletry|packing\s+cubes?|wash\s*bags?|document\s+storage|sterilization\s+bags?)\b/.test(name)) return fromSlug("pouches-organisers");
    if (/\b(laptop\s*(?:bags?|sleeves?|cases?)|tablet\s*(?:sleeves?|covers?)|slimcases?|messenger\s*bags?)\b/.test(name)) return fromSlug("laptop-bags");
    if (/\b(briefcases?|messengers?|folios?|conference\s+bags?)\b/.test(name)) return fromSlug("briefcases");
    if (/\b(sports?\s+bags?|gym\s+bags?|saddlebags?|motorcycle\s+(?:tank\s+)?bags?|equipment\s+bags?)\b/.test(name)) return fromSlug("sports-bags");
    if (/\b(duffels?|duffles?|trolleys?|suitcases?|luggage|trunks?|cabins?|check[- ]?in|carry[- ]?on|overnighters?)\b/.test(name)) return fromSlug("luggage");
    if (/\b(cross\s*bodies|crossbody|slings?|sling\s*bags?|slingpacks?|fanny\s*packs?|chest\s*bags?|belt\s*bags?|thigh\s*bags?)\b/.test(name)) return fromSlug("crossbody-bags");
    if (/\b(handbags?|satchels?|shoulder\s+bags?|hobo\s+bags?|purses?|kisslock\s+bags?)\b/.test(name)) return fromSlug("handbags");
    if (/\b(travel\s+(?:duo|trio|set|kit)|travelers?['’]?s?\s+trope|edc\s+(?:duo|mini|trio)?\s*set|\d\s*in\s*1\s+travel\s+bags?|set\s+of\s+\d+.*travel)\b/.test(name)) return fromSlug("travel-sets");
    if (/\b(passports?|umbrellas?|neck\s*pillows?|luggage\s*tags?|luggage\s*scales?|travel\s*adapters?|eye\s*masks?|garment\s+sleeves?|bottle\s+holders?|watch\s+cases?|rain\s+covers?)\b/.test(name)) return fromSlug("travel-accessories");
    if (/\b(jute|cotton|canvas|drawstring|felt)\b/.test(name) && /\bbags?\b/.test(name)) return fromSlug("reusable-bags");
  }

  if (category === "tech-gadgets") {
    if (/\b(coffee\s?(?:makers?|machines?|grinders?)|espresso\s?(?:makers?|machines?)|air\s?fryers?|airfryers?|vacuum\s?cleaners?|garment\s?steamers?|hair\s?dryers?|trimmers?|shavers?|microwaves?|oven\s?toasters?|otg\b|cookware|choppers?|sandwich\s?grills?|toasters?|juicers?|mixer\s?grinders?|nutri[- ]?blends?|blenders?|kettles?|hand\s?blenders?|peelers?|cook\s?pots?|multicookers?)\b/.test(name)) return fromSlug("home-appliances");
    if (/\b(speakers?|headphones?|earbuds?|earpods?|airdopes?|earphones?|neckbands?|headsets?|soundbars?)\b/.test(name)) return fromSlug("audio");
    if (/\b(chargers?|power\s*banks?|charging\s*pads?|cables?)\b/.test(name) && !/\b(lamps?|lights?|clocks?|mice|mouse|keyboards?|hubs?|organizers?|organisers?)\b/.test(name)) return fromSlug("chargers");
    if (/\b(smartwatch|smart\s*watch|fitness\s*band)\b/.test(name)) return fromSlug("wearables");
    if (/\b(combo|combination|bundle|kit|gift\s*set)\b/.test(name)) return fromSlug("tech-bundles");
    if (/\b(lamps?|lights?|clocks?|mice|mouse|keyboards?|hubs?|organi[sz]ers?)\b/.test(name)) return fromSlug("desk-tech");
  }

  if (category === "apparel-lifestyle") {
    if (/\b(kids?|children|school\s*uniform|schoolwear)\b/.test(name)) return fromSlug("kids-schoolwear");
    if (/\b(raincoats?|rainwear|ponchos?)\b/.test(name)) return fromSlug("rainwear");
    if (/\b(jackets?|coats?|parkas?|windcheaters?|windbreakers?|sweaters?)\b/.test(name)) return fromSlug("outerwear");
    if (/\b(hoodies?|sweatshirts?)\b/.test(name)) return fromSlug("hoodies-sweatshirts");
    if (/\b(jerseys?|sportswear|tracksuits?)\b/.test(name)) return fromSlug("sportswear");
    if (/\b(caps?|hats?|beanies?)\b/.test(name)) return fromSlug("headwear");
    if (/\b(sock|brief|boxer|camisole|legging)\b/.test(name)) return fromSlug("accessories");
  }

  if (category === "office-stationery") {
    if (/\b(fridge\s?magnets?)\b/.test(name)) return fromSlug("office-essentials");
    if (/\b(snapdot|pin\s?badges?)\b/.test(name)) return fromSlug("stationery");
    if (/\b(notebook|planner|diary|journal)\b/.test(name)) return fromSlug("notebooks-planners");
    if (/\b(pen|pencil)\b/.test(name)) return fromSlug("stationery");
    if (/\b(organi[sz]ers?|trays?|document\s*holders?)\b/.test(name)) return fromSlug("organisers");
    if (/\b(calendars?)\b/.test(name)) return fromSlug("calendars");
    if (/\b(card\s*holders?|id\s*cards?|id\s*card\s*retractors?)\b/.test(name)) return fromSlug("card-holders");
    if (/\b(key\s*chains?|keyfobs?)\b/.test(name)) return fromSlug("keychains");
    if (/\bwrist\s*bands?\b/.test(name)) return fromSlug("wristbands");
  }

  if (category === "hampers-gifting" && !valid?.has(sourceSubcategory)) {
    return fromSlug("gift-sets");
  }

  if (category === "wellness-organic") {
    if (/\b(plant|planter|grow\s*kit|seed|garden|sapling|tree)\b/.test(name)) return fromSlug("plants-green");
    if (/\b(tea|kahwa|infusion)\b/.test(name)) return fromSlug("tea-infusions");
    if (valid?.has(sourceSubcategory)) return fromSlug(sourceSubcategory);
    if (/\b(calendar|visionbook|mug|coaster|badge|pixelpad|mat|folder|brief|boxer|pencil)\b/.test(name)) return fromSlug("other-wellness");
    return fromSlug("self-care");
  }

  if (category === "awards-trophies" && /\b(troph(?:y|ies)|award|plaque|medal|memento|name\s?board)\b/.test(name)) return fromSlug("trophies");

  if (category === "other" && /\b(christmas\s+(?:led\s+)?trees?|fibre\s+optic\s+trees?)\b/.test(name)) return fromSlug("seasonal-decor");

  if (valid?.has(sourceSubcategory)) return fromSlug(sourceSubcategory);
  if (category === "drinkware-barware") return fromSlug("drinkware-accessories");
  if (category === "bags-travel") return fromSlug("other-bags");
  if (category === "tech-gadgets") return fromSlug("desk-tech");
  if (category === "apparel-lifestyle") return fromSlug("accessories");
  if (category === "office-stationery") return fromSlug("office-essentials");
  return fromSlug("other");
}
