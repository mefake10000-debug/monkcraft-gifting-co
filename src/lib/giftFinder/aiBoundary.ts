/**
 * LAYER B — Future conversational AI boundary (NOT ACTIVATED).
 *
 * Do not install AI SDKs, API keys, or claim generative AI is live.
 * When approved later, a provider adapter should:
 *  1. Interpret natural language into GiftFinderRequirements (validated).
 *  2. Call recommendGifts() for real catalogue matches only.
 *  3. Explain results using verified product fields from the recommend service.
 *  4. Update brief / shortlist / box only via existing app actions
 *     (patchBrief, addToShortlist, addToBox) — never invent product IDs/prices.
 *
 * Security / ops to plan later: server-side credentials, rate limits, cost
 * logging, prompt-injection hardening, and treating model output as untrusted
 * until validated against export-backed IDs and fields.
 */

import type {
  GiftFinderRecommendRequest,
  GiftFinderRecommendResult,
  GiftFinderRequirements,
} from "./types";

/** Status of the optional model layer — always inactive in V1. */
export const GIFT_FINDER_AI_STATUS = {
  enabled: false as const,
  label: "Smart Gift Finder",
  mode: "rule-based" as const,
  provider: null,
};

/**
 * Future adapter contract. Implementations must never return fabricated SKUs.
 * Product names/prices from a model are untrusted until validated against
 * recommendGifts() / getProductById().
 */
export type GiftFinderAiAdapter = {
  /** Parse free text into a partial requirements patch (validated by caller). */
  interpretRequirements?: (
    utterance: string,
    current: GiftFinderRequirements,
  ) => Promise<Partial<GiftFinderRequirements>>;
  /**
   * Optional NL follow-up — must still call the real recommendation service
   * and only cite products present in that result.
   */
  explainMatches?: (
    result: GiftFinderRecommendResult,
    question: string,
  ) => Promise<string>;
};

/** Placeholder — returns null until a provider is approved and wired server-side. */
export function getGiftFinderAiAdapter(): GiftFinderAiAdapter | null {
  return null;
}

/**
 * Single entry for any future conversational layer: always run the real engine.
 * Import recommendGifts from ./recommend in server code only.
 */
export type GiftFinderRecommendFn = (
  request: GiftFinderRecommendRequest,
) => GiftFinderRecommendResult;

export const AI_PROVIDER_OPTIONS_FOR_LATER = [
  {
    id: "openai",
    note: "GPT models via server-side API — requires key, rate limits, cost controls",
  },
  {
    id: "anthropic",
    note: "Claude via server-side API — same safeguards",
  },
  {
    id: "google-gemini",
    note: "Gemini via server-side API — same safeguards",
  },
  {
    id: "none",
    note: "Keep rule-based Smart Gift Finder only",
  },
] as const;
