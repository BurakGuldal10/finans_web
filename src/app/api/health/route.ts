import { NextResponse } from "next/server";
import { getLocalDataStats } from "@/lib/local-db";

export async function GET() {
  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    data: getLocalDataStats(),
    environment: {
      fmpApiKey: Boolean(process.env.FMP_API_KEY),
      nodeEnv: process.env.NODE_ENV ?? "development",
    },
    sources: {
      bist: "yahoo",
      crypto: "binance",
      stocks: "yahoo",
      stockFundamentals: process.env.FMP_API_KEY ? "financialmodelingprep" : "missing-key",
    },
    resilience: {
      staleCacheFallback: true,
    },
  });
}
