import { NextRequest, NextResponse } from "next/server";
import { analyzeCandles } from "@/lib/analysis";
import { fetchCandles, getDefaultSymbols } from "@/lib/binance";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol")?.toUpperCase() ?? "BTCUSDT";

  if (!getDefaultSymbols().includes(symbol)) {
    return NextResponse.json(
      { error: "Bu ilk surumde sadece varsayilan izleme listesi analiz ediliyor." },
      { status: 400 },
    );
  }

  try {
    const candles = await fetchCandles(symbol);
    return NextResponse.json({
      source: "binance",
      interval: "1h",
      updatedAt: new Date().toISOString(),
      analysis: analyzeCandles(symbol, candles),
      candles: candles.slice(-48),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown analysis error",
      },
      { status: 502 },
    );
  }
}
