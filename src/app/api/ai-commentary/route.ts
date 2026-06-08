import { NextRequest, NextResponse } from "next/server";
import {
  createAiCommentary,
  MissingOpenAiApiKeyError,
  type AiCommentaryInput,
} from "@/lib/ai-commentary";

export async function POST(request: NextRequest) {
  try {
    const input = (await request.json()) as AiCommentaryInput;
    const commentary = await createAiCommentary(input);

    return NextResponse.json({
      commentary,
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      ok: true,
    });
  } catch (error) {
    if (error instanceof MissingOpenAiApiKeyError) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY tanimli degil. AI yorumlama icin .env.local dosyasina OPENAI_API_KEY ekleyin.",
          ok: false,
        },
        { status: 501 },
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "AI yorumlama olusturulamadi.",
        ok: false,
      },
      { status: 502 },
    );
  }
}
