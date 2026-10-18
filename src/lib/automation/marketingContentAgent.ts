import { validateGeneratedMarketingDraft, type MarketingContentBrief } from "@/lib/automation/marketingContent";

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    copy: { type: "string" },
    callToAction: { type: "string" },
    imageBrief: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
    keywordSuggestions: { type: "array", items: { type: "string" } },
    factCheckNotes: { type: "array", items: { type: "string" } },
  },
  required: ["title", "copy", "callToAction", "imageBrief", "hashtags", "keywordSuggestions", "factCheckNotes"],
  additionalProperties: false,
};

export function marketingAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function generateMarketingContentDraft(brief: MarketingContentBrief) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("marketing_ai_not_configured");
  const model = process.env.MONKCRAFT_MARKETING_MODEL?.trim() || "gpt-5.4-mini";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      cache: "no-store",
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1400,
        input: [
          {
            role: "system",
            content: "You are Moncraft's supervised marketing and SEO drafting agent. Produce a useful first draft for a premium corporate gifting business. Use only the campaign information supplied. Do not invent products, customer names, prices, supplier facts, certifications, sustainability claims, stock, lead times, rankings, or performance results. Treat keyword suggestions as hypotheses for human research, not verified search-volume data. Make the channel format appropriate. Include explicit fact-check questions for any factual claims that still need evidence. The output must match the supplied JSON schema.",
          },
          { role: "user", content: JSON.stringify({ ...brief, actor: undefined, owner: undefined, publishAt: undefined }) },
        ],
        text: { format: { type: "json_schema", name: "moncraft_marketing_draft", strict: true, schema: OUTPUT_SCHEMA } },
      }),
    });
    const body = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!response.ok) throw new Error("marketing_ai_provider_failed");
    if (!body || body.status !== "completed" || !Array.isArray(body.output)) throw new Error("marketing_ai_incomplete");
    const message = body.output.find((item) => item && typeof item === "object" && (item as Record<string, unknown>).type === "message") as Record<string, unknown> | undefined;
    const content = Array.isArray(message?.content) ? message.content : [];
    const text = content.find((part) => part && typeof part === "object" && (part as Record<string, unknown>).type === "output_text") as Record<string, unknown> | undefined;
    if (typeof text?.text !== "string") throw new Error("marketing_ai_no_structured_output");
    const parsed = validateGeneratedMarketingDraft(JSON.parse(text.text) as unknown);
    if (!parsed.ok) throw new Error("marketing_ai_invalid_draft");
    const rawUsage = body.usage && typeof body.usage === "object" ? body.usage as Record<string, unknown> : {};
    return {
      draft: parsed.value,
      model,
      usage: {
        inputTokens: Number.isSafeInteger(rawUsage.input_tokens) ? rawUsage.input_tokens as number : null,
        outputTokens: Number.isSafeInteger(rawUsage.output_tokens) ? rawUsage.output_tokens as number : null,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("marketing_ai_")) throw error;
    throw new Error("marketing_ai_provider_failed");
  } finally {
    clearTimeout(timeout);
  }
}
