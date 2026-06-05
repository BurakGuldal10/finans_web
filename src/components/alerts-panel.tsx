"use client";

import { Bell, BellRing, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatPrice, type AnalysisResult } from "@/lib/analysis";
import type { MarketKind } from "@/lib/markets";

type AlertMetric = "price" | "score" | "rsi";
type AlertDirection = "above" | "below";

type AlertRule = {
  id: string;
  market: MarketKind;
  symbol: string;
  metric: AlertMetric;
  direction: AlertDirection;
  threshold: number;
  note: string;
  createdAt: string;
  triggeredAt?: string;
};

type AlertsPanelProps = {
  analysis?: AnalysisResult;
  market: MarketKind;
  price?: number;
  symbol: string;
};

type DraftAlert = {
  direction: AlertDirection;
  metric: AlertMetric;
  note: string;
  threshold: string;
};

const storageKey = "finansman-alerts";

const defaultDraft: DraftAlert = {
  direction: "below",
  metric: "price",
  note: "",
  threshold: "",
};

const metricLabels: Record<AlertMetric, string> = {
  price: "Fiyat",
  score: "Teknik skor",
  rsi: "RSI",
};

const directionLabels: Record<AlertDirection, string> = {
  above: "Uzerine cikarsa",
  below: "Altina inerse",
};

export function AlertsPanel({ analysis, market, price, symbol }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [draft, setDraft] = useState<DraftAlert>(defaultDraft);
  const [message, setMessage] = useState<string | null>(null);

  async function loadAlerts() {
    try {
      const response = await fetch("/api/alerts");
      if (!response.ok) {
        throw new Error("Alerts load failed");
      }

      const data = (await response.json()) as { alerts?: unknown };
      const savedAlerts = Array.isArray(data.alerts) ? data.alerts.filter(isAlertRule) : [];
      const migrated = await migrateLegacyAlerts(savedAlerts);
      setAlerts([...migrated, ...savedAlerts]);
    } catch {
      setMessage("Uyarilar okunamadi. API veya veritabani kontrol edilmeli.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAlerts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const triggeredUpdates = alerts.flatMap((alert) => {
        if (alert.triggeredAt || alert.market !== market || alert.symbol !== symbol) {
          return [];
        }

        const currentValue = readMetric(alert.metric, price, analysis);
        if (currentValue === null) {
          return [];
        }

        const triggered =
          alert.direction === "above"
            ? currentValue >= alert.threshold
            : currentValue <= alert.threshold;

        return triggered ? [{ id: alert.id, triggeredAt: new Date().toISOString() }] : [];
      });

      if (triggeredUpdates.length === 0) {
        return;
      }

      const triggeredAtById = new Map(
        triggeredUpdates.map((update) => [update.id, update.triggeredAt]),
      );
      setAlerts((current) =>
        current.map((alert) => {
          const triggeredAt = triggeredAtById.get(alert.id);
          return triggeredAt ? { ...alert, triggeredAt } : alert;
        }),
      );

      for (const update of triggeredUpdates) {
        void updateAlertTriggeredAt(update.id, update.triggeredAt);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [alerts, analysis, market, price, symbol]);

  const relevantAlerts = useMemo(
    () => alerts.filter((alert) => alert.market === market && alert.symbol === symbol),
    [alerts, market, symbol],
  );
  const triggeredAlerts = relevantAlerts.filter((alert) => alert.triggeredAt);

  function fillFromCurrent() {
    const currentValue = readMetric(draft.metric, price, analysis);
    if (currentValue === null) {
      setMessage("Bu metrik icin veri henuz yuklenmedi.");
      return;
    }

    setDraft((current) => ({
      ...current,
      threshold: formatInputNumber(currentValue),
    }));
    setMessage(`${metricLabels[draft.metric]} esigi guncel degerle dolduruldu.`);
  }

  async function addAlert(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const threshold = Number(draft.threshold);

    if (!Number.isFinite(threshold)) {
      setMessage("Esik degeri sayisal olmali.");
      return;
    }

    const alert: AlertRule = {
      id: crypto.randomUUID(),
      market,
      symbol,
      metric: draft.metric,
      direction: draft.direction,
      threshold,
      note: draft.note.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const saved = await saveAlert(alert);
      setAlerts((current) => [saved, ...current]);
      setDraft(defaultDraft);
      setMessage(`${symbol} uyarisi eklendi.`);
    } catch {
      setMessage("Uyari kaydedilemedi. API veya veritabani kontrol edilmeli.");
    }
  }

  async function deleteAlert(id: string) {
    try {
      const response = await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Alert delete failed");
      }
      setAlerts((current) => current.filter((alert) => alert.id !== id));
    } catch {
      setMessage("Uyari silinemedi. API veya veritabani kontrol edilmeli.");
    }
  }

  async function resetAlert(id: string) {
    try {
      await updateAlertTriggeredAt(id, null);
      setAlerts((current) =>
        current.map((alert) =>
          alert.id === id ? { ...alert, triggeredAt: undefined } : alert,
        ),
      );
    } catch {
      setMessage("Uyari sifirlanamadi. API veya veritabani kontrol edilmeli.");
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Bell size={18} />
            Uyari listesi
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Fiyat, teknik skor ve RSI kosullarini yerel olarak izler.
          </p>
        </div>

        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white/[0.04] px-3 text-sm font-medium text-white transition hover:border-emerald-300 hover:bg-emerald-300/10"
          onClick={fillFromCurrent}
          type="button"
        >
          <PlusCircle size={16} />
          Guncel deger
        </button>
      </div>

      {triggeredAlerts.length > 0 ? (
        <div className="mt-4 space-y-2">
          {triggeredAlerts.map((alert) => (
            <div
              className="flex gap-3 rounded-md border border-yellow-300/20 bg-yellow-300/10 p-3 text-sm leading-6 text-yellow-100"
              key={alert.id}
            >
              <BellRing className="mt-1 shrink-0" size={16} />
              <span>{describeAlert(alert)} tetiklendi.</span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[340px_1fr]">
        <form className="space-y-3 rounded-md border border-white/5 bg-white/[0.03] p-3" onSubmit={addAlert}>
          <div className="rounded-md border border-white/5 bg-black/10 px-3 py-2">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Sembol</p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">{symbol}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="space-y-1 text-xs text-[var(--muted)]">
              Metrik
              <select
                className="h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 text-sm text-white outline-none"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, metric: event.target.value as AlertMetric }))
                }
                value={draft.metric}
              >
                {Object.entries(metricLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-xs text-[var(--muted)]">
              Kosul
              <select
                className="h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 text-sm text-white outline-none"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    direction: event.target.value as AlertDirection,
                  }))
                }
                value={draft.direction}
              >
                {Object.entries(directionLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-xs text-[var(--muted)]">
            Esik
            <input
              className="h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 font-mono text-sm text-white outline-none"
              inputMode="decimal"
              onChange={(event) =>
                setDraft((current) => ({ ...current, threshold: event.target.value }))
              }
              placeholder="0.00"
              type="number"
              value={draft.threshold}
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
            <Bell size={16} />
            Uyari ekle
          </button>
        </form>

        <div className="max-h-[390px] space-y-3 overflow-auto pr-1">
          {relevantAlerts.length === 0 ? (
            <div className="rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
              Bu sembol icin henuz uyari yok.
            </div>
          ) : (
            relevantAlerts.map((alert) => (
              <article
                className={`rounded-md border p-3 ${
                  alert.triggeredAt
                    ? "border-yellow-300/20 bg-yellow-300/10"
                    : "border-white/5 bg-white/[0.03]"
                }`}
                key={alert.id}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-white">{describeAlert(alert)}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {new Date(alert.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.triggeredAt ? (
                      <button
                        className="h-9 rounded-md border border-[var(--border)] px-3 text-xs text-white transition hover:border-emerald-300"
                        onClick={() => resetAlert(alert.id)}
                        type="button"
                      >
                        Sifirla
                      </button>
                    ) : null}
                    <button
                      aria-label={`${alert.symbol} uyarisini sil`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-red-300/10 hover:text-red-100"
                      onClick={() => deleteAlert(alert.id)}
                      type="button"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {alert.note ? (
                  <p className="mt-3 rounded-md border border-white/5 bg-black/10 p-3 text-sm leading-6 text-[var(--muted)]">
                    {alert.note}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function readMetric(metric: AlertMetric, price?: number, analysis?: AnalysisResult) {
  if (metric === "price") {
    return price ?? analysis?.price ?? null;
  }

  if (metric === "score") {
    return analysis?.score ?? null;
  }

  return analysis?.indicators.rsi14 ?? null;
}

function describeAlert(alert: AlertRule) {
  const direction = alert.direction === "above" ? ">" : "<";
  return `${alert.symbol} ${metricLabels[alert.metric]} ${direction} ${formatAlertValue(
    alert.metric,
    alert.threshold,
  )}`;
}

function formatAlertValue(metric: AlertMetric, value: number) {
  if (metric === "price") {
    return formatPrice(value);
  }

  return value.toFixed(2);
}

function formatInputNumber(value: number) {
  return Number(value.toFixed(value >= 1 ? 4 : 8)).toString();
}

function isAlertRule(value: unknown): value is AlertRule {
  if (!value || typeof value !== "object") {
    return false;
  }

  const alert = value as Partial<AlertRule>;
  return (
    typeof alert.id === "string" &&
    (alert.market === "crypto" || alert.market === "stocks") &&
    typeof alert.symbol === "string" &&
    (alert.metric === "price" || alert.metric === "score" || alert.metric === "rsi") &&
    (alert.direction === "above" || alert.direction === "below") &&
    typeof alert.threshold === "number"
  );
}

async function migrateLegacyAlerts(existing: AlertRule[]) {
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved) as unknown;
    const existingIds = new Set(existing.map((alert) => alert.id));
    const legacy = Array.isArray(parsed)
      ? parsed.filter(isAlertRule).filter((alert) => !existingIds.has(alert.id))
      : [];
    const migrated: AlertRule[] = [];

    for (const alert of legacy) {
      migrated.push(await saveAlert(alert));
    }

    window.localStorage.removeItem(storageKey);
    return migrated;
  } catch {
    window.localStorage.removeItem(storageKey);
    return [];
  }
}

async function saveAlert(alert: AlertRule) {
  const response = await fetch("/api/alerts", {
    body: JSON.stringify(alert),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Alert save failed");
  }

  const data = (await response.json()) as { alert?: unknown };
  if (!isAlertRule(data.alert)) {
    throw new Error("Invalid alert response");
  }

  return data.alert;
}

async function updateAlertTriggeredAt(id: string, triggeredAt: string | null) {
  const response = await fetch("/api/alerts", {
    body: JSON.stringify({ id, triggeredAt }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  if (!response.ok) {
    throw new Error("Alert update failed");
  }
}
