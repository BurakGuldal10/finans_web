import { fetchTickers, normalizeSymbol } from "@/lib/binance";
import type { FundamentalAnalysis } from "@/lib/fundamentals";
import { fetchFundamentals, fetchYahooFundamentals } from "@/lib/fundamentals";
import type { MarketKind } from "@/lib/markets";
import { createCacheKey, getCached } from "@/lib/server-cache";

export type LongTermHorizon = "3m" | "6m" | "1y" | "3y" | "5y" | 1 | 3 | 5;

export type ScoreDimension = {
  id: "quality" | "growth" | "balance" | "valuation" | "relative" | "risk";
  label: string;
  score: number | null;
  weight: number;
  summary: string;
};

export type PeerBenchmark = {
  available: boolean;
  sampleSize: number;
  symbols: string[];
  peMedian: number | null;
  priceToBookMedian: number | null;
  enterpriseToEbitdaMedian: number | null;
  note: string;
};

export type PricePerformance = {
  symbol: string;
  totalReturn: number | null;
  annualizedReturn: number | null;
  annualizedVolatility: number | null;
  maxDrawdown: number | null;
  latestPrice?: number | null;
};

export type ResearchEvent = {
  category: "filing" | "news";
  date: string;
  source: string;
  title: string;
  url: string;
};

export type PriceScenario = {
  name: "bull" | "base" | "bear";
  label: string;
  tone: "positive" | "default" | "danger";
  targetPriceLow: number;
  targetPriceHigh: number;
  targetPriceMid: number;
  expectedReturnLowPct: number;
  expectedReturnHighPct: number;
  expectedReturnMidPct: number;
  probabilityLabel: string;
  keyDrivers: string[];
};

export type PriceProjections = {
  currentPrice: number | null;
  currency: string;
  horizonKey: LongTermHorizon;
  horizonLabel: string;
  horizonYearsValue: number;
  scenarios: {
    bull: PriceScenario;
    base: PriceScenario;
    bear: PriceScenario;
  };
  riskRewardRatio: number | null;
  methodologyNote: string;
};

export type BalanceSheetCommentary = {
  healthStatus: "strong" | "moderate" | "cautious";
  healthTitle: string;
  healthSummary: string;
  marginTrend: string;
  debtAndLiquidity: string;
  cashFlowQuality: string;
  quarterlyHighlights: string[];
  keyWatchpoints: string[];
};

export type LongTermResearch = {
  symbol: string;
  companyName: string;
  sector: string;
  horizonYears: LongTermHorizon;
  horizonLabel: string;
  score: number;
  confidence: "high" | "medium" | "low";
  coveragePercent: number;
  stance: "accumulate_on_weakness" | "watch" | "cautious";
  summary: string;
  dimensions: ScoreDimension[];
  fundamentals: FundamentalAnalysis;
  peers: PeerBenchmark;
  performance: {
    company: PricePerformance;
    market: PricePerformance;
    sector: PricePerformance | null;
    marketBenchmark: string;
    sectorBenchmark: string | null;
  };
  projections: PriceProjections;
  quarterlyCommentary: BalanceSheetCommentary;
  catalysts: string[];
  risks: string[];
  checklist: string[];
  events: ResearchEvent[];
  dataNotes: string[];
  updatedAt: string;
};

type PricePoint = { close: number; timestamp: number };

type FmpPeerRatios = {
  priceEarningsRatioTTM?: number;
  priceToBookRatioTTM?: number;
  enterpriseValueMultipleTTM?: number;
};

const sectorEtfs: Record<string, string> = {
  communication: "XLC",
  consumer: "XLY",
  energy: "XLE",
  financial: "XLF",
  health: "XLV",
  industrial: "XLI",
  materials: "XLB",
  realestate: "XLRE",
  technology: "XLK",
  utilities: "XLU",
};

export function parseHorizon(horizon: LongTermHorizon) {
  if (horizon === "3m") return { key: "3m" as const, years: 0.25, label: "3 Ay", yahooRange: "6mo" };
  if (horizon === "6m") return { key: "6m" as const, years: 0.5, label: "6 Ay", yahooRange: "1y" };
  if (horizon === "1y" || horizon === 1) return { key: "1y" as const, years: 1, label: "1 Yıl", yahooRange: "1y" };
  if (horizon === "3y" || horizon === 3) return { key: "3y" as const, years: 3, label: "3 Yıl", yahooRange: "3y" };
  return { key: "5y" as const, years: 5, label: "5 Yıl", yahooRange: "5y" };
}

export async function buildLongTermResearch(input: {
  horizonYears: LongTermHorizon;
  market: MarketKind;
  symbol: string;
}): Promise<LongTermResearch> {
  const parsedHorizon = parseHorizon(input.horizonYears);
  const cacheKey = createCacheKey(["long-term", input.market, input.symbol, parsedHorizon.key]);

  const cached = await getCached<LongTermResearch>(cacheKey, 180, async (): Promise<LongTermResearch> => {
    if (input.market === "crypto") {
      return buildCryptoLongTermResearch(input.symbol, input.horizonYears);
    }

    const fundamentals = await fetchBestFundamentals(input.market, input.symbol);
    const marketBenchmark = input.market === "bist" ? "XU100.IS" : "SPY";
    const sectorBenchmark = input.market === "stocks" ? resolveSectorEtf(fundamentals.sector) : null;

    const [companyResult, marketResult, sectorResult, peersResult, newsResult, filingsResult] =
      await Promise.allSettled([
        fetchPerformance(input.symbol, input.horizonYears),
        fetchPerformance(marketBenchmark, input.horizonYears),
        sectorBenchmark
          ? fetchPerformance(sectorBenchmark, input.horizonYears)
          : Promise.resolve<PricePerformance | null>(null),
        fetchPeerBenchmark(input.market, input.symbol),
        fetchCompanyNews(fundamentals.companyName, input.symbol),
        input.market === "stocks" ? fetchRecentSecFilings(input.symbol) : Promise.resolve([]),
      ]);

    const company = settledValue(
      companyResult,
      emptyPerformance(input.symbol),
    );
    const market = settledValue(marketResult, emptyPerformance(marketBenchmark));
    const sector = settledValue(sectorResult, null);
    const peers = settledValue(peersResult, unavailablePeers());
    const news = settledValue(newsResult, []);
    const filings = settledValue(filingsResult, []);
    const dimensions = buildDimensions(fundamentals, peers, company, market, sector);
    const availableWeight = dimensions.reduce(
      (sum, dimension) => sum + (dimension.score === null ? 0 : dimension.weight),
      0,
    );
    const weightedTotal = dimensions.reduce(
      (sum, dimension) => sum + (dimension.score === null ? 0 : dimension.score * dimension.weight),
      0,
    );
    const score = availableWeight > 0 ? Math.round(weightedTotal / availableWeight) : 50;
    const coveragePercent = Math.round((availableWeight / 100) * 100);
    const confidence = coveragePercent >= 85 ? "high" : coveragePercent >= 60 ? "medium" : "low";
    const stance =
      score >= 72 && confidence !== "low"
        ? "accumulate_on_weakness"
        : score < 48
          ? "cautious"
          : "watch";

    const projections = buildPriceProjections(
      input.symbol,
      input.market,
      input.horizonYears,
      fundamentals,
      company,
      peers,
    );
    const quarterlyCommentary = buildQuarterlyCommentary(fundamentals, input.horizonYears);

    return {
      symbol: input.symbol,
      companyName: fundamentals.companyName,
      sector: fundamentals.sector,
      horizonYears: input.horizonYears,
      horizonLabel: parsedHorizon.label,
      score,
      confidence,
      coveragePercent,
      stance,
      summary: buildSummary(score, confidence, parsedHorizon.label),
      dimensions,
      fundamentals,
      peers,
      performance: {
        company,
        market,
        sector,
        marketBenchmark,
        sectorBenchmark,
      },
      projections,
      quarterlyCommentary,
      catalysts: buildCatalysts(fundamentals, company, market),
      risks: buildRisks(fundamentals, peers, company, market),
      checklist: buildChecklist(parsedHorizon.label, fundamentals, peers),
      events: [...filings, ...news]
        .sort((left, right) => right.date.localeCompare(left.date))
        .slice(0, 12),
      dataNotes: buildDataNotes(peers, filingsResult, newsResult, coveragePercent),
      updatedAt: new Date().toISOString(),
    };
  });

  return cached.value;
}

async function buildCryptoLongTermResearch(
  rawSymbol: string,
  horizon: LongTermHorizon,
): Promise<LongTermResearch> {
  const symbol = normalizeSymbol(rawSymbol);
  const baseAsset = symbol.replace(/USDT$/, "");
  const parsedHorizon = parseHorizon(horizon);
  const marketBenchmark = "BTCUSDT";
  const sectorBenchmark = symbol === "ETHUSDT" ? "SOLUSDT" : "ETHUSDT";

  const [assetPerfResult, btcPerfResult, ethPerfResult, tickerResult, newsResult] =
    await Promise.allSettled([
      fetchCryptoPerformance(symbol, horizon),
      symbol === marketBenchmark
        ? fetchCryptoPerformance(symbol, horizon)
        : fetchCryptoPerformance(marketBenchmark, horizon),
      fetchCryptoPerformance(sectorBenchmark, horizon),
      fetchTickers([symbol]),
      fetchCompanyNews(`${baseAsset} crypto`, baseAsset),
    ]);

  const company = settledValue(assetPerfResult, emptyPerformance(symbol));
  const market = settledValue(btcPerfResult, emptyPerformance(marketBenchmark));
  const sector = settledValue(ethPerfResult, null);
  const ticker = settledValue(tickerResult, [])[0] ?? null;
  const news = settledValue(newsResult, []);

  const quoteVolume = ticker?.quoteVolume ?? 0;
  const liquidityScore =
    quoteVolume > 0 ? clamp(Math.round((Math.log10(quoteVolume) - 5) * 22), 20, 92) : 50;
  const momentumScore =
    company.annualizedReturn !== null
      ? clamp(Math.round(50 + company.annualizedReturn * 0.45), 15, 90)
      : null;
  const drawdownScore =
    company.maxDrawdown !== null
      ? scoreLower(Math.abs(company.maxDrawdown), 75, 25)
      : null;
  const relativeBtcScore =
    symbol === "BTCUSDT"
      ? 72
      : scoreSpread(company.annualizedReturn, market.annualizedReturn);
  const relativeEthScore = scoreSpread(
    company.annualizedReturn,
    sector?.annualizedReturn ?? null,
  );
  const riskScore = scoreLower(company.annualizedVolatility, 95, 35);

  const dimensions: ScoreDimension[] = [
    dimension("quality", "Likidite & Derinlik", 25, [liquidityScore], "24s USDT işlem hacmi ve piyasa derinliği"),
    dimension("growth", "Döngü & Momentum", 20, [momentumScore], `${parsedHorizon.label} dönemlik trend ve getiri ivmesi`),
    dimension("balance", "Çöküş Dayanıklılığı", 20, [drawdownScore], "Tarihsel azami gerileme (Max Drawdown) direnci"),
    dimension("valuation", "BTC Göreli Gücü", 15, [relativeBtcScore], "Bitcoin (BTCUSDT) karşısındaki göreli getiri performansı"),
    dimension("relative", "Ekosistem Göreli Gücü", 10, [relativeEthScore], `${sectorBenchmark} karşısındaki göreli performans`),
    dimension("risk", "Volatilite Rejimi", 10, [riskScore], "Yıllıklandırılmış oynaklık ve fiyat riski"),
  ];

  const availableWeight = dimensions.reduce(
    (sum, item) => sum + (item.score === null ? 0 : item.weight),
    0,
  );
  const weightedTotal = dimensions.reduce(
    (sum, item) => sum + (item.score === null ? 0 : item.score * item.weight),
    0,
  );
  const score = availableWeight > 0 ? Math.round(weightedTotal / availableWeight) : 50;
  const coveragePercent = Math.round((availableWeight / 100) * 100);
  const confidence = coveragePercent >= 85 ? "high" : coveragePercent >= 60 ? "medium" : "low";
  const stance =
    score >= 70 && confidence !== "low"
      ? "accumulate_on_weakness"
      : score < 46
        ? "cautious"
        : "watch";

  const currentPrice = ticker?.price ?? company.latestPrice ?? null;
  const volAnnual = (company.annualizedVolatility ?? 65) / 100;
  const years = parsedHorizon.years;
  const volHorizon = volAnnual * Math.sqrt(years);
  const histAnnualReturn =
    company.annualizedReturn !== null
      ? clamp(company.annualizedReturn / 100, -0.35, 0.65)
      : 0.15;

  const basePriceMid = currentPrice ? currentPrice * Math.pow(1 + histAnnualReturn * 0.6, years) : 0;
  const bullPriceMid = currentPrice
    ? currentPrice * Math.pow(1 + Math.max(histAnnualReturn * 1.1, 0.25), years) * (1 + 0.45 * volHorizon)
    : 0;
  const maxDd = Math.abs(company.maxDrawdown ?? 50) / 100;
  const bearFactor = Math.max(0.25, 1 - Math.max(volHorizon * 0.9, maxDd * 0.65));
  const bearPriceMid = currentPrice ? currentPrice * bearFactor : 0;

  const toPct = (target: number) =>
    currentPrice && currentPrice > 0
      ? Math.round(((target - currentPrice) / currentPrice) * 100 * 10) / 10
      : 0;

  const bullRet = toPct(bullPriceMid);
  const bearRet = toPct(bearPriceMid);
  const riskRewardRatio =
    bullRet > 0 && bearRet < 0
      ? Math.round((bullRet / Math.abs(bearRet)) * 10) / 10
      : null;

  const projections: PriceProjections = {
    currentPrice: currentPrice ? Math.round(currentPrice * 10000) / 10000 : null,
    currency: "$",
    horizonKey: horizon,
    horizonLabel: parsedHorizon.label,
    horizonYearsValue: years,
    scenarios: {
      bull: {
        name: "bull",
        label: "Boğa (İyimser) Senaryo",
        tone: "positive",
        targetPriceLow: Math.round(bullPriceMid * 0.9 * 10000) / 10000,
        targetPriceHigh: Math.round(bullPriceMid * 1.15 * 10000) / 10000,
        targetPriceMid: Math.round(bullPriceMid * 10000) / 10000,
        expectedReturnLowPct: toPct(bullPriceMid * 0.9),
        expectedReturnHighPct: toPct(bullPriceMid * 1.15),
        expectedReturnMidPct: bullRet,
        probabilityLabel: "%25-%30 Olasılık",
        keyDrivers: [
          "Küresel kripto likidite genişlemesi ve BTC döngü ivmesi",
          `${baseAsset} ağ/ekosistem hacminde ve kurumsal talepte artış`,
          `Volatilite kanalının üst bandına (%${(volHorizon * 100).toFixed(0)} genişleme) yönelim`,
        ],
      },
      base: {
        name: "base",
        label: "Baz (Beklenen) Senaryo",
        tone: "default",
        targetPriceLow: Math.round(basePriceMid * (1 - 0.2 * volHorizon) * 10000) / 10000,
        targetPriceHigh: Math.round(basePriceMid * (1 + 0.2 * volHorizon) * 10000) / 10000,
        targetPriceMid: Math.round(basePriceMid * 10000) / 10000,
        expectedReturnLowPct: toPct(basePriceMid * (1 - 0.2 * volHorizon)),
        expectedReturnHighPct: toPct(basePriceMid * (1 + 0.2 * volHorizon)),
        expectedReturnMidPct: toPct(basePriceMid),
        probabilityLabel: "%50-%55 Olasılık",
        keyDrivers: [
          "Mevcut piyasa likiditesi ve tarihsel ortalama volatilite seyri",
          `BTC (${marketBenchmark}) ile dengeli korelasyonun korunması`,
          `${parsedHorizon.label} vadede destek ve direnç bantları arasında dengelenme`,
        ],
      },
      bear: {
        name: "bear",
        label: "Ayı (Kötümser) Senaryo",
        tone: "danger",
        targetPriceLow: Math.round(bearPriceMid * 0.85 * 10000) / 10000,
        targetPriceHigh: Math.round(bearPriceMid * 1.08 * 10000) / 10000,
        targetPriceMid: Math.round(bearPriceMid * 10000) / 10000,
        expectedReturnLowPct: toPct(bearPriceMid * 0.85),
        expectedReturnHighPct: toPct(bearPriceMid * 1.08),
        expectedReturnMidPct: bearRet,
        probabilityLabel: "%15-%20 Olasılık",
        keyDrivers: [
          "Makro likidite daralması veya kripto piyasasında riskten kaçış (risk-off)",
          `Tarihsel azami gerileme (%${(maxDd * 100).toFixed(0)} Max Drawdown) bölgesinin test edilmesi`,
          "Altcoin/parite hacminde sert düşüş ve yüksek volatilite baskısı",
        ],
      },
    },
    riskRewardRatio,
    methodologyNote: `Kripto projeksiyonları şirket bilançosu içermez; Binance tarihsel %${(volAnnual * 100).toFixed(0)} yıllıklandırılmış volatilite kanalı, Max Drawdown ve BTC korelasyonu üzerinden hesaplanan matematiksel simülasyonlardır. Yatırım tavsiyesi değildir.`,
  };

  const healthStatus: BalanceSheetCommentary["healthStatus"] =
    score >= 68 ? "strong" : score < 46 ? "cautious" : "moderate";

  const quarterlyCommentary: BalanceSheetCommentary = {
    healthStatus,
    healthTitle:
      healthStatus === "strong"
        ? "Güçlü Likidite ve Olumlu Döngü Yapısı"
        : healthStatus === "cautious"
          ? "Yüksek Oynaklık ve Derin Gerileme Riski"
          : "Dengeli Piyasa Yapısı ve Orta Düzey Volatilite",
    healthSummary: `Kripto varlıklarda şirket bilançosu bulunmadığından ${symbol} için 24 saatlik likidite derinliği, ${parsedHorizon.label} vadeli trend ivmesi, BTC/ETH göreli gücü ve tarihsel çöküş dayanıklılığı (Max Drawdown) analiz edilmiştir.`,
    marginTrend:
      company.totalReturn !== null
        ? `Seçilen dönemde toplam getiri %${company.totalReturn.toFixed(1)}, yıllıklandırılmış getiri %${company.annualizedReturn?.toFixed(1) ?? "N/A"}.`
        : "Tarihsel getiri serisi sınırlı.",
    debtAndLiquidity:
      quoteVolume > 0
        ? `24 saatlik Binance spot işlem hacmi $${(quoteVolume / 1e6).toFixed(1)}M USDT. ${quoteVolume > 50_000_000 ? "Yüksek piyasa derinliği." : "Orta/sınırlı likidite derinliği; kademe kaymasına (slippage) dikkat edilmeli."}`
        : "24 saatlik hacim verisi alınamadı.",
    cashFlowQuality:
      company.maxDrawdown !== null
        ? `Seçilen dönemde azami düşüş (Max Drawdown) %${Math.abs(company.maxDrawdown).toFixed(1)}, yıllık volatilite %${company.annualizedVolatility?.toFixed(1) ?? "N/A"}.`
        : "Max Drawdown hesaplanamadı.",
    quarterlyHighlights: [
      `24s Hacim: $${(quoteVolume / 1e6).toFixed(1)}M USDT`,
      company.totalReturn !== null ? `${parsedHorizon.label} Getiri: %${company.totalReturn.toFixed(1)}` : "Getiri: N/A",
      company.maxDrawdown !== null ? `Max Drawdown: -%${Math.abs(company.maxDrawdown).toFixed(1)}` : "Max DD: N/A",
      company.annualizedVolatility !== null ? `Yıllık Volatilite: %${company.annualizedVolatility.toFixed(1)}` : "Volatilite: N/A",
    ],
    keyWatchpoints: [
      "Bitcoin (BTCUSDT) dominansı ve toplam kripto piyasa likiditesiyle olan korelasyonu izleyin.",
      "Yüksek kaldıraçlı işlemlerden kaçının; kripto varlıklarda %40-%70 arası dönemsel geri çekilmeler olağandır.",
      "Ağ kilit açılımları (token unlocks), protokol güncellemeleri ve regülasyon haberlerini takip edin.",
    ],
  };

  const syntheticFundamentals: FundamentalAnalysis = {
    symbol,
    companyName: `${baseAsset} / USDT Kripto Varlık`,
    sector: "Kripto & Blokzincir",
    score,
    health: healthStatus === "strong" ? "strong" : healthStatus === "cautious" ? "weak" : "mixed",
    summary: quarterlyCommentary.healthSummary,
    metrics: [],
    raw: {
      marketCap: quoteVolume,
      peRatio: null,
      priceToBook: null,
      enterpriseToEbitda: null,
      revenueGrowth: null,
      earningsGrowth: null,
      grossMargin: null,
      operatingMargin: null,
      netMargin: null,
      debtToEquity: null,
      currentRatio: null,
      freeCashFlow: null,
      returnOnEquity: null,
      returnOnAssets: null,
      dividendYield: null,
    },
  };

  return {
    symbol,
    companyName: `${baseAsset} / USDT`,
    sector: "Kripto Varlık (Spot USDT)",
    horizonYears: horizon,
    horizonLabel: parsedHorizon.label,
    score,
    confidence,
    coveragePercent,
    stance,
    summary: buildSummary(score, confidence, parsedHorizon.label),
    dimensions,
    fundamentals: syntheticFundamentals,
    peers: {
      available: false,
      sampleSize: 2,
      symbols: ["BTCUSDT", sectorBenchmark],
      peMedian: null,
      priceToBookMedian: null,
      enterpriseToEbitdaMedian: null,
      note: "Kripto varlıklarda F/K veya PD/DD çarpanı bulunmaz; kıyaslama BTCUSDT ve ETHUSDT göreli performansı üzerinden yapılır.",
    },
    performance: {
      company,
      market,
      sector,
      marketBenchmark,
      sectorBenchmark,
    },
    projections,
    quarterlyCommentary,
    catalysts: [
      quoteVolume > 50_000_000
        ? `Yüksek 24s spot hacim ($${(quoteVolume / 1e6).toFixed(1)}M) kurumsal ve bireysel likiditeyi destekliyor.`
        : "İşlem hacmindeki artışlar trend teyidi için yakından izlenmeli.",
      company.annualizedReturn !== null && market.annualizedReturn !== null && company.annualizedReturn > market.annualizedReturn
        ? `Seçilen ${parsedHorizon.label} dönemde BTCUSDT getirisinin üzerinde pozitif ayrışma (alfa) mevcut.`
        : "BTCUSDT liderliğindeki piyasa döngüsü ana yön belirleyici olmaya devam ediyor.",
    ],
    risks: [
      company.maxDrawdown !== null && company.maxDrawdown < -40
        ? `Seçilen dönemde -%${Math.abs(company.maxDrawdown).toFixed(1)} azami düşüş yaşanmış; sert volatilite riski yüksek.`
        : "Kripto piyasasında ani likidite çekilmeleri ve yüksek oynaklık her zaman temel risktir.",
      "Şirket bilançosu veya nakit akışı çıpası olmadığından fiyatlamalar tamamen arz/talep ve makro likiditeye duyarlıdır.",
    ],
    checklist: quarterlyCommentary.keyWatchpoints,
    events: news.slice(0, 10),
    dataNotes: [
      `Skor veri kapsamı: %${coveragePercent}.`,
      "Kripto varlıklarda şirket bilançosu bulunmadığından; likidite derinliği, döngü momentumu, Max Drawdown ve BTC/ETH göreli gücü esas alınmıştır.",
      "Haberler puana dahil edilmez; yalnızca ekosistem gelişmelerini takip etmek için sunulur.",
    ],
    updatedAt: new Date().toISOString(),
  };
}

async function fetchCryptoPerformance(symbol: string, horizon: LongTermHorizon): Promise<PricePerformance> {
  const parsed = parseHorizon(horizon);
  const interval = parsed.years <= 1 ? "1d" : "1w";
  const limit =
    parsed.key === "3m"
      ? 90
      : parsed.key === "6m"
        ? 180
        : parsed.key === "1y"
          ? 365
          : parsed.key === "3y"
            ? 156
            : 260;

  const cacheKey = createCacheKey(["crypto-perf", symbol, interval, limit]);
  const cached = await getCached(cacheKey, 600, async () => {
    const params = new URLSearchParams({
      symbol,
      interval,
      limit: String(limit),
    });
    const response = await fetch(`https://api.binance.com/api/v3/klines?${params}`, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      throw new Error(`Binance fiyat geçmişi alınamadı: ${response.status}`);
    }
    const raw = (await response.json()) as unknown[][];
    const points: PricePoint[] = raw.flatMap((item) => {
      const timestamp = Number(item[0]) / 1000;
      const close = Number(item[4]);
      return Number.isFinite(timestamp) && Number.isFinite(close) && close > 0
        ? [{ timestamp, close }]
        : [];
    });

    if (points.length < 2) {
      return emptyPerformance(symbol);
    }

    const latestPrice = points.at(-1)!.close;
    const totalReturn = (latestPrice / points[0].close - 1) * 100;
    const elapsedYears = Math.max(
      (points.at(-1)!.timestamp - points[0].timestamp) / (365.25 * 24 * 60 * 60),
      0.05,
    );
    const returns = points.slice(1).map((point, index) => point.close / points[index].close - 1);
    const multiplier = interval === "1d" ? Math.sqrt(365) : Math.sqrt(52);
    let peak = points[0].close;
    let maxDrawdown = 0;
    for (const point of points) {
      peak = Math.max(peak, point.close);
      maxDrawdown = Math.min(maxDrawdown, (point.close / peak - 1) * 100);
    }

    return {
      symbol,
      totalReturn,
      annualizedReturn: (Math.pow(latestPrice / points[0].close, 1 / Math.max(elapsedYears, 0.1)) - 1) * 100,
      annualizedVolatility: standardDeviation(returns) * multiplier * 100,
      maxDrawdown,
      latestPrice,
    };
  });

  return cached.value;
}

async function fetchBestFundamentals(
  market: Exclude<MarketKind, "crypto">,
  symbol: string,
) {
  if (market === "stocks" && process.env.FMP_API_KEY) {
    try {
      return await fetchFundamentals(symbol);
    } catch {
      return fetchYahooFundamentals(symbol);
    }
  }

  return fetchYahooFundamentals(symbol);
}

function buildDimensions(
  fundamentals: FundamentalAnalysis,
  peers: PeerBenchmark,
  company: PricePerformance,
  market: PricePerformance,
  sector: PricePerformance | null,
): ScoreDimension[] {
  const raw = fundamentals.raw;
  const normalizedSector = normalizeSector(fundamentals.sector);
  const isFinancial = normalizedSector.includes("financial");
  const valuationBands = getSectorValuationBands(normalizedSector);
  const qualityValues = [
    scoreHigher(raw.netMargin, isFinancial ? 8 : 5, isFinancial ? 22 : 18),
    scoreHigher(raw.returnOnEquity, 8, 20),
    scoreHigher(raw.returnOnAssets, 3, 10),
    raw.freeCashFlow === null || isFinancial ? null : raw.freeCashFlow > 0 ? 78 : 22,
  ];
  const growthValues = [
    scoreHigher(raw.revenueGrowth, 0, 15),
    scoreHigher(raw.earningsGrowth, 0, 15),
  ];
  const balanceValues = isFinancial
    ? [scoreHigher(raw.returnOnEquity, 8, 20)]
    : [scoreLower(raw.debtToEquity, 2.5, 0.5), scoreHigher(raw.currentRatio, 0.9, 1.8)];
  const valuationValues = [
    scoreRelativeLower(raw.peRatio, peers.peMedian, valuationBands.pe[0], valuationBands.pe[1]),
    scoreRelativeLower(
      raw.priceToBook,
      peers.priceToBookMedian,
      valuationBands.priceToBook[0],
      valuationBands.priceToBook[1],
    ),
    isFinancial
      ? null
      : scoreRelativeLower(
          raw.enterpriseToEbitda,
          peers.enterpriseToEbitdaMedian,
          valuationBands.enterpriseToEbitda[0],
          valuationBands.enterpriseToEbitda[1],
        ),
  ];
  const relativeValues = [
    scoreSpread(company.annualizedReturn, market.annualizedReturn),
    scoreSpread(company.annualizedReturn, sector?.annualizedReturn ?? null),
  ];
  const riskValues = [
    scoreLower(company.maxDrawdown === null ? null : Math.abs(company.maxDrawdown), 55, 20),
    scoreLower(company.annualizedVolatility, 55, 20),
  ];

  return [
    dimension("quality", "Sirket kalitesi", 25, qualityValues, "Marjlar, sermaye verimliligi ve nakit uretimi"),
    dimension("growth", "Buyume", 20, growthValues, "Gelir ve kâr buyumesinin surdurulebilirligi"),
    dimension("balance", "Bilanco dayanıkliligi", 15, balanceValues, isFinancial ? "Finans sirketine uygun sermaye verimliligi" : "Borc ve kisa vadeli odeme gucu"),
    dimension("valuation", "Sektore gore degerleme", 20, valuationValues, peers.available ? `${peers.sampleSize} emsal sirketin medyaniyla F/K, PD/DD ve FD/FAVOK kiyaslamasi` : "Emsal veri yok; sektor duyarlı mutlak degerleme bantlari"),
    dimension("relative", "Goreli performans", 10, relativeValues, "Piyasa ve sektor gostergesine gore yilliklandirilmis getiri"),
    dimension("risk", "Fiyat riski", 10, riskValues, "Volatilite ve azami gerileme"),
  ];
}

function dimension(
  id: ScoreDimension["id"],
  label: string,
  weight: number,
  values: Array<number | null>,
  detail: string,
): ScoreDimension {
  const available = values.filter((value): value is number => value !== null);
  return {
    id,
    label,
    weight,
    score: available.length ? Math.round(average(available)) : null,
    summary: available.length ? detail : `${detail}; yeterli veri yok`,
  };
}

async function fetchPerformance(symbol: string, horizon: LongTermHorizon): Promise<PricePerformance> {
  const parsed = parseHorizon(horizon);
  const params = new URLSearchParams({
    interval: parsed.years <= 0.5 ? "1d" : "1wk",
    range: parsed.yahooRange,
    events: "history",
  });
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`,
    { next: { revalidate: 3600 } },
  );
  if (!response.ok) throw new Error(`Fiyat geçmişi alınamadı: ${response.status}`);
  const payload = (await response.json()) as {
    chart?: { result?: Array<{ timestamp?: number[]; indicators?: { adjclose?: Array<{ adjclose?: Array<number | null> }> } }> };
  };
  const result = payload.chart?.result?.[0];
  const closes = result?.indicators?.adjclose?.[0]?.adjclose ?? [];
  const points: PricePoint[] = (result?.timestamp ?? []).flatMap((timestamp, index) => {
    const close = closes[index];
    return typeof close === "number" && Number.isFinite(close) ? [{ timestamp, close }] : [];
  });
  if (points.length < 2) return emptyPerformance(symbol);

  const latestPrice = points.at(-1)!.close;
  const totalReturn = ((latestPrice / points[0].close) - 1) * 100;
  const elapsedYears = Math.max(
    (points.at(-1)!.timestamp - points[0].timestamp) / (365.25 * 24 * 60 * 60),
    0.05,
  );
  const returns = points.slice(1).map((point, index) => point.close / points[index].close - 1);
  const multiplier = parsed.years <= 0.5 ? Math.sqrt(252) : Math.sqrt(52);
  let peak = points[0].close;
  let maxDrawdown = 0;
  for (const point of points) {
    peak = Math.max(peak, point.close);
    maxDrawdown = Math.min(maxDrawdown, (point.close / peak - 1) * 100);
  }

  return {
    symbol,
    totalReturn,
    annualizedReturn: (Math.pow(latestPrice / points[0].close, 1 / Math.max(elapsedYears, 0.1)) - 1) * 100,
    annualizedVolatility: standardDeviation(returns) * multiplier * 100,
    maxDrawdown,
    latestPrice,
  };
}

function buildPriceProjections(
  symbol: string,
  market: Exclude<MarketKind, "crypto">,
  horizon: LongTermHorizon,
  fundamentals: FundamentalAnalysis,
  companyPerf: PricePerformance,
  peers: PeerBenchmark,
): PriceProjections {
  const parsed = parseHorizon(horizon);
  const years = parsed.years;
  const currentPrice = companyPerf.latestPrice ?? null;
  const currency = market === "bist" ? "₺" : "$";

  if (!currentPrice || currentPrice <= 0) {
    const emptyScenario = (name: "bull" | "base" | "bear", label: string, tone: "positive" | "default" | "danger"): PriceScenario => ({
      name,
      label,
      tone,
      targetPriceLow: 0,
      targetPriceHigh: 0,
      targetPriceMid: 0,
      expectedReturnLowPct: 0,
      expectedReturnHighPct: 0,
      expectedReturnMidPct: 0,
      probabilityLabel: "%30 Olasılık",
      keyDrivers: ["Fiyat geçmişi verisi yetersiz"],
    });

    return {
      currentPrice: null,
      currency,
      horizonKey: horizon,
      horizonLabel: parsed.label,
      horizonYearsValue: years,
      scenarios: {
        bull: emptyScenario("bull", "Boğa Senaryosu", "positive"),
        base: emptyScenario("base", "Baz Senaryo", "default"),
        bear: emptyScenario("bear", "Ayı Senaryosu", "danger"),
      },
      riskRewardRatio: null,
      methodologyNote: "Fiyat verisi yetersiz olduğu için senaryo hedef fiyatları hesaplanamadı.",
    };
  }

  const raw = fundamentals.raw;
  const volAnnual = (companyPerf.annualizedVolatility ?? 25) / 100;
  const volHorizon = volAnnual * Math.sqrt(years);
  const earningsGrowth = raw.earningsGrowth !== null ? raw.earningsGrowth / 100 : 0.08;
  const revenueGrowth = raw.revenueGrowth !== null ? raw.revenueGrowth / 100 : 0.06;
  const blendedGrowth = Math.max(-0.15, Math.min(0.35, (earningsGrowth + revenueGrowth) / 2));

  // Base Scenario
  const baseGrowthRate = blendedGrowth;
  const basePriceMid = currentPrice * Math.pow(1 + baseGrowthRate, years);
  const baseLow = basePriceMid * (1 - 0.25 * volHorizon);
  const baseHigh = basePriceMid * (1 + 0.25 * volHorizon);

  // Bull Scenario (Optimistic)
  const bullGrowthRate = Math.max(blendedGrowth * 1.3, blendedGrowth + 0.08);
  const bullValuationBoost = (raw.peRatio && peers.peMedian && raw.peRatio < peers.peMedian) ? 1.12 : 1.05;
  const bullPriceMid = currentPrice * Math.pow(1 + bullGrowthRate, years) * bullValuationBoost * (1 + 0.4 * volHorizon);
  const bullLow = bullPriceMid * 0.92;
  const bullHigh = bullPriceMid * 1.12;

  // Bear Scenario (Pessimistic)
  const bearGrowthRate = Math.min(blendedGrowth * 0.5, blendedGrowth - 0.10);
  const maxDrawdownPct = Math.abs(companyPerf.maxDrawdown ?? 30) / 100;
  const bearDrawdownFactor = Math.max(0.45, 1 - Math.max(volHorizon * 1.1, maxDrawdownPct * 0.6));
  const bearPriceMid = currentPrice * Math.pow(1 + Math.min(0, bearGrowthRate), years) * bearDrawdownFactor;
  const bearLow = bearPriceMid * 0.85;
  const bearHigh = bearPriceMid * 1.08;

  const toPct = (target: number) => Math.round(((target - currentPrice) / currentPrice) * 100 * 10) / 10;

  const bullReturnMid = toPct(bullPriceMid);
  const bearReturnMid = toPct(bearPriceMid);

  const riskReward = (bullReturnMid > 0 && bearReturnMid < 0)
    ? Math.round((bullReturnMid / Math.abs(bearReturnMid)) * 10) / 10
    : null;

  return {
    currentPrice: Math.round(currentPrice * 100) / 100,
    currency,
    horizonKey: horizon,
    horizonLabel: parsed.label,
    horizonYearsValue: years,
    scenarios: {
      bull: {
        name: "bull",
        label: "Boğa (İyimser) Senaryo",
        tone: "positive",
        targetPriceLow: Math.round(bullLow * 100) / 100,
        targetPriceHigh: Math.round(bullHigh * 100) / 100,
        targetPriceMid: Math.round(bullPriceMid * 100) / 100,
        expectedReturnLowPct: toPct(bullLow),
        expectedReturnHighPct: toPct(bullHigh),
        expectedReturnMidPct: bullReturnMid,
        probabilityLabel: "%25-%30 Olasılık",
        keyDrivers: [
          `Yıllıklandırılmış kâr/gelir ivmesi %${(bullGrowthRate * 100).toFixed(1)} üzerine çıkması`,
          "Sektörel çarpanlarda genişleme ve güçlü talep ortamı",
          `Volatilite kanalının üst bandına (%${(volHorizon * 100).toFixed(0)} hareket) doğru eğilim`,
        ],
      },
      base: {
        name: "base",
        label: "Baz (Beklenen) Senaryo",
        tone: "default",
        targetPriceLow: Math.round(baseLow * 100) / 100,
        targetPriceHigh: Math.round(baseHigh * 100) / 100,
        targetPriceMid: Math.round(basePriceMid * 100) / 100,
        expectedReturnLowPct: toPct(baseLow),
        expectedReturnHighPct: toPct(baseHigh),
        expectedReturnMidPct: toPct(basePriceMid),
        probabilityLabel: "%50-%55 Olasılık",
        keyDrivers: [
          `Mevcut kârlılık trendi (%${(baseGrowthRate * 100).toFixed(1)} tahmini yıllık büyüme)`,
          "Tarihsel ortalama çarpan seviyelerinin korunması",
          `${parsed.label} vadede piyasa beklentileriyle paralel performans`,
        ],
      },
      bear: {
        name: "bear",
        label: "Ayı (Kötümser) Senaryo",
        tone: "danger",
        targetPriceLow: Math.round(bearLow * 100) / 100,
        targetPriceHigh: Math.round(bearHigh * 100) / 100,
        targetPriceMid: Math.round(bearPriceMid * 100) / 100,
        expectedReturnLowPct: toPct(bearLow),
        expectedReturnHighPct: toPct(bearHigh),
        expectedReturnMidPct: bearReturnMid,
        probabilityLabel: "%15-%20 Olasılık",
        keyDrivers: [
          "Bilanço marjlarında daralma veya kâr büyümesinde yavaşlama",
          `Sektörel değerleme çarpanlarında sıkılaşma ve azami %${(maxDrawdownPct * 100).toFixed(0)} gerileme riski`,
          "Makroekonomik veya sektörel olumsuzluklar",
        ],
      },
    },
    riskRewardRatio: riskReward,
    methodologyNote: `Tahminler; şirketin büyüme oranları, tarihsel %${(volAnnual * 100).toFixed(0)} volatilite kanalı ve sektörel F/K & PD/DD çarpanları kullanılarak hesaplanan matematiksel projeksiyonlardır. Garanti vaat etmez.`,
  };
}

function buildQuarterlyCommentary(
  fundamentals: FundamentalAnalysis,
  horizon: LongTermHorizon,
): BalanceSheetCommentary {
  const raw = fundamentals.raw;
  const parsed = parseHorizon(horizon);
  const isShortTerm = parsed.years <= 0.5;

  let healthStatus: BalanceSheetCommentary["healthStatus"] = "moderate";
  if (fundamentals.health === "strong" && (raw.debtToEquity === null || raw.debtToEquity <= 1.5)) {
    healthStatus = "strong";
  } else if (fundamentals.health === "weak" || (raw.debtToEquity !== null && raw.debtToEquity > 2.5)) {
    healthStatus = "cautious";
  }

  const healthTitle =
    healthStatus === "strong"
      ? "Sağlam Bilanço ve Yüksek Finansal Dayanıklılık"
      : healthStatus === "cautious"
        ? "Temkinli Bilanço Yapısı ve Finansman Riski"
        : "Dengeli Bilanço ve Orta Düzey Finansal Yapı";

  const healthSummary =
    healthStatus === "strong"
      ? `Şirketin sermaye yapısı ve nakit akışları ${parsed.label} vadeli riskleri göğüslemek için son derece elverişli. Borç yükü kontrol altında ve özkaynak verimliliği yüksek.`
      : healthStatus === "cautious"
        ? `Şirketin borçluluk oranları veya nakit üretimi ${parsed.label} vadeli dalgalanmalara karşı hassasiyet yaratıyor. Çeyreklik borç ödeme gücü yakından izlenmeli.`
        : `Şirket makul düzeyde bilanço büyüklüklerine sahip. ${parsed.label} periyotta kârlılık artışı ve borç yönetimi dengede duruyor.`;

  const marginTrend =
    raw.grossMargin !== null || raw.operatingMargin !== null
      ? `Brüt marj %${raw.grossMargin?.toFixed(1) ?? "N/A"}, faaliyet marjı %${raw.operatingMargin?.toFixed(1) ?? "N/A"}, net kâr marjı %${raw.netMargin?.toFixed(1) ?? "N/A"}. ${
          (raw.operatingMargin ?? 0) > 12 ? "Operasyonel kârlılık yüksek seviyede." : "Faaliyet marjları sektör ortalamasına yakın."
        }`
      : "Çeyreklik marj detayları eksiksiz alınamadı; genel kârlılık rasyoları esas alındı.";

  const debtAndLiquidity =
    raw.debtToEquity !== null || raw.currentRatio !== null
      ? `Borç/Özkaynak oranı ${raw.debtToEquity?.toFixed(2) ?? "N/A"}, Cari Oran ${raw.currentRatio?.toFixed(2) ?? "N/A"}. ${
          (raw.currentRatio ?? 0) >= 1.2
            ? "Kısa vadeli yükümlülükleri karşılama kapasitesi (likidite) güvenli bölgede."
            : "Kısa vadeli likidite sıkı izlenmeli."
        }`
      : "Borç ve likidite oranları sınırlı veri içeriyor.";

  const cashFlowQuality =
    raw.freeCashFlow !== null
      ? raw.freeCashFlow > 0
        ? `Pozitif Serbest Nakit Akışı (${(raw.freeCashFlow / 1e6).toFixed(1)}M). Nakit yaratma gücü yatırımları ve sermaye ihtiyacını destekliyor.`
        : "Serbest nakit akışı negatif veya sınırlı. Şirketin dış finansman veya işletme sermayesi ihtiyacı bulunabilir."
      : "Serbest nakit akışı verisi doğrudan mevcut değil.";

  const quarterlyHighlights: string[] = [];
  if (raw.revenueGrowth !== null) {
    quarterlyHighlights.push(`Satış Gelirleri Büyümesi: Yıllık/Çeyreklik %${raw.revenueGrowth.toFixed(1)}`);
  }
  if (raw.earningsGrowth !== null) {
    quarterlyHighlights.push(`Net Kâr Büyümesi: %${raw.earningsGrowth.toFixed(1)}`);
  }
  if (raw.returnOnEquity !== null) {
    quarterlyHighlights.push(`Özkaynak Kârlılığı (ROE): %${raw.returnOnEquity.toFixed(1)}`);
  }
  if (raw.returnOnAssets !== null) {
    quarterlyHighlights.push(`Aktif Kârlılığı (ROA): %${raw.returnOnAssets.toFixed(1)}`);
  }

  const keyWatchpoints: string[] = [
    isShortTerm
      ? "Gelecek çeyrek bilanço açıklanma tarihini ve favök marjı beklentilerini takip edin."
      : `${parsed.label} dönem boyunca çeyreklik kâr marjlarındaki istikrarı doğrulatın.`,
    raw.debtToEquity && raw.debtToEquity > 1.8
      ? "Faiz giderlerinin net kâr üzerindeki baskısını çeyreklik dipnotlarda inceleyin."
      : "Sektörel talep değişiminin gelirler üzerindeki etkisini izleyin.",
    "Yönetim kurulu rehberliği (guidance) ve sektörel beklenti revizyonlarını kontrol edin.",
  ];

  return {
    healthStatus,
    healthTitle,
    healthSummary,
    marginTrend,
    debtAndLiquidity,
    cashFlowQuality,
    quarterlyHighlights,
    keyWatchpoints,
  };
}

async function fetchPeerBenchmark(
  market: Exclude<MarketKind, "crypto">,
  symbol: string,
): Promise<PeerBenchmark> {
  const apiKey = process.env.FMP_API_KEY;
  if (market !== "stocks" || !apiKey) return unavailablePeers();

  const peerResponse = await fetch(
    `https://financialmodelingprep.com/api/v4/stock_peers?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`,
    { next: { revalidate: 86400 } },
  );
  if (!peerResponse.ok) return unavailablePeers();
  const peerPayload = (await peerResponse.json()) as Array<{ peersList?: string[] }>;
  const symbols = (peerPayload[0]?.peersList ?? []).slice(0, 8);
  const results = await Promise.allSettled(
    symbols.map(async (peer) => {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/ratios-ttm/${encodeURIComponent(peer)}?apikey=${apiKey}`,
        { next: { revalidate: 21600 } },
      );
      if (!response.ok) throw new Error("Peer ratios unavailable");
      const data = (await response.json()) as FmpPeerRatios[];
      return data[0];
    }),
  );
  const ratios = results.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : [],
  );
  if (!ratios.length) return unavailablePeers();

  return {
    available: true,
    sampleSize: ratios.length,
    symbols: symbols.slice(0, ratios.length),
    peMedian: median(ratios.map((item) => safePositive(item.priceEarningsRatioTTM))),
    priceToBookMedian: median(ratios.map((item) => safePositive(item.priceToBookRatioTTM))),
    enterpriseToEbitdaMedian: median(
      ratios.map((item) => safePositive(item.enterpriseValueMultipleTTM)),
    ),
    note: "FMP emsal sirket listesindeki guncel TTM oranlarinin medyani.",
  };
}

async function fetchCompanyNews(companyName: string, symbol: string): Promise<ResearchEvent[]> {
  const query = `(${companyName} OR ${symbol}) (earnings OR guidance OR revenue OR margin OR capex) when:30d`;
  const params = new URLSearchParams({ q: query, hl: "en-US", gl: "US", ceid: "US:en" });
  const response = await fetch(`https://news.google.com/rss/search?${params}`, {
    next: { revalidate: 1800 },
  });
  if (!response.ok) throw new Error(`Haber kaynagi erisilemedi: ${response.status}`);
  const xml = await response.text();
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g))
    .slice(0, 8)
    .flatMap((match) => {
      const item = match[1];
      const title = decodeXml(readXmlTag(item, "title"));
      const url = decodeXml(readXmlTag(item, "link"));
      const date = readXmlTag(item, "pubDate");
      const source = decodeXml(readXmlTag(item, "source")) || "Google News";
      if (!title || !url) return [];
      return [{ category: "news" as const, title, url, source, date: toIsoDate(date) }];
    });
}

async function fetchRecentSecFilings(symbol: string): Promise<ResearchEvent[]> {
  const userAgent = process.env.SEC_USER_AGENT;
  if (!userAgent) throw new Error("SEC_USER_AGENT tanimli degil");
  const headers = { "User-Agent": userAgent, Accept: "application/json" };
  const tickersResponse = await fetch("https://www.sec.gov/files/company_tickers.json", {
    headers,
    next: { revalidate: 86400 },
  });
  if (!tickersResponse.ok) throw new Error(`SEC ticker listesi alinamadi: ${tickersResponse.status}`);
  const tickers = (await tickersResponse.json()) as Record<string, { cik_str: number; ticker: string }>;
  const company = Object.values(tickers).find(
    (item) => item.ticker.toUpperCase() === symbol.toUpperCase(),
  );
  if (!company) return [];
  const cik = String(company.cik_str).padStart(10, "0");
  const response = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
    headers,
    next: { revalidate: 1800 },
  });
  if (!response.ok) throw new Error(`SEC bildirimleri alinamadi: ${response.status}`);
  const payload = (await response.json()) as {
    filings?: { recent?: { accessionNumber?: string[]; filingDate?: string[]; form?: string[]; primaryDocument?: string[] } };
  };
  const recent = payload.filings?.recent;
  if (!recent) return [];
  const allowed = new Set(["10-K", "10-Q", "8-K", "20-F", "6-K"]);
  return (recent.form ?? []).flatMap((form, index) => {
    if (!allowed.has(form)) return [];
    const accession = recent.accessionNumber?.[index];
    const document = recent.primaryDocument?.[index];
    if (!accession || !document) return [];
    const accessionPath = accession.replaceAll("-", "");
    return [{
      category: "filing" as const,
      date: recent.filingDate?.[index] ?? "",
      source: "SEC EDGAR",
      title: `${form} resmi sirket bildirimi`,
      url: `https://www.sec.gov/Archives/edgar/data/${company.cik_str}/${accessionPath}/${document}`,
    }];
  }).slice(0, 6);
}

function buildCatalysts(
  fundamentals: FundamentalAnalysis,
  company: PricePerformance,
  market: PricePerformance,
) {
  const raw = fundamentals.raw;
  return [
    raw.revenueGrowth !== null && raw.revenueGrowth >= 8
      ? `Gelir buyumesi %${raw.revenueGrowth.toFixed(1)} ile pozitif.`
      : "Gelir buyumesinin gelecek bilancolarda yeniden teyit edilmesi gerekiyor.",
    raw.freeCashFlow !== null && raw.freeCashFlow > 0
      ? "Serbest nakit akisi pozitif; buyume ve borc servisi icin alan sagliyor."
      : "Serbest nakit akisi pozitif teyit vermiyor.",
    company.annualizedReturn !== null && market.annualizedReturn !== null && company.annualizedReturn > market.annualizedReturn
      ? "Secilen donemde piyasa gostergesinin uzerinde yilliklandirilmis getiri var."
      : "Piyasa gostergesine gore kalici ustun performans henuz teyitli degil.",
  ];
}

function buildRisks(
  fundamentals: FundamentalAnalysis,
  peers: PeerBenchmark,
  company: PricePerformance,
  market: PricePerformance,
) {
  const raw = fundamentals.raw;
  const risks = [
    raw.debtToEquity !== null && raw.debtToEquity > 2
      ? `Borc/ozsermaye ${raw.debtToEquity.toFixed(2)}; finansman riski yakindan izlenmeli.`
      : "Borc vadesi ve faiz maliyeti her bilanço doneminde kontrol edilmeli.",
    company.maxDrawdown !== null && company.maxDrawdown < -35
      ? `Secilen donemde azami gerileme %${Math.abs(company.maxDrawdown).toFixed(1)}; pozisyon boyutu buna gore sinirlanmali.`
      : "Gecmis fiyat riski gelecek kaybi sinirlamaz; kademeli alim ve cesitlendirme gerekli.",
  ];
  if (raw.peRatio !== null && peers.peMedian !== null && raw.peRatio > peers.peMedian * 1.25) {
    risks.push("F/K emsal medyaninin belirgin uzerinde; buyume beklentisi bozulursa carpanda daralma riski var.");
  }
  if (company.annualizedReturn !== null && market.annualizedReturn !== null && company.annualizedReturn < market.annualizedReturn) {
    risks.push("Sirket, secilen donemde piyasa gostergesinin gerisinde kalmis.");
  }
  return risks;
}

function buildChecklist(
  horizonLabel: string,
  fundamentals: FundamentalAnalysis,
  peers: PeerBenchmark,
) {
  return [
    `Tezi ${horizonLabel} ufukta izle; her çeyrek gelir, faaliyet marjı ve serbest nakit akışındaki yönü kaydet.`,
    peers.available
      ? "F/K, PD/DD ve FD/FAVÖK priminin emsallere göre büyüme ve kârlılıkla haklı olup olmadığını kontrol et."
      : "Canlı emsal verisi olmadığı için değerleme kararını tek bir mutlak çarpanla verme.",
    `Sektör (${fundamentals.sector}) için talep, regülasyon, sermaye ihtiyacı ve rekabet koşullarını her bilanço sonrasında yeniden değerlendir.`,
    "Yatırım tezini bozan koşulları önceden yaz: iki dönem büyüme/marj bozulması, kalıcı negatif nakit akışı veya kontrolsüz borçlanma.",
  ];
}

function buildDataNotes(
  peers: PeerBenchmark,
  filings: PromiseSettledResult<ResearchEvent[]>,
  news: PromiseSettledResult<ResearchEvent[]>,
  coveragePercent: number,
) {
  const notes = [`Skor veri kapsami: %${coveragePercent}. Eksik metrikler puana sifir olarak degil, kapsama disi olarak yansitilir.`];
  notes.push(peers.note);
  if (filings.status === "rejected") notes.push("SEC resmi bildirimleri gösterilemedi; SEC_USER_AGENT ayari veya ag erisimi kontrol edilmeli.");
  if (news.status === "rejected") notes.push("Guncel haber akisi erisilemedi; haber yok sonucu cikarilmadi.");
  notes.push("Haberler puana dahil edilmez; bilanço tezini dogrulamak veya sorgulamak icin kanit olarak sunulur.");
  return notes;
}

function buildSummary(score: number, confidence: LongTermResearch["confidence"], horizonLabel: string) {
  if (score >= 72 && confidence !== "low") return `${horizonLabel} vadeli ufukta kalite, değerleme ve göreli performans birlikte destekleyici. Tek seferde alım yerine makul güvenlik marjıyla kademeli biriktirme araştırılabilir.`;
  if (score < 48) return `${horizonLabel} vadeli ufukta riskler mevcut verilerle ağır basıyor. Yeni pozisyon yerine bilanço, değerleme ve trendde iyileşme teyidi beklenmeli.`;
  return `${horizonLabel} vadeli ufukta görünüm karışık. Şirket izlenebilir ancak yeni alım için sektör emsalleri, sonraki bilanço ve fiyatlama birlikte teyit vermeli.`;
}

function resolveSectorEtf(sector: string) {
  const normalized = normalizeSector(sector);
  const match = Object.entries(sectorEtfs).find(([key]) => normalized.includes(key));
  return match?.[1] ?? null;
}

function getSectorValuationBands(sector: string) {
  if (sector.includes("technology") || sector.includes("communication")) {
    return { pe: [22, 50], priceToBook: [4, 14], enterpriseToEbitda: [14, 32] };
  }
  if (sector.includes("financial")) {
    return { pe: [9, 22], priceToBook: [1.2, 4], enterpriseToEbitda: [10, 24] };
  }
  if (sector.includes("utility") || sector.includes("utilities")) {
    return { pe: [14, 30], priceToBook: [1.5, 5], enterpriseToEbitda: [9, 20] };
  }
  if (sector.includes("energy") || sector.includes("material")) {
    return { pe: [10, 25], priceToBook: [1.5, 5], enterpriseToEbitda: [7, 16] };
  }
  if (sector.includes("health")) {
    return { pe: [18, 42], priceToBook: [3, 10], enterpriseToEbitda: [13, 28] };
  }
  return { pe: [15, 35], priceToBook: [2, 7], enterpriseToEbitda: [10, 24] };
}

function normalizeSector(value: string) {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

function scoreHigher(value: number | null, weak: number, strong: number) {
  if (value === null) return null;
  return clamp(25 + ((value - weak) / Math.max(strong - weak, 0.01)) * 60, 15, 90);
}

function scoreLower(value: number | null, weak: number, strong: number) {
  if (value === null) return null;
  return clamp(85 - ((value - strong) / Math.max(weak - strong, 0.01)) * 60, 15, 90);
}

function scoreRelativeLower(
  value: number | null,
  peerMedian: number | null,
  attractive: number,
  expensive: number,
) {
  if (value === null || value <= 0) return null;
  if (peerMedian !== null && peerMedian > 0) {
    return clamp(70 - ((value / peerMedian) - 1) * 55, 15, 90);
  }
  return scoreLower(value, expensive, attractive);
}

function scoreSpread(company: number | null, benchmark: number | null) {
  if (company === null || benchmark === null) return null;
  return clamp(50 + (company - benchmark) * 2, 15, 90);
}

function emptyPerformance(symbol: string): PricePerformance {
  return { symbol, totalReturn: null, annualizedReturn: null, annualizedVolatility: null, maxDrawdown: null };
}

function unavailablePeers(): PeerBenchmark {
  return {
    available: false,
    sampleSize: 0,
    symbols: [],
    peMedian: null,
    priceToBookMedian: null,
    enterpriseToEbitdaMedian: null,
    note: "Canli emsal medyani bulunamadi; FMP_API_KEY/plani veya piyasa kapsami kontrol edilmeli.",
  };
}

function settledValue<T>(result: PromiseSettledResult<T>, fallback: T) {
  return result.status === "fulfilled" ? result.value : fallback;
}

function safePositive(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function median(values: Array<number | null>) {
  const sorted = values.filter((value): value is number => value !== null).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => Math.pow(value - mean, 2))));
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function readXmlTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.replace(/^<!\[CDATA\[|\]\]>$/g, "").trim() ?? "";
}

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function toIsoDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}
