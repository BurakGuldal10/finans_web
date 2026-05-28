import type { Candle } from "@/lib/analysis";

export type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
};

export type BinanceInterval = "15m" | "1h" | "4h" | "1d";

type BinanceExchangeInfo = {
  symbols: Array<{
    symbol: string;
    status: string;
    quoteAsset: string;
    isSpotTradingAllowed: boolean;
  }>;
};

const DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
const SYMBOL_PATTERN = /^[A-Z0-9]{3,20}USDT$/;
const SUPPORTED_INTERVALS: BinanceInterval[] = ["15m", "1h", "4h", "1d"];

export async function fetchTickers(symbols = DEFAULT_SYMBOLS) {
  const url = "https://api.binance.com/api/v3/ticker/24hr";
  const response = await fetch(url, {
    next: { revalidate: 20 },
  });

  if (!response.ok) {
    throw new Error(`Binance ticker request failed: ${response.status}`);
  }

  const data = (await response.json()) as BinanceTicker[];
  const allowed = new Set(symbols);
  return data
    .filter((ticker) => allowed.has(ticker.symbol))
    .map((ticker) => ({
      symbol: ticker.symbol,
      price: Number(ticker.lastPrice),
      changePercent: Number(ticker.priceChangePercent),
      quoteVolume: Number(ticker.quoteVolume),
      high: Number(ticker.highPrice),
      low: Number(ticker.lowPrice),
    }));
}

export async function fetchCandles(symbol: string, interval: BinanceInterval = "1h", limit = 120) {
  const normalizedSymbol = normalizeSymbol(symbol);
  const params = new URLSearchParams({
    symbol: normalizedSymbol,
    interval,
    limit: String(limit),
  });
  const response = await fetch(`https://api.binance.com/api/v3/klines?${params}`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Binance candle request failed: ${response.status}`);
  }

  const data = (await response.json()) as unknown[][];
  return data.map(
    (item): Candle => ({
      openTime: Number(item[0]),
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
      volume: Number(item[5]),
    }),
  );
}

export function getDefaultSymbols() {
  return DEFAULT_SYMBOLS;
}

export function getSupportedIntervals() {
  return SUPPORTED_INTERVALS;
}

export function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isSupportedUsdtSymbol(symbol: string) {
  return SYMBOL_PATTERN.test(normalizeSymbol(symbol));
}

export function normalizeInterval(interval: string | null): BinanceInterval {
  if (interval && SUPPORTED_INTERVALS.includes(interval as BinanceInterval)) {
    return interval as BinanceInterval;
  }

  return "1h";
}

export function parseSymbolList(value: string | null) {
  if (!value) {
    return DEFAULT_SYMBOLS;
  }

  const symbols = value
    .split(",")
    .map(normalizeSymbol)
    .filter(isSupportedUsdtSymbol);

  return Array.from(new Set(symbols)).slice(0, 20);
}

export async function validateSpotUsdtSymbol(symbol: string) {
  const normalizedSymbol = normalizeSymbol(symbol);

  if (!isSupportedUsdtSymbol(normalizedSymbol)) {
    return {
      symbol: normalizedSymbol,
      valid: false,
      reason: "USDT paritesi formatinda girin. Ornek: AVAXUSDT",
    };
  }

  const params = new URLSearchParams({ symbol: normalizedSymbol });
  const response = await fetch(`https://api.binance.com/api/v3/exchangeInfo?${params}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return {
      symbol: normalizedSymbol,
      valid: false,
      reason: `${normalizedSymbol} Binance spot piyasasinda bulunamadi.`,
    };
  }

  const data = (await response.json()) as BinanceExchangeInfo;
  const match = data.symbols.find((item) => item.symbol === normalizedSymbol);
  const valid =
    match?.status === "TRADING" &&
    match.quoteAsset === "USDT" &&
    match.isSpotTradingAllowed === true;

  return {
    symbol: normalizedSymbol,
    valid,
    reason: valid ? null : `${normalizedSymbol} aktif Binance spot USDT paritesi degil.`,
  };
}
