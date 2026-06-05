import { NextRequest, NextResponse } from "next/server";
import {
  createTradeEntry,
  deleteTradeEntry,
  listTradeEntries,
  updateTradeStatus,
  type TradeEntryRecord,
} from "@/lib/local-db";

export async function GET() {
  return NextResponse.json({ entries: listTradeEntries() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as TradeEntryRecord;
  const entry: TradeEntryRecord = {
    id: body.id,
    symbol: body.symbol,
    timeframe: body.timeframe,
    side: body.side,
    entryPrice: Number(body.entryPrice),
    stopLoss: Number(body.stopLoss),
    targetPrice: Number(body.targetPrice),
    quantity: Number(body.quantity),
    strategy: body.strategy ?? "Teknik skor",
    status: body.status,
    note: body.note ?? "",
    createdAt: body.createdAt,
  };

  return NextResponse.json({ entry: createTradeEntry(entry) });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { id?: string; status?: TradeEntryRecord["status"] };
  if (!body.id || !body.status) {
    return NextResponse.json({ error: "id ve status gerekli." }, { status: 400 });
  }

  updateTradeStatus(body.id, body.status);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id gerekli." }, { status: 400 });
  }

  deleteTradeEntry(id);
  return NextResponse.json({ ok: true });
}
