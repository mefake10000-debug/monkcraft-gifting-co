import { timingSafeEqual } from "node:crypto";
import { OPS_SESSION_COOKIE, verifyOperationsSession } from "@/lib/automation/opsSession";

function cookieValue(request: Request, name: string) {
  const item = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item?.slice(name.length + 1) ?? "";
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
  }
  // Browsers commonly omit Origin on same-origin GETs. Fetch Metadata still
  // identifies the initiating site, so permit the signed cookie only there.
  return request.headers.get("sec-fetch-site") === "same-origin";
}

export function isAuthorizedOperationsRequest(request: Request) {
  const expected = process.env.MONKCRAFT_OPS_API_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!expected) return false;
  if (supplied) {
    const a = Buffer.from(expected);
    const b = Buffer.from(supplied);
    return a.length === b.length && timingSafeEqual(a, b);
  }
  const session = cookieValue(request, OPS_SESSION_COOKIE);
  return sameOrigin(request) && verifyOperationsSession(session, expected);
}
