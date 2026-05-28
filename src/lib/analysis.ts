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
  buyZone: [number, number];
  stopLoss: number;
  targetOne: number;
  targetTwo: number;
  riskReward: number;
  reasons: string[];
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

  let score = 50;
  const reasons: string[] = [];

  if (price > ema20) {
    score += 12;
    reasons.push("Fiyat EMA20 uzerinde, kisa vadeli trend destekli.");
  } else {
    score -= 10;
    reasons.push("Fiyat EMA20 altinda, kisa vadeli trend zayif.");
  }

  if (sma20 > sma50) {
    score += 12;
    reasons.push("SMA20, SMA50 uzerinde; orta vadeli momentum olumlu.");
  } else {
    score -= 8;
    reasons.push("SMA20, SMA50 altinda; orta vadeli momentum temkinli.");
  }

  if (rsi14 >= 45 && rsi14 <= 68) {
    score += 10;
    reasons.push("RSI dengeli bolgede, asiri alim baskisi sinirli.");
  } else if (rsi14 > 72) {
    score -= 12;
    reasons.push("RSI asiri alim bolgesine yakin, geri cekilme riski artti.");
  } else if (rsi14 < 35) {
    score -= 6;
    reasons.push("RSI zayif bolgede, tepki icin teyit gerekir.");
  }

  if (macdValues.macdLine > macdValues.signal) {
    score += 10;
    reasons.push("MACD sinyal cizgisinin uzerinde, momentum pozitif.");
  } else {
    score -= 8;
    reasons.push("MACD sinyal cizgisinin altinda, momentum teyidi zayif.");
  }

  if (volumeRatio > 1.15) {
    score += 6;
    reasons.push("Hacim son ortalamanin uzerinde, hareket teyidi guclendi.");
  } else {
    reasons.push("Hacim normal seviyede, kopus icin ek teyit izlenmeli.");
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

  return {
    symbol,
    price,
    verdict,
    score: boundedScore,
    buyZone: [lowerBuy, upperBuy],
    stopLoss,
    targetOne,
    targetTwo,
    riskReward: reward / risk,
    reasons: reasons.slice(0, 5),
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

export function formatPrice(value: number) {
  if (value >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  if (value >= 1) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
  }

  return value.toLocaleString("en-US", { maximumFractionDigits: 8 });
}
