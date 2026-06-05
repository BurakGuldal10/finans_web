import { NextRequest, NextResponse } from "next/server";
import {
  createPortfolioPosition,
  deletePortfolioPosition,
  listPortfolioPositions,
  type PortfolioPositionRecord,
} from "@/lib/local-db";

export async function GET() {
  return NextResponse.json({ positions: listPortfolioPositions() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as PortfolioPositionRecord;
  const position: PortfolioPositionRecord = {
    id: body.id,
    symbol: body.symbol,
    quantity: Number(body.quantity),
    averageCost: Number(body.averageCost),
    stopLoss: Number(body.stopLoss),
    note: body.note ?? "",
    createdAt: body.createdAt,
  };

  return NextResponse.json({ position: createPortfolioPosition(position) });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id gerekli." }, { status: 400 });
  }

  deletePortfolioPosition(id);
  return NextResponse.json({ ok: true });
}
