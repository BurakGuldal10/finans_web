import { NextRequest, NextResponse } from "next/server";
import { isSupportedUsdtSymbol, normalizeSymbol } from "@/lib/binance";
import { buildLongTermResearch, type LongTermHorizon } from "@/lib/long-term-analysis";
import { normalizeMarket } from "@/lib/markets";
import {
  isSupportedBistSymbol,
  isSupportedStockSymbol,
  normalizeBistSymbol,
  normalizeStockSymbol,
} from "@/lib/yahoo";

export async function GET(request: NextRequest) {
  const market = normalizeMarket(request.nextUrl.searchParams.get("market"));
  const rawSymbol =
    request.nextUrl.searchParams.get("symbol") ??
    (market === "bist" ? "THYAO.IS" : market === "stocks" ? "AAPL" : "BTCUSDT");
  const symbol =
    market === "bist"
      ? normalizeBistSymbol(rawSymbol)
      : market === "stocks"
        ? normalizeStockSymbol(rawSymbol)
        : normalizeSymbol(rawSymbol);
  const horizonYears = normalizeHorizon(request.nextUrl.searchParams.get("horizon"));

  if (market === "crypto" && !isSupportedUsdtSymbol(symbol)) {
    return NextResponse.json({ error: "Gecerli bir Binance USDT paritesi girin. Ornek: BTCUSDT" }, { status: 400 });
  }

  if (market === "bist" && !isSupportedBistSymbol(symbol)) {
    return NextResponse.json({ error: "Gecerli bir BIST sembolu girin." }, { status: 400 });
  }

  if (market === "stocks" && !isSupportedStockSymbol(symbol)) {
    return NextResponse.json({ error: "Gecerli bir hisse sembolu girin." }, { status: 400 });
  }

  try {
    return NextResponse.json({
      market,
      source: market === "crypto" ? "Binance/Google News" : "FMP/Yahoo/SEC/Google News",
      research: await buildLongTermResearch({ market, symbol, horizonYears }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Uzun vadeli analiz tamamlanamadi." },
      { status: 502 },
    );
  }
}

function normalizeHorizon(value: string | null): LongTermHorizon {
  if (!value) return "5y";
  const val = value.trim().toLowerCase();
  if (val === "3m" || val === "6m" || val === "1y" || val === "3y" || val === "5y") {
    return val as LongTermHorizon;
  }
  if (val === "1") return "1y";
  if (val === "3") return "3y";
  if (val === "5") return "5y";
  return "5y";
}
