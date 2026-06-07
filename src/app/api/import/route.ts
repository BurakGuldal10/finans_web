import { NextRequest, NextResponse } from "next/server";
import {
  importRecords,
  normalizeExportResource,
  parseImportPayload,
} from "@/lib/export-data";

export async function POST(request: NextRequest) {
  const resource = normalizeExportResource(request.nextUrl.searchParams.get("type"));

  try {
    const payload = await request.json();
    const records = parseImportPayload(resource, payload);
    const result = importRecords(resource, records);

    return NextResponse.json({
      ok: true,
      resource,
      imported: result.imported,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "JSON dosyasi ice aktarilamadi.",
      },
      { status: 400 },
    );
  }
}
