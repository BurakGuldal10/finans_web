import { NextRequest, NextResponse } from "next/server";
import { MissingFmpApiKeyError, fetchFundamentals } from "@/lib/fundamentals";
import { normalizeMarket } from "@/lib/markets";
import { normalizeStockSymbol } from "@/lib/yahoo";

export async function GET(request: NextRequest) {
  const market = normalizeMarket(request.nextUrl.searchParams.get("market"));

  if (market !== "stocks") {
    return NextResponse.json(
      { error: "Temel analiz su an sadece ABD hisseleri icin destekleniyor." },
      { status: 400 },
    );
  }

  const symbol = normalizeStockSymbol(request.nextUrl.searchParams.get("symbol") ?? "AAPL");

  try {
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
