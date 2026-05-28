"use client";

import { BriefcaseBusiness, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatPrice } from "@/lib/analysis";

type TickerPrice = {
  symbol: string;
  price?: number;
};

type PortfolioPosition = {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  stopLoss: number;
  note: string;
  createdAt: string;
};

type DraftPosition = {
  quantity: string;
  averageCost: string;
  stopLoss: string;
  note: string;
};

type PortfolioPanelProps = {
  currentPrice?: number;
  selectedSymbol: string;
  tickers: TickerPrice[];
};

const storageKey = "finansman-portfolio";

const defaultDraft: DraftPosition = {
  quantity: "",
  averageCost: "",
  stopLoss: "",
  note: "",
};

export function PortfolioPanel({ currentPrice, selectedSymbol, tickers }: PortfolioPanelProps) {
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [draft, setDraft] = useState<DraftPosition>(defaultDraft);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        return;
      }

      try {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) {
          setPositions(parsed.filter(isPortfolioPosition));
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(positions));
  }, [positions]);

  const priceMap = useMemo(() => {
    return new Map(tickers.map((ticker) => [ticker.symbol, ticker.price]));
  }, [tickers]);

  const rows = useMemo(() => {
    return positions.map((position) => {
      const price = priceMap.get(position.symbol);
      const marketValue = price ? price * position.quantity : 0;
      const costValue = position.averageCost * position.quantity;
      const profitLoss = marketValue - costValue;
      const profitLossPercent = costValue > 0 ? (profitLoss / costValue) * 100 : 0;
      const riskValue =
        position.stopLoss > 0
          ? Math.max(position.averageCost - position.stopLoss, 0) * position.quantity
          : 0;

      return {
        ...position,
        price,
        marketValue,
        costValue,
        profitLoss,
        profitLossPercent,
        riskValue,
      };
    });
  }, [positions, priceMap]);

  const summary = useMemo(() => {
    return rows.reduce(
      (total, row) => ({
        value: total.value + row.marketValue,
        cost: total.cost + row.costValue,
        profitLoss: total.profitLoss + row.profitLoss,
        risk: total.risk + row.riskValue,
      }),
      { value: 0, cost: 0, profitLoss: 0, risk: 0 },
    );
  }, [rows]);

  const summaryProfitLossPercent =
    summary.cost > 0 ? (summary.profitLoss / summary.cost) * 100 : 0;

  function fillSelectedPrice() {
    if (!currentPrice) {
      setMessage("Secili sembol icin fiyat henuz yuklenmedi.");
      return;
    }

    setDraft((current) => ({
      ...current,
      averageCost: formatInputPrice(currentPrice),
    }));
    setMessage(`${selectedSymbol} fiyati ortalama maliyete aktarildi.`);
  }

  function addPosition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantity = Number(draft.quantity);
    const averageCost = Number(draft.averageCost);
    const stopLoss = draft.stopLoss.trim() === "" ? 0 : Number(draft.stopLoss);

    if (![quantity, averageCost, stopLoss].every((value) => Number.isFinite(value))) {
      setMessage("Miktar, maliyet ve stop sayisal olmali.");
      return;
    }

    if (quantity <= 0 || averageCost <= 0 || stopLoss < 0) {
      setMessage("Miktar ve maliyet sifirdan buyuk olmali.");
      return;
    }

    const position: PortfolioPosition = {
      id: crypto.randomUUID(),
      symbol: selectedSymbol,
      quantity,
      averageCost,
      stopLoss,
      note: draft.note.trim(),
      createdAt: new Date().toISOString(),
    };

    setPositions((current) => [position, ...current]);
    setDraft(defaultDraft);
    setMessage(`${selectedSymbol} pozisyonu eklendi.`);
  }

  function deletePosition(id: string) {
    setPositions((current) => current.filter((position) => position.id !== id));
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <BriefcaseBusiness size={18} />
            Portfoy
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Pozisyon maliyeti, canli deger, kar/zarar ve stop riskini takip eder.
          </p>
        </div>

        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white/[0.04] px-3 text-sm font-medium text-white transition hover:border-emerald-300 hover:bg-emerald-300/10"
          onClick={fillSelectedPrice}
          type="button"
        >
          <PlusCircle size={16} />
          Fiyati kullan
        </button>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[340px_1fr]">
        <form className="space-y-3 rounded-md border border-white/5 bg-white/[0.03] p-3" onSubmit={addPosition}>
          <div className="rounded-md border border-white/5 bg-black/10 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Sembol</p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">{selectedSymbol}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <PortfolioInput
              label="Miktar"
              onChange={(value) => setDraft((current) => ({ ...current, quantity: value }))}
              value={draft.quantity}
            />
            <PortfolioInput
              label="Ortalama maliyet"
              onChange={(value) => setDraft((current) => ({ ...current, averageCost: value }))}
              value={draft.averageCost}
            />
          </div>

          <PortfolioInput
            label="Stop"
            onChange={(value) => setDraft((current) => ({ ...current, stopLoss: value }))}
            value={draft.stopLoss}
          />

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
            <PlusCircle size={16} />
            Pozisyon ekle
          </button>
        </form>

        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <PortfolioMetric label="Deger" value={formatPrice(summary.value)} />
            <PortfolioMetric label="Maliyet" value={formatPrice(summary.cost)} />
            <PortfolioMetric
              label="Kar / zarar"
              tone={summary.profitLoss >= 0 ? "positive" : "danger"}
              value={`${formatSigned(summary.profitLoss)} (${summaryProfitLossPercent.toFixed(2)}%)`}
            />
            <PortfolioMetric label="Stop riski" tone="danger" value={formatPrice(summary.risk)} />
          </div>

          <div className="max-h-[430px] space-y-3 overflow-auto pr-1">
            {rows.length === 0 ? (
              <div className="rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
                Henuz portfoy pozisyonu yok.
              </div>
            ) : (
              rows.map((row) => (
                <article className="rounded-md border border-white/5 bg-white/[0.03] p-3" key={row.id}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-white">{row.symbol}</span>
                        <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-[var(--muted)]">
                          {row.quantity} adet
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {new Date(row.createdAt).toLocaleString("tr-TR")}
                      </p>
                    </div>

                    <button
                      aria-label={`${row.symbol} pozisyonunu sil`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-red-300/10 hover:text-red-100"
                      onClick={() => deletePosition(row.id)}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-5">
                    <SmallStat label="Maliyet" value={formatPrice(row.averageCost)} />
                    <SmallStat label="Fiyat" value={row.price ? formatPrice(row.price) : "..."} />
                    <SmallStat label="Deger" value={formatPrice(row.marketValue)} />
                    <SmallStat
                      label="K/Z"
                      tone={row.profitLoss >= 0 ? "positive" : "danger"}
                      value={`${formatSigned(row.profitLoss)} (${row.profitLossPercent.toFixed(2)}%)`}
                    />
                    <SmallStat label="Risk" tone="danger" value={formatPrice(row.riskValue)} />
                  </div>

                  {row.note ? (
                    <p className="mt-3 rounded-md border border-white/5 bg-black/10 p-3 text-sm leading-6 text-[var(--muted)]">
                      {row.note}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PortfolioInput({
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

function PortfolioMetric({
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

function SmallStat({
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
    <div>
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`mt-1 font-mono text-sm ${toneClass}`}>{value}</p>
    </div>
  );
}

function formatSigned(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatPrice(value)}`;
}

function formatInputPrice(value: number) {
  return Number(value.toFixed(value >= 1 ? 4 : 8)).toString();
}

function isPortfolioPosition(value: unknown): value is PortfolioPosition {
  if (!value || typeof value !== "object") {
    return false;
  }

  const position = value as Partial<PortfolioPosition>;
  return (
    typeof position.id === "string" &&
    typeof position.symbol === "string" &&
    typeof position.quantity === "number" &&
    typeof position.averageCost === "number" &&
    typeof position.stopLoss === "number"
  );
}
