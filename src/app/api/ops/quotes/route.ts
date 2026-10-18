import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { validateQuoteDraftInput, validateQuoteTransitionInput, type QuoteTransition } from "@/lib/automation/quoteWorkflow";
import { isNotionQuoteSyncConfigured, syncOneNotionQuoteVersion } from "@/lib/automation/notion";
import { listOperationsQuoteDesk, listQuoteReadinessChecks, saveOperationsQuoteDraft, transitionOperationsQuote } from "@/lib/automation/store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRANSITIONS = new Set<QuoteTransition>(["submit_for_approval", "approve", "request_changes", "mark_sent", "accept", "decline"]);

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const desk = await listOperationsQuoteDesk();
    const requestIds = [...desk.leads.map((lead) => lead.id), ...desk.quotes.map((quote) => quote.quote_request_id)];
    const supplierChecks = await listQuoteReadinessChecks(requestIds);
    return NextResponse.json({ ok: true, ...desk, supplierChecks }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Quote records are unavailable. Confirm the database setup and apply the quote approval migration." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (input.action === "save_draft") {
    const parsed = validateQuoteDraftInput(input.draft);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    const draft = input.draft as Record<string, unknown>;
    const quoteId = typeof draft.quoteId === "string" && draft.quoteId.trim() ? draft.quoteId.trim() : null;
    if (quoteId && !UUID.test(quoteId)) return NextResponse.json({ ok: false, error: "Select a valid quote version." }, { status: 400 });
    try {
      const rows = await saveOperationsQuoteDraft({
        requestId: parsed.value.requestId, quoteId,
        snapshot: { lines: parsed.value.lines, adjustments: parsed.value.adjustments, subtotalPaise: parsed.value.subtotalPaise, totalPaise: parsed.value.totalPaise },
        terms: parsed.value.terms, validUntil: parsed.value.validUntil, actor: parsed.value.actor,
      });
      if (!rows[0]) throw new Error("quote_record_missing");
      let notionSync: "synced" | "pending" | "not_configured" = "not_configured";
      if (isNotionQuoteSyncConfigured()) {
        try { notionSync = await syncOneNotionQuoteVersion(rows[0].id) === "synced" ? "synced" : "pending"; }
        catch { notionSync = "pending"; }
      }
      return NextResponse.json({ ok: true, quote: rows[0], notionSync }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json({ ok: false, error: "Draft could not be saved. Resolve any open quote version before creating another." }, { status: 409 });
    }
  }
  if (typeof input.action !== "string" || !TRANSITIONS.has(input.action as QuoteTransition)) {
    return NextResponse.json({ ok: false, error: "Choose a supported quote action." }, { status: 400 });
  }
  const parsed = validateQuoteTransitionInput(input, input.action as QuoteTransition);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  try {
    const rows = await transitionOperationsQuote({ ...parsed.value, action: input.action });
    if (!rows[0]) throw new Error("quote_record_missing");
    let notionSync: "synced" | "pending" | "not_configured" = "not_configured";
    if (isNotionQuoteSyncConfigured()) {
      try { notionSync = await syncOneNotionQuoteVersion(rows[0].id) === "synced" ? "synced" : "pending"; }
      catch { notionSync = "pending"; }
    }
    return NextResponse.json({ ok: true, quote: rows[0], notionSync }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "quote_supplier_checks_not_ready") {
      return NextResponse.json({ ok: false, error: "Supplier checks are not ready. Map every requested item to an active supplier, record a reply, and have a staff member review it as available before quote approval." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Quote action is not valid for its current status. Refresh the quote and review its history." }, { status: 409 });
  }
}
