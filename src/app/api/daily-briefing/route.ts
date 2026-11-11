import { NextRequest, NextResponse } from "next/server";
import {
  buildDailyBriefing,
  getDefaultBriefingTargets,
  type BriefingTarget,
} from "@/lib/daily-briefing";

export async function GET() {
  const briefing = await buildDailyBriefing(getDefaultBriefingTargets());
  return NextResponse.json({ briefing });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { targets?: unknown };
  const targets = Array.isArray(body.targets)
    ? body.targets.filter(isBriefingTarget)
    : getDefaultBriefingTargets();
  const briefing = await buildDailyBriefing(targets);

  return NextResponse.json({ briefing });
}

function isBriefingTarget(value: unknown): value is BriefingTarget {
  if (!value || typeof value !== "object") {
    return false;
  }

  const target = value as Partial<BriefingTarget>;
  return (
    typeof target.symbol === "string" &&
    typeof target.name === "string" &&
    (target.kind === "stock" ||
      target.kind === "commodity" ||
      target.kind === "crypto" ||
      target.kind === "index")
  );
}
