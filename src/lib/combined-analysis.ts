import type { AnalysisResult } from "@/lib/analysis";
import type { FundamentalAnalysis } from "@/lib/fundamentals";

export type CombinedAnalysis = {
  score: number;
  verdict: "positive" | "neutral" | "risky";
  summary: string;
  technicalWeight: number;
  fundamentalWeight: number;
  longTermThesis: LongTermThesis;
};

export type LongTermThesis = {
  stance: "accumulate" | "watch" | "avoid";
  qualityScore: number;
  valuation: "attractive" | "neutral" | "expensive" | "unknown";
  timing: "supportive" | "mixed" | "weak";
  summary: string;
  catalysts: string[];
  risks: string[];
  invalidation: string;
};

export function combineStockAnalysis(
  technical: AnalysisResult,
  fundamentals: FundamentalAnalysis,
): CombinedAnalysis {
  const technicalWeight = 0.55;
  const fundamentalWeight = 0.45;
  const score = Math.round(
    technical.score * technicalWeight + fundamentals.score * fundamentalWeight,
  );
  const verdict = score >= 74 ? "positive" : score <= 38 ? "risky" : "neutral";

  return {
    score,
    verdict,
    technicalWeight,
    fundamentalWeight,
    summary: buildCombinedSummary(verdict, technical.score, fundamentals.score),
    longTermThesis: buildLongTermThesis(technical, fundamentals),
  };
}

function buildLongTermThesis(
  technical: AnalysisResult,
  fundamentals: FundamentalAnalysis,
): LongTermThesis {
  const valuation = resolveValuation(fundamentals.raw.peRatio, fundamentals.raw.freeCashFlow);
  const timing =
    technical.price >= technical.indicators.sma200 && technical.indicators.sma20 >= technical.indicators.sma50
      ? "supportive"
      : technical.price < technical.indicators.sma200 && technical.indicators.sma20 < technical.indicators.sma50
        ? "weak"
        : "mixed";
  const stance: LongTermThesis["stance"] =
    fundamentals.score >= 70 && valuation !== "expensive" && timing !== "weak"
      ? "accumulate"
      : fundamentals.score <= 42 || valuation === "expensive"
        ? "avoid"
        : "watch";
  const catalysts = [
    fundamentals.raw.revenueGrowth !== null && fundamentals.raw.revenueGrowth >= 5
      ? "Gelir buyumesi olumlu seyrediyor."
      : "Gelir buyumesinde yeni bilanço teyidi izlenmeli.",
    fundamentals.raw.freeCashFlow !== null && fundamentals.raw.freeCashFlow > 0
      ? "Serbest nakit akisi pozitif."
      : "Serbest nakit akisi tarafinda iyilesme gerekli.",
    timing === "supportive"
      ? "Fiyat uzun vadeli trendin uzerinde; kademeli giris icin teknik zemin destekli."
      : "Fiyat davranisi uzun vadeli trend teyidi bekliyor.",
  ];
  const risks = [
    fundamentals.raw.debtToEquity !== null && fundamentals.raw.debtToEquity > 1.5
      ? "Borc/ozsermaye orani yuksek; faiz ve refinansman riski izlenmeli."
      : "Borc seviyesi tek basina belirgin bir kirmizi bayrak vermiyor.",
    valuation === "expensive"
      ? "Degerleme yuksek; guclu sirket olsa da getiri beklentisi sinirlanabilir."
      : "Degerleme icin sektor ve tarihsel ortalama karsilastirmasi sonraki adimda derinlestirilmeli.",
  ];

  return {
    stance,
    qualityScore: fundamentals.score,
    valuation,
    timing,
    summary: buildLongTermSummary(stance, fundamentals.score, valuation, timing),
    catalysts,
    risks,
    invalidation:
      "Gelir buyumesi, serbest nakit akisi veya marjlarda iki ardisik donem belirgin bozulma olursa yatirim tezi yeniden degerlendirilir.",
  };
}

function resolveValuation(peRatio: number | null, freeCashFlow: number | null): LongTermThesis["valuation"] {
  if (peRatio === null) return "unknown";
  if (peRatio > 60 || freeCashFlow === null || freeCashFlow < 0) return "expensive";
  if (peRatio <= 25 && freeCashFlow > 0) return "attractive";
  return "neutral";
}

function buildLongTermSummary(
  stance: LongTermThesis["stance"],
  qualityScore: number,
  valuation: LongTermThesis["valuation"],
  timing: LongTermThesis["timing"],
) {
  if (stance === "accumulate") {
    return `Finansal kalite ${qualityScore}/100, degerleme ${valuation} ve teknik zamanlama ${timing}. Uzun vadeli tez korunuyorsa kademeli pozisyon artisi takip edilebilir.`;
  }
  if (stance === "avoid") {
    return `Finansal kalite ${qualityScore}/100 veya degerleme ${valuation}. Uzun vadeli yeni pozisyon icin marj ve nakit akisinda daha guclu teyit beklenmeli.`;
  }
  return `Finansal kalite ${qualityScore}/100, degerleme ${valuation}, teknik zamanlama ${timing}. Tez var ancak yeni alimin hizi bilanço ve trend teyidine bagli olmali.`;
}

function buildCombinedSummary(
  verdict: CombinedAnalysis["verdict"],
  technicalScore: number,
  fundamentalScore: number,
) {
  if (verdict === "positive") {
    if (technicalScore >= 74 && fundamentalScore >= 68) {
      return "Teknik ve temel gorunum birlikte guclu; planli giris icin takip edilebilir.";
    }

    if (technicalScore >= fundamentalScore) {
      return "Teknik gorunum onde; temel veri yeterli ama pozisyon boyutu yine kontrollu olmali.";
    }

    return "Temel veri guclu; teknik teyit geldikce daha saglam bir trade planina donusebilir.";
  }

  if (verdict === "risky") {
    if (technicalScore <= 42 && fundamentalScore <= 42) {
      return "Teknik ve temel gorunum birlikte zayif; yeni alim icin risk yuksek.";
    }

    return "Skor riskli bolgede; teknik veya temel tarafta belirgin bir zayiflik var.";
  }

  return "Genel gorunum notr; teknik teyit, temel veri ve risk/odul birlikte izlenmeli.";
}
