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
};

const dayMs = 24 * 60 * 60 * 1000;

export function buildUsageSummary(notes: UsageTrialNoteRecord[], days = 7): UsageSummary {
  const safeDays = Math.max(1, Math.min(30, Math.floor(days)));
  const today = new Date();
  const to = toDateKey(today);
  const from = toDateKey(new Date(today.getTime() - (safeDays - 1) * dayMs));
  const filtered = notes.filter((note) => note.date >= from && note.date <= to);
  const activeDays = new Set(filtered.map((note) => note.date)).size;

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
      snapshots: filtered.reduce((sum, note) => sum + Number(note.snapshots || 0), 0),
    },
    symbols: topCounts(filtered.flatMap((note) => splitSymbols(note.symbols)), 8),
    usefulPanels: topCounts(filtered.map((note) => note.usefulPanel), 5),
    confusingPanels: topCounts(filtered.map((note) => note.confusingPanel), 5),
    dataIssues: uniqueText(filtered.map((note) => note.dataIssue), 8),
    nextActions: uniqueText(filtered.map((note) => note.nextAction), 8),
    recentNotes: filtered.slice(0, 5),
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
