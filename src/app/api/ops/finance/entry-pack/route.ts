import { NextResponse } from "next/server";
import { isAuthorizedOperationsRequest } from "@/lib/automation/opsAuth";
import { getVyaparEntryPack } from "@/lib/automation/store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  if (!isAuthorizedOperationsRequest(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const orderId = new URL(request.url).searchParams.get("orderId")?.trim() ?? "";
  if (!UUID.test(orderId)) return NextResponse.json({ ok: false, error: "Select a valid order." }, { status: 400 });
  try {
    const pack = await getVyaparEntryPack(orderId);
    const filename = `${pack.order.orderCode.replace(/[^a-zA-Z0-9_-]/g, "-")}-vyapar-entry-pack.json`;
    return new NextResponse(JSON.stringify(pack, null, 2), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "No accepted quote version with approval evidence was found for this order." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
