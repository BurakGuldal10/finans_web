import { NextRequest, NextResponse } from "next/server";
import { analyzeCandles } from "@/lib/analysis";
import { fetchCandles, isSupportedUsdtSymbol, normalizeSymbol } from "@/lib/binance";

export async function GET(request: NextRequest) {
  const symbol = normalizeSymbol(request.nextUrl.searchParams.get("symbol") ?? "BTCUSDT");

  if (!isSupportedUsdtSymbol(symbol)) {
    return NextResponse.json(
      { error: "Sadece Binance USDT pariteleri analiz ediliyor. Ornek: BTCUSDT" },
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
