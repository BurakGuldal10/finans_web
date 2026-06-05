export type MarketKind = "crypto" | "stocks" | "bist";

export function normalizeMarket(value: string | null): MarketKind {
  if (value === "stocks" || value === "bist") {
    return value;
  }

  return "crypto";
}
