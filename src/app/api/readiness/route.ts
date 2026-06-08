import { NextResponse } from "next/server";
import { isLocalAuthEnabled } from "@/lib/local-auth";
import { getLocalDataStats, listUsageTrialNotes } from "@/lib/local-db";
import { buildReadinessReport } from "@/lib/readiness";
import { buildUsageSummary } from "@/lib/usage-summary";

export async function GET() {
  const stats = getLocalDataStats();
  const usageSummary = buildUsageSummary(listUsageTrialNotes(200), 7);

  return NextResponse.json({
    report: buildReadinessReport({
      fmpApiKey: Boolean(process.env.FMP_API_KEY),
      localAuth: isLocalAuthEnabled(),
      openAiApiKey: Boolean(process.env.OPENAI_API_KEY),
      stats,
      usageSummary,
    }),
  });
}
