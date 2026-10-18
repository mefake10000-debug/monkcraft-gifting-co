import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { listMarketingPermissions, revokeMarketingPermission } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, permissions: await listMarketingPermissions() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Marketing consent records are unavailable. Apply the attribution and consent migration." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const permissionId = typeof input.permissionId === "string" ? input.permissionId.trim() : "";
  const evidenceReference = typeof input.evidenceReference === "string" ? input.evidenceReference.trim().slice(0, 500) : "";
  const actor = typeof input.actor === "string" ? input.actor.trim().slice(0, 120) : "";
  if (!uuidPattern.test(permissionId) || evidenceReference.length < 3 || !actor) {
    return NextResponse.json({ ok: false, error: "Provide the permission record, opt-out evidence reference, and staff name." }, { status: 400 });
  }
  try {
    await revokeMarketingPermission(permissionId, evidenceReference, actor);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Permission could not be withdrawn. Refresh the record and try again." }, { status: 409 });
  }
}
