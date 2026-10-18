import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { listOperationsExceptions } from "@/lib/automation/store";

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, generatedAt: new Date().toISOString(), exceptions: await listOperationsExceptions() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "The exception queue is unavailable. Confirm database setup and apply all current migrations." }, { status: 503 });
  }
}
