import type { Candle } from "@/lib/analysis";
import type { BinanceInterval } from "@/lib/binance";

type YahooChartResponse = {
  chart: {
    result?: Array<{
      meta?: {
        symbol?: string;
        shortName?: string;
        regularMarketPrice?: number;
        previousClose?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
  };
};

const DEFAULT_STOCK_SYMBOLS = ["AAPL", "MSFT", "NVDA", "TSLA", "SPY"];
const DEFAULT_BIST_SYMBOLS = ["THYAO.IS", "GARAN.IS", "ASELS.IS", "BIMAS.IS", "KCHOL.IS"];
const STOCK_SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;
const BIST_SYMBOL_PATTERN = /^[A-Z][A-Z0-9]{1,9}\.IS$/;

export function getDefaultStockSymbols() {
  return DEFAULT_STOCK_SYMBOLS;
}

export function getDefaultBistSymbols() {
  return DEFAULT_BIST_SYMBOLS;
}

export function normalizeStockSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

export function normalizeBistSymbol(symbol: string) {
  const normalized = symbol.trim().toUpperCase().replace(/[^A-Z0-9.]/g, "");
  return normalized.endsWith(".IS") ? normalized : `${normalized.replace(/\.$/, "")}.IS`;
}

export function isSupportedStockSymbol(symbol: string) {
  return STOCK_SYMBOL_PATTERN.test(normalizeStockSymbol(symbol));
}

export function isSupportedBistSymbol(symbol: string) {
  return BIST_SYMBOL_PATTERN.test(normalizeBistSymbol(symbol));
}

export function parseStockSymbolList(value: string | null) {
  if (!value) {
    return DEFAULT_STOCK_SYMBOLS;
  }

  const symbols = value
    .split(",")
    .map(normalizeStockSymbol)
    .filter(isSupportedStockSymbol);

  return Array.from(new Set(symbols)).slice(0, 20);
}

export function parseBistSymbolList(value: string | null) {
  if (!value) {
    return DEFAULT_BIST_SYMBOLS;
  }

  const symbols = value
    .split(",")
    .map(normalizeBistSymbol)
    .filter(isSupportedBistSymbol);

  return Array.from(new Set(symbols)).slice(0, 20);
}

export async function fetchYahooTickers(symbols = DEFAULT_STOCK_SYMBOLS) {
  const tickers = await Promise.all(symbols.map(fetchYahooTicker));
  return tickers.filter((ticker) => ticker !== null);
}

export async function fetchYahooCandles(symbol: string, interval: BinanceInterval = "1h") {
  const normalizedSymbol = normalizeStockSymbol(symbol);
  const { yahooInterval, range, aggregateBy } = mapYahooInterval(interval);
  const params = new URLSearchParams({
    interval: yahooInterval,
    range,
    includePrePost: "false",
  });
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?${params}`,
    { next: { revalidate: 60 } },
  );

  if (!response.ok) {
    throw new Error(`Yahoo chart request failed: ${response.status}`);
  }

  const data = (await response.json()) as YahooChartResponse;
  const result = data.chart.result?.[0];
  const quote = result?.indicators?.quote?.[0];

  if (!result?.timestamp || !quote?.open || !quote.high || !quote.low || !quote.close) {
    throw new Error(`Yahoo chart response missing candles for ${normalizedSymbol}`);
  }

  const candles = result.timestamp
    .map((timestamp, index): Candle | null => {
      const open = quote.open?.[index];
      const high = quote.high?.[index];
      const low = quote.low?.[index];
      const close = quote.close?.[index];

      if (open === null || high === null || low === null || close === null) {
        return null;
      }

      return {
        openTime: timestamp * 1000,
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(quote.volume?.[index] ?? 0),
      };
    })
    .filter((candle): candle is Candle => candle !== null);

  return aggregateBy > 1 ? aggregateCandles(candles, aggregateBy) : candles;
}

export async function validateStockSymbol(symbol: string) {
  const normalizedSymbol = normalizeStockSymbol(symbol);

  if (!isSupportedStockSymbol(normalizedSymbol)) {
    return {
      symbol: normalizedSymbol,
      valid: false,
      reason: "ABD hisse sembolu girin. Ornek: AAPL",
    };
  }

  const quotes = await fetchYahooTickers([normalizedSymbol]);
  const valid = quotes.some((quote) => quote.symbol === normalizedSymbol && quote.price > 0);

  return {
    symbol: normalizedSymbol,
    valid,
    reason: valid ? null : `${normalizedSymbol} Yahoo Finance uzerinde bulunamadi.`,
  };
}

export async function validateBistSymbol(symbol: string) {
  const normalizedSymbol = normalizeBistSymbol(symbol);

  if (!isSupportedBistSymbol(normalizedSymbol)) {
    return {
      symbol: normalizedSymbol,
      valid: false,
      reason: "BIST sembolu girin. Ornek: THYAO veya THYAO.IS",
    };
  }

  const quotes = await fetchYahooTickers([normalizedSymbol]);
  const valid = quotes.some((quote) => quote.symbol === normalizedSymbol && quote.price > 0);

  return {
    symbol: normalizedSymbol,
    valid,
    reason: valid ? null : `${normalizedSymbol} Yahoo Finance uzerinde bulunamadi.`,
  };
}

async function fetchYahooTicker(symbol: string) {
  const candles = await fetchYahooCandles(symbol, "1d");
  const latest = candles.at(-1);
  const previous = candles.at(-2);

  if (!latest) {
    return null;
  }

  const previousClose = previous?.close ?? latest.open;
  const changePercent = previousClose > 0 ? ((latest.close - previousClose) / previousClose) * 100 : 0;

  return {
    symbol: normalizeStockSymbol(symbol),
    name: normalizeStockSymbol(symbol),
    price: latest.close,
    changePercent,
    quoteVolume: latest.volume,
    high: latest.high,
    low: latest.low,
  };
}

function mapYahooInterval(interval: BinanceInterval) {
  if (interval === "15m") {
    return { yahooInterval: "15m", range: "5d", aggregateBy: 1 };
  }

  if (interval === "4h") {
    return { yahooInterval: "1h", range: "3mo", aggregateBy: 4 };
  }

  if (interval === "1d") {
    return { yahooInterval: "1d", range: "1y", aggregateBy: 1 };
  }

  return { yahooInterval: "1h", range: "1mo", aggregateBy: 1 };
}

function aggregateCandles(candles: Candle[], groupSize: number) {
  const grouped: Candle[] = [];

  for (let index = 0; index < candles.length; index += groupSize) {
    const group = candles.slice(index, index + groupSize);
    if (group.length === 0) {
      continue;
    }

    grouped.push({
      openTime: group[0].openTime,
      open: group[0].open,
      high: Math.max(...group.map((candle) => candle.high)),
      low: Math.min(...group.map((candle) => candle.low)),
      close: group.at(-1)?.close ?? group[0].close,
      volume: group.reduce((total, candle) => total + candle.volume, 0),
    });
  }

  return grouped;
}
