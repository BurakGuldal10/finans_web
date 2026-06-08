"use client";

import { CheckCircle2, FileText, XCircle } from "lucide-react";
import type { DecisionReport } from "@/lib/analysis";

type DecisionReportPanelProps = {
  report?: DecisionReport;
};

export function DecisionReportPanel({ report }: DecisionReportPanelProps) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <FileText size={18} />
            Karar raporu
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Teknik analiz, zaman teyidi ve trade planini tek raporda ozetler.
          </p>
        </div>
        {report ? (
          <span className={`rounded-md border px-3 py-1 font-mono text-sm ${biasClass(report.bias)}`}>
            {report.confidence}/100
          </span>
        ) : null}
      </div>

      {report ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-md border border-white/5 bg-white/[0.03] p-4">
            <p className="font-semibold text-white">{report.headline}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{report.overview}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {report.checklist.map((item) => (
              <article className="rounded-md border border-white/5 bg-white/[0.03] p-3" key={item.label}>
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  {item.passed ? (
                    <CheckCircle2 className="text-emerald-200" size={16} />
                  ) : (
                    <XCircle className="text-yellow-100" size={16} />
                  )}
                  {item.label}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{item.text}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {report.nextSteps.map((step) => (
              <p
                className="rounded-md border border-emerald-300/10 bg-emerald-300/10 p-3 text-sm leading-6 text-emerald-50"
                key={step}
              >
                {step}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
          Rapor verisi bekleniyor.
        </div>
      )}
    </section>
  );
}

function biasClass(bias: DecisionReport["bias"]) {
  if (bias === "positive") {
    return "border-emerald-300/30 text-emerald-100";
  }

  if (bias === "negative") {
    return "border-red-300/30 text-red-100";
  }

  return "border-yellow-300/30 text-yellow-100";
}
