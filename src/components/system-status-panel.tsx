"use client";

import { Database, KeyRound, Server } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { LocalLogoutButton } from "@/components/local-logout-button";

type HealthResponse = {
  checkedAt: string;
  data: {
    alerts: number;
    portfolio: number;
    snapshots: number;
    trades: number;
    triggeredAlerts: number;
  };
  environment: {
    fmpApiKey: boolean;
    localAuth: boolean;
    nodeEnv: string;
    openAiApiKey: boolean;
    openAiModel: string;
  };
  resilience: {
    staleCacheFallback: boolean;
  };
  sources: {
    bist: string;
    crypto: string;
    stocks: string;
    stockFundamentals: string;
  };
};

export function SystemStatusPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadHealth() {
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Health request failed");
      }

      setHealth((await response.json()) as HealthResponse);
      setError(null);
    } catch {
      setError("Sistem durumu okunamadi.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHealth();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <Server size={18} />
            Sistem durumu
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Yerel veri, kaynak ve ortam durumunu ozetler.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border)] px-3 text-sm text-white transition hover:border-emerald-300"
            onClick={() => void loadHealth()}
            type="button"
          >
            Kontrol et
          </button>
          {health?.environment.localAuth ? <LocalLogoutButton /> : null}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {health ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <div className="grid gap-3 md:grid-cols-5">
            <StatusMetric label="Portfoy" value={health.data.portfolio.toString()} />
            <StatusMetric label="Trade" value={health.data.trades.toString()} />
            <StatusMetric label="Uyari" value={health.data.alerts.toString()} />
            <StatusMetric label="Rapor" value={health.data.snapshots.toString()} />
            <StatusMetric label="Tetiklenen" value={health.data.triggeredAlerts.toString()} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <SourceCard
              icon={<Database size={15} />}
              label="Veri kaynaklari"
              text={`Kripto: ${health.sources.crypto}, Hisse: ${health.sources.stocks}, BIST: ${health.sources.bist}`}
            />
            <SourceCard
              icon={<KeyRound size={15} />}
              label="Temel analiz"
              text={
                health.environment.fmpApiKey
                  ? "FMP anahtari aktif"
                  : "FMP anahtari yok. ABD bilanco verisi icin FMP_API_KEY ekleyin."
              }
              tone={health.environment.fmpApiKey ? "positive" : "warning"}
            />
            <SourceCard
              icon={<KeyRound size={15} />}
              label="AI yorum"
              text={
                health.environment.openAiApiKey
                  ? `OpenAI aktif (${health.environment.openAiModel})`
                  : "OPENAI_API_KEY yok. AI yorum paneli manuel veriyle calisir ama yorum uretemez."
              }
              tone={health.environment.openAiApiKey ? "positive" : "warning"}
            />
            <SourceCard
              icon={<Database size={15} />}
              label="Veri dayanıkliligi"
              text={
                health.resilience.staleCacheFallback
                  ? "Canli kaynak hata verirse son basarili veri eski veri uyarisi ile gosterilir."
                  : "Eski veri yedegi kapali; kaynak hatasinda ekran bos kalabilir."
              }
              tone={health.resilience.staleCacheFallback ? "positive" : "warning"}
            />
          </div>

          <p className="text-xs text-[var(--muted)] lg:col-span-2">
            Son kontrol: {new Date(health.checkedAt).toLocaleString("tr-TR")} - Ortam:{" "}
            {health.environment.nodeEnv} - Eski veri yedegi:{" "}
            {health.resilience.staleCacheFallback ? "aktif" : "kapali"} - Lokal kilit:{" "}
            {health.environment.localAuth ? "aktif" : "kapali"}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-white/5 bg-white/[0.03] p-5 text-sm text-[var(--muted)]">
          Sistem durumu yukleniyor.
        </div>
      )}
    </section>
  );
}

function StatusMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function SourceCard({
  icon,
  label,
  text,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  text: string;
  tone?: "default" | "positive" | "warning";
}) {
  const toneClass =
    tone === "positive" ? "text-emerald-100" : tone === "warning" ? "text-yellow-100" : "text-white";

  return (
    <div className="rounded-md border border-white/5 bg-white/[0.03] p-3">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">
        {icon}
        {label}
      </p>
      <p className={`mt-2 text-sm leading-5 ${toneClass}`}>{text}</p>
    </div>
  );
}
