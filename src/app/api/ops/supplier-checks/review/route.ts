import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { reviewSupplierCheckReply } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const availabilityValues = new Set(["Available", "Partial", "Unavailable"]);

function optionalNumber(value: unknown, mode: "money" | "integer") {
  if (value === "" || value === null || value === undefined) return { ok: true as const, value: null };
  const stringValue = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  const validShape = mode === "money" ? /^\d{1,10}(?:\.\d{1,2})?$/.test(stringValue) : /^[1-9]\d{0,8}$/.test(stringValue);
  const parsed = Number(stringValue);
  if (!validShape || !Number.isFinite(parsed)) return { ok: false as const, value: null };
  return { ok: true as const, value: parsed };
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const payload = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const checkId = typeof payload.checkId === "string" ? payload.checkId.trim() : "";
  const reviewer = typeof payload.reviewer === "string" ? payload.reviewer.trim().slice(0, 120) : "";
  const availability = typeof payload.availability === "string" ? payload.availability : "";
  const price = optionalNumber(payload.quotedUnitPrice, "money");
  const moq = optionalNumber(payload.moq, "integer");
  if (!uuidPattern.test(checkId) || !reviewer || !availabilityValues.has(availability) || !price.ok || !moq.ok) {
    return NextResponse.json({ ok: false, error: "Provide the check, reviewer, verified availability, and valid optional price and MOQ." }, { status: 400 });
  }
  try {
    const rows = await reviewSupplierCheckReply({
      checkId,
      availability: availability as "Available" | "Partial" | "Unavailable",
      quotedUnitPrice: price.value,
      moq: moq.value,
      leadTime: typeof payload.leadTime === "string" ? payload.leadTime.trim().slice(0, 200) : "",
      reviewer,
      notes: typeof payload.notes === "string" ? payload.notes.trim().slice(0, 1000) : "",
    });
    const check = rows[0];
    if (!check) return NextResponse.json({ ok: false, error: "Supplier reply is not ready for review." }, { status: 409 });
    return NextResponse.json({ ok: true, checkId: check.id, availability: check.availability, reviewer });
  } catch {
    return NextResponse.json({ ok: false, error: "Supplier reply is not ready for review." }, { status: 409 });
  }
}
