import { NextResponse } from "next/server";
import { fetchTickers, parseSymbolList } from "@/lib/binance";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tickers = await fetchTickers(parseSymbolList(url.searchParams.get("symbols")));
    return NextResponse.json({
      source: "binance",
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
