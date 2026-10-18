import type { EnquiryAttribution, EnquiryAttributionTouch } from "@/lib/enquiry/types";

const STORAGE_KEY = "monkcraft-attribution-v1";
const ALLOWED_VALUE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/;

function safeTag(value: string | null) {
  const trimmed = value?.trim().replace(/\s+/g, "_").slice(0, 120) || "";
  return ALLOWED_VALUE.test(trimmed) ? trimmed : "";
}

function buildTouch(pathname: string, search: string, referrer: string, now: string): EnquiryAttributionTouch {
  const params = new URLSearchParams(search);
  let referrerHost = "";
  try {
    const parsed = new URL(referrer);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") referrerHost = parsed.hostname.toLowerCase().slice(0, 253);
  } catch { /* Invalid or absent referrer is ignored. */ }
  const utmSource = safeTag(params.get("utm_source"));
  const utmMedium = safeTag(params.get("utm_medium"));
  const fromSearch = /(^|\.)(google|bing|yahoo|duckduckgo)\./i.test(referrerHost);
  const source = utmSource || (referrerHost ? fromSearch ? "organic_search" : "referral" : "direct");
  const medium = utmMedium || (referrerHost ? fromSearch ? "organic" : "referral" : "direct");
  const path = pathname.startsWith("/") ? pathname.split(/[?#]/, 1)[0].slice(0, 300) : "/";
  const touch: EnquiryAttributionTouch = {
    source,
    medium,
    landingPath: path || "/",
    recordedAt: now,
  };
  const campaign = safeTag(params.get("utm_campaign"));
  const term = safeTag(params.get("utm_term"));
  const content = safeTag(params.get("utm_content"));
  if (campaign) touch.campaign = campaign;
  if (term) touch.term = term;
  if (content) touch.content = content;
  if (referrerHost) touch.referrerHost = referrerHost;
  return touch;
}

function isAttributedTouch(search: string, referrer: string, previous: EnquiryAttribution | null) {
  const params = new URLSearchParams(search);
  if (["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].some((key) => params.has(key))) return true;
  if (!referrer) return false;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return Boolean(host && host !== window.location.hostname && host !== previous?.lastTouch.referrerHost);
  } catch { return false; }
}

export function captureCampaignAttribution(pathname: string, search: string, referrer: string, now = new Date().toISOString()) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const previous = raw ? JSON.parse(raw) as EnquiryAttribution : null;
    const touch = buildTouch(pathname, search, referrer, now);
    const attribution: EnquiryAttribution = previous?.firstTouch && previous?.lastTouch
      ? { firstTouch: previous.firstTouch, lastTouch: isAttributedTouch(search, referrer, previous) ? touch : previous.lastTouch }
      : { firstTouch: touch, lastTouch: touch };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch { /* Campaign tags are optional; privacy settings or browser storage may disable them. */ }
}

export function readCampaignAttribution(): EnquiryAttribution | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as EnquiryAttribution;
    if (!parsed?.firstTouch?.source || !parsed?.lastTouch?.source) return undefined;
    return parsed;
  } catch { return undefined; }
}

export function sanitizeCampaignAttribution(value: unknown): EnquiryAttribution | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  const cleanTouch = (input: unknown): EnquiryAttributionTouch | undefined => {
    if (!input || typeof input !== "object") return undefined;
    const touch = input as Record<string, unknown>;
    const source = safeTag(typeof touch.source === "string" ? touch.source : null);
    const medium = safeTag(typeof touch.medium === "string" ? touch.medium : null);
    const landingPath = typeof touch.landingPath === "string" && touch.landingPath.startsWith("/")
      ? touch.landingPath.split(/[?#]/, 1)[0].slice(0, 300) : "";
    const recordedAt = typeof touch.recordedAt === "string" && !Number.isNaN(Date.parse(touch.recordedAt))
      ? new Date(touch.recordedAt).toISOString() : "";
    if (!source || !medium || !landingPath || !recordedAt) return undefined;
    const clean: EnquiryAttributionTouch = { source, medium, landingPath, recordedAt };
    for (const key of ["campaign", "term", "content"] as const) {
      const item = safeTag(typeof touch[key] === "string" ? touch[key] : null);
      if (item) clean[key] = item;
    }
    const host = typeof touch.referrerHost === "string" ? touch.referrerHost.toLowerCase().slice(0, 253) : "";
    if (host && /^[a-z0-9.-]+$/.test(host) && !host.includes("..")) clean.referrerHost = host;
    return clean;
  };
  const firstTouch = cleanTouch(raw.firstTouch);
  const lastTouch = cleanTouch(raw.lastTouch);
  return firstTouch && lastTouch ? { firstTouch, lastTouch } : undefined;
}
