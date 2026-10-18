import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { isQuoteStorageConfigured, recordSupplierWhatsAppReply } from "@/lib/automation/store";
import { extractSupplierReplies, verifyWhatsAppSignature } from "@/lib/automation/whatsapp";

function secureStringEqual(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export async function GET(request: Request) {
  const expectedToken = process.env.MONKCRAFT_WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim();
  if (!expectedToken) return NextResponse.json({ ok: false, error: "Webhook is not configured" }, { status: 503 });
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode") ?? "";
  const token = url.searchParams.get("hub.verify_token") ?? "";
  const challenge = url.searchParams.get("hub.challenge") ?? "";
  if (mode !== "subscribe" || !challenge || !secureStringEqual(token, expectedToken)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export async function POST(request: Request) {
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (!appSecret) return NextResponse.json({ ok: false, error: "Webhook is not configured" }, { status: 503 });
  const rawBody = await request.text();
  if (rawBody.length > 1_000_000) return NextResponse.json({ ok: false }, { status: 413 });
  if (!verifyWhatsAppSignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!isQuoteStorageConfigured()) return NextResponse.json({ ok: false, error: "Message storage is not configured" }, { status: 503 });

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const replies = extractSupplierReplies(payload);
  try {
    for (const reply of replies) await recordSupplierWhatsAppReply(reply);
  } catch {
    // Returning a retryable error lets Meta resend; provider message IDs make replay idempotent.
    return NextResponse.json({ ok: false, error: "Could not persist supplier reply" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, received: replies.length });
}
