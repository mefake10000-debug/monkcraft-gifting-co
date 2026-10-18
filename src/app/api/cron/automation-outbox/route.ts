import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  isNotionLeadSyncConfigured,
  isNotionCustomerCareSyncConfigured,
  isNotionMarketingContentSyncConfigured,
  isNotionAgentFeedbackSyncConfigured,
  isNotionOrderSyncConfigured,
  isNotionQuoteSyncConfigured,
  isNotionSupplierCheckSyncConfigured,
  isNotionSupplierDirectorySyncConfigured,
  syncOneNotionLead,
  syncOneNotionCustomerCareTask,
  syncOneNotionMarketingContent,
  syncOneNotionAgentRun,
  syncOneNotionOrder,
  syncOneNotionQuoteVersion,
  syncOneNotionSupplierCheck,
  syncOneNotionSupplierDirectoryRecord,
} from "@/lib/automation/notion";
import { prepareQuoteSupplierChecks } from "@/lib/automation/supplierChecks";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  if (!secret || !supplied) return false;
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let supplierChecksPrepared = 0;
  let supplierPreparationFailed = 0;
  let leadsSynced = 0;
  let supplierChecksSynced = 0;
  let supplierDirectorySynced = 0;
  let ordersSynced = 0;
  let quoteVersionsSynced = 0;
  let customerCareSynced = 0;
  let marketingContentSynced = 0;
  let agentRunsSynced = 0;
  let failed = 0;
  for (let i = 0; i < 15; i += 1) {
    const result = await prepareQuoteSupplierChecks();
    if (result.status === "empty") break;
    if (result.status === "prepared") supplierChecksPrepared += result.checkCount;
    else if (result.status === "failed") {
      supplierPreparationFailed += 1;
      // A failed row is scheduled for a later retry by the database. Keep
      // draining other eligible jobs so one bad request cannot block the queue.
      continue;
    }
  }
  if (isNotionLeadSyncConfigured()) for (let i = 0; i < 15; i += 1) {
    const result = await syncOneNotionLead();
    if (result === "empty") break;
    if (result === "synced") leadsSynced += 1;
    else if (result === "failed") failed += 1;
    else break;
  }
  if (isNotionSupplierCheckSyncConfigured()) for (let i = 0; i < 30; i += 1) {
    const result = await syncOneNotionSupplierCheck();
    if (result === "empty") break;
    if (result === "synced") supplierChecksSynced += 1;
    else if (result === "failed") failed += 1;
    else break;
  }
  if (isNotionSupplierDirectorySyncConfigured()) for (let i = 0; i < 30; i += 1) {
    const result = await syncOneNotionSupplierDirectoryRecord();
    if (result === "empty") break;
    if (result === "synced") supplierDirectorySynced += 1;
    else if (result === "failed") failed += 1;
    else break;
  }
  if (isNotionOrderSyncConfigured()) for (let i = 0; i < 30; i += 1) {
    const result = await syncOneNotionOrder();
    if (result === "empty") break;
    if (result === "synced") ordersSynced += 1;
    else if (result === "failed") failed += 1;
    else break;
  }
  if (isNotionQuoteSyncConfigured()) for (let i = 0; i < 30; i += 1) {
    const result = await syncOneNotionQuoteVersion();
    if (result === "empty") break;
    if (result === "synced") quoteVersionsSynced += 1;
    else if (result === "failed") failed += 1;
    else break;
  }
  if (isNotionCustomerCareSyncConfigured()) for (let i = 0; i < 30; i += 1) {
    const result = await syncOneNotionCustomerCareTask();
    if (result === "empty") break;
    if (result === "synced") customerCareSynced += 1;
    else if (result === "failed") failed += 1;
    else break;
  }
  if (isNotionMarketingContentSyncConfigured()) for (let i = 0; i < 30; i += 1) {
    const result = await syncOneNotionMarketingContent();
    if (result === "empty") break;
    if (result === "synced") marketingContentSynced += 1;
    else if (result === "failed") failed += 1;
    else break;
  }
  if (isNotionAgentFeedbackSyncConfigured()) for (let i = 0; i < 30; i += 1) {
    const result = await syncOneNotionAgentRun();
    if (result === "empty") break;
    if (result === "synced") agentRunsSynced += 1;
    else if (result === "failed") failed += 1;
    else break;
  }
  return NextResponse.json({
    ok: failed === 0 && supplierPreparationFailed === 0,
    supplierChecksPrepared,
    supplierPreparationFailed,
    leadsSynced,
    supplierChecksSynced,
    supplierDirectorySynced,
    ordersSynced,
    quoteVersionsSynced,
    customerCareSynced,
    marketingContentSynced,
    agentRunsSynced,
    failed,
  });
}
