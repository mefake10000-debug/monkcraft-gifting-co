import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { getOperationsAnalytics } from "@/lib/automation/store";

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, analytics: await getOperationsAnalytics() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Analytics are unavailable. Confirm the database configuration and apply the analytics migrations." }, { status: 503 });
  }
}
