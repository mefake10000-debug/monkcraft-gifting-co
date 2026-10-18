/** Keep metadata descriptions readable when a source summary is too long. */
export function truncateMetaDescription(value: string, maxLength = 160): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  const limit = Math.floor(maxLength);

  if (normalized.length <= limit || limit < 1) return normalized;

  const candidate = normalized.slice(0, limit);
  const boundary = candidate.lastIndexOf(" ");
  const completeWords = boundary > 0 ? candidate.slice(0, boundary) : candidate;
  const clean = completeWords.replace(/[\s.,;:!?…]+$/u, "");

  return `${clean}…`;
}
