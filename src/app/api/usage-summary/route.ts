import { NextRequest, NextResponse } from "next/server";
import { listUsageTrialNotes } from "@/lib/local-db";
import { buildUsageSummary } from "@/lib/usage-summary";

export async function GET(request: NextRequest) {
  const days = Number(request.nextUrl.searchParams.get("days") ?? 7);
  const safeDays = Number.isFinite(days) ? days : 7;

  return NextResponse.json({
    summary: buildUsageSummary(listUsageTrialNotes(200), safeDays),
  });
}
