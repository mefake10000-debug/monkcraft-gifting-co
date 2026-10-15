import type { EnquiryApiResponse } from "@/lib/enquiry/types";

/**
 * Short-lived idempotency cache so double-clicks / retries with the same
 * clientSubmissionId do not re-attempt provider delivery.
 */

type Entry = {
  response: EnquiryApiResponse;
  status: number;
  expiresAt: number;
};

const store = new Map<string, Entry>();
const TTL_MS = 30 * 60 * 1000;

function prune(now: number) {
  if (store.size < 200) return;
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

export function getIdempotentEnquiry(
  id: string,
): { response: EnquiryApiResponse; status: number } | null {
  if (!id) return null;
  const now = Date.now();
  const entry = store.get(id);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    store.delete(id);
    return null;
  }
  return {
    response: { ...entry.response, duplicate: true },
    status: entry.status,
  };
}

export function setIdempotentEnquiry(
  id: string,
  response: EnquiryApiResponse,
  status: number,
) {
  if (!id) return;
  const now = Date.now();
  prune(now);
  store.set(id, {
    response,
    status,
    expiresAt: now + TTL_MS,
  });
}

export function __resetEnquiryIdempotencyForTests() {
  store.clear();
}
