import type { UsageTrialNoteRecord } from "@/lib/local-db";

export type UsageSummary = {
  generatedAt: string;
  range: {
    from: string;
    to: string;
    days: number;
  };
  totals: {
    notes: number;
    snapshots: number;
    activeDays: number;
  };
  symbols: Array<{ label: string; count: number }>;
  usefulPanels: Array<{ label: string; count: number }>;
  confusingPanels: Array<{ label: string; count: number }>;
  dataIssues: string[];
  nextActions: string[];
  recentNotes: UsageTrialNoteRecord[];
  recommendations: UsageRecommendation[];
};

export type UsageRecommendation = {
  tone: "positive" | "warning" | "info";
  title: string;
  detail: string;
};

const dayMs = 24 * 60 * 60 * 1000;

export function buildUsageSummary(notes: UsageTrialNoteRecord[], days = 7): UsageSummary {
  const safeDays = Math.max(1, Math.min(30, Math.floor(days)));
  const today = new Date();
  const to = toDateKey(today);
  const from = toDateKey(new Date(today.getTime() - (safeDays - 1) * dayMs));
  const filtered = notes.filter((note) => note.date >= from && note.date <= to);
  const activeDays = new Set(filtered.map((note) => note.date)).size;
  const snapshots = filtered.reduce((sum, note) => sum + Number(note.snapshots || 0), 0);
  const symbols = topCounts(filtered.flatMap((note) => splitSymbols(note.symbols)), 8);
  const usefulPanels = topCounts(filtered.map((note) => note.usefulPanel), 5);
  const confusingPanels = topCounts(filtered.map((note) => note.confusingPanel), 5);
  const dataIssues = uniqueText(filtered.map((note) => note.dataIssue), 8);
  const nextActions = uniqueText(filtered.map((note) => note.nextAction), 8);

  return {
    generatedAt: new Date().toISOString(),
    range: {
      days: safeDays,
      from,
      to,
    },
    totals: {
      activeDays,
      notes: filtered.length,
      snapshots,
    },
    symbols,
    usefulPanels,
    confusingPanels,
    dataIssues,
    nextActions,
    recentNotes: filtered.slice(0, 5),
    recommendations: buildRecommendations({
      activeDays,
      confusingPanels,
      dataIssues,
      nextActions,
      notes: filtered.length,
      snapshots,
      symbols,
      totalDays: safeDays,
    }),
  };
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function splitSymbols(value: string) {
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function topCounts(values: string[], limit: number) {
  const counts = new Map<string, number>();

  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ count, label }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, limit);
}

function uniqueText(values: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];

  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      const key = value.toLocaleLowerCase("tr-TR");
      if (!seen.has(key) && result.length < limit) {
        seen.add(key);
        result.push(value);
      }
    });

  return result;
}

function buildRecommendations({
  activeDays,
  confusingPanels,
  dataIssues,
  nextActions,
  notes,
  snapshots,
  symbols,
  totalDays,
}: {
  activeDays: number;
  confusingPanels: Array<{ label: string; count: number }>;
  dataIssues: string[];
  nextActions: string[];
  notes: number;
  snapshots: number;
  symbols: Array<{ label: string; count: number }>;
  totalDays: number;
}) {
  const recommendations: UsageRecommendation[] = [];

  if (notes === 0) {
    recommendations.push({
      detail: "Sistem sekmesindeki gun sonu notunu en az 3 gun doldur; ozet bundan sonra daha anlamli hale gelir.",
      title: "Deneme verisi biriktir",
      tone: "info",
    });
    return recommendations;
  }

  if (activeDays < Math.min(3, totalDays)) {
    recommendations.push({
      detail: "Karar destek akisini yorumlamak icin notlar farkli gunlere yayilmali. Bugunden itibaren kisa da olsa gunluk not gir.",
      title: "Kullanim ritmini artir",
      tone: "warning",
    });
  }

  if (snapshots < activeDays) {
    recommendations.push({
      detail: "Her aktif gunde en az bir analiz snapshot'i kaydetmek, karar raporlarinin sonradan degerlendirilmesini kolaylastirir.",
      title: "Snapshot disiplinini guclendir",
      tone: "warning",
    });
  }

  if (symbols.length === 1 && notes >= 3) {
    recommendations.push({
      detail: "Deneme cok tek sembole sikismis gorunuyor. Ayni akisi bir kripto, bir ABD hisse ve bir BIST sembolunde de test et.",
      title: "Piyasa cesitliligini dene",
      tone: "info",
    });
  }

  if (confusingPanels.length > 0) {
    recommendations.push({
      detail: `${confusingPanels[0].label} paneli tekrar karisik not edilmis. Bu panel icin alan azaltma, metin sadelestirme veya daha net metrik etiketleri dusunulebilir.`,
      title: "Karisik paneli sadelestir",
      tone: "warning",
    });
  }

  if (dataIssues.length > 0) {
    recommendations.push({
      detail: "Veri sorunu notlari var. Sistem sekmesindeki kaynak durumunu, FMP/OpenAI anahtarlarini ve eski veri uyarilarini birlikte kontrol et.",
      title: "Veri guvenilirligini kontrol et",
      tone: "warning",
    });
  }

  if (nextActions.length > 0) {
    recommendations.push({
      detail: "Siradaki aksiyon notlarindan birini bir sonraki gelistirme adimi olarak sec; boylece deneme notlari dogrudan urun iyilestirmesine doner.",
      title: "Aksiyon notunu gelistirmeye cevir",
      tone: "info",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      detail: "Not, snapshot ve panel kullanimi dengeli gorunuyor. Bir sonraki adim haftalik AI yorum veya daha ayrintili performans karsilastirmasi olabilir.",
      title: "Deneme akisi dengeli",
      tone: "positive",
    });
  }

  return recommendations.slice(0, 5);
}
