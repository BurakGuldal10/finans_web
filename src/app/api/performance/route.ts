import { NextResponse } from "next/server";
import { getPerformanceSummary } from "@/lib/performance";

export async function GET() {
  return NextResponse.json({ performance: getPerformanceSummary() });
}
