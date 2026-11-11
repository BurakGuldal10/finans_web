"use client";

import { Newspaper, PlusCircle, RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type {
  BriefingBullet,
  BriefingTarget,
  BriefingTargetKind,
  DailyBriefing,
} from "@/lib/daily-briefing";

type DraftTarget = {
  name: string;
  symbol: string;
  kind: BriefingTargetKind;
  speculative: boolean;
};

const storageKey = "finansman-daily-briefing-targets";
const defaultTargets: BriefingTarget[] = [
  { symbol: "NVDA", name: "Nvidia", kind: "stock" },
  { symbol: "AMD", name: "AMD", kind: "stock" },
  { symbol: "MSFT", name: "Microsoft", kind: "stock" },
  { symbol: "GOOGL", name: "Alphabet", kind: "stock" },
  { symbol: "AMZN", name: "Amazon", kind: "stock" },
  { symbol: "GC=F", name: "Altin", kind: "commodity" },
  { symbol: "SI=F", name: "Gumus", kind: "commodity" },
];
const defaultDraft: DraftTarget = {
  name: "",
  symbol: "",
  kind: "stock",
  speculative: false,
};
const kindOptions: Array<{ label: string; value: BriefingTargetKind }> = [
  { label: "Sirket", value: "stock" },
  { label: "Kiymetli maden", value: "commodity" },
  { label: "Kripto", value: "crypto" },
  { label: "Endeks", value: "index" },
];

export function DailyBriefingPanel() {
  const [targets, setTargets] = useState<BriefingTarget[]>(defaultTargets);
  const [draft, setDraft] = useState<DraftTarget>(defaultDraft);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loading, setLoading] = useState(false);
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
          const savedTargets = parsed.filter(isBriefingTarget);
          if (savedTargets.length > 0) {
            setTargets(savedTargets);
          }
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(targets));
  }, [targets]);

  async function generateBriefing() {
    setLoading(true);
    setMessage("Son 24 saatlik haber ve fiyat performansi taraniyor...");

    try {
      const response = await fetch("/api/daily-briefing", {
        body: JSON.stringify({ targets }),
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Briefing request failed");
      }

      const payload = (await response.json()) as { briefing?: DailyBriefing };
      setBriefing(payload.briefing ?? null);
      setMessage("Gunluk bulten olusturuldu.");
    } catch {
      setMessage("Bulten olusturulamadi. Internet, haber kaynagi veya API erisimi kontrol edilmeli.");
    } finally {
      setLoading(false);
    }
  }

  function addTarget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const symbol = draft.symbol.trim().toUpperCase();
    const name = draft.name.trim() || symbol;

    if (!symbol) {
      setMessage("Sembol girin. Ornek: NVDA, MSFT, GC=F, SI=F");
      return;
    }

    if (targets.some((target) => target.symbol === symbol)) {
      setMessage(`${symbol} zaten takip listesinde.`);
      return;
    }

    setTargets((current) => [
      ...current,
      {
        symbol,
        name,
        kind: draft.kind,
        speculative: draft.speculative,
      },
    ]);
    setDraft(defaultDraft);
    setMessage(`${symbol} takip listesine eklendi.`);
  }

  function removeTarget(symbol: string) {
    setTargets((current) => current.filter((target) => target.symbol !== symbol));
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Newspaper size={18} />
            Gunluk bulten
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            AI, veri merkezi, enerji, cip, sogutma, bulut yatirimlari, sirketler ve kiymetli
            madenler icin son 24 saatlik akis ve 1 ay / 1 yil performans yorumunu uretir.
          </p>
        </div>

        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-300 px-3 text-sm font-semibold text-black transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          onClick={generateBriefing}
          type="button"
        >
          <RefreshCcw size={16} />
          {loading ? "Hazirlaniyor" : "Gunluk bulten olustur"}
        </button>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <form className="space-y-3 rounded-md border border-white/5 bg-white/[0.03] p-3" onSubmit={addTarget}>
            <div className="grid grid-cols-2 gap-2">
              <BriefingInput
                label="Sembol"
                onChange={(value) => setDraft((current) => ({ ...current, symbol: value }))}
                placeholder="NVDA"
                value={draft.symbol}
              />
              <BriefingInput
                label="Ad"
                onChange={(value) => setDraft((current) => ({ ...current, name: value }))}
                placeholder="Nvidia"
                value={draft.name}
              />
            </div>

            <label className="block space-y-1 text-xs text-[var(--muted)]">
              Kategori
              <select
                className="h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 text-sm text-white outline-none"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    kind: event.target.value as BriefingTargetKind,
                  }))
                }
                value={draft.kind}
              >
                {kindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center justify-between gap-3 rounded-md border border-white/5 bg-black/10 px-3 py-2 text-sm text-white">
              <span>Spekulatif rozetle</span>
              <input
                checked={draft.speculative}
                className="h-5 w-5 accent-emerald-300"
                onChange={(event) =>
                  setDraft((current) => ({ ...current, speculative: event.target.checked }))
                }
                type="checkbox"
              />
            </label>

            <button
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white/[0.04] px-3 text-sm font-medium text-white transition hover:border-emerald-300 hover:bg-emerald-300/10"
              type="submit"
            >
              <PlusCircle size={16} />
              Takibe ekle
            </button>
          </form>

          <div className="space-y-2 rounded-md border border-white/5 bg-white/[0.03] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">Takip listesi</p>
            <div className="max-h-[330px] space-y-2 overflow-auto pr-1">
              {targets.map((target) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-md border border-white/5 bg-black/10 px-3 py-2"
                  key={target.symbol}
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-white">{target.symbol}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {target.name} · {target.speculative ? "Spekulatif" : getKindLabel(target.kind)}
                    </p>
                  </div>
                  <button
                    aria-label={`${target.symbol} kaldir`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-red-300/10 hover:text-red-100"
                    onClick={() => removeTarget(target.symbol)}
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {message ? (
            <p className="rounded-md border border-white/5 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
              {message}
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          {briefing ? (
            <>
              <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
                  Rapor zamani
                </p>
                <p className="mt-2 text-sm text-white">
                  {new Date(briefing.generatedAt).toLocaleString("tr-TR")} · Son{" "}
                  {briefing.lookbackHours} saat
                </p>
              </div>

              {briefing.sections.map((section) => (
                <article className="rounded-lg border border-white/5 bg-white/[0.03] p-4" key={section.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-base font-semibold text-white">{section.title}</h4>
                    <span className="rounded-md border border-white/10 bg-black/10 px-2.5 py-1 text-xs text-[var(--muted)]">
                      {section.badge}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {section.bullets.map((bullet, index) => (
                      <BulletCard bullet={bullet} key={`${section.id}-${index}`} />
                    ))}
                  </div>
                </article>
              ))}

              <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50">
                <p className="font-semibold">Genel degerlendirme</p>
                <p className="mt-2">{briefing.generalAssessment}</p>
              </div>
            </>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] p-5 text-center text-sm leading-6 text-[var(--muted)]">
              Sirketleri ve kiymetli madenleri secip gunluk bulteni olusturun.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BulletCard({ bullet }: { bullet: BriefingBullet }) {
  return (
    <div className={`rounded-md border p-3 ${getBulletToneClass(bullet.badge)}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-white/10 bg-black/10 px-2 py-0.5 text-xs font-medium text-white">
          {getBadgeLabel(bullet.badge)}
        </span>
        {bullet.performance ? (
          <span className="text-xs text-white/75">
            1A {formatPercent(bullet.performance.oneMonthPercent)} · 1Y{" "}
            {formatPercent(bullet.performance.oneYearPercent)}
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <BriefingPart label="Gelisme" value={bullet.summary} />
        <BriefingPart label="Neden onemli" value={bullet.importance} />
        <BriefingPart label="Yatirim anlami" value={bullet.investmentView} />
      </div>

      {bullet.news?.url ? (
        <a
          className="mt-3 inline-flex text-xs font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
          href={bullet.news.url}
          rel="noreferrer"
          target="_blank"
        >
          Kaynagi ac
        </a>
      ) : null}
    </div>
  );
}

function BriefingPart({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.12em] text-white/55">{label}</p>
      <p className="mt-2 text-sm leading-6 text-white/90">{value}</p>
    </div>
  );
}

function BriefingInput({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="space-y-1 text-xs text-[var(--muted)]">
      {label}
      <input
        className="h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 text-sm text-white outline-none"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function isBriefingTarget(value: unknown): value is BriefingTarget {
  if (!value || typeof value !== "object") {
    return false;
  }

  const target = value as Partial<BriefingTarget>;
  return (
    typeof target.symbol === "string" &&
    typeof target.name === "string" &&
    (target.kind === "stock" ||
      target.kind === "commodity" ||
      target.kind === "crypto" ||
      target.kind === "index")
  );
}

function getKindLabel(kind: BriefingTargetKind) {
  if (kind === "commodity") return "Kiymetli maden";
  if (kind === "crypto") return "Kripto";
  if (kind === "index") return "Endeks";
  return "Sirket";
}

function getBadgeLabel(badge: BriefingBullet["badge"]) {
  if (badge === "positive") return "Olumlu";
  if (badge === "negative") return "Riskli";
  if (badge === "speculative") return "Spekulatif";
  if (badge === "no-news") return "Onemli haber yok";
  return "Notr";
}

function getBulletToneClass(badge: BriefingBullet["badge"]) {
  if (badge === "positive") {
    return "border-emerald-300/20 bg-emerald-300/10";
  }

  if (badge === "negative") {
    return "border-red-300/20 bg-red-300/10";
  }

  if (badge === "speculative") {
    return "border-yellow-300/25 bg-yellow-300/10";
  }

  if (badge === "no-news") {
    return "border-white/5 bg-black/10";
  }

  return "border-sky-300/20 bg-sky-300/10";
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}
