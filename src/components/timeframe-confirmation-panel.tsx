"use client";

import { Layers3 } from "lucide-react";
import type { MultiTimeframeAnalysis, TimeframeSignal } from "@/lib/analysis";

type TimeframeConfirmationPanelProps = {
  data?: MultiTimeframeAnalysis;
};

export function TimeframeConfirmationPanel({ data }: TimeframeConfirmationPanelProps) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Layers3 size={18} />
            Zaman dilimi teyidi
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            15m, 1s, 4s ve 1g teknik gorunumlerini birlikte okur.
          </p>
        </div>
        {data ? (
          <span className={`rounded-md border px-3 py-1 font-mono text-sm ${alignmentClass(data.alignment)}`}>
            {data.score}/100
          </span>
        ) : null}
      </div>

      {data ? (
        <div className="mt-4 space-y-4">
          <p className="rounded-md border border-white/5 bg-white/[0.03] p-3 text-sm leading-6 text-white">
            {data.summary}
          </p>

          <div className="grid gap-3 md:grid-cols-4">
            {data.signals.map((signal) => (
              <TimeframeCard key={signal.interval} signal={signal} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
          Teyit verisi bekleniyor.
        </div>
      )}
    </section>
  );
}

function TimeframeCard({ signal }: { signal: TimeframeSignal }) {
  return (
    <article className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white">{signal.label}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{translateVerdict(signal.verdict)}</p>
        </div>
        <span className={`rounded-md border px-2 py-1 font-mono text-xs ${verdictClass(signal.verdict)}`}>
          {signal.score}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-[var(--muted)]">
        <SmallMetric label="Trend" value={`${signal.trendStrength}/100`} />
        <SmallMetric label="RSI" value={signal.rsi14.toFixed(1)} />
        <SmallMetric label="EMA20" value={signal.priceVsEma20 === "above" ? "Uzerinde" : "Altinda"} />
      </div>

      <p className="mt-3 min-h-10 text-sm leading-5 text-[var(--muted)]">{signal.summary}</p>
    </article>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

function alignmentClass(alignment: MultiTimeframeAnalysis["alignment"]) {
  if (alignment === "bullish") {
    return "border-emerald-300/30 text-emerald-100";
  }

  if (alignment === "bearish") {
    return "border-red-300/30 text-red-100";
  }

  return "border-yellow-300/30 text-yellow-100";
}

function verdictClass(verdict: TimeframeSignal["verdict"]) {
  if (verdict === "positive") {
    return "border-emerald-300/30 text-emerald-100";
  }

  if (verdict === "risky") {
    return "border-red-300/30 text-red-100";
  }

  return "border-yellow-300/30 text-yellow-100";
}

function translateVerdict(verdict: TimeframeSignal["verdict"]) {
  if (verdict === "positive") {
    return "Olumlu";
  }

  if (verdict === "risky") {
    return "Riskli";
  }

  return "Notr";
}
