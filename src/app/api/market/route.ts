import { NextResponse } from "next/server";
import { fetchTickers, parseSymbolList } from "@/lib/binance";
import { normalizeMarket } from "@/lib/markets";
import { fetchYahooTickers, parseBistSymbolList, parseStockSymbolList } from "@/lib/yahoo";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const market = normalizeMarket(url.searchParams.get("market"));
    const tickers =
      market === "crypto"
        ? await fetchTickers(parseSymbolList(url.searchParams.get("symbols")))
        : await fetchYahooTickers(
            market === "bist"
              ? parseBistSymbolList(url.searchParams.get("symbols"))
              : parseStockSymbolList(url.searchParams.get("symbols")),
          );

    return NextResponse.json({
      market,
      source: market === "crypto" ? "binance" : "yahoo",
      updatedAt: new Date().toISOString(),
      tickers,
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
