import { NextRequest, NextResponse } from "next/server";
import {
  createExportBody,
  createExportFilename,
  getExportContentType,
  getExportData,
  normalizeExportFormat,
  normalizeExportResource,
} from "@/lib/export-data";

export async function GET(request: NextRequest) {
  const resource = normalizeExportResource(request.nextUrl.searchParams.get("type"));
  const format = normalizeExportFormat(request.nextUrl.searchParams.get("format"));
  const data = getExportData(resource);
  const body = createExportBody(data.records, data.headers, format);

  return new NextResponse(body, {
    headers: {
      "Content-Disposition": `attachment; filename="${createExportFilename(resource, format)}"`,
      "Content-Type": getExportContentType(format),
    },
  });
}
