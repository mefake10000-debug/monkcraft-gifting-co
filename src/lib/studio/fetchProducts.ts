"use client";

import type { StudioProductSummary } from "@/data/catalogue/studioTypes";

type SearchResponse = {
  products: StudioProductSummary[];
  total?: number;
};

export async function fetchStudioProducts(options: {
  q?: string;
  ids?: string[];
  slug?: string;
  limit?: number;
  signal?: AbortSignal;
}): Promise<StudioProductSummary[]> {
  const params = new URLSearchParams();
  if (options.slug) params.set("slug", options.slug);
  if (options.ids?.length) params.set("ids", options.ids.join(","));
  if (options.q) params.set("q", options.q);
  if (options.limit) params.set("limit", String(options.limit));

  const res = await fetch(`/api/catalogue/search?${params.toString()}`, {
    signal: options.signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error("Catalogue search failed. Try again in a moment.");
  }
  const data = (await res.json()) as SearchResponse;
  return Array.isArray(data.products) ? data.products : [];
}
