/**
 * Product compare — shared, environment-safe constants.
 * Kept free of "use client" so server components (e.g. /gifts/compare) can read
 * them; the client store in `compare.ts` re-exports these.
 */

export const COMPARE_EVENT = "monkcraft:compare";
export const MAX_COMPARE = 4;
export const COMPARE_STORAGE_KEY = "monkcraft-compare-v1";
