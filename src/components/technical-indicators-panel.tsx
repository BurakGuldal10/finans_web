"use client";

import { Activity, BarChart3, LineChart, Waves } from "lucide-react";
import { formatPrice, type AnalysisResult } from "@/lib/analysis";

type TechnicalIndicatorsPanelProps = {
  analysis?: AnalysisResult;
  unit: string;
};

export function TechnicalIndicatorsPanel({ analysis, unit }: TechnicalIndicatorsPanelProps) {
  if (!analysis) {
    return (
      <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-white">
          <LineChart size={18} />
          Teknik indikatorler
        </h3>
        <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
          Indikator detaylari icin analiz verisi bekleniyor.
        </div>
      </section>
    );
  }

  const indicators = analysis.indicators;
  const macdPositive = indicators.macd >= indicators.macdSignal;
  const aboveAverages = analysis.price >= indicators.ema20 && analysis.price >= indicators.sma50;

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <LineChart size={18} />
            Teknik indikatorler
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Skorun arkasindaki ortalama, momentum, volatilite ve hacim verilerini gosterir.
          </p>
        </div>

        <span
          className={`rounded-md border px-3 py-2 text-xs ${
            aboveAverages
              ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
              : "border-yellow-300/30 bg-yellow-300/10 text-yellow-100"
          }`}
        >
          {aboveAverages ? "Ortalamalar destekli" : "Ortalama teyidi zayif"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <IndicatorMetric label="SMA20" value={`${formatPrice(indicators.sma20)} ${unit}`} />
        <IndicatorMetric label="SMA50" value={`${formatPrice(indicators.sma50)} ${unit}`} />
        <IndicatorMetric label="EMA20" value={`${formatPrice(indicators.ema20)} ${unit}`} />
        <IndicatorMetric
          label="RSI14"
          tone={getRsiTone(indicators.rsi14)}
          value={indicators.rsi14.toFixed(2)}
        />
        <IndicatorMetric
          label="MACD"
          tone={macdPositive ? "positive" : "danger"}
          value={indicators.macd.toFixed(4)}
        />
        <IndicatorMetric label="MACD sinyal" value={indicators.macdSignal.toFixed(4)} />
        <IndicatorMetric label="ATR14" value={`${formatPrice(indicators.atr14)} ${unit}`} />
        <IndicatorMetric
          label="Hacim orani"
          tone={indicators.volumeRatio >= 1.15 ? "positive" : "default"}
          value={`${indicators.volumeRatio.toFixed(2)}x`}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <IndicatorNote
          icon="trend"
          label="Trend"
          text={`Trend gucu ${analysis.trendStrength}/100. Fiyat SMA50'ye gore ${analysis.price >= indicators.sma50 ? "yukarida" : "asagida"}.`}
        />
        <IndicatorNote
          icon="volatility"
          label="Volatilite"
          text={`ATR/fiyat orani ${analysis.volatility.percent.toFixed(2)}%; rejim ${translateVolatility(analysis.volatility.regime)}.`}
        />
        <IndicatorNote
          icon="levels"
          label="Seviyeler"
          text={`Destek ${formatPrice(analysis.levels.support)} ${unit}, direnc ${formatPrice(analysis.levels.resistance)} ${unit}.`}
        />
      </div>
    </section>
  );
}

function IndicatorMetric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "positive" | "danger";
  value: string;
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

function IndicatorNote({
  icon,
  label,
  text,
}: {
  icon: "levels" | "trend" | "volatility";
  label: string;
  text: string;
}) {
  const Icon = icon === "trend" ? Activity : icon === "volatility" ? Waves : BarChart3;

  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        <Icon size={14} />
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-white">{text}</p>
    </div>
  );
}

function getRsiTone(value: number) {
  if (value > 72 || value < 35) {
    return "danger";
  }

  if (value >= 45 && value <= 68) {
    return "positive";
  }

  return "default";
}

function translateVolatility(regime: AnalysisResult["volatility"]["regime"]) {
  if (regime === "high") {
    return "yuksek";
  }

  if (regime === "low") {
    return "dusuk";
  }

  return "normal";
}
