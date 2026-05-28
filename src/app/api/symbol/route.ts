import { NextRequest, NextResponse } from "next/server";
import { normalizeSymbol, validateSpotUsdtSymbol } from "@/lib/binance";

export async function GET(request: NextRequest) {
  const symbol = normalizeSymbol(request.nextUrl.searchParams.get("symbol") ?? "");

  if (!symbol) {
    return NextResponse.json(
      { error: "Kontrol edilecek sembol girilmedi." },
      { status: 400 },
    );
  }

  try {
    const validation = await validateSpotUsdtSymbol(symbol);
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
