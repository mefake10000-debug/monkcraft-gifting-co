export const MARKETING_CHANNELS = ["LinkedIn", "Instagram", "YouTube", "Google Business", "Website", "Email"] as const;
export type MarketingChannel = typeof MARKETING_CHANNELS[number];
export type MarketingDraftContent = {
  title: string; copy: string; callToAction: string; imageBrief: string;
  hashtags: string[]; keywordSuggestions: string[]; factCheckNotes: string[];
};
export type MarketingContentStatus = "Idea" | "Draft" | "Review" | "Approved" | "Scheduled" | "Published" | "Repurpose";
export type MarketingContentBrief = {
  channel: MarketingChannel; campaign: string; objective: string; audience: string;
  brief: string; keywordThemes: string[]; publishAt: string | null; owner: string; actor: string;
};

const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const lines = (value: unknown, maxItems: number, maxLength: number) => Array.isArray(value)
  ? value.slice(0, maxItems).map((item) => clean(item, maxLength)).filter(Boolean)
  : [];

export function validateMarketingContentBrief(value: unknown):
  | { ok: true; value: MarketingContentBrief }
  | { ok: false; error: string } {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const channel = input.channel;
  const campaign = clean(input.campaign, 120);
  const objective = clean(input.objective, 240);
  const audience = clean(input.audience, 240);
  const brief = clean(input.brief, 2000);
  const owner = clean(input.owner, 120);
  const actor = clean(input.actor, 120);
  const publishAt = clean(input.publishAt, 40) || null;
  if (!MARKETING_CHANNELS.includes(channel as MarketingChannel) || !campaign || !objective || !audience || brief.length < 20 || !owner || !actor) {
    return { ok: false, error: "Choose a channel and add a campaign, objective, audience, brief, owner, and your name." };
  }
  if (publishAt && Number.isNaN(Date.parse(publishAt))) {
    return { ok: false, error: "Choose a valid publish date and time." };
  }
  return { ok: true, value: { channel: channel as MarketingChannel, campaign, objective, audience, brief, keywordThemes: lines(input.keywordThemes, 12, 80), publishAt, owner, actor } };
}

export function validateGeneratedMarketingDraft(value: unknown): { ok: true; value: MarketingDraftContent } | { ok: false; error: string } {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const draft: MarketingDraftContent = {
    title: clean(input.title, 180), copy: clean(input.copy, 4000), callToAction: clean(input.callToAction, 300),
    imageBrief: clean(input.imageBrief, 1200), hashtags: lines(input.hashtags, 15, 80),
    keywordSuggestions: lines(input.keywordSuggestions, 12, 100), factCheckNotes: lines(input.factCheckNotes, 12, 300),
  };
  if (!draft.title || !draft.copy || !draft.callToAction || !draft.imageBrief) return { ok: false, error: "The marketing agent returned an incomplete draft. Generate it again or write it manually." };
  return { ok: true, value: draft };
}

export type MarketingContentAction = "save_draft" | "submit_for_review" | "request_changes" | "approve" | "schedule" | "mark_published" | "repurpose";
export function validateMarketingContentAction(value: unknown, action: MarketingContentAction) {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const id = clean(input.id, 36);
  const actor = clean(input.actor, 120);
  const note = clean(input.note, 1000);
  const url = clean(input.publishedUrl, 1000);
  const publishAt = clean(input.publishAt, 40);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !actor) return { ok: false as const, error: "Select a content item and enter your name." };
  if (action === "request_changes" && note.length < 3) return { ok: false as const, error: "Explain what needs to change." };
  if (action === "schedule" && (!publishAt || Number.isNaN(Date.parse(publishAt)))) return { ok: false as const, error: "Set the planned publication time." };
  let validPublishedUrl = false;
  try { validPublishedUrl = new URL(url).protocol === "https:" && Boolean(new URL(url).hostname); } catch { /* Invalid URL stays false. */ }
  if (action === "mark_published" && !validPublishedUrl) return { ok: false as const, error: "Add the public post or page URL after publishing." };
  return { ok: true as const, value: { id, actor, note, publishedUrl: url, publishAt: publishAt || null } };
}
