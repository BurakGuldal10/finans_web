import type {
  AnalysisResult,
  DecisionReport,
  MultiTimeframeAnalysis,
  TradePlan,
} from "@/lib/analysis";
import type { MarketKind } from "@/lib/markets";

export type AiCommentaryInput = {
  analysis: AnalysisResult;
  decisionReport: DecisionReport;
  interval: string;
  market: MarketKind;
  multiTimeframe: MultiTimeframeAnalysis;
  tradePlan: TradePlan;
};

type OpenAiResponse = {
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
    type?: string;
  }>;
  output_text?: string;
};

export class MissingOpenAiApiKeyError extends Error {
  constructor() {
    super("OPENAI_API_KEY tanimli degil.");
  }
}

export async function createAiCommentary(input: AiCommentaryInput) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new MissingOpenAiApiKeyError();
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: buildAiInput(input),
      instructions: [
        "Turkce yaz.",
        "Yatirim tavsiyesi verme; karar destek yorumu oldugunu belirt.",
        "Kisa, somut ve uygulanabilir yaz.",
        "Kesin al/sat dili kullanma.",
        "Sadece verilen analiz verilerine dayan; haber veya dis veri uydurma.",
      ].join(" "),
      max_output_tokens: 700,
      model: process.env.OPENAI_MODEL || "gpt-5.5",
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI istegi basarisiz: ${response.status}${detail ? ` ${detail}` : ""}`);
  }

  const data = (await response.json()) as OpenAiResponse;
  const text = extractOutputText(data).trim();
  if (!text) {
    throw new Error("OpenAI cevabinda metin bulunamadi.");
  }

  return text;
}

function buildAiInput(input: AiCommentaryInput) {
  return [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: JSON.stringify(
            {
              analysis: {
                buyZone: input.analysis.buyZone,
                indicators: input.analysis.indicators,
                invalidation: input.analysis.invalidation,
                levels: input.analysis.levels,
                price: input.analysis.price,
                reasons: input.analysis.reasons,
                risks: input.analysis.risks,
                riskReward: input.analysis.riskReward,
                score: input.analysis.score,
                stopLoss: input.analysis.stopLoss,
                symbol: input.analysis.symbol,
                targets: [input.analysis.targetOne, input.analysis.targetTwo],
                verdict: input.analysis.verdict,
                volatility: input.analysis.volatility,
              },
              decisionReport: input.decisionReport,
              interval: input.interval,
              market: input.market,
              multiTimeframe: input.multiTimeframe,
              tradePlan: input.tradePlan,
              task:
                "Bu verilerden 5 bolumlu kisa karar destek yorumu uret: genel durum, giris senaryosu, riskler, izlenecek seviyeler, disiplin notu.",
            },
            null,
            2,
          ),
        },
      ],
    },
  ];
}

function extractOutputText(response: OpenAiResponse) {
  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .filter(Boolean)
      .join("\n") ?? ""
  );
}
