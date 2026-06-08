"use client";

import { Archive, Eye, GitCompare, Save, Sigma, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

type SnapshotReport = {
  analysis?: AnalysisResult;
  decisionReport?: DecisionReport;
  tradePlan?: TradePlan;
};

type Props = {
  analysis?: AnalysisResult;
  currentPrice?: number;
  decisionReport?: DecisionReport;
  interval: string;
  market: MarketKind;
  symbol: string;
  tradePlan?: TradePlan;
};

export function AnalysisSnapshotPanel({
  analysis,
  currentPrice,
  decisionReport,
  interval,
  market,
  symbol,
  tradePlan,
}: Props) {
  const [snapshots, setSnapshots] = useState<AnalysisSnapshotRecord[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const canSave = Boolean(analysis && decisionReport && tradePlan);
  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) ?? null,
    [selectedSnapshotId, snapshots],
  );
  const selectedReport = useMemo(
    () => (selectedSnapshot ? parseSnapshotReport(selectedSnapshot.reportJson) : null),
    [selectedSnapshot],
  );
  const comparableSnapshots = useMemo(
    () =>
      snapshots.filter(
        (snapshot) =>
          snapshot.market === market &&
          snapshot.symbol === symbol &&
          Number.isFinite(currentPrice),
      ),
    [currentPrice, market, snapshots, symbol],
  );
  const performance = useMemo(
    () => buildSnapshotPerformance(comparableSnapshots, currentPrice),
    [comparableSnapshots, currentPrice],
  );

  const loadSnapshots = useCallback(async () => {
    const response = await fetch("/api/snapshots", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Snapshot listesi alinamadi.");
    }

    const payload = (await response.json()) as SnapshotResponse;
    setSnapshots(payload.snapshots);
    setSelectedSnapshotId((current) =>
      current && payload.snapshots.some((snapshot) => snapshot.id === current) ? current : null,
    );
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

      const payload = (await response.json()) as { snapshot: AnalysisSnapshotRecord };
      await loadSnapshots();
      setSelectedSnapshotId(payload.snapshot.id);
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
      setSelectedSnapshotId((current) => (current === id ? null : current));
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

      {performance ? <SnapshotPerformanceSummary performance={performance} /> : null}

      <div className="mt-4 grid gap-3">
        {snapshots.length > 0 ? (
          snapshots.map((snapshot) => (
            <SnapshotItem
              key={snapshot.id}
              onDelete={deleteSnapshot}
              onSelect={setSelectedSnapshotId}
              selected={snapshot.id === selectedSnapshotId}
              snapshot={snapshot}
            />
          ))
        ) : (
          <div className="rounded-md border border-white/5 bg-white/[0.03] p-4 text-sm text-[var(--muted)]">
            Henuz kaydedilmis analiz raporu yok.
          </div>
        )}
      </div>

      {selectedSnapshot ? (
        <SnapshotDetail
          currentAnalysis={analysis}
          currentDecisionReport={decisionReport}
          currentMarket={market}
          currentPrice={currentPrice}
          currentSymbol={symbol}
          currentTradePlan={tradePlan}
          onClose={() => setSelectedSnapshotId(null)}
          report={selectedReport}
          snapshot={selectedSnapshot}
        />
      ) : null}
    </section>
  );
}

function SnapshotItem({
  onDelete,
  onSelect,
  selected,
  snapshot,
}: {
  onDelete: (id: string) => Promise<void>;
  onSelect: (id: string) => void;
  selected: boolean;
  snapshot: AnalysisSnapshotRecord;
}) {
  const market = {
    bist: "BIST",
    crypto: "Kripto",
    stocks: "ABD",
  }[snapshot.market];

  return (
    <div
      className={`grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_auto] md:items-center ${
        selected ? "border-emerald-300/40 bg-emerald-300/10" : "border-white/5 bg-white/[0.03]"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-white">{snapshot.symbol}</span>
          <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-[var(--muted)]">
            {market} / {snapshot.interval}
          </span>
          <span className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-xs text-emerald-100">
            {stanceLabel(snapshot.stance)}
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

      <div className="flex items-center gap-2">
        <button
          aria-label={`${snapshot.symbol} analiz kaydini ac`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] transition hover:border-emerald-300/60 hover:text-emerald-100"
          onClick={() => onSelect(snapshot.id)}
          type="button"
        >
          <Eye size={15} />
        </button>
        <button
          aria-label={`${snapshot.symbol} analiz kaydini sil`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] transition hover:border-red-300/60 hover:text-red-100"
          onClick={() => void onDelete(snapshot.id)}
          type="button"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

function SnapshotDetail({
  currentAnalysis,
  currentDecisionReport,
  currentMarket,
  currentPrice,
  currentSymbol,
  currentTradePlan,
  onClose,
  report,
  snapshot,
}: {
  currentAnalysis?: AnalysisResult;
  currentDecisionReport?: DecisionReport;
  currentMarket: MarketKind;
  currentPrice?: number;
  currentSymbol: string;
  currentTradePlan?: TradePlan;
  onClose: () => void;
  report: SnapshotReport | null;
  snapshot: AnalysisSnapshotRecord;
}) {
  const savedAnalysis = report?.analysis;
  const savedDecisionReport = report?.decisionReport;
  const savedTradePlan = report?.tradePlan;
  const comparableCurrentPrice =
    typeof currentPrice === "number" && Number.isFinite(currentPrice) ? currentPrice : null;
  const canCompare =
    currentAnalysis &&
    currentDecisionReport &&
    currentTradePlan &&
    currentMarket === snapshot.market &&
    currentSymbol === snapshot.symbol;

  return (
    <div className="mt-5 rounded-md border border-emerald-300/20 bg-black/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-100">
            <GitCompare size={16} />
            Kayit detayi
          </h4>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {snapshot.symbol} icin {new Date(snapshot.createdAt).toLocaleString("tr-TR")} tarihinde
            kaydedilen rapor.
          </p>
        </div>
        <button
          aria-label="Kayit detayini kapat"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted)] transition hover:border-emerald-300 hover:text-white"
          onClick={onClose}
          type="button"
        >
          <X size={15} />
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <DetailMetric label="Kayit fiyati" value={formatPrice(snapshot.price)} />
        <DetailMetric label="Kayit skoru" value={`${snapshot.score}/100`} />
        <DetailMetric label="Kayit guveni" value={`${snapshot.confidence}/100`} />
        <DetailMetric label="Durus" value={stanceLabel(snapshot.stance)} />
      </div>

      {canCompare && comparableCurrentPrice !== null ? (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <DetailMetric label="Guncel fiyat" value={formatPrice(comparableCurrentPrice)} />
          <ReturnMetric current={comparableCurrentPrice} previous={snapshot.price} />
          <DetailMetric label="Gecen sure" value={formatAge(snapshot.createdAt)} />
          <DetailMetric
            label="Okuma"
            value={describeReturn(
              snapshot.stance,
              calculateReturnPercent(snapshot.price, comparableCurrentPrice),
            )}
          />
        </div>
      ) : null}

      {canCompare ? (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <ComparisonMetric
            current={currentAnalysis.price}
            formatter={formatPrice}
            label="Fiyat farki"
            previous={snapshot.price}
          />
          <ComparisonMetric
            current={currentAnalysis.score}
            formatter={(value) => `${Math.round(value)}/100`}
            label="Skor farki"
            previous={snapshot.score}
          />
          <ComparisonMetric
            current={currentDecisionReport.confidence}
            formatter={(value) => `${Math.round(value)}/100`}
            label="Guven farki"
            previous={snapshot.confidence}
          />
          <DetailMetric
            label="Durus degisimi"
            value={`${stanceLabel(snapshot.stance)} -> ${stanceLabel(currentTradePlan.stance)}`}
          />
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-yellow-300/20 bg-yellow-300/10 p-3 text-sm leading-6 text-yellow-100">
          Karsilastirma icin ekranda ayni piyasa ve sembolun guncel analizi secili olmali.
        </p>
      )}

      {savedDecisionReport || savedTradePlan || savedAnalysis ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Kayitli karar raporu
            </p>
            <p className="mt-3 font-semibold text-white">
              {savedDecisionReport?.headline ?? "Baslik kaydedilmemis"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {savedDecisionReport?.overview ?? savedAnalysis?.actionSummary ?? "Rapor detayi yok."}
            </p>
          </div>

          <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
              Kayitli trade plani
            </p>
            <p className="mt-3 font-semibold text-white">
              {savedTradePlan?.title ?? stanceLabel(snapshot.stance)}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {savedTradePlan?.summary ?? savedAnalysis?.invalidation ?? "Plan detayi yok."}
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
          Kayitli rapor govdesi okunamadi.
        </p>
      )}

      {savedAnalysis ? (
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <DetailMetric label="RSI" value={savedAnalysis.indicators.rsi14.toFixed(2)} />
          <DetailMetric label="Trend gucu" value={`${savedAnalysis.trendStrength}/100`} />
          <DetailMetric label="Risk / odul" value={`1:${savedAnalysis.riskReward.toFixed(2)}`} />
          <DetailMetric label="Stop" value={formatPrice(savedAnalysis.stopLoss)} />
        </div>
      ) : null}
    </div>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-mono text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ComparisonMetric({
  current,
  formatter,
  label,
  previous,
}: {
  current: number;
  formatter: (value: number) => string;
  label: string;
  previous: number;
}) {
  const change = current - previous;
  const positive = change >= 0;

  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p
        className={`mt-2 font-mono text-sm font-semibold ${
          positive ? "text-emerald-100" : "text-red-100"
        }`}
      >
        {positive ? "+" : ""}
        {formatter(change)}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">Guncel: {formatter(current)}</p>
    </div>
  );
}

type SnapshotPerformance = {
  averageReturnPercent: number;
  bestReturnPercent: number;
  count: number;
  stanceBuckets: Array<{
    averageReturnPercent: number;
    count: number;
    stance: AnalysisSnapshotRecord["stance"];
  }>;
  worstReturnPercent: number;
};

function SnapshotPerformanceSummary({ performance }: { performance: SnapshotPerformance }) {
  return (
    <div className="mt-4 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-50">
            <Sigma size={16} />
            Secili sembol snapshot performansi
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-50/80">
            Kayit fiyatlari guncel fiyatla karsilastirilir; emir veya kesin sonuc degildir.
          </p>
        </div>
        <span className="rounded-md border border-emerald-300/30 px-2 py-1 font-mono text-xs text-emerald-50">
          {performance.count} kayit
        </span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <PerformanceCell label="Ortalama" value={formatPercent(performance.averageReturnPercent)} />
        <PerformanceCell label="En iyi" value={formatPercent(performance.bestReturnPercent)} />
        <PerformanceCell label="En kotu" value={formatPercent(performance.worstReturnPercent)} />
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {performance.stanceBuckets.map((bucket) => (
          <div className="rounded-md border border-white/10 bg-black/10 p-2" key={bucket.stance}>
            <p className="text-xs uppercase tracking-[0.12em] text-emerald-50/70">
              {stanceLabel(bucket.stance)}
            </p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">
              {formatPercent(bucket.averageReturnPercent)}
            </p>
            <p className="mt-1 text-xs text-emerald-50/70">{bucket.count} kayit</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformanceCell({ label, value }: { label: string; value: string }) {
  const positive = !value.startsWith("-");

  return (
    <div className="rounded-md border border-white/10 bg-black/10 p-2">
      <p className="text-xs uppercase tracking-[0.12em] text-emerald-50/70">{label}</p>
      <p className={`mt-1 font-mono text-sm font-semibold ${positive ? "text-emerald-50" : "text-red-100"}`}>
        {value}
      </p>
    </div>
  );
}

function ReturnMetric({ current, previous }: { current: number; previous: number }) {
  const returnPercent = calculateReturnPercent(previous, current);

  return (
    <DetailMetric label="Fiyat getirisi" value={formatPercent(returnPercent)} />
  );
}

function buildSnapshotPerformance(
  snapshots: AnalysisSnapshotRecord[],
  currentPrice?: number,
): SnapshotPerformance | null {
  if (typeof currentPrice !== "number" || !Number.isFinite(currentPrice) || snapshots.length === 0) {
    return null;
  }

  const returns = snapshots.map((snapshot) => calculateReturnPercent(snapshot.price, currentPrice));
  const stanceBuckets = (["watch", "wait", "avoid"] as const)
    .map((stance) => {
      const stanceReturns = snapshots
        .filter((snapshot) => snapshot.stance === stance)
        .map((snapshot) => calculateReturnPercent(snapshot.price, currentPrice));

      return {
        averageReturnPercent: averageNumbers(stanceReturns),
        count: stanceReturns.length,
        stance,
      };
    })
    .filter((bucket) => bucket.count > 0);

  return {
    averageReturnPercent: averageNumbers(returns),
    bestReturnPercent: Math.max(...returns),
    count: snapshots.length,
    stanceBuckets,
    worstReturnPercent: Math.min(...returns),
  };
}

function averageNumbers(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function calculateReturnPercent(previous: number, current: number) {
  if (previous <= 0) {
    return 0;
  }

  return ((current - previous) / previous) * 100;
}

function formatPercent(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function formatAge(createdAt: string) {
  const created = Date.parse(createdAt);
  if (Number.isNaN(created)) {
    return "Bilinmiyor";
  }

  const diffMs = Date.now() - created;
  const diffHours = Math.max(Math.floor(diffMs / 36e5), 0);

  if (diffHours < 24) {
    return `${diffHours} saat`;
  }

  return `${Math.floor(diffHours / 24)} gun`;
}

function describeReturn(stance: AnalysisSnapshotRecord["stance"], returnPercent: number) {
  if (stance === "watch" && returnPercent > 0) {
    return "Takip olumlu";
  }

  if (stance === "avoid" && returnPercent < 0) {
    return "Kacin uyumlu";
  }

  if (Math.abs(returnPercent) < 1) {
    return "Notr";
  }

  return returnPercent > 0 ? "Yukari gitti" : "Asagi gitti";
}

function parseSnapshotReport(reportJson: string): SnapshotReport | null {
  try {
    const parsed = JSON.parse(reportJson) as SnapshotReport;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function stanceLabel(stance: AnalysisSnapshotRecord["stance"]) {
  if (stance === "watch") {
    return "Takip";
  }

  if (stance === "avoid") {
    return "Kacin";
  }

  return "Bekle";
}
