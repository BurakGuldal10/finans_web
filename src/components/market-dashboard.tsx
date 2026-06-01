"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock3,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice, type AnalysisResult, type Candle } from "@/lib/analysis";
import type { MarketKind } from "@/lib/markets";
import { PortfolioPanel } from "@/components/portfolio-panel";
import { TradeJournal } from "@/components/trade-journal";

type Ticker = {
  symbol: string;
  price: number;
  changePercent: number;
  quoteVolume: number;
  high: number;
  low: number;
};

type MarketResponse = {
  market: MarketKind;
  source: string;
  updatedAt: string;
  tickers: Ticker[];
};

type AnalyzeResponse = {
  market: MarketKind;
  source: string;
  interval: Timeframe;
  updatedAt: string;
  analysis: AnalysisResult;
  candles: Candle[];
};

type Timeframe = "15m" | "1h" | "4h" | "1d";

const cryptoSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
const stockSymbols = ["AAPL", "MSFT", "NVDA", "TSLA", "SPY"];
const markets: Array<{ label: string; value: MarketKind }> = [
  { label: "Kripto", value: "crypto" },
  { label: "ABD Hisse", value: "stocks" },
];
const timeframes: Array<{ label: string; value: Timeframe }> = [
  { label: "15m", value: "15m" },
  { label: "1s", value: "1h" },
  { label: "4s", value: "4h" },
  { label: "1g", value: "1d" },
];
const watchlistStorageKey = "finansman-watchlist";
const stockWatchlistStorageKey = "finansman-stock-watchlist";
const timeframeStorageKey = "finansman-timeframe";
const marketStorageKey = "finansman-market";

export function MarketDashboard() {
  const [selectedMarket, setSelectedMarket] = useState<MarketKind>("crypto");
  const [watchlists, setWatchlists] = useState<Record<MarketKind, string[]>>({
    crypto: cryptoSymbols,
    stocks: stockSymbols,
  });
  const [selectedSymbol, setSelectedSymbol] = useState(cryptoSymbols[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>("1h");
  const [newSymbol, setNewSymbol] = useState("");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const watchlist = watchlists[selectedMarket];

  const loadMarket = useCallback(async () => {
    const response = await fetch(`/api/market?market=${selectedMarket}&symbols=${watchlist.join(",")}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Piyasa verisi alinamadi.");
    }
    setMarket(await response.json());
  }, [selectedMarket, watchlist]);

  const loadAnalysis = useCallback(async (market: MarketKind, symbol: string, interval: Timeframe) => {
    const response = await fetch(`/api/analyze?market=${market}&symbol=${symbol}&interval=${interval}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Analiz verisi alinamadi.");
    }
    setAnalysisData(await response.json());
  }, []);

  const refresh = useCallback(async (market: MarketKind, symbol: string, interval: Timeframe) => {
    setError(null);
    setLoading(true);

    try {
      await Promise.all([loadMarket(), loadAnalysis(market, symbol, interval)]);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Bilinmeyen hata.");
    } finally {
      setLoading(false);
    }
  }, [loadAnalysis, loadMarket]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(watchlistStorageKey);
      const savedStocks = window.localStorage.getItem(stockWatchlistStorageKey);
      const savedTimeframe = window.localStorage.getItem(timeframeStorageKey);
      const savedMarket = window.localStorage.getItem(marketStorageKey);
      if (isValidTimeframe(savedTimeframe)) {
        setSelectedTimeframe(savedTimeframe);
      }

      const nextMarket = isValidMarket(savedMarket) ? savedMarket : "crypto";
      const nextWatchlists: Record<MarketKind, string[]> = {
        crypto: cryptoSymbols,
        stocks: stockSymbols,
      };

      if (saved) {
        try {
          const parsed = JSON.parse(saved) as unknown;
          if (Array.isArray(parsed)) {
            const normalized = parsed
              .filter((item): item is string => typeof item === "string")
              .map(normalizeCryptoSymbol)
              .filter(isValidUsdtSymbol);

            if (normalized.length > 0) {
              nextWatchlists.crypto = Array.from(new Set(normalized)).slice(0, 20);
            }
          }
        } catch {
          window.localStorage.removeItem(watchlistStorageKey);
        }
      }

      if (savedStocks) {
        try {
          const parsed = JSON.parse(savedStocks) as unknown;
          if (Array.isArray(parsed)) {
            const normalized = parsed
              .filter((item): item is string => typeof item === "string")
              .map(normalizeStockSymbol)
              .filter(isValidStockSymbol);

            if (normalized.length > 0) {
              nextWatchlists.stocks = Array.from(new Set(normalized)).slice(0, 20);
            }
          }
        } catch {
          window.localStorage.removeItem(stockWatchlistStorageKey);
        }
      }

      setWatchlists(nextWatchlists);
      setSelectedMarket(nextMarket);
      setSelectedSymbol(nextWatchlists[nextMarket][0]);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(watchlistStorageKey, JSON.stringify(watchlists.crypto));
    window.localStorage.setItem(stockWatchlistStorageKey, JSON.stringify(watchlists.stocks));
  }, [watchlists]);

  useEffect(() => {
    window.localStorage.setItem(timeframeStorageKey, selectedTimeframe);
  }, [selectedTimeframe]);

  useEffect(() => {
    window.localStorage.setItem(marketStorageKey, selectedMarket);
  }, [selectedMarket]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      refresh(selectedMarket, selectedSymbol, selectedTimeframe);
    }, 0);
    const timer = window.setInterval(() => {
      refresh(selectedMarket, selectedSymbol, selectedTimeframe);
    }, 30000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refresh, selectedMarket, selectedSymbol, selectedTimeframe]);

  async function addSymbol(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const symbol =
      selectedMarket === "stocks" ? normalizeStockSymbol(newSymbol) : normalizeCryptoSymbol(newSymbol);

    if (selectedMarket === "crypto" && !isValidUsdtSymbol(symbol)) {
      setFormMessage("USDT paritesi girin. Ornek: AVAXUSDT");
      return;
    }

    if (selectedMarket === "stocks" && !isValidStockSymbol(symbol)) {
      setFormMessage("ABD hisse sembolu girin. Ornek: AAPL");
      return;
    }

    if (watchlist.includes(symbol)) {
      setFormMessage(`${symbol} zaten listede.`);
      return;
    }

    if (watchlist.length >= 20) {
      setFormMessage("Izleme listesi en fazla 20 sembol olabilir.");
      return;
    }

    setFormMessage(`${symbol} kontrol ediliyor...`);

    try {
      const response = await fetch(`/api/symbol?market=${selectedMarket}&symbol=${symbol}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as {
        valid?: boolean;
        reason?: string;
      } | null;

      if (!response.ok || !payload?.valid) {
        setFormMessage(payload?.reason ?? `${symbol} Binance spot USDT paritesi degil.`);
        return;
      }

      setWatchlists((current) => ({
        ...current,
        [selectedMarket]: [...current[selectedMarket], symbol],
      }));
      setSelectedSymbol(symbol);
      setNewSymbol("");
      setFormMessage(`${symbol} eklendi.`);
    } catch {
      setFormMessage("Sembol kontrolu yapilamadi. Baglantiyi kontrol edin.");
    }
  }

  function removeSymbol(symbol: string) {
    if (watchlist.length === 1) {
      setFormMessage("Listede en az bir sembol kalmali.");
      return;
    }

    setWatchlists((current) => {
      const next = current[selectedMarket].filter((item) => item !== symbol);
      if (symbol === selectedSymbol) {
        setSelectedSymbol(next[0]);
      }
      return {
        ...current,
        [selectedMarket]: next,
      };
    });
    setFormMessage(`${symbol} kaldirildi.`);
  }

  function switchMarket(market: MarketKind) {
    setSelectedMarket(market);
    setSelectedSymbol(watchlists[market][0]);
    setFormMessage(null);
    setMarket(null);
    setAnalysisData(null);
  }

  const selectedTicker = useMemo(
    () => market?.tickers.find((ticker) => ticker.symbol === selectedSymbol),
    [market, selectedSymbol],
  );
  const displayedTickers = useMemo(
    () =>
      watchlist.map((symbol) => {
        return market?.tickers.find((ticker) => ticker.symbol === symbol) ?? ({ symbol } as Ticker);
      }),
    [market, watchlist],
  );
  const analysis = analysisData?.analysis;
  const chartData =
    analysisData?.candles.map((candle) => ({
      time: formatCandleTime(candle.openTime, selectedTimeframe),
      close: candle.close,
    })) ?? [];

  return (
    <main className="min-h-screen px-5 py-5 md:px-8 lg:px-10">
      <header className="mx-auto flex max-w-7xl flex-col gap-4 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-emerald-200">
            <Activity size={16} />
            <span>Canli karar destek paneli</span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white md:text-4xl">
            Finansman Asistani
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Kripto ve ABD hisseleri icin canli fiyat, teknik skor, alim bolgesi,
            stop ve hedef seviyelerini tek ekranda izler.
          </p>
        </div>

        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 text-sm font-medium text-white transition hover:border-emerald-300 hover:bg-[var(--panel-strong)]"
          onClick={() => refresh(selectedMarket, selectedSymbol, selectedTimeframe)}
          type="button"
        >
          <RefreshCcw size={16} />
          Yenile
        </button>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-200">
                Izleme listesi
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {selectedMarket === "stocks" ? "Yahoo Finance ABD hisseleri" : "Binance USDT pariteleri"}
              </p>
            </div>
            <BarChart3 className="text-emerald-200" size={20} />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            {markets.map((market) => {
              const active = market.value === selectedMarket;

              return (
                <button
                  className={`h-10 rounded-md border px-3 text-sm font-medium transition ${
                    active
                      ? "border-emerald-300 bg-emerald-300/10 text-emerald-100"
                      : "border-[var(--border)] bg-white/[0.03] text-[var(--muted)] hover:border-emerald-300 hover:text-white"
                  }`}
                  key={market.value}
                  onClick={() => switchMarket(market.value)}
                  type="button"
                >
                  {market.label}
                </button>
              );
            })}
          </div>

          <form className="mb-4 flex gap-2" onSubmit={addSymbol}>
            <input
              aria-label="Yeni sembol"
              className="h-10 min-w-0 flex-1 rounded-md border border-[var(--border)] bg-black/20 px-3 font-mono text-sm text-white outline-none transition placeholder:text-[var(--muted)] focus:border-emerald-300"
              onChange={(event) => {
                setNewSymbol(event.target.value);
                setFormMessage(null);
              }}
              placeholder={selectedMarket === "stocks" ? "AAPL" : "AVAXUSDT"}
              value={newSymbol}
            />
            <button
              aria-label="Sembol ekle"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-white/[0.04] text-white transition hover:border-emerald-300 hover:bg-emerald-300/10"
              type="submit"
            >
              <Plus size={17} />
            </button>
          </form>

          {formMessage ? (
            <p className="mb-3 rounded-md border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-[var(--muted)]">
              {formMessage}
            </p>
          ) : null}

          <div className="space-y-2">
            {displayedTickers.map((ticker) => {
              const active = ticker.symbol === selectedSymbol;
              const positive = (ticker.changePercent ?? 0) >= 0;

              return (
                <div
                  className={`grid w-full grid-cols-[1fr_auto] gap-3 rounded-md border p-3 text-left transition ${
                    active
                      ? "border-emerald-300 bg-emerald-300/10"
                      : "border-transparent bg-white/[0.03] hover:border-[var(--border)]"
                  }`}
                  key={ticker.symbol}
                >
                  <button
                    className="min-w-0 text-left"
                    onClick={() => setSelectedSymbol(ticker.symbol)}
                    type="button"
                  >
                    <span className="block text-sm font-semibold text-white">{ticker.symbol}</span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">
                      24s hacim {ticker.quoteVolume ? compactNumber(ticker.quoteVolume) : "..."}
                    </span>
                  </button>
                  <span className="flex items-start gap-2 text-right">
                    <button
                      aria-label={`${ticker.symbol} sec`}
                      className="min-w-[88px] text-right"
                      onClick={() => setSelectedSymbol(ticker.symbol)}
                      type="button"
                    >
                      <span className="block font-mono text-sm text-white">
                        {ticker.price ? formatPrice(ticker.price) : "..."}
                      </span>
                      <span
                        className={`mt-1 inline-flex items-center gap-1 text-xs ${
                          positive ? "text-emerald-200" : "text-red-200"
                        }`}
                      >
                        {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                        {ticker.changePercent ? ticker.changePercent.toFixed(2) : "0.00"}%
                      </span>
                    </button>
                    <button
                      aria-label={`${ticker.symbol} kaldir`}
                      className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-white/10 hover:text-white"
                      onClick={() => removeSymbol(ticker.symbol)}
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="space-y-5">
          <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-white">{selectedSymbol}</h2>
                  {analysis ? <VerdictBadge verdict={analysis.verdict} /> : null}
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {selectedTicker
                    ? `Son fiyat ${formatPrice(selectedTicker.price)} USDT`
                    : "Fiyat verisi yukleniyor."}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--muted)]">
                <Clock3 size={14} />
                <span>
                  {market?.updatedAt
                    ? new Date(market.updatedAt).toLocaleTimeString("tr-TR")
                    : "Bekleniyor"}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {timeframes.map((timeframe) => {
                const active = timeframe.value === selectedTimeframe;

                return (
                  <button
                    className={`h-9 min-w-12 rounded-md border px-3 text-sm font-medium transition ${
                      active
                        ? "border-emerald-300 bg-emerald-300/10 text-emerald-100"
                        : "border-[var(--border)] bg-white/[0.03] text-[var(--muted)] hover:border-emerald-300 hover:text-white"
                    }`}
                    key={timeframe.value}
                    onClick={() => setSelectedTimeframe(timeframe.value)}
                    type="button"
                  >
                    {timeframe.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 h-[320px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="priceFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#5ee7b7" stopOpacity={0.42} />
                        <stop offset="95%" stopColor="#5ee7b7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(159,184,175,0.12)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      minTickGap={30}
                      stroke="#9fb8af"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={["dataMin", "dataMax"]}
                      orientation="right"
                      stroke="#9fb8af"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatPrice(Number(value))}
                      tickLine={false}
                      width={82}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0d1a17",
                        border: "1px solid #23423b",
                        borderRadius: 8,
                        color: "#e8f2ee",
                      }}
                      formatter={(value) => [`${formatPrice(Number(value))} USDT`, "Kapanis"]}
                      labelStyle={{ color: "#9fb8af" }}
                    />
                    <Area
                      dataKey="close"
                      fill="url(#priceFill)"
                      stroke="#5ee7b7"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <LoadingPanel error={error} loading={loading} />
              )}
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <div className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 md:p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                <ShieldCheck size={18} />
                Karar destek ozeti
              </h3>

              {analysis ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Metric label="Skor" value={`${analysis.score}/100`} />
                  <Metric
                    label="Risk / odul"
                    value={`1:${analysis.riskReward.toFixed(2)}`}
                  />
                  <Metric
                    label="Alim bolgesi"
                    value={`${formatPrice(analysis.buyZone[0])} - ${formatPrice(
                      analysis.buyZone[1],
                    )}`}
                  />
                  <Metric label="Stop loss" tone="danger" value={formatPrice(analysis.stopLoss)} />
                  <Metric label="Hedef 1" tone="positive" value={formatPrice(analysis.targetOne)} />
                  <Metric label="Hedef 2" tone="positive" value={formatPrice(analysis.targetTwo)} />
                  <Metric label="Destek" value={formatPrice(analysis.levels.support)} />
                  <Metric label="Direnc" value={formatPrice(analysis.levels.resistance)} />
                  <Metric label="Trend gucu" value={`${analysis.trendStrength}/100`} />
                  <Metric
                    label="Volatilite"
                    tone={analysis.volatility.regime === "high" ? "danger" : "default"}
                    value={`${analysis.volatility.percent.toFixed(2)}%`}
                  />
                </div>
              ) : (
                <LoadingPanel error={error} loading={loading} />
              )}
            </div>

            <div className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 md:p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-white">
                <Target size={18} />
                Gerekceler
              </h3>

              {analysis ? (
                <div className="mt-4 space-y-3">
                  <p className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm leading-6 text-emerald-50">
                    {analysis.actionSummary}
                  </p>
                  {analysis.reasons.map((reason) => (
                    <p
                      className="rounded-md border border-white/5 bg-white/[0.03] p-3 text-sm leading-6 text-[var(--muted)]"
                      key={reason}
                    >
                      {reason}
                    </p>
                  ))}
                  {analysis.risks.map((risk) => (
                    <p
                      className="rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm leading-6 text-red-100"
                      key={risk}
                    >
                      {risk}
                    </p>
                  ))}
                  <p className="flex gap-2 rounded-md border border-yellow-300/20 bg-yellow-300/10 p-3 text-sm leading-6 text-yellow-100">
                    <AlertTriangle className="mt-1 shrink-0" size={16} />
                    {analysis.invalidation}
                  </p>
                </div>
              ) : (
                <LoadingPanel error={error} loading={loading} />
              )}
            </div>
          </section>

          <PortfolioPanel
            currentPrice={selectedTicker?.price}
            selectedSymbol={selectedSymbol}
            tickers={displayedTickers}
          />

          <TradeJournal
            analysis={analysis}
            selectedPrice={selectedTicker?.price}
            selectedSymbol={selectedSymbol}
            timeframe={selectedTimeframe}
          />
        </div>
      </section>
    </main>
  );
}

function VerdictBadge({ verdict }: { verdict: AnalysisResult["verdict"] }) {
  const label = {
    positive: "Olumlu",
    neutral: "Notr",
    risky: "Riskli",
  }[verdict];
  const tone = {
    positive: "border-emerald-300/40 bg-emerald-300/10 text-emerald-100",
    neutral: "border-yellow-300/40 bg-yellow-300/10 text-yellow-100",
    risky: "border-red-300/40 bg-red-300/10 text-red-100",
  }[verdict];

  return (
    <span className={`rounded-md border px-2.5 py-1 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "danger";
}) {
  const toneClass =
    tone === "positive" ? "text-emerald-200" : tone === "danger" ? "text-red-200" : "text-white";

  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className={`mt-2 font-mono text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function LoadingPanel({ error, loading }: { error: string | null; loading: boolean }) {
  if (error) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center rounded-md border border-red-300/20 bg-red-300/10 p-5 text-sm text-red-100">
        {error}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-40 items-center justify-center rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
      {loading ? "Veriler yukleniyor..." : "Veri bekleniyor."}
    </div>
  );
}

function compactNumber(value: number) {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCandleTime(openTime: number, timeframe: Timeframe) {
  const date = new Date(openTime);

  if (timeframe === "1d") {
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeCryptoSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function normalizeStockSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "");
}

function isValidUsdtSymbol(symbol: string) {
  return /^[A-Z0-9]{3,20}USDT$/.test(symbol);
}

function isValidStockSymbol(symbol: string) {
  return /^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol);
}

function isValidTimeframe(value: string | null): value is Timeframe {
  return value === "15m" || value === "1h" || value === "4h" || value === "1d";
}

function isValidMarket(value: string | null): value is MarketKind {
  return value === "crypto" || value === "stocks";
}
