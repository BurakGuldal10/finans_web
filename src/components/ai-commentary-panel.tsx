"use client";

import { BrainCircuit, Sparkles } from "lucide-react";
import { useState } from "react";
import type {
  AnalysisResult,
  DecisionReport,
  MultiTimeframeAnalysis,
  TradePlan,
} from "@/lib/analysis";
import type { MarketKind } from "@/lib/markets";

type AiCommentaryPanelProps = {
  analysis?: AnalysisResult;
  decisionReport?: DecisionReport;
  interval: string;
  market: MarketKind;
  multiTimeframe?: MultiTimeframeAnalysis;
  tradePlan?: TradePlan;
};

type AiCommentaryResponse = {
  commentary?: string;
  error?: string;
  model?: string;
};

export function AiCommentaryPanel({
  analysis,
  decisionReport,
  interval,
  market,
  multiTimeframe,
  tradePlan,
}: AiCommentaryPanelProps) {
  const [commentary, setCommentary] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ready = Boolean(analysis && decisionReport && multiTimeframe && tradePlan);

  async function generateCommentary() {
    if (!analysis || !decisionReport || !multiTimeframe || !tradePlan) {
      setMessage("AI yorumu icin analiz verisi bekleniyor.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/ai-commentary", {
        body: JSON.stringify({
          analysis,
          decisionReport,
          interval,
          market,
          multiTimeframe,
          tradePlan,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as AiCommentaryResponse | null;

      if (!response.ok) {
        setCommentary(null);
        setMessage(data?.error ?? "AI yorumu olusturulamadi.");
        return;
      }

      setCommentary(data?.commentary ?? "");
      setModel(data?.model ?? null);
    } catch {
      setCommentary(null);
      setMessage("AI yorumlama baglantisi kurulamadi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <BrainCircuit size={18} />
            AI yorum
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Mevcut karar raporunu kisa Turkce yorum haline getirir.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-300 px-3 text-sm font-semibold text-black transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!ready || loading}
          onClick={generateCommentary}
          type="button"
        >
          <Sparkles size={16} />
          {loading ? "Yaziliyor" : "Yorum uret"}
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-md border border-yellow-300/20 bg-yellow-300/10 p-3 text-sm leading-6 text-yellow-100">
          {message}
        </div>
      ) : null}

      {commentary ? (
        <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-4">
          <p className="whitespace-pre-wrap text-sm leading-6 text-white">{commentary}</p>
          {model ? <p className="mt-3 text-xs text-[var(--muted)]">Model: {model}</p> : null}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
          AI yorumu manuel olarak uretilecek.
        </div>
      )}
    </section>
  );
}
