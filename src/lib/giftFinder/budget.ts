/** Parse buyer budget text into a positive INR amount, or null. */
export function parseBudgetInr(raw: string): number | null {
  const cleaned = raw.replace(/[₹,\s]/g, "").replace(/inr/gi, "");
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.floor(value);
}
