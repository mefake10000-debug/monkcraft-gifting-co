import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { listFinanceRecords, saveFinanceRecord } from "@/lib/automation/store";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const documentTypes = new Set(["Estimate", "Sales order", "Invoice", "Receipt", "Supplier bill", "Credit note"]);
const statuses = new Set(["Needs entry", "Entered in Vyapar", "Matched", "Mismatch", "Needs review"]);

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await listFinanceRecords()) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Finance records are unavailable. Confirm database configuration and apply finance migrations." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const id = typeof input.id === "string" && uuidPattern.test(input.id) ? input.id : null;
  const clientSubmissionId = typeof input.clientSubmissionId === "string" && uuidPattern.test(input.clientSubmissionId) ? input.clientSubmissionId : null;
  const orderId = typeof input.orderId === "string" ? input.orderId.trim() : "";
  const documentType = typeof input.documentType === "string" ? input.documentType : "";
  const status = typeof input.status === "string" ? input.status : "";
  const enteredBy = typeof input.enteredBy === "string" ? input.enteredBy.trim().slice(0, 120) : "";
  const actor = typeof input.actor === "string" ? input.actor.trim().slice(0, 120) : "";
  const reference = typeof input.vyaparReference === "string" ? input.vyaparReference.trim().slice(0, 200) : "";
  const amount = (value: unknown) => value === "" || value === null || value === undefined ? null : typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : NaN;
  const expectedAmount = amount(input.expectedAmount);
  const recordedAmount = amount(input.recordedAmount);
  const rawDate = typeof input.documentDate === "string" ? input.documentDate.trim() : "";
  const documentDate = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
  if (!uuidPattern.test(orderId) || (input.id !== null && input.id !== undefined && !id) || (!id && !clientSubmissionId) || !documentTypes.has(documentType) || !statuses.has(status) || !actor || !enteredBy || Number.isNaN(expectedAmount) || Number.isNaN(recordedAmount) || (rawDate && !documentDate)) {
    return NextResponse.json({ ok: false, error: "Provide a valid order, document type, status, staff names, amounts, and date." }, { status: 400 });
  }
  try {
    await saveFinanceRecord({
      id, orderId, documentType, vyaparReference: reference,
      expectedAmount, recordedAmount, status, enteredBy, documentDate,
      notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 2000) : "", actor, clientSubmissionId,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Finance record was not saved. Check the Vyapar reference, amounts, date, and reconciliation state." }, { status: 409 });
  }
}
