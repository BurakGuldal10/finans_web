"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock3,
  RefreshCcw,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
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

type Ticker = {
  symbol: string;
  price: number;
  changePercent: number;
  quoteVolume: number;
  high: number;
  low: number;
};

type MarketResponse = {
  source: string;
  updatedAt: string;
  tickers: Ticker[];
};

type AnalyzeResponse = {
  source: string;
  interval: string;
  updatedAt: string;
  analysis: AnalysisResult;
  candles: Candle[];
};

const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];

export function MarketDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState(symbols[0]);
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMarket = useCallback(async () => {
    const response = await fetch("/api/market", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Piyasa verisi alinamadi.");
    }
    setMarket(await response.json());
  }, []);

  const loadAnalysis = useCallback(async (symbol: string) => {
    const response = await fetch(`/api/analyze?symbol=${symbol}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Analiz verisi alinamadi.");
    }
    setAnalysisData(await response.json());
  }, []);

  const refresh = useCallback(async (symbol: string) => {
    setError(null);
    setLoading(true);

    try {
      await Promise.all([loadMarket(), loadAnalysis(symbol)]);
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Bilinmeyen hata.");
    } finally {
      setLoading(false);
    }
  }, [loadAnalysis, loadMarket]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      refresh(selectedSymbol);
    }, 0);
    const timer = window.setInterval(() => {
      refresh(selectedSymbol);
    }, 30000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refresh, selectedSymbol]);

  const selectedTicker = useMemo(
    () => market?.tickers.find((ticker) => ticker.symbol === selectedSymbol),
    [market, selectedSymbol],
  );
  const analysis = analysisData?.analysis;
  const chartData =
    analysisData?.candles.map((candle) => ({
      time: new Date(candle.openTime).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
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
            Kripto piyasasi icin canli fiyat, teknik skor, alim bolgesi, stop ve hedef
            seviyelerini tek ekranda izler.
          </p>
        </div>

        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 text-sm font-medium text-white transition hover:border-emerald-300 hover:bg-[var(--panel-strong)]"
          onClick={() => refresh(selectedSymbol)}
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
              <p className="mt-1 text-xs text-[var(--muted)]">Binance USDT pariteleri</p>
            </div>
            <BarChart3 className="text-emerald-200" size={20} />
          </div>

          <div className="space-y-2">
            {(market?.tickers ?? symbols.map((symbol) => ({ symbol } as Ticker))).map((ticker) => {
              const active = ticker.symbol === selectedSymbol;
              const positive = (ticker.changePercent ?? 0) >= 0;

              return (
                <button
                  className={`grid w-full grid-cols-[1fr_auto] gap-3 rounded-md border p-3 text-left transition ${
                    active
                      ? "border-emerald-300 bg-emerald-300/10"
                      : "border-transparent bg-white/[0.03] hover:border-[var(--border)]"
                  }`}
                  key={ticker.symbol}
                  onClick={() => setSelectedSymbol(ticker.symbol)}
                  type="button"
                >
                  <span>
                    <span className="block text-sm font-semibold text-white">{ticker.symbol}</span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">
                      24s hacim {ticker.quoteVolume ? compactNumber(ticker.quoteVolume) : "..."}
                    </span>
                  </span>
                  <span className="text-right">
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
                  </span>
                </button>
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
                  {analysis.reasons.map((reason) => (
                    <p
                      className="rounded-md border border-white/5 bg-white/[0.03] p-3 text-sm leading-6 text-[var(--muted)]"
                      key={reason}
                    >
                      {reason}
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
