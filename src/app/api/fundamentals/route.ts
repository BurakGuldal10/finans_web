import { NextRequest, NextResponse } from "next/server";
import {
  fetchFundamentals,
  fetchYahooFundamentals,
} from "@/lib/fundamentals";
import { normalizeMarket } from "@/lib/markets";
import { normalizeBistSymbol, normalizeStockSymbol } from "@/lib/yahoo";

export async function GET(request: NextRequest) {
  const market = normalizeMarket(request.nextUrl.searchParams.get("market"));

  if (market === "crypto") {
    return NextResponse.json(
      { error: "Temel analiz su an sadece hisse senetleri icin destekleniyor." },
      { status: 400 },
    );
  }

  const requestedSymbol = request.nextUrl.searchParams.get("symbol");
  const symbol =
    market === "bist"
      ? normalizeBistSymbol(requestedSymbol ?? "THYAO.IS")
      : normalizeStockSymbol(requestedSymbol ?? "AAPL");

  try {
    if (market === "bist") {
      return NextResponse.json({
        market,
        source: "yahoo",
        updatedAt: new Date().toISOString(),
        fundamentals: await fetchYahooFundamentals(symbol),
      });
    }

    if (process.env.FMP_API_KEY) {
      try {
        return NextResponse.json({
          market,
          source: "financialmodelingprep",
          updatedAt: new Date().toISOString(),
          fundamentals: await fetchFundamentals(symbol),
        });
      } catch {
        // FMP plani veya servis erisimi yetersizse temel panel Yahoo ile calismaya devam eder.
      }
    }

    return NextResponse.json({
      market,
      source: "yahoo",
      updatedAt: new Date().toISOString(),
      fundamentals: await fetchYahooFundamentals(symbol),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown fundamentals error",
      },
      { status: 502 },
    );
  }
}
