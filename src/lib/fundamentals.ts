export type FundamentalMetric = {
  label: string;
  tone: "default" | "positive" | "danger";
  value: string;
};

export type FundamentalAnalysis = {
  symbol: string;
  companyName: string;
  sector: string;
  score: number;
  health: "strong" | "mixed" | "weak";
  summary: string;
  metrics: FundamentalMetric[];
  raw: {
    marketCap: number;
    peRatio: number | null;
    revenueGrowth: number | null;
    netMargin: number | null;
    debtToEquity: number | null;
    currentRatio: number | null;
    freeCashFlow: number | null;
    returnOnEquity: number | null;
  };
};

type FmpProfile = {
  companyName?: string;
  sector?: string;
  mktCap?: number;
  pe?: number;
};

type FmpIncomeStatement = {
  revenue?: number;
  netIncome?: number;
};

type FmpBalanceSheet = {
  totalDebt?: number;
  totalStockholdersEquity?: number;
  totalCurrentAssets?: number;
  totalCurrentLiabilities?: number;
};

type FmpCashFlow = {
  freeCashFlow?: number;
};

type FmpRatio = {
  currentRatio?: number;
  debtEquityRatio?: number;
  returnOnEquity?: number;
  netProfitMargin?: number;
  priceEarningsRatio?: number;
};

export async function fetchFundamentals(symbol: string): Promise<FundamentalAnalysis> {
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    throw new MissingFmpApiKeyError();
  }

  const normalizedSymbol = symbol.trim().toUpperCase();
  const [profile, income, balance, cashFlow, ratios] = await Promise.all([
    fetchFmpArray<FmpProfile>(`profile/${normalizedSymbol}`, apiKey),
    fetchFmpArray<FmpIncomeStatement>(`income-statement/${normalizedSymbol}?limit=2`, apiKey),
    fetchFmpArray<FmpBalanceSheet>(`balance-sheet-statement/${normalizedSymbol}?limit=1`, apiKey),
    fetchFmpArray<FmpCashFlow>(`cash-flow-statement/${normalizedSymbol}?limit=1`, apiKey),
    fetchFmpArray<FmpRatio>(`ratios/${normalizedSymbol}?limit=1`, apiKey),
  ]);

  if (!profile[0]) {
    throw new Error(`${normalizedSymbol} icin temel veri bulunamadi.`);
  }

  return analyzeFundamentals({
    symbol: normalizedSymbol,
    profile: profile[0],
    latestIncome: income[0],
    previousIncome: income[1],
    balance: balance[0],
    cashFlow: cashFlow[0],
    ratios: ratios[0],
  });
}

export class MissingFmpApiKeyError extends Error {
  constructor() {
    super("FMP_API_KEY tanimli degil.");
  }
}

async function fetchFmpArray<T>(path: string, apiKey: string) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(
    `https://financialmodelingprep.com/api/v3/${path}${separator}apikey=${apiKey}`,
    { next: { revalidate: 3600 } },
  );

  if (!response.ok) {
    throw new Error(`FMP request failed: ${response.status}`);
  }

  return (await response.json()) as T[];
}

function analyzeFundamentals(input: {
  symbol: string;
  profile: FmpProfile;
  latestIncome?: FmpIncomeStatement;
  previousIncome?: FmpIncomeStatement;
  balance?: FmpBalanceSheet;
  cashFlow?: FmpCashFlow;
  ratios?: FmpRatio;
}): FundamentalAnalysis {
  const marketCap = Number(input.profile.mktCap ?? 0);
  const revenue = Number(input.latestIncome?.revenue ?? 0);
  const previousRevenue = Number(input.previousIncome?.revenue ?? 0);
  const netIncome = Number(input.latestIncome?.netIncome ?? 0);
  const freeCashFlow = Number(input.cashFlow?.freeCashFlow ?? 0);
  const equity = Number(input.balance?.totalStockholdersEquity ?? 0);
  const debt = Number(input.balance?.totalDebt ?? 0);
  const currentAssets = Number(input.balance?.totalCurrentAssets ?? 0);
  const currentLiabilities = Number(input.balance?.totalCurrentLiabilities ?? 0);
  const peRatio = safeNumber(input.ratios?.priceEarningsRatio ?? input.profile.pe);
  const revenueGrowth =
    previousRevenue > 0 && revenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : null;
  const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : safePercent(input.ratios?.netProfitMargin);
  const debtToEquity =
    equity > 0 ? debt / equity : safeNumber(input.ratios?.debtEquityRatio);
  const currentRatio =
    currentLiabilities > 0 ? currentAssets / currentLiabilities : safeNumber(input.ratios?.currentRatio);
  const returnOnEquity =
    equity > 0 ? (netIncome / equity) * 100 : safePercent(input.ratios?.returnOnEquity);

  let score = 50;
  score += scoreRevenueGrowth(revenueGrowth);
  score += scoreNetMargin(netMargin);
  score += scoreDebtToEquity(debtToEquity);
  score += scoreCurrentRatio(currentRatio);
  score += scoreFreeCashFlow(freeCashFlow);
  score += scorePeRatio(peRatio);
  score += scoreReturnOnEquity(returnOnEquity);

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const health = boundedScore >= 70 ? "strong" : boundedScore <= 42 ? "weak" : "mixed";

  return {
    symbol: input.symbol,
    companyName: input.profile.companyName ?? input.symbol,
    sector: input.profile.sector ?? "Unknown",
    score: boundedScore,
    health,
    summary: buildSummary(health),
    metrics: [
      metric("Piyasa degeri", formatLargeNumber(marketCap), "default"),
      metric("F/K", peRatio === null ? "N/A" : peRatio.toFixed(2), peTone(peRatio)),
      metric("Gelir buyumesi", formatPercent(revenueGrowth), growthTone(revenueGrowth)),
      metric("Net marj", formatPercent(netMargin), marginTone(netMargin)),
      metric("Borc/Ozsermaye", debtToEquity === null ? "N/A" : debtToEquity.toFixed(2), debtTone(debtToEquity)),
      metric("Cari oran", currentRatio === null ? "N/A" : currentRatio.toFixed(2), currentRatioTone(currentRatio)),
      metric("Serbest nakit", formatLargeNumber(freeCashFlow), freeCashFlow >= 0 ? "positive" : "danger"),
      metric("ROE", formatPercent(returnOnEquity), roeTone(returnOnEquity)),
    ],
    raw: {
      marketCap,
      peRatio,
      revenueGrowth,
      netMargin,
      debtToEquity,
      currentRatio,
      freeCashFlow,
      returnOnEquity,
    },
  };
}

function metric(
  label: string,
  value: string,
  tone: FundamentalMetric["tone"],
): FundamentalMetric {
  return { label, value, tone };
}

function safeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function safePercent(value: unknown) {
  const number = safeNumber(value);
  if (number === null) {
    return null;
  }

  return Math.abs(number) <= 1 ? number * 100 : number;
}

function scoreRevenueGrowth(value: number | null) {
  if (value === null) return 0;
  if (value >= 15) return 12;
  if (value >= 5) return 6;
  if (value < -5) return -10;
  return 0;
}

function scoreNetMargin(value: number | null) {
  if (value === null) return 0;
  if (value >= 20) return 10;
  if (value >= 10) return 5;
  if (value < 0) return -12;
  return 0;
}

function scoreDebtToEquity(value: number | null) {
  if (value === null) return 0;
  if (value <= 0.6) return 8;
  if (value <= 1.5) return 2;
  if (value > 3) return -10;
  return -4;
}

function scoreCurrentRatio(value: number | null) {
  if (value === null) return 0;
  if (value >= 1.5) return 6;
  if (value < 1) return -7;
  return 2;
}

function scoreFreeCashFlow(value: number | null) {
  if (value === null) return 0;
  return value >= 0 ? 8 : -12;
}

function scorePeRatio(value: number | null) {
  if (value === null || value <= 0) return 0;
  if (value <= 25) return 6;
  if (value > 60) return -8;
  return -2;
}

function scoreReturnOnEquity(value: number | null) {
  if (value === null) return 0;
  if (value >= 20) return 8;
  if (value >= 10) return 4;
  if (value < 0) return -8;
  return 0;
}

function buildSummary(health: FundamentalAnalysis["health"]) {
  if (health === "strong") {
    return "Temel veriler guclu; teknik sinyal ile birlikte daha yuksek guvenle izlenebilir.";
  }

  if (health === "weak") {
    return "Temel veriler zayif; teknik trade olsa bile pozisyon boyutu ve stop daha temkinli olmali.";
  }

  return "Temel gorunum karisik; teknik teyit ve risk/odul hesabi belirleyici olmali.";
}

function formatPercent(value: number | null) {
  return value === null ? "N/A" : `${value.toFixed(2)}%`;
}

function formatLargeNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return "N/A";
  }

  return Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    notation: "compact",
  }).format(value);
}

function peTone(value: number | null): FundamentalMetric["tone"] {
  if (value === null || value <= 0) return "default";
  if (value <= 25) return "positive";
  if (value > 60) return "danger";
  return "default";
}

function growthTone(value: number | null): FundamentalMetric["tone"] {
  if (value === null) return "default";
  if (value >= 5) return "positive";
  if (value < -5) return "danger";
  return "default";
}

function marginTone(value: number | null): FundamentalMetric["tone"] {
  if (value === null) return "default";
  if (value >= 10) return "positive";
  if (value < 0) return "danger";
  return "default";
}

function debtTone(value: number | null): FundamentalMetric["tone"] {
  if (value === null) return "default";
  if (value <= 0.6) return "positive";
  if (value > 3) return "danger";
  return "default";
}

function currentRatioTone(value: number | null): FundamentalMetric["tone"] {
  if (value === null) return "default";
  if (value >= 1.5) return "positive";
  if (value < 1) return "danger";
  return "default";
}

function roeTone(value: number | null): FundamentalMetric["tone"] {
  if (value === null) return "default";
  if (value >= 15) return "positive";
  if (value < 0) return "danger";
  return "default";
}
