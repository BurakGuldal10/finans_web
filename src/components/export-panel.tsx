"use client";

import { useRef, useState } from "react";
import { Download, FileJson, Sheet, Upload } from "lucide-react";

type ExportItem = {
  description: string;
  label: string;
  type: "alerts" | "portfolio" | "snapshots" | "trades";
};

type ImportState = Partial<Record<ExportItem["type"], string>>;

const exportItems: ExportItem[] = [
  {
    description: "Trade gunlugu kayitlari, durumlar ve strateji notlari.",
    label: "Trade gunlugu",
    type: "trades",
  },
  {
    description: "Pozisyon miktari, maliyet, stop ve portfoy notlari.",
    label: "Portfoy",
    type: "portfolio",
  },
  {
    description: "Fiyat, RSI ve skor uyari kurallari.",
    label: "Uyarilar",
    type: "alerts",
  },
  {
    description: "Kaydedilen karar raporlari, trade planlari ve analiz snapshot'lari.",
    label: "Analiz gecmisi",
    type: "snapshots",
  },
];

export function ExportPanel() {
  const [importState, setImportState] = useState<ImportState>({});
  const [importingType, setImportingType] = useState<ExportItem["type"] | null>(null);

  async function importJson(type: ExportItem["type"], file: File | null) {
    if (!file) {
      return;
    }

    setImportingType(type);
    setImportState((current) => ({ ...current, [type]: "Ice aktariliyor..." }));

    try {
      const body = await file.text();
      const response = await fetch(`/api/import?type=${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const result = (await response.json()) as { imported?: number; error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "JSON dosyasi ice aktarilamadi.");
      }

      setImportState((current) => ({
        ...current,
        [type]: `${result.imported ?? 0} kayit ice aktarildi.`,
      }));
    } catch (error) {
      setImportState((current) => ({
        ...current,
        [type]: error instanceof Error ? error.message : "JSON dosyasi ice aktarilamadi.",
      }));
    } finally {
      setImportingType(null);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold text-white">
          <Download size={18} />
          Yedek / disa aktar
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Yerel SQLite kayitlarini CSV veya JSON olarak indirir; JSON yedekleri geri yukler.
        </p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        {exportItems.map((item) => (
          <article className="rounded-md border border-white/5 bg-white/[0.03] p-3" key={item.type}>
            <div>
              <p className="font-semibold text-white">{item.label}</p>
              <p className="mt-1 min-h-10 text-sm leading-5 text-[var(--muted)]">
                {item.description}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <ExportLink format="csv" type={item.type} />
              <ExportLink format="json" type={item.type} />
            </div>

            <ImportControl
              disabled={importingType === item.type}
              message={importState[item.type]}
              onImport={(file) => importJson(item.type, file)}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

function ExportLink({
  format,
  type,
}: {
  format: "csv" | "json";
  type: ExportItem["type"];
}) {
  const Icon = format === "csv" ? Sheet : FileJson;

  return (
    <a
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white/[0.04] px-3 text-sm font-medium text-white transition hover:border-emerald-300 hover:bg-emerald-300/10"
      href={`/api/export?type=${type}&format=${format}`}
    >
      <Icon size={16} />
      {format.toUpperCase()}
    </a>
  );
}

function ImportControl({
  disabled,
  message,
  onImport,
}: {
  disabled: boolean;
  message?: string;
  onImport: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="mt-3">
      <button
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-emerald-300/10 px-3 text-sm font-medium text-emerald-100 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <Upload size={16} />
        {disabled ? "Yukleniyor" : "JSON yukle"}
      </button>
      <input
        accept=".json,application/json"
        className="hidden"
        onChange={(event) => {
          onImport(event.target.files?.[0] ?? null);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      {message ? <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{message}</p> : null}
    </div>
  );
}
