"use client";

import { BarChart3, RefreshCcw, Sigma, Target, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/analysis";
import type { PerformanceBucket, PerformanceSummary } from "@/lib/performance";

export function PerformancePanel() {
  const [performance, setPerformance] = useState<PerformanceSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadPerformance() {
    try {
      setMessage(null);
      const response = await fetch("/api/performance", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Performance load failed");
      }

      const payload = (await response.json()) as { performance?: PerformanceSummary };
      setPerformance(payload.performance ?? null);
    } catch {
      setMessage("Performans ozeti okunamadi. API veya veritabani kontrol edilmeli.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPerformance();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const strategyRows = useMemo(
    () => performance?.byStrategy.filter((bucket) => bucket.total > 0) ?? [],
    [performance],
  );
  const symbolRows = useMemo(
    () => performance?.bySymbol.filter((bucket) => bucket.total > 0) ?? [],
    [performance],
  );

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Sigma size={18} />
            Performans ozeti
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Trade gunlugu kayitlarindan win rate, risk ve strateji kirilimi cikarir.
          </p>
        </div>

        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white/[0.04] px-3 text-sm font-medium text-white transition hover:border-emerald-300 hover:bg-emerald-300/10"
          onClick={loadPerformance}
          type="button"
        >
          <RefreshCcw size={16} />
          Guncelle
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-red-300/20 bg-red-300/10 px-3 py-2 text-sm text-red-100">
          {message}
        </p>
      ) : null}

      {performance ? (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <PerformanceMetric icon="trades" label="Toplam kayit" value={String(performance.total)} />
            <PerformanceMetric label="Win rate" value={`${performance.winRate.toFixed(0)}%`} />
            <PerformanceMetric
              label="Plan risk"
              tone="danger"
              value={formatPrice(performance.plannedRisk)}
            />
            <PerformanceMetric
              label="Tahmini sonuc"
              tone={performance.estimatedResult >= 0 ? "positive" : "danger"}
              value={formatSigned(performance.estimatedResult)}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <BucketTable emptyLabel="Henuz strateji kirilimi yok." rows={strategyRows} title="Strateji" />
            <BucketTable emptyLabel="Henuz sembol kirilimi yok." rows={symbolRows} title="Sembol" />
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
          Performans verisi yukleniyor.
        </div>
      )}
    </section>
  );
}

function PerformanceMetric({
  icon = "target",
  label,
  tone = "default",
  value,
}: {
  icon?: "target" | "trades";
  label: string;
  tone?: "default" | "positive" | "danger";
  value: string;
}) {
  const toneClass =
    tone === "positive" ? "text-emerald-200" : tone === "danger" ? "text-red-200" : "text-white";
  const Icon = icon === "trades" ? BarChart3 : Target;

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

function BucketTable({
  emptyLabel,
  rows,
  title,
}: {
  emptyLabel: string;
  rows: PerformanceBucket[];
  title: string;
}) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
        <TrendingUp size={16} />
        {title}
      </h4>
      <div className="mt-3 max-h-[280px] overflow-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">{emptyLabel}</p>
        ) : (
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              <tr>
                <th className="py-2 pr-3 font-medium">Ad</th>
                <th className="py-2 pr-3 font-medium">Kayit</th>
                <th className="py-2 pr-3 font-medium">Win</th>
                <th className="py-2 pr-3 font-medium">R/O</th>
                <th className="py-2 text-right font-medium">Sonuc</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-white/5" key={row.key}>
                  <td className="py-2 pr-3 font-medium text-white">{row.key}</td>
                  <td className="py-2 pr-3 font-mono text-[var(--muted)]">{row.total}</td>
                  <td className="py-2 pr-3 font-mono text-[var(--muted)]">
                    {row.winRate.toFixed(0)}%
                  </td>
                  <td className="py-2 pr-3 font-mono text-[var(--muted)]">
                    1:{row.averageRiskReward.toFixed(2)}
                  </td>
                  <td
                    className={`py-2 text-right font-mono ${
                      row.estimatedResult >= 0 ? "text-emerald-200" : "text-red-200"
                    }`}
                  >
                    {formatSigned(row.estimatedResult)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function formatSigned(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatPrice(value)}`;
}
