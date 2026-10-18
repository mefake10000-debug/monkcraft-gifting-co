import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createOperationsSession, OPS_SESSION_COOKIE, OPS_SESSION_MAX_AGE_SECONDS } from "@/lib/automation/opsSession";

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

function cookieOptions(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:" || forwardedProto === "https",
    sameSite: "strict" as const,
    path: "/",
    maxAge: OPS_SESSION_MAX_AGE_SECONDS,
  };
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false, error: "Same-origin request required." }, { status: 403 });
  const secret = process.env.MONKCRAFT_OPS_API_SECRET?.trim();
  if (!secret) return NextResponse.json({ ok: false, code: "operations_not_configured" }, { status: 503 });
  if (Number(request.headers.get("content-length") || 0) > 2048) return NextResponse.json({ ok: false }, { status: 413 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const password = body && typeof body === "object" && "password" in body && typeof body.password === "string"
    ? body.password
    : "";
  if (!password || password.length > 1024) return NextResponse.json({ ok: false, error: "Enter the operations access key." }, { status: 400 });
  const expected = Buffer.from(secret);
  const supplied = Buffer.from(password);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return NextResponse.json({ ok: false, error: "The operations access key is not valid." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(OPS_SESSION_COOKIE, createOperationsSession(secret), cookieOptions(request));
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OPS_SESSION_COOKIE, "", { ...cookieOptions(request), maxAge: 0 });
  return response;
}
