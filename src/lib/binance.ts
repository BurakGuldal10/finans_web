import type { Candle } from "@/lib/analysis";
import { createCacheKey, getCached } from "@/lib/server-cache";

export type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
};

export type NormalizedTicker = {
  symbol: string;
  price: number;
  changePercent: number;
  quoteVolume: number;
  high: number;
  low: number;
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

const DEFAULT_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "BNBUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "AVAXUSDT",
  "DOGEUSDT",
  "DOTUSDT",
  "LINKUSDT",
  "POLUSDT",
  "LTCUSDT",
  "TRXUSDT",
  "ATOMUSDT",
  "NEARUSDT",
  "APTUSDT",
  "ARBUSDT",
  "OPUSDT",
  "INJUSDT",
  "SUIUSDT",
];
const KNOWN_VALID_SYMBOLS = new Set(DEFAULT_SYMBOLS);
const SYMBOL_PATTERN = /^[A-Z0-9]{3,20}USDT$/;
const SUPPORTED_INTERVALS: BinanceInterval[] = ["15m", "1h", "4h", "1d"];
const REQUEST_TIMEOUT_MS = 8000;

function mapBinanceTicker(ticker: BinanceTicker): NormalizedTicker {
  return {
    symbol: ticker.symbol,
    price: Number(ticker.lastPrice),
    changePercent: Number(ticker.priceChangePercent),
    quoteVolume: Number(ticker.quoteVolume),
    high: Number(ticker.highPrice),
    low: Number(ticker.lowPrice),
  };
}

async function fetchAllTickersCached(): Promise<Map<string, NormalizedTicker>> {
  const result = await getCached("binance:all-24hr-tickers-map", 20, async () => {
    const response = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
      next: { revalidate: 20 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Binance ticker request failed: ${response.status}`);
    }

    const data = (await response.json()) as BinanceTicker[];
    const map = new Map<string, NormalizedTicker>();
    for (const item of data) {
      if (item.symbol.endsWith("USDT")) {
        map.set(item.symbol, mapBinanceTicker(item));
      }
    }
    return map;
  });

  return result.value;
}

export async function fetchTickers(symbols = DEFAULT_SYMBOLS): Promise<NormalizedTicker[]> {
  const uniqueSymbols = Array.from(new Set(symbols.map(normalizeSymbol).filter(isSupportedUsdtSymbol)));
  if (uniqueSymbols.length === 0) {
    return [];
  }

  // Küçük ve bilinen sembol listelerinde yalnızca ilgili sembolleri çekerek ~1.5MB yükten tasarruf et
  if (uniqueSymbols.length <= 40) {
    try {
      const encodedSymbols = encodeURIComponent(JSON.stringify(uniqueSymbols));
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodedSymbols}`,
        {
          next: { revalidate: 15 },
          signal: AbortSignal.timeout(5000),
        },
      );

      if (response.ok) {
        const data = (await response.json()) as BinanceTicker[];
        const bySymbol = new Map(data.map((item) => [item.symbol, mapBinanceTicker(item)]));
        return uniqueSymbols
          .map((sym) => bySymbol.get(sym))
          .filter((item): item is NormalizedTicker => item !== undefined);
      }
    } catch {
      // Hata veya geçersiz sembol durumunda paylaşımlı tüm liste önbelleğine düş
    }
  }

  const allTickers = await fetchAllTickersCached();
  return uniqueSymbols
    .map((sym) => allTickers.get(sym))
    .filter((item): item is NormalizedTicker => item !== undefined);
}

export async function fetchCandles(
  symbol: string,
  interval: BinanceInterval = "1h",
  limit = 210,
): Promise<Candle[]> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const cacheKey = createCacheKey(["binance-klines", normalizedSymbol, interval, limit]);
  const ttlSeconds = interval === "15m" ? 30 : interval === "1h" ? 45 : 90;

  const cached = await getCached(cacheKey, ttlSeconds, async () => {
    const params = new URLSearchParams({
      symbol: normalizedSymbol,
      interval,
      limit: String(limit),
    });
    const response = await fetch(`https://api.binance.com/api/v3/klines?${params}`, {
      next: { revalidate: ttlSeconds },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
  });

  return cached.value;
}

export function getDefaultSymbols() {
  return DEFAULT_SYMBOLS;
}

export function getSupportedIntervals() {
  return SUPPORTED_INTERVALS;
}

export function normalizeSymbol(symbol: string) {
  const cleaned = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return cleaned === "MATICUSDT" ? "POLUSDT" : cleaned;
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

  return Array.from(new Set(symbols)).slice(0, 500);
}

export async function fetchSpotUsdtSymbols(): Promise<string[]> {
  const cached = await getCached("binance:spot-usdt-symbols", 3600, async () => {
    const response = await fetch("https://api.binance.com/api/v3/exchangeInfo?permissions=SPOT", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Binance exchangeInfo request failed: ${response.status}`);
    }

    const data = (await response.json()) as BinanceExchangeInfo;

    return data.symbols
      .filter(
        (item) =>
          item.status === "TRADING" &&
          item.quoteAsset === "USDT" &&
          item.isSpotTradingAllowed === true,
      )
      .map((item) => item.symbol)
      .sort();
  });

  return cached.value;
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

  // Bilinen varsayılan semboller için dış ağ çağrısını tamamen atla (0ms)
  if (KNOWN_VALID_SYMBOLS.has(normalizedSymbol)) {
    return {
      symbol: normalizedSymbol,
      valid: true,
      reason: null,
    };
  }

  try {
    const spotSymbols = await fetchSpotUsdtSymbols();
    if (spotSymbols.includes(normalizedSymbol)) {
      KNOWN_VALID_SYMBOLS.add(normalizedSymbol);
      return {
        symbol: normalizedSymbol,
        valid: true,
        reason: null,
      };
    }
  } catch {
    // Genel liste alınamazsa tekil sembol sorgusuna düş
  }

  const params = new URLSearchParams({ symbol: normalizedSymbol });
  const response = await fetch(`https://api.binance.com/api/v3/exchangeInfo?${params}`, {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(6000),
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

  if (valid) {
    KNOWN_VALID_SYMBOLS.add(normalizedSymbol);
  }

  return {
    symbol: normalizedSymbol,
    valid,
    reason: valid ? null : `${normalizedSymbol} aktif Binance spot USDT paritesi degil.`,
  };
}
