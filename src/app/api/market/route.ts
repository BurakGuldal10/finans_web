import { NextResponse } from "next/server";
import { fetchTickers } from "@/lib/binance";

export async function GET() {
  try {
    const tickers = await fetchTickers();
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
