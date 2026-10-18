import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { getProductById } from "@/data/catalogue/products";
import { isNotionSupplierDirectorySyncConfigured, syncOneNotionSupplierDirectoryRecord } from "@/lib/automation/notion";
import {
  validateMappingRetirementInput,
  validateSupplierDirectoryInput,
  validateSupplierProductMappingInput,
} from "@/lib/automation/supplierAdmin";
import {
  listSupplierDirectoryForOperations,
  deactivateSupplierProductMapping,
  saveSupplierDirectoryRecord,
  saveSupplierProductMapping,
} from "@/lib/automation/store";

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    const directory = await listSupplierDirectoryForOperations();
    return NextResponse.json({ ok: true, ...directory }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "Supplier directory is unavailable. Confirm database configuration and apply the supplier management migration." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 }); }
  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  if (input.action === "save_supplier") {
    const parsed = validateSupplierDirectoryInput(input.supplier);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    try {
      const rows = await saveSupplierDirectoryRecord(parsed.value);
      if (!rows[0]) throw new Error("supplier_record_missing");
      let notionSync: "synced" | "pending" | "not_configured" = "not_configured";
      if (isNotionSupplierDirectorySyncConfigured()) {
        try { notionSync = await syncOneNotionSupplierDirectoryRecord(rows[0].id) === "synced" ? "synced" : "pending"; }
        catch { notionSync = "pending"; }
      }
      return NextResponse.json({ ok: true, supplier: rows[0], notionSync }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json({ ok: false, error: "Supplier record could not be saved. Check for a duplicate supplier code and try again." }, { status: 409 });
    }
  }
  if (input.action === "save_mapping") {
    const parsed = validateSupplierProductMappingInput(input.mapping);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    if (!getProductById(parsed.value.productId)) {
      return NextResponse.json({ ok: false, error: "Product ID does not match an active catalogue record. Refresh the catalogue and select a current product." }, { status: 400 });
    }
    try {
      const rows = await saveSupplierProductMapping(parsed.value);
      if (!rows[0]) throw new Error("supplier_mapping_missing");
      let notionSync: "synced" | "pending" | "not_configured" = "not_configured";
      if (isNotionSupplierDirectorySyncConfigured()) {
        try { notionSync = await syncOneNotionSupplierDirectoryRecord(rows[0].supplier_id) === "synced" ? "synced" : "pending"; }
        catch { notionSync = "pending"; }
      }
      return NextResponse.json({ ok: true, notionSync }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json({ ok: false, error: "Product mapping could not be saved. The supplier may be inactive; refresh the directory and try again." }, { status: 409 });
    }
  }
  if (input.action === "deactivate_mapping") {
    const parsed = validateMappingRetirementInput(input.mapping);
    if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    try {
      const rows = await deactivateSupplierProductMapping(parsed.productId, parsed.actor);
      if (!rows[0]) throw new Error("supplier_mapping_missing");
      let notionSync: "synced" | "pending" | "not_configured" = "not_configured";
      if (isNotionSupplierDirectorySyncConfigured()) {
        try { notionSync = await syncOneNotionSupplierDirectoryRecord(rows[0].supplier_id) === "synced" ? "synced" : "pending"; }
        catch { notionSync = "pending"; }
      }
      return NextResponse.json({ ok: true, notionSync }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json({ ok: false, error: "Mapping could not be deactivated. Refresh the directory and try again." }, { status: 409 });
    }
  }
  return NextResponse.json({ ok: false, error: "Choose a supported supplier operation." }, { status: 400 });
}
