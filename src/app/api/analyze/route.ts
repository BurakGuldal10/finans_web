import { NextRequest, NextResponse } from "next/server";
import { analyzeCandles, buildTradePlan, summarizeTimeframes } from "@/lib/analysis";
import {
  type BinanceInterval,
  fetchCandles,
  isSupportedUsdtSymbol,
  normalizeInterval,
  normalizeSymbol,
  validateSpotUsdtSymbol,
} from "@/lib/binance";
import { normalizeMarket } from "@/lib/markets";
import { createCacheKey, getCached } from "@/lib/server-cache";
import {
  fetchYahooCandles,
  isSupportedBistSymbol,
  isSupportedStockSymbol,
  normalizeBistSymbol,
  normalizeStockSymbol,
  validateBistSymbol,
  validateStockSymbol,
} from "@/lib/yahoo";

const ANALYSIS_CACHE_TTL_SECONDS = 45;
const TIMEFRAME_LABELS: Record<BinanceInterval, string> = {
  "15m": "15 dakika",
  "1h": "1 saat",
  "4h": "4 saat",
  "1d": "1 gun",
};
const CONFIRMATION_INTERVALS: BinanceInterval[] = ["15m", "1h", "4h", "1d"];

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

    const cacheResult = await getCached(
      createCacheKey(["analysis", market, symbol, interval]),
      ANALYSIS_CACHE_TTL_SECONDS,
      async () => {
        const candleSets = await Promise.all(
          CONFIRMATION_INTERVALS.map(async (currentInterval) => ({
            candles:
              market === "crypto"
                ? await fetchCandles(symbol, currentInterval)
                : await fetchYahooCandles(symbol, currentInterval),
            interval: currentInterval,
          })),
        );
        const selectedCandles =
          candleSets.find((item) => item.interval === interval)?.candles ?? candleSets[1].candles;
        const timeframeAnalyses = candleSets.map((item) => ({
          analysis: analyzeCandles(symbol, item.candles),
          interval: item.interval,
          label: TIMEFRAME_LABELS[item.interval],
        }));

        const analysis =
          timeframeAnalyses.find((item) => item.interval === interval)?.analysis ??
          analyzeCandles(symbol, selectedCandles);
        const multiTimeframe = summarizeTimeframes(timeframeAnalyses);

        return {
          analysis,
          candles: selectedCandles.slice(-80),
          multiTimeframe,
          tradePlan: buildTradePlan(analysis, multiTimeframe),
        };
      },
    );

    return NextResponse.json({
      cached: cacheResult.hit,
      cacheTtlSeconds: cacheResult.ttlSeconds,
      stale: cacheResult.stale,
      staleReason: cacheResult.staleReason,
      market,
      source: market === "crypto" ? "binance" : "yahoo",
      interval,
      updatedAt: new Date().toISOString(),
      analysis: cacheResult.value.analysis,
      candles: cacheResult.value.candles,
      multiTimeframe: cacheResult.value.multiTimeframe,
      tradePlan: cacheResult.value.tradePlan,
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
