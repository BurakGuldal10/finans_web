import { NextRequest, NextResponse } from "next/server";
import {
  MissingFmpApiKeyError,
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

    return NextResponse.json({
      market,
      source: "financialmodelingprep",
      updatedAt: new Date().toISOString(),
      fundamentals: await fetchFundamentals(symbol),
    });
  } catch (error) {
    if (error instanceof MissingFmpApiKeyError) {
      return NextResponse.json(
        {
          error: "FMP_API_KEY tanimli degil. Canli temel analiz icin .env.local dosyasina FMP_API_KEY ekleyin.",
        },
        { status: 501 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown fundamentals error",
      },
      { status: 502 },
    );
  }
}
