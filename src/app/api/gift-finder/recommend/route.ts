import { NextRequest, NextResponse } from "next/server";
import { recommendGifts } from "@/lib/giftFinder/recommend";
import type { GiftFinderRecommendRequest } from "@/lib/giftFinder/types";

/**
 * Smart Gift Finder recommendations — rule-based, export-backed catalogue only.
 * Not a generative AI endpoint.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const raw = body as Partial<GiftFinderRecommendRequest>;
  if (!raw || typeof raw !== "object" || !raw.requirements) {
    return NextResponse.json(
      { error: "Missing requirements" },
      { status: 400 },
    );
  }

  const result = recommendGifts({
    requirements: raw.requirements,
    limit: raw.limit,
    alternativeLimit: raw.alternativeLimit,
  });

  return NextResponse.json({
    ...result,
    mode: "rule-based",
    label: "Smart Gift Finder",
  });
}
