import { createHmac, timingSafeEqual } from "node:crypto";

export const OPS_SESSION_COOKIE = "moncraft_ops_session";
export const OPS_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createOperationsSession(secret: string, now = Date.now()) {
  const payload = `v1.${Math.floor(now / 1000) + OPS_SESSION_MAX_AGE_SECONDS}`;
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyOperationsSession(token: string, secret: string, now = Date.now()) {
  if (!secret || token.length > 256) return false;
  const match = /^v1\.(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const expiresAt = Number(match[1]);
  const nowSeconds = Math.floor(now / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= nowSeconds || expiresAt > nowSeconds + OPS_SESSION_MAX_AGE_SECONDS) return false;
  const payload = `v1.${match[1]}`;
  const expected = Buffer.from(signature(payload, secret));
  const supplied = Buffer.from(match[2]);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
