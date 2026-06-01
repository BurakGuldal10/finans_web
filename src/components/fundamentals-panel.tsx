"use client";

import { Building2, KeyRound } from "lucide-react";
import type { FundamentalAnalysis } from "@/lib/fundamentals";

type FundamentalsResponse = {
  fundamentals: FundamentalAnalysis;
};

type FundamentalsPanelProps = {
  data: FundamentalsResponse | null;
  error: string | null;
  loading: boolean;
};

export function FundamentalsPanel({ data, error, loading }: FundamentalsPanelProps) {
  const fundamentals = data?.fundamentals;

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold text-white">
          <Building2 size={18} />
          Temel analiz
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          ABD hisseleri icin sirket sagligi, degerleme ve bilanco metriklerini ozetler.
        </p>
      </div>

      {loading ? (
        <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
          Temel veriler yukleniyor...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="mt-4 flex gap-3 rounded-md border border-yellow-300/20 bg-yellow-300/10 p-4 text-sm leading-6 text-yellow-100">
          <KeyRound className="mt-1 shrink-0" size={17} />
          <span>{error}</span>
        </div>
      ) : null}

      {!loading && fundamentals ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{fundamentals.companyName}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {fundamentals.symbol} · {fundamentals.sector}
                </p>
              </div>
              <span className="rounded-md border border-emerald-300/30 px-3 py-1 font-mono text-sm text-emerald-100">
                {fundamentals.score}/100
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-emerald-50">{fundamentals.summary}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {fundamentals.metrics.map((metric) => (
              <FundamentalMetricCard
                key={metric.label}
                label={metric.label}
                tone={metric.tone}
                value={metric.value}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function FundamentalMetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "default" | "positive" | "danger";
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
