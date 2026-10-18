import { NextResponse } from "next/server";
import { generateMarketingContentDraft, marketingAiConfigured } from "@/lib/automation/marketingContentAgent";
import { validateGeneratedMarketingDraft, validateMarketingContentAction, validateMarketingContentBrief, type MarketingContentAction, type MarketingDraftContent } from "@/lib/automation/marketingContent";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { isNotionMarketingContentSyncConfigured, syncOneNotionMarketingContent } from "@/lib/automation/notion";
import { listMarketingContent, saveMarketingContentDraft, transitionMarketingContent } from "@/lib/automation/store";

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, aiConfigured: marketingAiConfigured(), items: await listMarketingContent() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Marketing content is unavailable. Confirm database setup and apply the marketing-content migration." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const action = input.action;

  try {
    if (action === "generate" || action === "save_draft") {
      const briefResult = validateMarketingContentBrief(input);
      if (!briefResult.ok) return NextResponse.json({ ok: false, error: briefResult.error }, { status: 400 });
      const id = typeof input.id === "string" ? input.id : null;
      if (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ ok: false, error: "Invalid content item." }, { status: 400 });
      let draft: MarketingDraftContent;
      let model: string | null = null;
      let usage: Record<string, unknown> = {};
      if (action === "generate") {
        if (!marketingAiConfigured()) return NextResponse.json({ ok: false, error: "AI drafting is not configured. Add a server-side OpenAI API key or write a draft manually." }, { status: 503 });
        const generated = await generateMarketingContentDraft(briefResult.value);
        draft = generated.draft;
        model = generated.model;
        usage = generated.usage;
      } else {
        const parsed = validateGeneratedMarketingDraft(input.content);
        if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
        draft = parsed.value;
      }
      const saved = await saveMarketingContentDraft({
        id, ...briefResult.value, content: draft as unknown as Record<string, unknown>,
        keywordSuggestions: draft.keywordSuggestions.length ? draft.keywordSuggestions : briefResult.value.keywordThemes,
        imageBrief: draft.imageBrief, model, usage,
      });
      const item = saved[0];
      if (item && isNotionMarketingContentSyncConfigured()) await syncOneNotionMarketingContent(item.id);
      return NextResponse.json({ ok: true, item });
    }

    const allowed: MarketingContentAction[] = ["submit_for_review", "request_changes", "approve", "schedule", "mark_published", "repurpose"];
    if (typeof action !== "string" || !allowed.includes(action as MarketingContentAction)) return NextResponse.json({ ok: false, error: "Choose a valid marketing content action." }, { status: 400 });
    const parsed = validateMarketingContentAction(input, action as MarketingContentAction);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    const publishAt = parsed.value.publishAt ? new Date(parsed.value.publishAt).toISOString() : null;
    const rows = await transitionMarketingContent({ ...parsed.value, action, publishAt });
    if (rows[0] && isNotionMarketingContentSyncConfigured()) await syncOneNotionMarketingContent(rows[0].id);
    return NextResponse.json({ ok: true, item: rows[0] });
  } catch (error) {
    if (error instanceof Error && error.message === "marketing_ai_not_configured") return NextResponse.json({ ok: false, error: "AI drafting is not configured. Add a server-side OpenAI API key or write a draft manually." }, { status: 503 });
    return NextResponse.json({ ok: false, error: "The marketing action could not be saved. Confirm migration and current item status, then try again." }, { status: 409 });
  }
}
