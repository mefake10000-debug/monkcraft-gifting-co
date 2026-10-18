type RewriteInput = {
  title: string;
  description?: string | null;
  specifications?: Record<string, string | null | undefined> | null;
};

const PROMOTIONAL = /\b(?:corporate|bulk)\s+gift(?:ing|s)?\b|\b(?:ideal|perfect|great|best)\s+for\b|\bsuited\s+for\b|\bemployee\s+gift(?:ing|s)?\b|\bclient\s+appreciation\b|\bpan[- ]india\b|\bvolume\s+pricing\b|\bcontact\s+us\b|\bprice\s+on\s+request\b|\bpersonalise\s+with\s+your\s+logo\b|\bpersonalize\s+with\s+your\s+logo\b|\b(?:corporate|bulk)\s+gifti\w*/i;

function cleanSentence(sentence: string): string {
  return sentence
    .replace(/\s+/g, " ")
    .replace(/\s*[-–—|,:;]\s*$/, "")
    .trim();
}

function specValue(specifications: RewriteInput["specifications"], key: string): string | undefined {
  const matched = Object.entries(specifications ?? {}).find(([label]) => label.trim().toLowerCase() === key.toLowerCase());
  const value = matched?.[1]?.trim();
  return value || undefined;
}

/** Lightly edit source copy; retain only product information and use explicit specs as fallback. */
export function rewriteProductDescription(input: RewriteInput): string {
  const title = input.title.trim();
  const source = (input.description ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const sentences = source
    .split(/(?<=[.!?])\s+|\s*[|•]\s*/)
    .map(cleanSentence)
    .filter((sentence) => sentence && !PROMOTIONAL.test(sentence));
  let body = sentences.join(" ").trim();

  // Third-party campaign copy is not a reliable product description.
  if (/\b(?:discover the beauty|gift hampers?|epitome of|redefine the ways)\b/i.test(body)) body = "";

  // Some exports concatenate long marketing copy without punctuation. Remove
  // the promotional tail while preserving the preceding product description.
  const promoAt = body.search(PROMOTIONAL);
  if (promoAt >= 0) body = body.slice(0, promoAt).replace(/[\s,;:–—-]+$/, "").trim();

  if (body && body.toLowerCase() !== title.toLowerCase()) return body;

  const color = specValue(input.specifications, "Color");
  const material = specValue(input.specifications, "Material");
  if (color && material) return `The ${title} is listed in ${color} and made from ${material}.`;
  if (color) return `The ${title} is listed in ${color}.`;
  if (material) return `The ${title} is made from ${material}.`;
  return `${title}.`;
}
