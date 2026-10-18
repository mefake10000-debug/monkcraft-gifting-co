import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { saveLeadInteraction } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const channels = ["email", "whatsapp", "linkedin", "phone", "meeting", "internal"] as const;
const directions = ["inbound", "outbound", "internal_note"] as const;

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const requestId = typeof input.requestId === "string" ? input.requestId.trim() : "";
  const channel = input.channel;
  const direction = input.direction;
  const content = typeof input.content === "string" ? input.content.trim() : "";
  const outcome = typeof input.outcome === "string" ? input.outcome.trim().slice(0, 500) : "";
  const actor = typeof input.actor === "string" ? input.actor.trim().slice(0, 120) : "";
  const rawDate = typeof input.occurredAt === "string" ? input.occurredAt.trim() : "";
  const occurredAt = rawDate ? new Date(rawDate) : null;
  if (!uuidPattern.test(requestId) || !channels.includes(channel as typeof channels[number])
    || !directions.includes(direction as typeof directions[number]) || !content || content.length > 8000 || !actor
    || (rawDate && (!occurredAt || Number.isNaN(occurredAt.getTime())))) {
    return NextResponse.json({ ok: false, error: "Provide a valid lead, channel, direction, message, and staff name." }, { status: 400 });
  }
  try {
    const rows = await saveLeadInteraction({
      quote_request_id: requestId, channel: channel as typeof channels[number],
      direction: direction as typeof directions[number], content, outcome: outcome || null,
      actor, ...(occurredAt ? { occurred_at: occurredAt.toISOString() } : {}),
    });
    if (!rows[0]) return NextResponse.json({ ok: false, error: "Interaction was not saved." }, { status: 503 });
    return NextResponse.json({ ok: true, interaction: rows[0] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save the interaction. Confirm the lead interaction migration and retry." }, { status: 503 });
  }
}
