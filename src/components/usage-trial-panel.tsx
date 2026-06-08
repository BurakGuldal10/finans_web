"use client";

import { CalendarCheck, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type TrialItem = {
  id: string;
  label: string;
};

const trialItems: TrialItem[] = [
  { id: "market", label: "Kripto, ABD hisse veya BIST tarafinda en az 3 sembol kontrol edildi." },
  { id: "snapshot", label: "En az 1 karar raporu analiz gecmisine kaydedildi." },
  { id: "risk", label: "Risk hesaplayici ile pozisyon boyutu kontrol edildi." },
  { id: "journal", label: "Trade gunlugune plan veya gozlem notu eklendi." },
  { id: "alert", label: "Gerekiyorsa fiyat, skor veya RSI uyarisi kuruldu." },
  { id: "review", label: "Gunun sonunda snapshot performansi ve trade notlari gozden gecirildi." },
];

const storagePrefix = "finansman-usage-trial";

export function UsageTrialPanel() {
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const storageKey = `${storagePrefix}-${todayKey}`;
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const completedCount = checkedItems.length;
  const progress = Math.round((completedCount / trialItems.length) * 100);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) {
        return;
      }

      try {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed)) {
          setCheckedItems(
            parsed.filter(
              (item): item is string =>
                typeof item === "string" && trialItems.some((trialItem) => trialItem.id === item),
            ),
          );
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(checkedItems));
  }, [checkedItems, storageKey]);

  function toggleItem(id: string) {
    setCheckedItems((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function resetToday() {
    setCheckedItems([]);
    window.localStorage.removeItem(storageKey);
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <CalendarCheck size={18} />
            Gunluk kullanim testi
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Uygulamayi gercek karar destek akisiyle denemek icin gunluk kontrol listesi.
          </p>
        </div>

        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm text-white transition hover:border-emerald-300"
          onClick={resetToday}
          type="button"
        >
          <RotateCcw size={15} />
          Bugunu sifirla
        </button>
      </div>

      <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-white">{todayKey}</p>
          <p className="font-mono text-sm text-emerald-100">{progress}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-emerald-300 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {trialItems.map((item) => {
          const checked = checkedItems.includes(item.id);

          return (
            <label
              className={`flex items-start gap-3 rounded-md border p-3 text-sm leading-6 transition ${
                checked
                  ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-50"
                  : "border-white/5 bg-white/[0.03] text-[var(--muted)]"
              }`}
              key={item.id}
            >
              <input
                checked={checked}
                className="mt-1 h-4 w-4 accent-emerald-300"
                onChange={() => toggleItem(item.id)}
                type="checkbox"
              />
              <span>{item.label}</span>
            </label>
          );
        })}
      </div>

      <p className="mt-4 rounded-md border border-yellow-300/20 bg-yellow-300/10 p-3 text-sm leading-6 text-yellow-100">
        Bu liste yatirim tavsiyesi degil; uygulamanin hangi bolumlerinin gercek kullanimda ise
        yaradigini anlamak icin gunluk deneme ritmi saglar.
      </p>
    </section>
  );
}
