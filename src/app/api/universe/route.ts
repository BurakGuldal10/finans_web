import { NextRequest, NextResponse } from "next/server";
import { fetchSpotUsdtSymbols } from "@/lib/binance";
import { BIST_UNIVERSE, STOCK_UNIVERSE } from "@/lib/market-universe";
import { normalizeMarket } from "@/lib/markets";
import { createCacheKey, getCached } from "@/lib/server-cache";

const UNIVERSE_CACHE_TTL_SECONDS = 60 * 60;

export async function GET(request: NextRequest) {
  const market = normalizeMarket(request.nextUrl.searchParams.get("market"));

  try {
    const cacheResult = await getCached(
      createCacheKey(["universe", market]),
      UNIVERSE_CACHE_TTL_SECONDS,
      async () => {
        if (market === "crypto") {
          return fetchSpotUsdtSymbols();
        }

        if (market === "bist") {
          return BIST_UNIVERSE;
        }

        return STOCK_UNIVERSE;
      },
    );

    return NextResponse.json({
      cached: cacheResult.hit,
      cacheTtlSeconds: cacheResult.ttlSeconds,
      market,
      source: market === "crypto" ? "binance" : "local-universe",
      symbols: cacheResult.value,
      total: cacheResult.value.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown universe error",
      },
      { status: 502 },
    );
  }
}
