"use client";

import { BarChart3, Lightbulb, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { UsageSummary } from "@/lib/usage-summary";

type UsageSummaryResponse = {
  summary: UsageSummary;
};

export function UsageSummaryPanel() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/usage-summary?days=7", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Usage summary request failed");
      }

      const payload = (await response.json()) as UsageSummaryResponse;
      setSummary(payload.summary);
      setError(null);
    } catch {
      setError("Kullanim ozeti okunamadi.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSummary();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSummary]);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <BarChart3 size={18} />
            Kullanim ozeti
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Son 7 gunluk notlardan sembol, panel ve aksiyon ozetini cikarir.
          </p>
        </div>

        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm text-white transition hover:border-emerald-300"
          onClick={() => void loadSummary()}
          type="button"
        >
          <RefreshCcw size={15} />
          Yenile
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {summary ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryMetric label="Not" value={summary.totals.notes.toString()} />
            <SummaryMetric label="Aktif gun" value={`${summary.totals.activeDays}/7`} />
            <SummaryMetric label="Snapshot" value={summary.totals.snapshots.toString()} />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <CountList emptyText="Henuz sembol yok." items={summary.symbols} title="En cok bakilan semboller" />
            <CountList emptyText="Henuz panel notu yok." items={summary.usefulPanels} title="Faydali paneller" />
            <CountList emptyText="Karistiran panel notu yok." items={summary.confusingPanels} title="Karistiran paneller" />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <TextList emptyText="Veri sorunu not edilmemis." items={summary.dataIssues} title="Veri sorunlari" />
            <TextList emptyText="Aksiyon notu yok." items={summary.nextActions} title="Siradaki aksiyonlar" />
          </div>

          <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Lightbulb size={16} />
              Oneriler
            </h4>
            <div className="mt-3 grid gap-2">
              {summary.recommendations.map((recommendation) => (
                <RecommendationCard
                  detail={recommendation.detail}
                  key={`${recommendation.title}-${recommendation.detail}`}
                  title={recommendation.title}
                  tone={recommendation.tone}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-[var(--muted)]">
            Aralik: {summary.range.from} - {summary.range.to}. Son uretim:{" "}
            {new Date(summary.generatedAt).toLocaleString("tr-TR")}.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
          Kullanim ozeti yukleniyor.
        </div>
      )}
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function CountList({
  emptyText,
  items,
  title,
}: {
  emptyText: string;
  items: Array<{ label: string; count: number }>;
  title: string;
}) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <div className="mt-3 grid gap-2">
        {items.length ? (
          items.map((item) => (
            <div className="flex items-center justify-between gap-3 text-sm" key={item.label}>
              <span className="min-w-0 truncate text-[var(--muted)]">{item.label}</span>
              <span className="font-mono text-emerald-100">{item.count}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function TextList({ emptyText, items, title }: { emptyText: string; items: string[]; title: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <div className="mt-3 grid gap-2">
        {items.length ? (
          items.map((item) => (
            <p className="rounded-md border border-white/5 bg-black/15 p-2 text-sm leading-6 text-[var(--muted)]" key={item}>
              {item}
            </p>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function RecommendationCard({
  detail,
  title,
  tone,
}: {
  detail: string;
  title: string;
  tone: "positive" | "warning" | "info";
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-50"
      : tone === "warning"
        ? "border-yellow-300/20 bg-yellow-300/10 text-yellow-50"
        : "border-white/5 bg-black/15 text-[var(--muted)]";

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm leading-6">{detail}</p>
    </div>
  );
}
