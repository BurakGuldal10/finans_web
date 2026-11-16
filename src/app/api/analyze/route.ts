import { NextRequest, NextResponse } from "next/server";
import {
  type AnalysisResult,
  analyzeCandles,
  buildDecisionReport,
  buildTradePlan,
  type Candle,
  summarizeTimeframes,
} from "@/lib/analysis";
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
const VALIDATION_CACHE_TTL_SECONDS = 3600;
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
    const validationCache = await getCached(
      createCacheKey(["symbol-valid", market, symbol]),
      VALIDATION_CACHE_TTL_SECONDS,
      async () =>
        market === "stocks"
          ? await validateStockSymbol(symbol)
          : market === "bist"
            ? await validateBistSymbol(symbol)
            : await validateSpotUsdtSymbol(symbol),
    );

    if (!validationCache.value.valid) {
      return NextResponse.json({ error: validationCache.value.reason }, { status: 404 });
    }

    // 4 zaman diliminin tamamını sembol bazında önbellekle; zaman dilimi geçişlerinde 0 dış API isteği yap
    const bundleResult = await getCached(
      createCacheKey(["analysis-bundle", market, symbol]),
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

        const candlesByInterval = {} as Record<BinanceInterval, Candle[]>;
        const analysisByInterval = {} as Record<BinanceInterval, AnalysisResult>;

        const timeframeAnalyses = candleSets.map((item) => {
          const currentAnalysis = analyzeCandles(symbol, item.candles);
          candlesByInterval[item.interval] = item.candles.slice(-80);
          analysisByInterval[item.interval] = currentAnalysis;
          return {
            analysis: currentAnalysis,
            interval: item.interval,
            label: TIMEFRAME_LABELS[item.interval],
          };
        });

        const multiTimeframe = summarizeTimeframes(timeframeAnalyses);

        return {
          analysisByInterval,
          candlesByInterval,
          multiTimeframe,
        };
      },
    );

    const bundle = bundleResult.value;
    const analysis = bundle.analysisByInterval[interval] ?? bundle.analysisByInterval["1h"];
    const candles = bundle.candlesByInterval[interval] ?? bundle.candlesByInterval["1h"];
    const tradePlan = buildTradePlan(analysis, bundle.multiTimeframe);
    const decisionReport = buildDecisionReport(analysis, bundle.multiTimeframe, tradePlan);

    return NextResponse.json({
      cached: bundleResult.hit,
      cacheTtlSeconds: bundleResult.ttlSeconds,
      stale: bundleResult.stale,
      staleReason: bundleResult.staleReason,
      market,
      source: market === "crypto" ? "binance" : "yahoo",
      interval,
      updatedAt: new Date().toISOString(),
      analysis,
      candles,
      decisionReport,
      multiTimeframe: bundle.multiTimeframe,
      tradePlan,
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
