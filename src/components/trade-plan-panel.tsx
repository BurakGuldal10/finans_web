"use client";

import { ClipboardCheck, Flag, ShieldAlert, Target } from "lucide-react";
import type { ReactNode } from "react";
import type { TradePlan } from "@/lib/analysis";

type TradePlanPanelProps = {
  plan?: TradePlan;
};

export function TradePlanPanel({ plan }: TradePlanPanelProps) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <ClipboardCheck size={18} />
            Trade plani
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Teknik skor, seviye ve zaman dilimi teyidinden islem senaryosu uretir.
          </p>
        </div>
        {plan ? (
          <span className={`rounded-md border px-3 py-1 text-sm font-medium ${stanceClass(plan.stance)}`}>
            {stanceLabel(plan.stance)}
          </span>
        ) : null}
      </div>

      {plan ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4">
            <p className="font-semibold text-white">{plan.title}</p>
            <p className="mt-2 text-sm leading-6 text-emerald-50">{plan.summary}</p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <PlanCard icon={<Flag size={17} />} label="Giris tetigi" text={plan.entryTrigger} />
            <PlanCard icon={<ShieldAlert size={17} />} label="Stop plani" text={plan.stopPlan} />
            <PlanCard icon={<Target size={17} />} label="Hedefler" text={plan.targetPlan} />
          </div>

          <div className="rounded-md border border-yellow-300/20 bg-yellow-300/10 p-3 text-sm leading-6 text-yellow-100">
            {plan.riskNote}
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {plan.managementRules.map((rule) => (
              <p
                className="rounded-md border border-white/5 bg-white/[0.03] p-3 text-sm leading-6 text-[var(--muted)]"
                key={rule}
              >
                {rule}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
          Trade plani bekleniyor.
        </div>
      )}
    </section>
  );
}

function PlanCard({
  icon,
  label,
  text,
}: {
  icon: ReactNode;
  label: string;
  text: string;
}) {
  return (
    <article className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-white">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
    </article>
  );
}

function stanceClass(stance: TradePlan["stance"]) {
  if (stance === "watch") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }

  if (stance === "avoid") {
    return "border-red-300/30 bg-red-300/10 text-red-100";
  }

  return "border-yellow-300/30 bg-yellow-300/10 text-yellow-100";
}

function stanceLabel(stance: TradePlan["stance"]) {
  if (stance === "watch") {
    return "Takip";
  }

  if (stance === "avoid") {
    return "Kacin";
  }

  return "Bekle";
}
