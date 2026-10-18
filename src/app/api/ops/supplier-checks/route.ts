import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { listSupplierChecksForOperations } from "@/lib/automation/store";

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const checks = await listSupplierChecksForOperations();
    return NextResponse.json({ ok: true, checks }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Supplier checks are unavailable. Verify database configuration." }, { status: 503 });
  }
}
