"use client";

import { Activity, BookOpenCheck, ExternalLink, RefreshCcw, Scale, ShieldAlert, Target } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { LongTermHorizon, LongTermResearch } from "@/lib/long-term-analysis";
import type { MarketKind } from "@/lib/markets";

type LongTermResearchPanelProps = {
  market: MarketKind;
  symbol: string;
};

export function LongTermResearchPanel({ market, symbol }: LongTermResearchPanelProps) {
  const [horizon, setHorizon] = useState<LongTermHorizon>("5y");
  const [research, setResearch] = useState<LongTermResearch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (market === "crypto") {
      setResearch(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/long-term-analysis?market=${market}&symbol=${encodeURIComponent(symbol)}&horizon=${horizon}`,
        { cache: "no-store" },
      );
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; research?: LongTermResearch }
        | null;
      if (!response.ok || !payload?.research) {
        throw new Error(payload?.error ?? "Bilanço ve fiyat analizi alınamadı.");
      }
      setResearch(payload.research);
    } catch (currentError) {
      setResearch(null);
      setError(currentError instanceof Error ? currentError.message : "Bağlantı kurulamadı.");
    } finally {
      setLoading(false);
    }
  }, [horizon, market, symbol]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  if (market === "crypto") {
    return (
      <EmptyState text="Uzun vadeli bilanço ve fiyat projeksiyon analizi için ABD Hisse veya BIST piyasasını seçin." />
    );
  }

  const horizonOptions: Array<{ label: string; value: LongTermHorizon }> = [
    { label: "3 Ay", value: "3m" },
    { label: "6 Ay", value: "6m" },
    { label: "1 Yıl", value: "1y" },
    { label: "3 Yıl", value: "3y" },
    { label: "5 Yıl", value: "5y" },
  ];

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <BookOpenCheck size={20} />
              3 Ay – 5 Yıllık Bilanço Yorumu & Tahmini Fiyat Hareketleri
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              Çeyreklik bilanço dayanıklılığı, marj trendleri ve kârlılığı analiz eder;
              volatilite ve sektörel çarpan bazlı Boğa, Baz ve Ayı tahmini fiyat senaryoları sunar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {horizonOptions.map((item) => (
              <button
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  horizon === item.value || (horizon === 1 && item.value === "1y") || (horizon === 3 && item.value === "3y") || (horizon === 5 && item.value === "5y")
                    ? "border-emerald-300 bg-emerald-300/15 text-emerald-100 font-medium"
                    : "border-white/10 bg-white/[0.03] text-[var(--muted)] hover:text-white"
                }`}
                key={item.value}
                onClick={() => setHorizon(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
            <button
              className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5 transition"
              disabled={loading}
              onClick={() => void load()}
              type="button"
            >
              <RefreshCcw className={loading ? "animate-spin" : ""} size={15} />
              Yenile
            </button>
          </div>
        </div>
      </div>

      {loading ? <EmptyState text="Bilanço, emsal, volatilite ve senaryo hedef fiyat verileri hesaplanıyor..." /> : null}
      {!loading && error ? <EmptyState danger text={error} /> : null}
      {!loading && research ? <ResearchReport research={research} /> : null}
    </section>
  );
}

function ResearchReport({ research }: { research: LongTermResearch }) {
  const stanceLabel =
    research.stance === "accumulate_on_weakness"
      ? "Geri çekilmelerde kademeli biriktirmeyi araştır"
      : research.stance === "cautious"
        ? "Temkinli ol, teyit bekle"
        : "İzle, güvenlik marjı bekle";

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.9fr]">
        <article className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-emerald-200">
            {research.symbol} · {research.sector} · {research.horizonLabel ?? `${research.horizonYears} yıl`}
          </p>
          <div className="mt-3 flex items-end gap-3">
            <span className="font-mono text-5xl font-semibold text-white">{research.score}</span>
            <span className="pb-1 text-sm text-emerald-100">/100</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-white">{stanceLabel}</p>
          <p className="mt-2 text-sm leading-6 text-emerald-50">{research.summary}</p>
          <p className="mt-3 text-xs text-emerald-100/75">
            Veri kapsamı %{research.coveragePercent} · Güven: {confidenceLabel(research.confidence)}
          </p>
        </article>

        <article className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Puan bileşenleri
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {research.dimensions.map((dimension) => (
              <div className="rounded-md border border-white/5 bg-white/[0.03] p-3" key={dimension.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{dimension.label}</p>
                  <span className="font-mono text-sm text-emerald-200">
                    {dimension.score === null ? "N/A" : `${dimension.score}/100`}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{dimension.summary}</p>
                <p className="mt-2 text-[11px] text-white/45">Ağırlık %{dimension.weight}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <PriceProjectionsCard research={research} />

      <QuarterlyBalanceSheetCard research={research} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ValuationCard research={research} />
        <PerformanceCard research={research} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard items={research.catalysts} title="Tezi destekleyen göstergeler" tone="positive" />
        <ListCard items={research.risks} title="Riskler ve tez kırıcıları" tone="danger" />
      </div>

      <article className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-white">
          <BookOpenCheck size={18} /> Güncel gelişmeler ve resmi bildirimler
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          SEC bildirimleri resmi kaynaktır. Haber başlıkları Google News üzerinden gelir; bağlantıyı
          açıp asıl yayını doğrulamadan yatırım kararı vermeyin.
        </p>
        {research.events.length ? (
          <div className="mt-4 divide-y divide-white/5 rounded-md border border-white/5">
            {research.events.map((event) => (
              <a
                className="flex items-start justify-between gap-3 p-3 transition hover:bg-white/[0.04]"
                href={event.url}
                key={`${event.category}-${event.date}-${event.url}`}
                rel="noreferrer"
                target="_blank"
              >
                <div>
                  <p className="text-sm leading-5 text-white">{event.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {event.source} · {formatDate(event.date)} · {event.category === "filing" ? "Resmi bildirim" : "Haber"}
                  </p>
                </div>
                <ExternalLink className="mt-1 shrink-0 text-[var(--muted)]" size={15} />
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-4 text-sm text-[var(--muted)]">
            Gösterilebilen güncel gelişme yok. Bu ifade “haber yok” değil, veri akışının boş veya
            erişilemez olabileceği anlamına gelir.
          </p>
        )}
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListCard items={research.checklist} title="Dönemsel takip listesi" tone="default" />
        <ListCard items={research.dataNotes} title="Veri ve yöntem notları" tone="default" />
      </div>

      <p className="rounded-md border border-yellow-300/20 bg-yellow-300/10 p-4 text-xs leading-5 text-yellow-100">
        Bu rapor kişiye özel yatırım danışmanlığı değildir. Skor geçmiş ve güncel verileri düzenler;
        gelecek getiriyi garanti etmez. Portföy büyüklüğü, gelir ihtiyacı, likidite ve risk toleransı
        ayrıca değerlendirilmelidir.
      </p>
    </>
  );
}

function PriceProjectionsCard({ research }: { research: LongTermResearch }) {
  const proj = research.projections;
  if (!proj) return null;

  const scenarios = [proj.scenarios.bull, proj.scenarios.base, proj.scenarios.bear];

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-5 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Target className="text-emerald-300" size={18} />
            Tahmini Fiyat Hareketleri & Senaryo Projeksiyonları ({proj.horizonLabel})
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Tarihsel volatilite kanalları, kâr/gelir büyüme oranları ve sektörel çarpan duyarlılığı.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {proj.currentPrice !== null ? (
            <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-right">
              <span className="block text-[10px] text-[var(--muted)] uppercase">Son Fiyat</span>
              <span className="font-mono text-sm font-semibold text-white">
                {proj.currency}{proj.currentPrice.toFixed(2)}
              </span>
            </div>
          ) : null}
          {proj.riskRewardRatio !== null ? (
            <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-right">
              <span className="block text-[10px] text-emerald-200 uppercase">Risk/Ödül (R:R)</span>
              <span className="font-mono text-sm font-semibold text-emerald-100">
                {proj.riskRewardRatio}x
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((sc) => {
          const isBull = sc.name === "bull";
          const isBear = sc.name === "bear";
          const cardBorder = isBull
            ? "border-emerald-300/30 bg-emerald-300/5"
            : isBear
              ? "border-red-300/30 bg-red-300/5"
              : "border-white/10 bg-white/[0.02]";

          const badgeBg = isBull
            ? "bg-emerald-300/20 text-emerald-200"
            : isBear
              ? "bg-red-300/20 text-red-200"
              : "bg-white/10 text-white/80";

          const returnColor = isBull
            ? "text-emerald-300"
            : isBear
              ? "text-red-300"
              : "text-emerald-100";

          return (
            <div className={`rounded-md border ${cardBorder} p-4 space-y-3 flex flex-col justify-between`} key={sc.name}>
              <div>
                <div className="flex items-center justify-between">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${badgeBg}`}>
                    {sc.label}
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">{sc.probabilityLabel}</span>
                </div>

                <div className="mt-3">
                  <span className="text-xs text-[var(--muted)] block">Hedef Fiyat Aralığı</span>
                  <span className="font-mono text-lg font-semibold text-white">
                    {proj.currency}{sc.targetPriceLow.toFixed(2)} – {proj.currency}{sc.targetPriceHigh.toFixed(2)}
                  </span>
                </div>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xs text-[var(--muted)]">Tahmini Getiri:</span>
                  <span className={`font-mono text-sm font-semibold ${returnColor}`}>
                    {sc.expectedReturnMidPct >= 0 ? "+" : ""}{sc.expectedReturnMidPct.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    ({sc.expectedReturnLowPct >= 0 ? "+" : ""}{sc.expectedReturnLowPct.toFixed(0)}% / {sc.expectedReturnHighPct >= 0 ? "+" : ""}{sc.expectedReturnHighPct.toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-2 text-xs space-y-1 text-[var(--muted)]">
                {sc.keyDrivers.map((driver, i) => (
                  <div className="flex gap-1.5 leading-4" key={i}>
                    <span className="text-white/40">•</span>
                    <span>{driver}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] leading-4 text-[var(--muted)] italic border-t border-white/5 pt-2">
        {proj.methodologyNote}
      </p>
    </article>
  );
}

function QuarterlyBalanceSheetCard({ research }: { research: LongTermResearch }) {
  const q = research.quarterlyCommentary;
  if (!q) return null;

  const badgeColor =
    q.healthStatus === "strong"
      ? "border-emerald-300/30 bg-emerald-300/15 text-emerald-100"
      : q.healthStatus === "cautious"
        ? "border-red-300/30 bg-red-300/15 text-red-100"
        : "border-yellow-300/30 bg-yellow-300/15 text-yellow-100";

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-5 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Activity className="text-emerald-300" size={18} />
            Çeyreklik Bilanço Yorumu & Finansal Sağlık
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Gelir tablosu, bilanço dayanıklılığı, borç çevirme kabiliyeti ve serbest nakit akışları.
          </p>
        </div>
        <span className={`inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold ${badgeColor}`}>
          {q.healthTitle}
        </span>
      </div>

      <p className="text-sm leading-6 text-emerald-50 bg-white/[0.02] p-3 rounded-md border border-white/5">
        {q.healthSummary}
      </p>

      <div className="grid gap-3 sm:grid-cols-3 text-xs">
        <div className="rounded-md border border-white/5 bg-white/[0.03] p-3 space-y-1">
          <span className="font-semibold text-white block">Marj İvmesi</span>
          <p className="text-[var(--muted)] leading-5">{q.marginTrend}</p>
        </div>
        <div className="rounded-md border border-white/5 bg-white/[0.03] p-3 space-y-1">
          <span className="font-semibold text-white block">Borç & Likidite</span>
          <p className="text-[var(--muted)] leading-5">{q.debtAndLiquidity}</p>
        </div>
        <div className="rounded-md border border-white/5 bg-white/[0.03] p-3 space-y-1">
          <span className="font-semibold text-white block">Nakit Kalitesi</span>
          <p className="text-[var(--muted)] leading-5">{q.cashFlowQuality}</p>
        </div>
      </div>

      {q.quarterlyHighlights.length ? (
        <div className="flex flex-wrap gap-2 text-xs border-t border-white/5 pt-3">
          {q.quarterlyHighlights.map((hl, i) => (
            <span className="rounded bg-emerald-300/10 border border-emerald-300/20 px-2.5 py-1 text-emerald-200" key={i}>
              {hl}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function ValuationCard({ research }: { research: LongTermResearch }) {
  const raw = research.fundamentals.raw;
  const rows = [
    ["F/K", raw.peRatio, research.peers.peMedian],
    ["PD/DD", raw.priceToBook, research.peers.priceToBookMedian],
    ["FD/FAVÖK", raw.enterpriseToEbitda, research.peers.enterpriseToEbitdaMedian],
  ] as const;

  return (
    <article className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold text-white">
        <Scale size={18} /> Sektörel değerleme
      </h3>
      <div className="mt-4 overflow-hidden rounded-md border border-white/5">
        <div className="grid grid-cols-3 bg-white/[0.04] px-3 py-2 text-xs text-[var(--muted)]">
          <span>Çarpan</span><span>Şirket</span><span>Emsal medyanı</span>
        </div>
        {rows.map(([label, company, peer]) => (
          <div className="grid grid-cols-3 border-t border-white/5 px-3 py-2 text-sm" key={label}>
            <span className="text-white">{label}</span>
            <span className="font-mono text-emerald-100">{formatRatio(company)}</span>
            <span className="font-mono text-[var(--muted)]">{formatRatio(peer)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{research.peers.note}</p>
      {research.peers.symbols.length ? (
        <p className="mt-2 text-xs text-white/55">Emsaller: {research.peers.symbols.join(", ")}</p>
      ) : null}
    </article>
  );
}

function PerformanceCard({ research }: { research: LongTermResearch }) {
  const rows = [research.performance.company, research.performance.market, research.performance.sector].filter(
    (item): item is NonNullable<typeof item> => item !== null,
  );
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-5">
      <h3 className="text-base font-semibold text-white">Getiri ve fiyat riski</h3>
      <div className="mt-4 overflow-hidden rounded-md border border-white/5">
        <div className="grid grid-cols-4 bg-white/[0.04] px-3 py-2 text-xs text-[var(--muted)]">
          <span>Varlık</span><span>Toplam</span><span>Yıllık</span><span>Azami düşüş</span>
        </div>
        {rows.map((row) => (
          <div className="grid grid-cols-4 border-t border-white/5 px-3 py-2 text-sm" key={row.symbol}>
            <span className="text-white">{row.symbol}</span>
            <span className="font-mono text-emerald-100">{formatPercent(row.totalReturn)}</span>
            <span className="font-mono text-white">{formatPercent(row.annualizedReturn)}</span>
            <span className="font-mono text-red-200">{formatPercent(row.maxDrawdown)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--muted)]">
        Temettü ve bölünmeler düzeltilmiş haftalık fiyatlardan hesaplanır; vergi ve işlem maliyeti dahil değildir.
      </p>
    </article>
  );
}

function ListCard({ items, title, tone }: { items: string[]; title: string; tone: "positive" | "danger" | "default" }) {
  const border = tone === "positive" ? "border-emerald-300/20" : tone === "danger" ? "border-red-300/20" : "border-[var(--border)]";
  const Icon = tone === "danger" ? ShieldAlert : BookOpenCheck;
  return (
    <article className={`rounded-lg border ${border} bg-[rgba(13,26,23,0.82)] p-5`}>
      <h3 className="flex items-center gap-2 text-base font-semibold text-white"><Icon size={18} /> {title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted)]">
        {items.map((item) => <li className="flex gap-2" key={item}><span>•</span><span>{item}</span></li>)}
      </ul>
    </article>
  );
}

function EmptyState({ danger = false, text }: { danger?: boolean; text: string }) {
  return <div className={`rounded-lg border p-5 text-sm ${danger ? "border-red-300/20 bg-red-300/10 text-red-100" : "border-[var(--border)] bg-[rgba(13,26,23,0.82)] text-[var(--muted)]"}`}>{text}</div>;
}

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatRatio(value: number | null) {
  return value === null ? "N/A" : value.toFixed(2);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Tarih yok" : new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
}

function confidenceLabel(value: LongTermResearch["confidence"]) {
  return value === "high" ? "yüksek" : value === "medium" ? "orta" : "düşük";
}
