import { NextResponse } from "next/server";
import { fetchTickers, parseSymbolList } from "@/lib/binance";
import { normalizeMarket } from "@/lib/markets";
import { createCacheKey, getCached } from "@/lib/server-cache";
import { fetchYahooTickers, parseBistSymbolList, parseStockSymbolList } from "@/lib/yahoo";

const MARKET_CACHE_TTL_SECONDS = 20;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const market = normalizeMarket(url.searchParams.get("market"));
    const symbols =
      market === "crypto"
        ? parseSymbolList(url.searchParams.get("symbols"))
        : market === "bist"
          ? parseBistSymbolList(url.searchParams.get("symbols"))
          : parseStockSymbolList(url.searchParams.get("symbols"));
    const cacheResult = await getCached(
      createCacheKey(["market", market, symbols.join(",")]),
      MARKET_CACHE_TTL_SECONDS,
      async () =>
        market === "crypto" ? await fetchTickers(symbols) : await fetchYahooTickers(symbols),
    );

    return NextResponse.json({
      cached: cacheResult.hit,
      cacheTtlSeconds: cacheResult.ttlSeconds,
      stale: cacheResult.stale,
      staleReason: cacheResult.staleReason,
      market,
      source: market === "crypto" ? "binance" : "yahoo",
      updatedAt: new Date().toISOString(),
      tickers: cacheResult.value,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown market data error",
      },
      { status: 502 },
    );
  }
}
