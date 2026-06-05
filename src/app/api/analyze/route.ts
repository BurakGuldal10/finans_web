import { NextRequest, NextResponse } from "next/server";
import { analyzeCandles } from "@/lib/analysis";
import {
  fetchCandles,
  isSupportedUsdtSymbol,
  normalizeInterval,
  normalizeSymbol,
  validateSpotUsdtSymbol,
} from "@/lib/binance";
import { normalizeMarket } from "@/lib/markets";
import {
  fetchYahooCandles,
  isSupportedBistSymbol,
  isSupportedStockSymbol,
  normalizeBistSymbol,
  normalizeStockSymbol,
  validateBistSymbol,
  validateStockSymbol,
} from "@/lib/yahoo";

export async function GET(request: NextRequest) {
  const market = normalizeMarket(request.nextUrl.searchParams.get("market"));
  const rawSymbol =
    request.nextUrl.searchParams.get("symbol") ??
    (market === "stocks" ? "AAPL" : market === "bist" ? "THYAO.IS" : "BTCUSDT");
  const symbol =
    market === "stocks"
      ? normalizeStockSymbol(rawSymbol)
      : market === "bist"
        ? normalizeBistSymbol(rawSymbol)
        : normalizeSymbol(rawSymbol);
  const interval = normalizeInterval(request.nextUrl.searchParams.get("interval"));

  if (market === "stocks" && !isSupportedStockSymbol(symbol)) {
    return NextResponse.json(
      { error: "ABD hisse sembolu girin. Ornek: AAPL" },
      { status: 400 },
    );
  }

  if (market === "bist" && !isSupportedBistSymbol(symbol)) {
    return NextResponse.json(
      { error: "BIST sembolu girin. Ornek: THYAO veya THYAO.IS" },
      { status: 400 },
    );
  }

  if (market === "crypto" && !isSupportedUsdtSymbol(symbol)) {
    return NextResponse.json(
      { error: "Sadece Binance USDT pariteleri analiz ediliyor. Ornek: BTCUSDT" },
      { status: 400 },
    );
  }

  try {
    const validation =
      market === "stocks"
        ? await validateStockSymbol(symbol)
        : market === "bist"
          ? await validateBistSymbol(symbol)
          : await validateSpotUsdtSymbol(symbol);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 404 });
    }

    const candles =
      market === "crypto" ? await fetchCandles(symbol, interval) : await fetchYahooCandles(symbol, interval);

    return NextResponse.json({
      market,
      source: market === "crypto" ? "binance" : "yahoo",
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
