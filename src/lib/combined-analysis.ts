import type { AnalysisResult } from "@/lib/analysis";
import type { FundamentalAnalysis } from "@/lib/fundamentals";

export type CombinedAnalysis = {
  score: number;
  verdict: "positive" | "neutral" | "risky";
  summary: string;
  technicalWeight: number;
  fundamentalWeight: number;
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
  const verdict = score >= 68 ? "positive" : score <= 42 ? "risky" : "neutral";

  return {
    score,
    verdict,
    technicalWeight,
    fundamentalWeight,
    summary: buildCombinedSummary(verdict, technical.score, fundamentals.score),
  };
}

function buildCombinedSummary(
  verdict: CombinedAnalysis["verdict"],
  technicalScore: number,
  fundamentalScore: number,
) {
  if (verdict === "positive") {
    if (technicalScore >= 68 && fundamentalScore >= 68) {
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
