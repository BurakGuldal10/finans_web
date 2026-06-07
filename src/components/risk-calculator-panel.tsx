"use client";

import { Calculator, ClipboardPlus, ShieldAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatPrice, type AnalysisResult } from "@/lib/analysis";
import type { MarketKind } from "@/lib/markets";

type RiskCalculatorPanelProps = {
  analysis?: AnalysisResult;
  defaultRiskPercent: string;
  market: MarketKind;
  selectedPrice?: number;
  symbol: string;
};

type DraftRisk = {
  accountSize: string;
  entryPrice: string;
  riskPercent: string;
  stopLoss: string;
  targetPrice: string;
};

const storageKey = "finansman-risk-calculator";

const defaultDraft: DraftRisk = {
  accountSize: "",
  entryPrice: "",
  riskPercent: "1",
  stopLoss: "",
  targetPrice: "",
};

export function RiskCalculatorPanel({
  analysis,
  defaultRiskPercent,
  market,
  selectedPrice,
  symbol,
}: RiskCalculatorPanelProps) {
  const [draft, setDraft] = useState<DraftRisk>({
    ...defaultDraft,
    riskPercent: defaultRiskPercent,
  });
  const [message, setMessage] = useState<string | null>(null);
  const unit = market === "crypto" ? "USDT" : market === "bist" ? "TRY" : "USD";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        setDraft((current) => ({ ...current, riskPercent: defaultRiskPercent }));
        return;
      }

      try {
        const parsed = JSON.parse(saved) as Partial<DraftRisk>;
        setDraft({
          accountSize: typeof parsed.accountSize === "string" ? parsed.accountSize : "",
          entryPrice: "",
          riskPercent:
            typeof parsed.riskPercent === "string" ? parsed.riskPercent : defaultRiskPercent,
          stopLoss: "",
          targetPrice: "",
        });
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [defaultRiskPercent]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        accountSize: draft.accountSize,
        riskPercent: draft.riskPercent,
      }),
    );
  }, [draft.accountSize, draft.riskPercent]);

  const result = useMemo(() => {
    const accountSize = Number(draft.accountSize);
    const riskPercent = Number(draft.riskPercent);
    const entryPrice = Number(draft.entryPrice);
    const stopLoss = Number(draft.stopLoss);
    const targetPrice = Number(draft.targetPrice);

    if (![accountSize, riskPercent, entryPrice, stopLoss].every(Number.isFinite)) {
      return null;
    }

    if (accountSize <= 0 || riskPercent <= 0 || entryPrice <= 0 || stopLoss <= 0) {
      return null;
    }

    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    if (riskPerUnit <= 0) {
      return null;
    }

    const riskAmount = accountSize * (riskPercent / 100);
    const quantity = riskAmount / riskPerUnit;
    const positionValue = quantity * entryPrice;
    const portfolioWeight = (positionValue / accountSize) * 100;
    const rewardPerUnit =
      Number.isFinite(targetPrice) && targetPrice > 0 ? Math.abs(targetPrice - entryPrice) : 0;
    const potentialReward = rewardPerUnit * quantity;
    const riskReward = rewardPerUnit > 0 ? rewardPerUnit / riskPerUnit : 0;

    return {
      portfolioWeight,
      positionValue,
      potentialReward,
      quantity,
      riskAmount,
      riskReward,
      riskPerUnit,
    };
  }, [draft]);

  function fillFromAnalysis() {
    if (!analysis) {
      setMessage("Analiz verisinin yuklenmesini bekleyin.");
      return;
    }

    setDraft((current) => ({
      ...current,
      entryPrice: formatInputPrice(selectedPrice ?? analysis.price),
      stopLoss: formatInputPrice(analysis.stopLoss),
      targetPrice: formatInputPrice(analysis.targetOne),
    }));
    setMessage(`${symbol} analiz seviyeleri risk formuna aktarildi.`);
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Calculator size={18} />
            Risk hesaplayici
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Hesap buyuklugu ve stop mesafesine gore pozisyon boyutu hesaplar.
          </p>
        </div>

        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white/[0.04] px-3 text-sm font-medium text-white transition hover:border-emerald-300 hover:bg-emerald-300/10"
          onClick={fillFromAnalysis}
          type="button"
        >
          <ClipboardPlus size={16} />
          Analizden doldur
        </button>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[360px_1fr]">
        <div className="space-y-3 rounded-md border border-white/5 bg-white/[0.03] p-3">
          <div className="grid grid-cols-2 gap-2">
            <RiskInput
              label={`Hesap (${unit})`}
              onChange={(value) => setDraft((current) => ({ ...current, accountSize: value }))}
              value={draft.accountSize}
            />
            <RiskInput
              label="Risk %"
              onChange={(value) => setDraft((current) => ({ ...current, riskPercent: value }))}
              value={draft.riskPercent}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <RiskInput
              label="Giris"
              onChange={(value) => setDraft((current) => ({ ...current, entryPrice: value }))}
              value={draft.entryPrice}
            />
            <RiskInput
              label="Stop"
              onChange={(value) => setDraft((current) => ({ ...current, stopLoss: value }))}
              value={draft.stopLoss}
            />
          </div>

          <RiskInput
            label="Hedef"
            onChange={(value) => setDraft((current) => ({ ...current, targetPrice: value }))}
            value={draft.targetPrice}
          />

          {message ? (
            <p className="rounded-md border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-[var(--muted)]">
              {message}
            </p>
          ) : null}
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <RiskMetric label="Risk tutari" tone="danger" value={`${formatPrice(result.riskAmount)} ${unit}`} />
              <RiskMetric label="Adet" value={formatQuantity(result.quantity)} />
              <RiskMetric label="Pozisyon" value={`${formatPrice(result.positionValue)} ${unit}`} />
              <RiskMetric label="Portfoy %" value={`${result.portfolioWeight.toFixed(1)}%`} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <RiskMetric label="Birim risk" tone="danger" value={`${formatPrice(result.riskPerUnit)} ${unit}`} />
              <RiskMetric
                label="Potansiyel kar"
                tone="positive"
                value={`${formatPrice(result.potentialReward)} ${unit}`}
              />
              <RiskMetric label="Risk / odul" value={`1:${result.riskReward.toFixed(2)}`} />
            </div>

            {result.portfolioWeight > 100 ? (
              <p className="flex gap-2 rounded-md border border-yellow-300/20 bg-yellow-300/10 p-3 text-sm leading-6 text-yellow-100">
                <ShieldAlert className="mt-1 shrink-0" size={16} />
                Pozisyon degeri hesap buyuklugunu asiyor; kaldirac veya daha dusuk risk varsayimi gerekir.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
            Hesap buyuklugu, risk yuzdesi, giris ve stop girildiginde pozisyon boyutu hesaplanir.
          </div>
        )}
      </div>
    </section>
  );
}

function RiskInput({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-1 text-xs text-[var(--muted)]">
      {label}
      <input
        className="h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 font-mono text-sm text-white outline-none"
        inputMode="decimal"
        onChange={(event) => onChange(event.target.value)}
        placeholder="0.00"
        type="number"
        value={value}
      />
    </label>
  );
}

function RiskMetric({
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

function formatInputPrice(value: number) {
  return Number(value.toFixed(value >= 1 ? 4 : 8)).toString();
}

function formatQuantity(value: number) {
  if (value >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  if (value >= 1) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }

  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}
