import { NextRequest, NextResponse } from "next/server";
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
  if (market === "crypto") {
    return NextResponse.json(
      { error: "Uzun vadeli bilanco analizi su an ABD ve BIST hisselerini destekliyor." },
      { status: 400 },
    );
  }

  const rawSymbol = request.nextUrl.searchParams.get("symbol") ?? (market === "bist" ? "THYAO.IS" : "AAPL");
  const symbol = market === "bist" ? normalizeBistSymbol(rawSymbol) : normalizeStockSymbol(rawSymbol);
  const horizonYears = normalizeHorizon(request.nextUrl.searchParams.get("horizon"));

  if (market === "bist" ? !isSupportedBistSymbol(symbol) : !isSupportedStockSymbol(symbol)) {
    return NextResponse.json({ error: "Gecerli bir hisse sembolu girin." }, { status: 400 });
  }

  try {
    return NextResponse.json({
      market,
      source: "FMP/Yahoo/SEC/Google News",
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
