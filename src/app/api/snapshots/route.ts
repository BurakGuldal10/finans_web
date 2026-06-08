import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createAnalysisSnapshot,
  deleteAnalysisSnapshot,
  listAnalysisSnapshots,
  type AnalysisSnapshotRecord,
} from "@/lib/local-db";

const markets = new Set(["crypto", "stocks", "bist"]);
const stances = new Set(["watch", "wait", "avoid"]);

export async function GET() {
  return NextResponse.json({
    snapshots: listAnalysisSnapshots(),
  });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as Partial<AnalysisSnapshotRecord> | null;

  if (!payload) {
    return NextResponse.json({ error: "Gecersiz JSON govdesi." }, { status: 400 });
  }

  const market = typeof payload.market === "string" ? payload.market : "";
  const stance = typeof payload.stance === "string" ? payload.stance : "";
  const symbol = typeof payload.symbol === "string" ? payload.symbol.trim().toUpperCase() : "";
  const interval = typeof payload.interval === "string" ? payload.interval.trim() : "";
  const price = Number(payload.price);
  const score = Number(payload.score);
  const confidence = Number(payload.confidence);
  const reportJson = typeof payload.reportJson === "string" ? payload.reportJson : "";

  if (!markets.has(market) || !stances.has(stance) || !symbol || !interval) {
    return NextResponse.json({ error: "Snapshot alanlari eksik veya gecersiz." }, { status: 400 });
  }

  if (![price, score, confidence].every(Number.isFinite) || !reportJson) {
    return NextResponse.json({ error: "Snapshot sayisal alanlari gecersiz." }, { status: 400 });
  }

  const snapshot = createAnalysisSnapshot({
    confidence,
    createdAt: new Date().toISOString(),
    id: randomUUID(),
    interval,
    market: market as AnalysisSnapshotRecord["market"],
    price,
    reportJson,
    score,
    stance: stance as AnalysisSnapshotRecord["stance"],
    symbol,
  });

  return NextResponse.json({ snapshot }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Snapshot id gerekli." }, { status: 400 });
  }

  deleteAnalysisSnapshot(id);
  return NextResponse.json({ ok: true });
}
