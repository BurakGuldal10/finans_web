"use client";

import { BookOpen, CheckCircle2, ClipboardPlus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatPrice, type AnalysisResult } from "@/lib/analysis";

type TradeStatus = "plan" | "open" | "win" | "loss" | "breakeven";
type TradeSide = "long" | "short";

type TradeEntry = {
  id: string;
  symbol: string;
  timeframe: string;
  side: TradeSide;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  quantity: number;
  strategy: string;
  status: TradeStatus;
  note: string;
  createdAt: string;
};

type DraftTrade = {
  side: TradeSide;
  entryPrice: string;
  stopLoss: string;
  targetPrice: string;
  quantity: string;
  strategy: string;
  status: TradeStatus;
  note: string;
};

type TradeJournalProps = {
  analysis?: AnalysisResult;
  selectedPrice?: number;
  selectedSymbol: string;
  timeframe: string;
};

const storageKey = "finansman-trade-journal";

const defaultDraft: DraftTrade = {
  side: "long",
  entryPrice: "",
  stopLoss: "",
  targetPrice: "",
  quantity: "",
  strategy: "Teknik skor",
  status: "plan",
  note: "",
};

const statusLabels: Record<TradeStatus, string> = {
  plan: "Plan",
  open: "Acik",
  win: "Kar",
  loss: "Zarar",
  breakeven: "Basabas",
};

export function TradeJournal({
  analysis,
  selectedPrice,
  selectedSymbol,
  timeframe,
}: TradeJournalProps) {
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [draft, setDraft] = useState<DraftTrade>(defaultDraft);
  const [message, setMessage] = useState<string | null>(null);

  async function loadEntries() {
    try {
      const response = await fetch("/api/trades");
      if (!response.ok) {
        throw new Error("Trade journal load failed");
      }

      const data = (await response.json()) as { entries?: unknown };
      const savedEntries = Array.isArray(data.entries) ? data.entries.filter(isTradeEntry) : [];
      const migrated = await migrateLegacyEntries(savedEntries);
      setEntries([...migrated, ...savedEntries]);
    } catch {
      setMessage("Trade kayitlari okunamadi. API veya veritabani kontrol edilmeli.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadEntries();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const summary = useMemo(() => {
    const closed = entries.filter((entry) =>
      ["win", "loss", "breakeven"].includes(entry.status),
    );
    const wins = closed.filter((entry) => entry.status === "win").length;
    const losses = closed.filter((entry) => entry.status === "loss").length;
    const plannedRisk = entries
      .filter((entry) => entry.status === "plan" || entry.status === "open")
      .reduce((total, entry) => {
        return total + Math.abs(entry.entryPrice - entry.stopLoss) * entry.quantity;
      }, 0);

    return {
      total: entries.length,
      open: entries.filter((entry) => entry.status === "open").length,
      closed: closed.length,
      winRate: closed.length > 0 ? (wins / closed.length) * 100 : 0,
      losses,
      plannedRisk,
    };
  }, [entries]);

  function fillFromAnalysis() {
    if (!analysis) {
      setMessage("Once analiz verisinin yuklenmesini bekleyin.");
      return;
    }

    setDraft((current) => ({
      ...current,
      entryPrice: formatInputPrice(selectedPrice ?? analysis.price),
      stopLoss: formatInputPrice(analysis.stopLoss),
      targetPrice: formatInputPrice(analysis.targetOne),
      note: `Skor ${analysis.score}/100. ${analysis.reasons[0] ?? ""}`.trim(),
    }));
    setMessage("Analiz seviyeleri forma aktarildi.");
  }

  async function addEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entryPrice = Number(draft.entryPrice);
    const stopLoss = Number(draft.stopLoss);
    const targetPrice = Number(draft.targetPrice);
    const quantity = draft.quantity.trim() === "" ? 1 : Number(draft.quantity);

    if (![entryPrice, stopLoss, targetPrice, quantity].every((value) => Number.isFinite(value))) {
      setMessage("Fiyat, stop, hedef ve miktar sayisal olmali.");
      return;
    }

    if (entryPrice <= 0 || stopLoss <= 0 || targetPrice <= 0 || quantity <= 0) {
      setMessage("Fiyat, stop, hedef ve miktar sifirdan buyuk olmali.");
      return;
    }

    const entry: TradeEntry = {
      id: crypto.randomUUID(),
      symbol: selectedSymbol,
      timeframe,
      side: draft.side,
      entryPrice,
      stopLoss,
      targetPrice,
      quantity,
      strategy: draft.strategy.trim() || "Teknik skor",
      status: draft.status,
      note: draft.note.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const saved = await saveEntry(entry);
      setEntries((current) => [saved, ...current]);
      setDraft(defaultDraft);
      setMessage(`${selectedSymbol} kaydi eklendi.`);
    } catch {
      setMessage("Trade kaydi kaydedilemedi. API veya veritabani kontrol edilmeli.");
    }
  }

  async function updateStatus(id: string, status: TradeStatus) {
    try {
      const response = await fetch("/api/trades", {
        body: JSON.stringify({ id, status }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (!response.ok) {
        throw new Error("Trade status update failed");
      }
      setEntries((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, status } : entry)),
      );
    } catch {
      setMessage("Trade durumu guncellenemedi. API veya veritabani kontrol edilmeli.");
    }
  }

  async function deleteEntry(id: string) {
    try {
      const response = await fetch(`/api/trades?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Trade delete failed");
      }
      setEntries((current) => current.filter((entry) => entry.id !== id));
    } catch {
      setMessage("Trade kaydi silinemedi. API veya veritabani kontrol edilmeli.");
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <BookOpen size={18} />
            Trade gunlugu
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Plan, acik islem ve sonuc kayitlarini yerel olarak saklar.
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
        <form className="space-y-3 rounded-md border border-white/5 bg-white/[0.03] p-3" onSubmit={addEntry}>
          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-[var(--muted)]">
              Yon
              <select
                className="h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 text-sm text-white outline-none"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, side: event.target.value as TradeSide }))
                }
                value={draft.side}
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </label>
            <label className="space-y-1 text-xs text-[var(--muted)]">
              Durum
              <select
                className="h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 text-sm text-white outline-none"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, status: event.target.value as TradeStatus }))
                }
                value={draft.status}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Giris"
              onChange={(value) => setDraft((current) => ({ ...current, entryPrice: value }))}
              value={draft.entryPrice}
            />
            <NumberInput
              label="Miktar"
              onChange={(value) => setDraft((current) => ({ ...current, quantity: value }))}
              value={draft.quantity}
            />
            <NumberInput
              label="Stop"
              onChange={(value) => setDraft((current) => ({ ...current, stopLoss: value }))}
              value={draft.stopLoss}
            />
            <NumberInput
              label="Hedef"
              onChange={(value) => setDraft((current) => ({ ...current, targetPrice: value }))}
              value={draft.targetPrice}
            />
          </div>

          <label className="block space-y-1 text-xs text-[var(--muted)]">
            Strateji
            <input
              className="h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 text-sm text-white outline-none"
              onChange={(event) =>
                setDraft((current) => ({ ...current, strategy: event.target.value }))
              }
              value={draft.strategy}
            />
          </label>

          <label className="block space-y-1 text-xs text-[var(--muted)]">
            Not
            <textarea
              className="min-h-20 w-full resize-y rounded-md border border-[var(--border)] bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none"
              onChange={(event) =>
                setDraft((current) => ({ ...current, note: event.target.value }))
              }
              value={draft.note}
            />
          </label>

          {message ? (
            <p className="rounded-md border border-white/5 bg-white/[0.03] px-3 py-2 text-xs text-[var(--muted)]">
              {message}
            </p>
          ) : null}

          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-300 px-3 text-sm font-semibold text-black transition hover:bg-emerald-200"
            type="submit"
          >
            <CheckCircle2 size={16} />
            Kaydet
          </button>
        </form>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <JournalMetric label="Toplam" value={String(summary.total)} />
            <JournalMetric label="Acik" value={String(summary.open)} />
            <JournalMetric label="Win rate" value={`${summary.winRate.toFixed(0)}%`} />
            <JournalMetric label="Plan risk" value={formatPrice(summary.plannedRisk)} />
          </div>

          <div className="max-h-[460px] space-y-3 overflow-auto pr-1">
            {entries.length === 0 ? (
              <div className="rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
                Henuz trade kaydi yok.
              </div>
            ) : (
              entries.map((entry) => (
                <TradeRow
                  entry={entry}
                  key={entry.id}
                  onDelete={() => deleteEntry(entry.id)}
                  onStatusChange={(status) => updateStatus(entry.id, status)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function NumberInput({
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

function JournalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function TradeRow({
  entry,
  onDelete,
  onStatusChange,
}: {
  entry: TradeEntry;
  onDelete: () => void;
  onStatusChange: (status: TradeStatus) => void;
}) {
  const riskReward = calculateRiskReward(entry);

  return (
    <article className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">{entry.symbol}</span>
            <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-[var(--muted)]">
              {entry.timeframe}
            </span>
            <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-[var(--muted)]">
              {entry.side.toUpperCase()}
            </span>
            <span className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-100">
              {statusLabels[entry.status]}
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {new Date(entry.createdAt).toLocaleString("tr-TR")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-[var(--border)] bg-black/20 px-2 text-xs text-white outline-none"
            onChange={(event) => onStatusChange(event.target.value as TradeStatus)}
            value={entry.status}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            aria-label={`${entry.symbol} kaydini sil`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-red-300/10 hover:text-red-100"
            onClick={onDelete}
            type="button"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        <SmallStat label="Giris" value={formatPrice(entry.entryPrice)} />
        <SmallStat label="Stop" value={formatPrice(entry.stopLoss)} />
        <SmallStat label="Hedef" value={formatPrice(entry.targetPrice)} />
        <SmallStat label="R/O" value={`1:${riskReward.toFixed(2)}`} />
      </div>

      {entry.note ? (
        <p className="mt-3 rounded-md border border-white/5 bg-black/10 p-3 text-sm leading-6 text-[var(--muted)]">
          {entry.note}
        </p>
      ) : null}
    </article>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-mono text-sm text-white">{value}</p>
    </div>
  );
}

function calculateRiskReward(entry: TradeEntry) {
  const risk = Math.max(Math.abs(entry.entryPrice - entry.stopLoss), 0.00000001);
  const reward = Math.max(Math.abs(entry.targetPrice - entry.entryPrice), 0);
  return reward / risk;
}

function formatInputPrice(value: number) {
  return Number(value.toFixed(value >= 1 ? 4 : 8)).toString();
}

function isTradeEntry(value: unknown): value is TradeEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<TradeEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.symbol === "string" &&
    typeof entry.entryPrice === "number" &&
    typeof entry.stopLoss === "number" &&
    typeof entry.targetPrice === "number" &&
    typeof entry.quantity === "number"
  );
}

async function migrateLegacyEntries(existing: TradeEntry[]) {
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved) as unknown;
    const existingIds = new Set(existing.map((entry) => entry.id));
    const legacy = Array.isArray(parsed)
      ? parsed.filter(isTradeEntry).filter((entry) => !existingIds.has(entry.id))
      : [];
    const migrated: TradeEntry[] = [];

    for (const entry of legacy) {
      migrated.push(await saveEntry(entry));
    }

    window.localStorage.removeItem(storageKey);
    return migrated;
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
}

async function saveEntry(entry: TradeEntry) {
  const response = await fetch("/api/trades", {
    body: JSON.stringify(entry),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Trade save failed");
  }

  const data = (await response.json()) as { entry?: unknown };
  if (!isTradeEntry(data.entry)) {
    throw new Error("Invalid trade response");
  }

  return data.entry;
}
