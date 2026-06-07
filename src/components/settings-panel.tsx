"use client";

import { RefreshCcw, Settings, ShieldCheck } from "lucide-react";

export type AppSettings = {
  autoRefresh: boolean;
  browserNotifications: boolean;
  refreshIntervalSeconds: number;
  riskPercent: string;
};

type SettingsPanelProps = {
  onChange: (settings: AppSettings) => void;
  settings: AppSettings;
};

const refreshOptions = [15, 30, 60, 120];

export function SettingsPanel({ onChange, settings }: SettingsPanelProps) {
  function updateSettings(next: Partial<AppSettings>) {
    onChange({ ...settings, ...next });
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold text-white">
          <Settings size={18} />
          Ayarlar
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Veri yenileme davranisi ve varsayilan risk yuzdesini yonetir.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-4">
        <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            <RefreshCcw size={14} />
            Otomatik yenileme
          </p>
          <label className="mt-3 flex items-center justify-between gap-3 rounded-md border border-white/5 bg-black/10 px-3 py-2 text-sm text-white">
            <span>{settings.autoRefresh ? "Acik" : "Kapali"}</span>
            <input
              checked={settings.autoRefresh}
              className="h-5 w-5 accent-emerald-300"
              onChange={(event) => updateSettings({ autoRefresh: event.target.checked })}
              type="checkbox"
            />
          </label>
        </div>

        <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Tarayici bildirimi
          </p>
          <label className="mt-3 flex items-center justify-between gap-3 rounded-md border border-white/5 bg-black/10 px-3 py-2 text-sm text-white">
            <span>{settings.browserNotifications ? "Acik" : "Kapali"}</span>
            <input
              checked={settings.browserNotifications}
              className="h-5 w-5 accent-emerald-300"
              onChange={(event) => updateSettings({ browserNotifications: event.target.checked })}
              type="checkbox"
            />
          </label>
        </div>

        <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            Yenileme araligi
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {refreshOptions.map((seconds) => {
              const active = settings.refreshIntervalSeconds === seconds;

              return (
                <button
                  className={`h-10 rounded-md border text-sm font-medium transition ${
                    active
                      ? "border-emerald-300 bg-emerald-300/10 text-emerald-100"
                      : "border-[var(--border)] bg-white/[0.03] text-[var(--muted)] hover:border-emerald-300 hover:text-white"
                  }`}
                  key={seconds}
                  onClick={() => updateSettings({ refreshIntervalSeconds: seconds })}
                  type="button"
                >
                  {seconds}s
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
            <ShieldCheck size={14} />
            Varsayilan risk
          </p>
          <label className="mt-3 block space-y-1 text-xs text-[var(--muted)]">
            Risk %
            <input
              className="h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 font-mono text-sm text-white outline-none"
              inputMode="decimal"
              min="0"
              onChange={(event) => updateSettings({ riskPercent: event.target.value })}
              placeholder="1"
              type="number"
              value={settings.riskPercent}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
