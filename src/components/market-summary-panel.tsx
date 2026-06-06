"use client";

import { BarChart3, Gauge, TrendingDown, TrendingUp, Waves } from "lucide-react";
import { formatPrice } from "@/lib/analysis";

export type MarketSummaryTicker = {
  changePercent?: number;
  high?: number;
  low?: number;
  price?: number;
  quoteVolume?: number;
  symbol: string;
};

type MarketSummaryPanelProps = {
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
  tickers: MarketSummaryTicker[];
  unit: string;
};

export function MarketSummaryPanel({
  onSelectSymbol,
  selectedSymbol,
  tickers,
  unit,
}: MarketSummaryPanelProps) {
  const readyTickers = tickers.filter((ticker) => Number.isFinite(ticker.price));
  const sortedByChange = [...readyTickers].sort(
    (a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0),
  );
  const strongest = sortedByChange[0];
  const weakest = sortedByChange.at(-1);
  const volumeLeader = [...readyTickers].sort(
    (a, b) => (b.quoteVolume ?? 0) - (a.quoteVolume ?? 0),
  )[0];
  const averageChange =
    readyTickers.length > 0
      ? readyTickers.reduce((total, ticker) => total + (ticker.changePercent ?? 0), 0) /
        readyTickers.length
      : 0;
  const advancing = readyTickers.filter((ticker) => (ticker.changePercent ?? 0) >= 0).length;
  const declining = Math.max(readyTickers.length - advancing, 0);
  const breadth =
    readyTickers.length > 0 ? `${advancing} yukselen / ${declining} dusen` : "Veri bekleniyor";

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Gauge size={18} />
            Piyasa ozeti
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Izleme listesindeki guc, zayiflik, hacim ve gun ici araliklari ozetler.
          </p>
        </div>

        <span className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-[var(--muted)]">
          {breadth}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <SummaryMetric
          icon="gauge"
          label="Ortalama degisim"
          tone={averageChange >= 0 ? "positive" : "danger"}
          value={`${averageChange.toFixed(2)}%`}
        />
        <SummaryTickerCard
          label="En guclu"
          onSelectSymbol={onSelectSymbol}
          ticker={strongest}
          tone="positive"
          unit={unit}
        />
        <SummaryTickerCard
          label="En zayif"
          onSelectSymbol={onSelectSymbol}
          ticker={weakest}
          tone="danger"
          unit={unit}
        />
        <SummaryTickerCard
          label="Hacim lideri"
          onSelectSymbol={onSelectSymbol}
          ticker={volumeLeader}
          tone="default"
          unit={unit}
        />
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-2">
        {tickers.map((ticker) => (
          <button
            className={`grid min-h-16 grid-cols-[1fr_auto] items-center gap-3 rounded-md border p-3 text-left transition ${
              ticker.symbol === selectedSymbol
                ? "border-emerald-300 bg-emerald-300/10"
                : "border-white/5 bg-white/[0.03] hover:border-emerald-300/50"
            }`}
            key={ticker.symbol}
            onClick={() => onSelectSymbol(ticker.symbol)}
            type="button"
          >
            <span className="min-w-0">
              <span className="block font-semibold text-white">{ticker.symbol}</span>
              <span className="mt-1 block text-xs text-[var(--muted)]">
                Aralik {formatRange(ticker, unit)}
              </span>
            </span>
            <span className="text-right">
              <span className="block font-mono text-sm text-white">
                {ticker.price ? `${formatPrice(ticker.price)} ${unit}` : "..."}
              </span>
              <span
                className={`mt-1 inline-flex items-center gap-1 text-xs ${
                  (ticker.changePercent ?? 0) >= 0 ? "text-emerald-200" : "text-red-200"
                }`}
              >
                {(ticker.changePercent ?? 0) >= 0 ? (
                  <TrendingUp size={13} />
                ) : (
                  <TrendingDown size={13} />
                )}
                {Number.isFinite(ticker.changePercent) ? ticker.changePercent?.toFixed(2) : "0.00"}%
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SummaryMetric({
  icon,
  label,
  tone = "default",
  value,
}: {
  icon: "gauge" | "volume";
  label: string;
  tone?: "default" | "positive" | "danger";
  value: string;
}) {
  const toneClass =
    tone === "positive" ? "text-emerald-200" : tone === "danger" ? "text-red-200" : "text-white";
  const Icon = icon === "volume" ? BarChart3 : Waves;

  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        <Icon size={14} />
        {label}
      </p>
      <p className={`mt-2 font-mono text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

function SummaryTickerCard({
  label,
  onSelectSymbol,
  ticker,
  tone,
  unit,
}: {
  label: string;
  onSelectSymbol: (symbol: string) => void;
  ticker?: MarketSummaryTicker;
  tone: "default" | "positive" | "danger";
  unit: string;
}) {
  if (!ticker) {
    return <SummaryMetric icon="gauge" label={label} value="..." />;
  }

  const toneClass =
    tone === "positive" ? "text-emerald-200" : tone === "danger" ? "text-red-200" : "text-white";

  return (
    <button
      className="rounded-md border border-white/5 bg-white/[0.03] p-3 text-left transition hover:border-emerald-300/50"
      onClick={() => onSelectSymbol(ticker.symbol)}
      type="button"
    >
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold text-white">{ticker.symbol}</p>
      <p className={`mt-1 text-xs ${toneClass}`}>
        {(ticker.changePercent ?? 0).toFixed(2)}% ·{" "}
        {ticker.price ? `${formatPrice(ticker.price)} ${unit}` : "..."}
      </p>
    </button>
  );
}

function formatRange(ticker: MarketSummaryTicker, unit: string) {
  if (!ticker.low || !ticker.high) {
    return "...";
  }

  return `${formatPrice(ticker.low)} - ${formatPrice(ticker.high)} ${unit}`;
}
