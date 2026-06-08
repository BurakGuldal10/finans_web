"use client";

import { Archive, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatPrice, type AnalysisResult, type DecisionReport, type TradePlan } from "@/lib/analysis";
import type { MarketKind } from "@/lib/markets";

type AnalysisSnapshotRecord = {
  id: string;
  market: MarketKind;
  symbol: string;
  interval: string;
  price: number;
  score: number;
  stance: "watch" | "wait" | "avoid";
  confidence: number;
  reportJson: string;
  createdAt: string;
};

type SnapshotResponse = {
  snapshots: AnalysisSnapshotRecord[];
};

type Props = {
  analysis?: AnalysisResult;
  decisionReport?: DecisionReport;
  interval: string;
  market: MarketKind;
  symbol: string;
  tradePlan?: TradePlan;
};

export function AnalysisSnapshotPanel({
  analysis,
  decisionReport,
  interval,
  market,
  symbol,
  tradePlan,
}: Props) {
  const [snapshots, setSnapshots] = useState<AnalysisSnapshotRecord[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canSave = Boolean(analysis && decisionReport && tradePlan);

  const loadSnapshots = useCallback(async () => {
    const response = await fetch("/api/snapshots", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Snapshot listesi alinamadi.");
    }

    const payload = (await response.json()) as SnapshotResponse;
    setSnapshots(payload.snapshots);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSnapshots().catch(() => setMessage("Analiz gecmisi okunamadi."));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSnapshots]);

  async function saveSnapshot() {
    if (!analysis || !decisionReport || !tradePlan) {
      setMessage("Kaydedilecek analiz henuz hazir degil.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/snapshots", {
        body: JSON.stringify({
          confidence: decisionReport.confidence,
          interval,
          market,
          price: analysis.price,
          reportJson: JSON.stringify({
            analysis,
            decisionReport,
            tradePlan,
          }),
          score: analysis.score,
          stance: tradePlan.stance,
          symbol,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Snapshot kaydedilemedi.");
      }

      await loadSnapshots();
      setMessage("Analiz raporu kaydedildi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Snapshot kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSnapshot(id: string) {
    setMessage(null);

    try {
      const response = await fetch(`/api/snapshots?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Snapshot silinemedi.");
      }

      setSnapshots((current) => current.filter((snapshot) => snapshot.id !== id));
      setMessage("Kayit silindi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Snapshot silinemedi.");
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Archive size={18} />
            Analiz gecmisi
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Mevcut karar raporunu yerel veritabanina kaydeder.
          </p>
        </div>

        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-300/40 bg-emerald-300/10 px-4 text-sm font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-[var(--muted)]"
          disabled={!canSave || loading}
          onClick={() => void saveSnapshot()}
          type="button"
        >
          <Save size={16} />
          {loading ? "Kaydediliyor" : "Raporu kaydet"}
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-md border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-[var(--muted)]">
          {message}
        </p>
      ) : null}

      <div className="mt-4 grid gap-3">
        {snapshots.length > 0 ? (
          snapshots.map((snapshot) => (
            <SnapshotItem
              key={snapshot.id}
              onDelete={deleteSnapshot}
              snapshot={snapshot}
            />
          ))
        ) : (
          <div className="rounded-md border border-white/5 bg-white/[0.03] p-4 text-sm text-[var(--muted)]">
            Henuz kaydedilmis analiz raporu yok.
          </div>
        )}
      </div>
    </section>
  );
}

function SnapshotItem({
  onDelete,
  snapshot,
}: {
  onDelete: (id: string) => Promise<void>;
  snapshot: AnalysisSnapshotRecord;
}) {
  const stance = {
    avoid: "Kacin",
    wait: "Bekle",
    watch: "Takip",
  }[snapshot.stance];
  const market = {
    bist: "BIST",
    crypto: "Kripto",
    stocks: "ABD",
  }[snapshot.market];

  return (
    <div className="grid gap-3 rounded-md border border-white/5 bg-white/[0.03] p-3 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-white">{snapshot.symbol}</span>
          <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-[var(--muted)]">
            {market} / {snapshot.interval}
          </span>
          <span className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">
            {stance}
          </span>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Fiyat {formatPrice(snapshot.price)} - Skor {snapshot.score}/100 - Guven{" "}
          {snapshot.confidence}/100
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          {new Date(snapshot.createdAt).toLocaleString("tr-TR")}
        </p>
      </div>

      <button
        aria-label={`${snapshot.symbol} analiz kaydini sil`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] transition hover:border-red-300/60 hover:text-red-100"
        onClick={() => void onDelete(snapshot.id)}
        type="button"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
