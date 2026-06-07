"use client";

import { Download, FileJson, Sheet } from "lucide-react";

type ExportItem = {
  description: string;
  label: string;
  type: "alerts" | "portfolio" | "trades";
};

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
];

export function ExportPanel() {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-[rgba(13,26,23,0.82)] p-4 shadow-2xl shadow-black/20 md:p-5">
      <div>
        <h3 className="flex items-center gap-2 text-base font-semibold text-white">
          <Download size={18} />
          Yedek / disa aktar
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Yerel SQLite kayitlarini CSV veya JSON olarak indirir.
        </p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
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
