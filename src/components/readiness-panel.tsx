"use client";

import { CheckCircle2, ClipboardCheck, RefreshCcw, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ReadinessReport, ReadinessStatus } from "@/lib/readiness";

type ReadinessResponse = {
  report: ReadinessReport;
};

export function ReadinessPanel() {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    try {
      const response = await fetch("/api/readiness", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Readiness request failed");
      }

      const payload = (await response.json()) as ReadinessResponse;
      setReport(payload.report);
      setError(null);
    } catch {
      setError("MVP hazirlik raporu okunamadi.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadReport();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadReport]);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <ClipboardCheck size={18} />
            MVP hazirlik durumu
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Uygulamanin kisisel kullanim icin hangi parcalarinin hazir oldugunu ozetler.
          </p>
        </div>

        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm text-white transition hover:border-emerald-300"
          onClick={() => void loadReport()}
          type="button"
        >
          <RefreshCcw size={15} />
          Yenile
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {report ? (
        <div className="mt-4 space-y-4">
          <div className={`rounded-md border p-4 ${getStatusSurface(report.status)}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{getStatusLabel(report.status)}</p>
                <p className="mt-1 text-sm leading-6">{report.summary}</p>
              </div>
              <p className="font-mono text-3xl font-semibold text-white">{report.score}%</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {report.items.map((item) => (
              <ReadinessItemCard
                detail={item.detail}
                key={item.id}
                label={item.label}
                status={item.status}
              />
            ))}
          </div>

          <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
            <h4 className="text-sm font-semibold text-white">Siradaki kontroller</h4>
            <div className="mt-3 grid gap-2">
              {report.nextSteps.length ? (
                report.nextSteps.map((step) => (
                  <p
                    className="rounded-md border border-white/5 bg-black/15 p-2 text-sm leading-6 text-[var(--muted)]"
                    key={step}
                  >
                    {step}
                  </p>
                ))
              ) : (
                <p className="text-sm text-[var(--muted)]">
                  Kod tarafinda acik hazirlik maddesi yok; gercek kullanim denemesine devam et.
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-[var(--muted)]">
            Son kontrol: {new Date(report.generatedAt).toLocaleString("tr-TR")}.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
          MVP hazirlik raporu yukleniyor.
        </div>
      )}
    </section>
  );
}

function ReadinessItemCard({
  detail,
  label,
  status,
}: {
  detail: string;
  label: string;
  status: ReadinessStatus;
}) {
  const ready = status === "ready";

  return (
    <div className={`rounded-md border p-3 ${getStatusSurface(status)}`}>
      <div className="flex items-start gap-2">
        {ready ? (
          <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-200" size={16} />
        ) : (
          <TriangleAlert className="mt-0.5 shrink-0 text-yellow-200" size={16} />
        )}
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-sm leading-6">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status: ReadinessStatus) {
  if (status === "ready") {
    return "Kisisel MVP kullanimi icin hazir";
  }

  if (status === "attention") {
    return "Kullanilabilir, ama dikkat isteyen maddeler var";
  }

  return "Deneme verisi bekleniyor";
}

function getStatusSurface(status: ReadinessStatus) {
  if (status === "ready") {
    return "border-emerald-300/20 bg-emerald-300/10 text-emerald-50";
  }

  if (status === "attention") {
    return "border-yellow-300/20 bg-yellow-300/10 text-yellow-50";
  }

  return "border-white/5 bg-white/[0.03] text-[var(--muted)]";
}
