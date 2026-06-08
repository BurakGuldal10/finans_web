import { NextRequest, NextResponse } from "next/server";
import { normalizeSymbol, validateSpotUsdtSymbol } from "@/lib/binance";
import { normalizeMarket } from "@/lib/markets";
import { createCacheKey, getCached } from "@/lib/server-cache";
import {
  normalizeBistSymbol,
  normalizeStockSymbol,
  validateBistSymbol,
  validateStockSymbol,
} from "@/lib/yahoo";

const SYMBOL_CACHE_TTL_SECONDS = 60 * 60;

export async function GET(request: NextRequest) {
  const market = normalizeMarket(request.nextUrl.searchParams.get("market"));
  const rawSymbol = request.nextUrl.searchParams.get("symbol") ?? "";
  const symbol =
    market === "stocks"
      ? normalizeStockSymbol(rawSymbol)
      : market === "bist"
        ? normalizeBistSymbol(rawSymbol)
        : normalizeSymbol(rawSymbol);

  if (!symbol) {
    return NextResponse.json(
      { error: "Kontrol edilecek sembol girilmedi." },
      { status: 400 },
    );
  }

  try {
    const cacheResult = await getCached(
      createCacheKey(["symbol", market, symbol]),
      SYMBOL_CACHE_TTL_SECONDS,
      async () =>
        market === "stocks"
          ? await validateStockSymbol(symbol)
          : market === "bist"
            ? await validateBistSymbol(symbol)
            : await validateSpotUsdtSymbol(symbol),
    );
    const validation = cacheResult.value;

    return NextResponse.json(
      {
        ...validation,
        cached: cacheResult.hit,
        cacheTtlSeconds: cacheResult.ttlSeconds,
        stale: cacheResult.stale,
        staleReason: cacheResult.staleReason,
      },
      { status: validation.valid ? 200 : 404 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown symbol validation error",
      },
      { status: 502 },
    );
  }
}
