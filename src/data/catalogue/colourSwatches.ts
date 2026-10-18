const SWATCH_COLOURS: Record<string, string> = {
  black: "#25242a", charcoal: "#44434a", grey: "#8a8990", gray: "#8a8990",
  white: "#fbfaf7", cream: "#efe8d6", beige: "#cdbb9d", tan: "#b4895c", khaki: "#aa9b76",
  brown: "#76523f", burgundy: "#762b42", maroon: "#762b42", wine: "#70263f", red: "#c63d4b",
  pink: "#df8eae", magenta: "#bc3d85", purple: "#7955a1", lavender: "#a995c5",
  blue: "#416aa7", navy: "#263758", teal: "#287f83", turquoise: "#52a7a4",
  green: "#4d8054", olive: "#74783b", lime: "#9ca63c", yellow: "#e4c943",
  mustard: "#c69c32", orange: "#d77b36", peach: "#e6a27d", gold: "#c4a04b",
  silver: "#aaaab0", petrol: "#306c76", ice: "#aad3df", sky: "#83c4df", cork: "#b4895c",
};

/** Visual cue only; the catalogue's verified colour label remains authoritative. */
export function colourSwatchStyle(colour: string): { backgroundColor?: string; backgroundImage?: string } {
  const normalized = colour.trim().toLocaleLowerCase();
  const aliases: Record<string, string> = {
    "navy blue": "navy", "royal blue": "blue", "sky blue": "sky", "teal blue": "teal",
    "light blue": "blue", "dark blue": "navy", "forest green": "green",
    "bottle green": "green", "olive green": "olive", "light green": "green",
    "dark green": "green", "off white": "white", "ivory": "cream",
    "rose gold": "gold", "steel grey": "grey", "dark grey": "charcoal",
    "light grey": "grey", "wine red": "wine", "natural cork": "cork", khakhi: "khaki",
  };
  const paletteTokens = Object.keys(SWATCH_COLOURS).sort((a, b) => b.length - a.length);
  const phrases = Object.keys(aliases).sort((a, b) => b.length - a.length);
  const foundPhrases = phrases.filter((phrase) => new RegExp(`(^|[^a-z])${phrase.replace(/ /g, "\\s+")}(?=$|[^a-z])`, "i").test(normalized));
  const remainder = foundPhrases.reduce((value, phrase) => value.replace(new RegExp(phrase.replace(/ /g, "\\s+"), "ig"), " "), normalized);
  const matched = [
    ...foundPhrases.map((phrase) => ({ key: aliases[phrase], position: normalized.indexOf(phrase) })),
    ...paletteTokens
      .filter((token) => new RegExp(`(^|[^a-z])${token}(?=$|[^a-z])`, "i").test(remainder))
      .map((token) => ({ key: token, position: normalized.search(new RegExp(`(^|[^a-z])${token}(?=$|[^a-z])`, "i")) })),
  ].sort((a, b) => a.position - b.position);
  const unique = [...new Set(matched.map(({ key }) => key))];
  if (unique.length > 1) {
    return { backgroundImage: `linear-gradient(135deg, ${SWATCH_COLOURS[unique[0]]} 0 50%, ${SWATCH_COLOURS[unique[1]]} 50% 100%)` };
  }
  const key = unique[0];
  return { backgroundColor: key ? SWATCH_COLOURS[key] : "#b7b7b7" };
}
