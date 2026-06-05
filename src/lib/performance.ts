import { listTradeEntries, type TradeEntryRecord } from "@/lib/local-db";

export type PerformanceBucket = {
  averageRiskReward: number;
  breakevens: number;
  closed: number;
  estimatedResult: number;
  key: string;
  losses: number;
  open: number;
  planned: number;
  plannedRisk: number;
  total: number;
  winRate: number;
  wins: number;
};

export type PerformanceSummary = PerformanceBucket & {
  byStrategy: PerformanceBucket[];
  bySymbol: PerformanceBucket[];
};

type EnrichedTrade = TradeEntryRecord & {
  estimatedResult: number;
  riskAmount: number;
  riskReward: number;
};

export function getPerformanceSummary(): PerformanceSummary {
  const entries = listTradeEntries().map(enrichTrade);
  const total = summarizeBucket("Genel", entries);

  return {
    ...total,
    byStrategy: summarizeGroups(entries, (entry) => entry.strategy || "Strateji yok"),
    bySymbol: summarizeGroups(entries, (entry) => entry.symbol),
  };
}

function summarizeGroups(
  entries: EnrichedTrade[],
  readKey: (entry: EnrichedTrade) => string,
) {
  const groups = new Map<string, EnrichedTrade[]>();

  for (const entry of entries) {
    const key = readKey(entry);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }

  return Array.from(groups.entries())
    .map(([key, groupEntries]) => summarizeBucket(key, groupEntries))
    .sort((a, b) => b.total - a.total || a.key.localeCompare(b.key))
    .slice(0, 8);
}

function summarizeBucket(key: string, entries: EnrichedTrade[]): PerformanceBucket {
  const closedEntries = entries.filter((entry) =>
    ["win", "loss", "breakeven"].includes(entry.status),
  );
  const wins = closedEntries.filter((entry) => entry.status === "win").length;
  const losses = closedEntries.filter((entry) => entry.status === "loss").length;
  const breakevens = closedEntries.filter((entry) => entry.status === "breakeven").length;
  const openEntries = entries.filter((entry) => entry.status === "open");
  const plannedEntries = entries.filter((entry) => entry.status === "plan");
  const plannedRisk = [...openEntries, ...plannedEntries].reduce(
    (total, entry) => total + entry.riskAmount,
    0,
  );
  const estimatedResult = closedEntries.reduce(
    (total, entry) => total + entry.estimatedResult,
    0,
  );
  const averageRiskReward =
    entries.length > 0
      ? entries.reduce((total, entry) => total + entry.riskReward, 0) / entries.length
      : 0;

  return {
    averageRiskReward,
    breakevens,
    closed: closedEntries.length,
    estimatedResult,
    key,
    losses,
    open: openEntries.length,
    planned: plannedEntries.length,
    plannedRisk,
    total: entries.length,
    winRate: closedEntries.length > 0 ? (wins / closedEntries.length) * 100 : 0,
    wins,
  };
}

function enrichTrade(entry: TradeEntryRecord): EnrichedTrade {
  const riskPerUnit =
    entry.side === "short"
      ? Math.max(entry.stopLoss - entry.entryPrice, 0)
      : Math.max(entry.entryPrice - entry.stopLoss, 0);
  const rewardPerUnit =
    entry.side === "short"
      ? Math.max(entry.entryPrice - entry.targetPrice, 0)
      : Math.max(entry.targetPrice - entry.entryPrice, 0);
  const riskAmount = riskPerUnit * entry.quantity;
  const rewardAmount = rewardPerUnit * entry.quantity;
  const estimatedResult =
    entry.status === "win" ? rewardAmount : entry.status === "loss" ? -riskAmount : 0;

  return {
    ...entry,
    estimatedResult,
    riskAmount,
    riskReward: rewardPerUnit / Math.max(riskPerUnit, 0.00000001),
  };
}
