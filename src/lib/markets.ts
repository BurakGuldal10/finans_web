export type MarketKind = "crypto" | "stocks";

export function normalizeMarket(value: string | null): MarketKind {
  return value === "stocks" ? "stocks" : "crypto";
}
