import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { approveSupplierCheckForWhatsApp } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 }); }
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const checkId = typeof payload.checkId === "string" ? payload.checkId.trim() : "";
  const reviewer = typeof payload.reviewer === "string" ? payload.reviewer.trim().slice(0, 120) : "";
  if (!uuidPattern.test(checkId) || !reviewer) return NextResponse.json({ ok: false, error: "A valid supplier check ID and reviewer are required." }, { status: 400 });
  try {
    const rows = await approveSupplierCheckForWhatsApp(checkId, reviewer);
    const check = rows[0];
    if (!check) return NextResponse.json({ ok: false, error: "Supplier check was not eligible for approval." }, { status: 409 });
    return NextResponse.json({ ok: true, checkId: check.id, status: check.status, reviewer });
  } catch {
    return NextResponse.json({ ok: false, error: "Supplier check was not eligible. Verify its mapping and supplier opt-in." }, { status: 409 });
  }
}
