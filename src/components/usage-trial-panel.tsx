"use client";

import { CalendarCheck, RotateCcw, Save, Trash2 } from "lucide-react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type TrialItem = {
  id: string;
  label: string;
};

type UsageTrialNote = {
  id: string;
  date: string;
  symbols: string;
  snapshots: number;
  tradeNotes: string;
  usefulPanel: string;
  confusingPanel: string;
  dataIssue: string;
  nextAction: string;
  createdAt: string;
};

type DraftNote = {
  symbols: string;
  snapshots: string;
  tradeNotes: string;
  usefulPanel: string;
  confusingPanel: string;
  dataIssue: string;
  nextAction: string;
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

const emptyDraft: DraftNote = {
  confusingPanel: "",
  dataIssue: "",
  nextAction: "",
  snapshots: "0",
  symbols: "",
  tradeNotes: "",
  usefulPanel: "",
};

export function UsageTrialPanel() {
  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const storageKey = `${storagePrefix}-${todayKey}`;
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [draft, setDraft] = useState<DraftNote>(emptyDraft);
  const [notes, setNotes] = useState<UsageTrialNote[]>([]);
  const [noteStatus, setNoteStatus] = useState<string | null>(null);
  const completedCount = checkedItems.length;
  const progress = Math.round((completedCount / trialItems.length) * 100);

  const loadNotes = useCallback(async () => {
    try {
      const response = await fetch("/api/usage-notes", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Usage notes request failed");
      }

      const payload = (await response.json()) as { notes: UsageTrialNote[] };
      setNotes(payload.notes);
      setNoteStatus(null);
    } catch {
      setNoteStatus("Kullanim notlari okunamadi.");
    }
  }, []);

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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotes();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadNotes]);

  function toggleItem(id: string) {
    setCheckedItems((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function resetToday() {
    setCheckedItems([]);
    window.localStorage.removeItem(storageKey);
  }

  function updateDraft(field: keyof DraftNote, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveNote() {
    setNoteStatus("Not kaydediliyor...");

    try {
      const response = await fetch("/api/usage-notes", {
        body: JSON.stringify({
          ...draft,
          date: todayKey,
          snapshots: Number(draft.snapshots),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Usage note save failed");
      }

      const payload = (await response.json()) as { note: UsageTrialNote };
      setNotes((current) => [payload.note, ...current.filter((note) => note.id !== payload.note.id)]);
      setDraft(emptyDraft);
      setNoteStatus("Gunluk not kaydedildi.");
    } catch {
      setNoteStatus("Gunluk not kaydedilemedi.");
    }
  }

  async function deleteNote(id: string) {
    try {
      const response = await fetch(`/api/usage-notes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Usage note delete failed");
      }

      setNotes((current) => current.filter((note) => note.id !== id));
      setNoteStatus("Gunluk not silindi.");
    } catch {
      setNoteStatus("Gunluk not silinemedi.");
    }
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

      <div className="mt-5 rounded-md border border-white/5 bg-white/[0.03] p-3 md:p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Gun sonu notu</h4>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Bugun hangi ekranlar ise yaradi, hangi veri veya karar noktasi sorun cikardi?
            </p>
          </div>
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-emerald-300 px-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200"
            onClick={() => void saveNote()}
            type="button"
          >
            <Save size={15} />
            Notu kaydet
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field
            label="Incelenen semboller"
            onChange={(value) => updateDraft("symbols", value)}
            placeholder="BTCUSDT, AAPL, THYAO.IS"
            value={draft.symbols}
          />
          <Field
            label="Kaydedilen snapshot sayisi"
            min="0"
            onChange={(value) => updateDraft("snapshots", value)}
            type="number"
            value={draft.snapshots}
          />
          <Field
            label="En faydali panel"
            onChange={(value) => updateDraft("usefulPanel", value)}
            placeholder="Karar raporu, risk hesaplayici..."
            value={draft.usefulPanel}
          />
          <Field
            label="Kafa karistiran panel"
            onChange={(value) => updateDraft("confusingPanel", value)}
            placeholder="Varsa not et"
            value={draft.confusingPanel}
          />
          <TextAreaField
            label="Trade / gozlem notu"
            onChange={(value) => updateDraft("tradeNotes", value)}
            placeholder="Bugunku plan, takip edilen seviye veya islem fikri"
            value={draft.tradeNotes}
          />
          <TextAreaField
            label="Veri hatasi veya gecikme"
            onChange={(value) => updateDraft("dataIssue", value)}
            placeholder="Kaynak hatasi, eski veri uyarisi, eksik bilanco..."
            value={draft.dataIssue}
          />
          <TextAreaField
            className="md:col-span-2"
            label="Yarin kontrol edilecek not"
            onChange={(value) => updateDraft("nextAction", value)}
            placeholder="Yarin tekrar bakilacak sembol, panel veya duzeltme"
            value={draft.nextAction}
          />
        </div>

        {noteStatus ? <p className="mt-3 text-sm text-emerald-100">{noteStatus}</p> : null}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-white">Son gunluk notlar</h4>
          <button
            className="text-sm text-emerald-100 underline-offset-4 transition hover:text-emerald-50 hover:underline"
            onClick={() => void loadNotes()}
            type="button"
          >
            Yenile
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          {notes.length ? (
            notes.slice(0, 5).map((note) => (
              <article className="rounded-md border border-white/5 bg-black/15 p-3" key={note.id}>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-mono text-sm text-emerald-100">
                      {note.date} - {note.symbols || "Sembol notu yok"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Snapshot: {note.snapshots} - Kayit:{" "}
                      {new Date(note.createdAt).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <button
                    aria-label="Gunluk notu sil"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-white transition hover:border-red-300 hover:text-red-100"
                    onClick={() => void deleteNote(note.id)}
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted)] md:grid-cols-2">
                  <NoteLine label="Trade" value={note.tradeNotes} />
                  <NoteLine label="Faydali" value={note.usefulPanel} />
                  <NoteLine label="Karistiran" value={note.confusingPanel} />
                  <NoteLine label="Veri" value={note.dataIssue} />
                  <NoteLine className="md:col-span-2" label="Sonraki" value={note.nextAction} />
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-md border border-white/5 bg-white/[0.03] p-3 text-sm text-[var(--muted)]">
              Henuz gunluk not yok.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  onChange,
  value,
  className = "",
  ...props
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className={`text-sm ${className}`}>
      <span className="text-[var(--muted)]">{label}</span>
      <input
        {...props}
        className="mt-2 h-10 w-full rounded-md border border-[var(--border)] bg-black/20 px-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
  className = "",
  ...props
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
  className?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value">) {
  return (
    <label className={`text-sm ${className}`}>
      <span className="text-[var(--muted)]">{label}</span>
      <textarea
        {...props}
        className="mt-2 min-h-24 w-full resize-y rounded-md border border-[var(--border)] bg-black/20 px-3 py-2 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function NoteLine({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  if (!value) {
    return null;
  }

  return (
    <p className={className}>
      <span className="font-medium text-white">{label}:</span> {value}
    </p>
  );
}
