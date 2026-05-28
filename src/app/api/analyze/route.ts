import { NextRequest, NextResponse } from "next/server";
import { analyzeCandles } from "@/lib/analysis";
import {
  fetchCandles,
  isSupportedUsdtSymbol,
  normalizeInterval,
  normalizeSymbol,
  validateSpotUsdtSymbol,
} from "@/lib/binance";

export async function GET(request: NextRequest) {
  const symbol = normalizeSymbol(request.nextUrl.searchParams.get("symbol") ?? "BTCUSDT");
  const interval = normalizeInterval(request.nextUrl.searchParams.get("interval"));

  if (!isSupportedUsdtSymbol(symbol)) {
    return NextResponse.json(
      { error: "Sadece Binance USDT pariteleri analiz ediliyor. Ornek: BTCUSDT" },
      { status: 400 },
    );
  }

  try {
    const validation = await validateSpotUsdtSymbol(symbol);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 404 });
    }

    const candles = await fetchCandles(symbol, interval);
    return NextResponse.json({
      source: "binance",
      interval,
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
