import { NextRequest, NextResponse } from "next/server";
import { normalizeSymbol, validateSpotUsdtSymbol } from "@/lib/binance";
import { normalizeMarket } from "@/lib/markets";
import { normalizeStockSymbol, validateStockSymbol } from "@/lib/yahoo";

export async function GET(request: NextRequest) {
  const market = normalizeMarket(request.nextUrl.searchParams.get("market"));
  const rawSymbol = request.nextUrl.searchParams.get("symbol") ?? "";
  const symbol = market === "stocks" ? normalizeStockSymbol(rawSymbol) : normalizeSymbol(rawSymbol);

  if (!symbol) {
    return NextResponse.json(
      { error: "Kontrol edilecek sembol girilmedi." },
      { status: 400 },
    );
  }

  try {
    const validation =
      market === "stocks" ? await validateStockSymbol(symbol) : await validateSpotUsdtSymbol(symbol);

    return NextResponse.json(validation, { status: validation.valid ? 200 : 404 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown symbol validation error",
      },
      { status: 502 },
    );
  }
}
