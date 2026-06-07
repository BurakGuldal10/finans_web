export type Candle = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type AnalysisResult = {
  symbol: string;
  price: number;
  verdict: "positive" | "neutral" | "risky";
  score: number;
  trendStrength: number;
  volatility: {
    percent: number;
    regime: "low" | "normal" | "high";
  };
  levels: {
    support: number;
    resistance: number;
    rangeLow: number;
    rangeHigh: number;
  };
  buyZone: [number, number];
  stopLoss: number;
  targetOne: number;
  targetTwo: number;
  riskReward: number;
  reasons: string[];
  risks: string[];
  actionSummary: string;
  invalidation: string;
  indicators: {
    sma20: number;
    sma50: number;
    ema20: number;
    rsi14: number;
    macd: number;
    macdSignal: number;
    atr14: number;
    volumeRatio: number;
  };
};

export type TimeframeSignal = {
  interval: "15m" | "1h" | "4h" | "1d";
  label: string;
  price: number;
  score: number;
  verdict: AnalysisResult["verdict"];
  trendStrength: number;
  rsi14: number;
  priceVsEma20: "above" | "below";
  summary: string;
};

export type MultiTimeframeAnalysis = {
  alignment: "bullish" | "mixed" | "bearish";
  score: number;
  summary: string;
  signals: TimeframeSignal[];
};

export type TradePlan = {
  stance: "watch" | "wait" | "avoid";
  title: string;
  summary: string;
  entryTrigger: string;
  invalidation: string;
  stopPlan: string;
  targetPlan: string;
  riskNote: string;
  managementRules: string[];
};

export function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function sma(values: number[], period: number) {
  return average(values.slice(-period));
}

export function ema(values: number[], period: number) {
  if (values.length === 0) {
    return 0;
  }

  const multiplier = 2 / (period + 1);
  return values.reduce((previous, value, index) => {
    if (index === 0) {
      return value;
    }

    return value * multiplier + previous * (1 - multiplier);
  }, values[0]);
}

export function rsi(values: number[], period = 14) {
  if (values.length <= period) {
    return 50;
  }

  const changes = values.slice(1).map((value, index) => value - values[index]);
  const recent = changes.slice(-period);
  const gains = recent.map((change) => Math.max(change, 0));
  const losses = recent.map((change) => Math.abs(Math.min(change, 0)));
  const avgGain = average(gains);
  const avgLoss = average(losses);

  if (avgLoss === 0) {
    return 100;
  }

  const relativeStrength = avgGain / avgLoss;
  return 100 - 100 / (1 + relativeStrength);
}

export function atr(candles: Candle[], period = 14) {
  if (candles.length <= period) {
    return 0;
  }

  const trueRanges = candles.slice(1).map((candle, index) => {
    const previousClose = candles[index].close;
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    );
  });

  return average(trueRanges.slice(-period));
}

export function macd(values: number[]) {
  const macdLine = ema(values, 12) - ema(values, 26);
  const macdHistory = values.map((_, index) => {
    const slice = values.slice(0, index + 1);
    return ema(slice, 12) - ema(slice, 26);
  });

  return {
    macdLine,
    signal: ema(macdHistory, 9),
  };
}

export function recentLevels(candles: Candle[], lookback = 60) {
  const recent = candles.slice(-lookback);
  const highs = recent.map((candle) => candle.high);
  const lows = recent.map((candle) => candle.low);
  const closes = recent.map((candle) => candle.close);
  const rangeHigh = Math.max(...highs);
  const rangeLow = Math.min(...lows);
  const lastClose = closes.at(-1) ?? 0;
  const supports = lows
    .filter((low) => low < lastClose)
    .sort((a, b) => Math.abs(lastClose - a) - Math.abs(lastClose - b));
  const resistances = highs
    .filter((high) => high > lastClose)
    .sort((a, b) => Math.abs(lastClose - a) - Math.abs(lastClose - b));

  return {
    support: supports[0] ?? rangeLow,
    resistance: resistances[0] ?? rangeHigh,
    rangeLow,
    rangeHigh,
  };
}

export function trendStrengthScore(price: number, ema20: number, sma50: number, atr14: number) {
  const distance = Math.abs(price - sma50);
  const normalizedDistance = atr14 > 0 ? Math.min(distance / (atr14 * 4), 1) : 0;
  const alignmentBonus = price > ema20 && ema20 > sma50 ? 20 : price < ema20 && ema20 < sma50 ? 20 : 5;
  return Math.round(Math.min(100, normalizedDistance * 80 + alignmentBonus));
}

export function volatilityRegime(
  price: number,
  atr14: number,
): AnalysisResult["volatility"] {
  const percent = price > 0 ? (atr14 / price) * 100 : 0;
  const regime: AnalysisResult["volatility"]["regime"] =
    percent >= 3.5 ? "high" : percent <= 1.2 ? "low" : "normal";

  return { percent, regime };
}

export function analyzeCandles(symbol: string, candles: Candle[]): AnalysisResult {
  const closes = candles.map((candle) => candle.close);
  const volumes = candles.map((candle) => candle.volume);
  const price = closes.at(-1) ?? 0;
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const ema20 = ema(closes, 20);
  const rsi14 = rsi(closes, 14);
  const macdValues = macd(closes);
  const atr14 = atr(candles, 14);
  const volumeRatio = (volumes.at(-1) ?? 0) / Math.max(average(volumes.slice(-20)), 1);
  const levels = recentLevels(candles);
  const trendStrength = trendStrengthScore(price, ema20, sma50, atr14);
  const volatility = volatilityRegime(price, atr14);

  let score = 50;
  const reasons: string[] = [];
  const risks: string[] = [];

  if (price > ema20) {
    score += 12;
    reasons.push("Fiyat EMA20 uzerinde, kisa vadeli trend destekli.");
  } else {
    score -= 10;
    risks.push("Fiyat EMA20 altinda, kisa vadeli trend zayif.");
  }

  if (sma20 > sma50) {
    score += 12;
    reasons.push("SMA20, SMA50 uzerinde; orta vadeli momentum olumlu.");
  } else {
    score -= 8;
    risks.push("SMA20, SMA50 altinda; orta vadeli momentum temkinli.");
  }

  if (rsi14 >= 45 && rsi14 <= 68) {
    score += 10;
    reasons.push("RSI dengeli bolgede, asiri alim baskisi sinirli.");
  } else if (rsi14 > 72) {
    score -= 12;
    risks.push("RSI asiri alim bolgesine yakin, geri cekilme riski artti.");
  } else if (rsi14 < 35) {
    score -= 6;
    risks.push("RSI zayif bolgede, tepki icin teyit gerekir.");
  }

  if (macdValues.macdLine > macdValues.signal) {
    score += 10;
    reasons.push("MACD sinyal cizgisinin uzerinde, momentum pozitif.");
  } else {
    score -= 8;
    risks.push("MACD sinyal cizgisinin altinda, momentum teyidi zayif.");
  }

  if (volumeRatio > 1.15) {
    score += 6;
    reasons.push("Hacim son ortalamanin uzerinde, hareket teyidi guclendi.");
  } else {
    risks.push("Hacim normal seviyede, kopus icin ek teyit izlenmeli.");
  }

  if (price > levels.resistance * 0.995) {
    score += 6;
    reasons.push("Fiyat yakin direnc bolgesini test ediyor, kopus teyidi izlenebilir.");
  } else if (price < levels.support * 1.01) {
    score += 4;
    reasons.push("Fiyat destek bolgesine yakin, risk daha net tanimlanabilir.");
  }

  if (trendStrength >= 70) {
    score += 6;
    reasons.push("Trend gucu yuksek, fiyat ortalamalardan anlamli ayrismis.");
  } else if (trendStrength <= 35) {
    score -= 5;
    risks.push("Trend gucu dusuk, yatay veya kararsiz piyasa riski var.");
  }

  if (volatility.regime === "high") {
    score -= 6;
    risks.push("Volatilite yuksek, stop ve pozisyon boyutu daha temkinli olmali.");
  } else if (volatility.regime === "low") {
    risks.push("Volatilite dusuk, hareket baslamadan once hacim teyidi gerekebilir.");
  }

  const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
  const verdict =
    boundedScore >= 68 ? "positive" : boundedScore <= 42 ? "risky" : "neutral";
  const lowerBuy = Math.max(price - atr14 * 0.9, 0);
  const upperBuy = Math.max(price - atr14 * 0.25, 0);
  const stopLoss = Math.max(price - atr14 * 1.8, 0);
  const targetOne = price + atr14 * 1.7;
  const targetTwo = price + atr14 * 3.1;
  const risk = Math.max(price - stopLoss, 0.00000001);
  const reward = Math.max(targetOne - price, 0);
  const actionSummary =
    boundedScore >= 68
      ? "Alim icin takip edilebilir; yine de destek/stop bolgesi bozulursa plan iptal edilmeli."
      : boundedScore <= 42
        ? "Yeni alim icin riskli; toparlanma veya trend teyidi beklemek daha mantikli."
        : "Notr bolge; giris icin destek tepkisi veya direnc kirilimi gibi ek teyit beklenmeli.";

  return {
    symbol,
    price,
    verdict,
    score: boundedScore,
    trendStrength,
    volatility,
    levels,
    buyZone: [lowerBuy, upperBuy],
    stopLoss,
    targetOne,
    targetTwo,
    riskReward: reward / risk,
    reasons: reasons.slice(0, 5),
    risks: risks.slice(0, 5),
    actionSummary,
    invalidation: `${formatPrice(stopLoss)} altinda kapanis analizi gecersiz kilar.`,
    indicators: {
      sma20,
      sma50,
      ema20,
      rsi14,
      macd: macdValues.macdLine,
      macdSignal: macdValues.signal,
      atr14,
      volumeRatio,
    },
  };
}

export function summarizeTimeframes(
  analyses: Array<{
    analysis: AnalysisResult;
    interval: TimeframeSignal["interval"];
    label: string;
  }>,
): MultiTimeframeAnalysis {
  const signals = analyses.map(({ analysis, interval, label }): TimeframeSignal => {
    const priceVsEma20 = analysis.price >= analysis.indicators.ema20 ? "above" : "below";
    return {
      interval,
      label,
      price: analysis.price,
      score: analysis.score,
      verdict: analysis.verdict,
      trendStrength: analysis.trendStrength,
      rsi14: analysis.indicators.rsi14,
      priceVsEma20,
      summary: buildTimeframeSummary(analysis, priceVsEma20),
    };
  });
  const score = Math.round(average(signals.map((signal) => signal.score)));
  const positiveCount = signals.filter((signal) => signal.verdict === "positive").length;
  const riskyCount = signals.filter((signal) => signal.verdict === "risky").length;
  const aboveEmaCount = signals.filter((signal) => signal.priceVsEma20 === "above").length;
  const alignment: MultiTimeframeAnalysis["alignment"] =
    positiveCount >= 3 && aboveEmaCount >= 3 ? "bullish" : riskyCount >= 2 && aboveEmaCount <= 1 ? "bearish" : "mixed";

  return {
    alignment,
    score,
    summary: buildMultiTimeframeSummary(alignment, score, positiveCount, riskyCount),
    signals,
  };
}

export function buildTradePlan(
  analysis: AnalysisResult,
  multiTimeframe: MultiTimeframeAnalysis,
): TradePlan {
  const scoreBlend = Math.round(analysis.score * 0.62 + multiTimeframe.score * 0.38);
  const stance: TradePlan["stance"] =
    scoreBlend >= 68 && multiTimeframe.alignment === "bullish"
      ? "watch"
      : scoreBlend <= 42 || multiTimeframe.alignment === "bearish"
        ? "avoid"
        : "wait";
  const title =
    stance === "watch"
      ? "Takip edilebilir trade plani"
      : stance === "avoid"
        ? "Yeni alim icin riskli bolge"
        : "Teyit bekleyen senaryo";

  return {
    stance,
    title,
    summary: buildTradePlanSummary(stance, scoreBlend, multiTimeframe.alignment),
    entryTrigger: buildEntryTrigger(analysis, multiTimeframe),
    invalidation: analysis.invalidation,
    stopPlan: `Stop bolgesi ${formatPrice(analysis.stopLoss)}. Bu seviye altinda kapanis plani iptal eder.`,
    targetPlan: `Ilk hedef ${formatPrice(analysis.targetOne)}, ikinci hedef ${formatPrice(analysis.targetTwo)}. Risk/odul 1:${analysis.riskReward.toFixed(2)}.`,
    riskNote: buildRiskNote(analysis, multiTimeframe),
    managementRules: buildManagementRules(analysis, multiTimeframe),
  };
}

export function formatPrice(value: number) {
  if (value >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  if (value >= 1) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }

  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}

function buildTradePlanSummary(
  stance: TradePlan["stance"],
  scoreBlend: number,
  alignment: MultiTimeframeAnalysis["alignment"],
) {
  if (stance === "watch") {
    return `Teknik skor ve zaman dilimi teyidi uyumlu. Plan skoru ${scoreBlend}/100; giris sadece fiyat teyidiyle degerlendirilmeli.`;
  }

  if (stance === "avoid") {
    return `Plan skoru ${scoreBlend}/100 ve zaman dilimi uyumu ${alignment}. Yeni alim icin risk/teyit dengesi zayif.`;
  }

  return `Plan skoru ${scoreBlend}/100. Sinyal tamamen reddedilmiyor, ancak giris icin ek teyit beklemek daha saglikli.`;
}

function buildEntryTrigger(
  analysis: AnalysisResult,
  multiTimeframe: MultiTimeframeAnalysis,
) {
  const buyZone = `${formatPrice(analysis.buyZone[0])} - ${formatPrice(analysis.buyZone[1])}`;

  if (multiTimeframe.alignment === "bullish" && analysis.verdict === "positive") {
    return `${buyZone} bolgesine geri cekilme veya ${formatPrice(analysis.levels.resistance)} uzeri hacimli kirilim takip edilebilir.`;
  }

  if (analysis.price <= analysis.levels.support * 1.015) {
    return `${formatPrice(analysis.levels.support)} destek bolgesinde tepki mumu ve hacim artisi beklenmeli.`;
  }

  return `${formatPrice(analysis.levels.resistance)} direnci uzerinde kapanis veya coklu zaman dilimi skorunda iyilesme beklenmeli.`;
}

function buildRiskNote(
  analysis: AnalysisResult,
  multiTimeframe: MultiTimeframeAnalysis,
) {
  if (analysis.volatility.regime === "high") {
    return "Volatilite yuksek; pozisyon boyutu normalden dusuk tutulmali ve stop genisligi hesaba katilmali.";
  }

  if (multiTimeframe.alignment === "bearish") {
    return "Ust zaman dilimi teyidi zayif; acele giris yerine toparlanma teyidi beklenmeli.";
  }

  if (analysis.riskReward < 1.4) {
    return "Risk/odul zayif; giris fiyati iyilesmeden pozisyon acmak verimsiz olabilir.";
  }

  return "Risk seviyesi plana bagli yonetilebilir; pozisyon boyutu risk hesaplayici ile belirlenmeli.";
}

function buildManagementRules(
  analysis: AnalysisResult,
  multiTimeframe: MultiTimeframeAnalysis,
) {
  const rules = [
    `Fiyat ${formatPrice(analysis.targetOne)} hedefine ulasirsa stop maliyet bolgesine yaklastirilabilir.`,
    `Fiyat ${formatPrice(analysis.stopLoss)} altinda kapanirsa plan gecersiz kabul edilmeli.`,
  ];

  if (multiTimeframe.alignment !== "bullish") {
    rules.push("Coklu zaman dilimi uyumu bullish olmadan agresif pozisyon artirilmamali.");
  }

  if (analysis.indicators.rsi14 > 70) {
    rules.push("RSI asiri alim bolgesinde; hedefe yakin yerde kar alma daha oncelikli olmali.");
  } else {
    rules.push("Hacim ortalama uzerine cikmadan kirilim islemleri daha temkinli izlenmeli.");
  }

  return rules;
}

function buildTimeframeSummary(
  analysis: AnalysisResult,
  priceVsEma20: TimeframeSignal["priceVsEma20"],
) {
  if (analysis.verdict === "positive" && priceVsEma20 === "above") {
    return "Trend ve momentum destekli.";
  }

  if (analysis.verdict === "risky") {
    return "Trend teyidi zayif, temkinli okunmali.";
  }

  if (priceVsEma20 === "below") {
    return "Fiyat EMA20 altinda, ek teyit gerekir.";
  }

  return "Notr, kirilim veya destek tepkisi beklenmeli.";
}

function buildMultiTimeframeSummary(
  alignment: MultiTimeframeAnalysis["alignment"],
  score: number,
  positiveCount: number,
  riskyCount: number,
) {
  if (alignment === "bullish") {
    return `Zaman dilimleri uyumlu; ${positiveCount} periyot olumlu ve genel teyit skoru ${score}/100.`;
  }

  if (alignment === "bearish") {
    return `Ust zaman dilimi teyidi zayif; ${riskyCount} periyot riskli ve genel teyit skoru ${score}/100.`;
  }

  return `Zaman dilimleri karisik; genel teyit skoru ${score}/100, giris icin ek fiyat davranisi beklenmeli.`;
}
