import {
  listAlertRules,
  listPortfolioPositions,
  listTradeEntries,
  type AlertRuleRecord,
  type PortfolioPositionRecord,
  type TradeEntryRecord,
} from "@/lib/local-db";

export type ExportFormat = "csv" | "json";
export type ExportResource = "alerts" | "portfolio" | "trades";

type ExportPayload =
  | AlertRuleRecord[]
  | PortfolioPositionRecord[]
  | TradeEntryRecord[];

const portfolioHeaders: Array<keyof PortfolioPositionRecord> = [
  "id",
  "symbol",
  "quantity",
  "averageCost",
  "stopLoss",
  "note",
  "createdAt",
];

const tradeHeaders: Array<keyof TradeEntryRecord> = [
  "id",
  "symbol",
  "timeframe",
  "side",
  "entryPrice",
  "stopLoss",
  "targetPrice",
  "quantity",
  "strategy",
  "status",
  "note",
  "createdAt",
];

const alertHeaders: Array<keyof AlertRuleRecord> = [
  "id",
  "market",
  "symbol",
  "metric",
  "direction",
  "threshold",
  "note",
  "createdAt",
  "triggeredAt",
];

export function normalizeExportResource(value: string | null): ExportResource {
  if (value === "portfolio" || value === "alerts") {
    return value;
  }

  return "trades";
}

export function normalizeExportFormat(value: string | null): ExportFormat {
  return value === "json" ? "json" : "csv";
}

export function getExportData(resource: ExportResource) {
  if (resource === "portfolio") {
    return {
      filenameBase: "portfolio",
      headers: portfolioHeaders,
      records: listPortfolioPositions(),
    };
  }

  if (resource === "alerts") {
    return {
      filenameBase: "alerts",
      headers: alertHeaders,
      records: listAlertRules(),
    };
  }

  return {
    filenameBase: "trades",
    headers: tradeHeaders,
    records: listTradeEntries(),
  };
}

export function createExportBody(
  records: ExportPayload,
  headers: string[],
  format: ExportFormat,
) {
  if (format === "json") {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        records,
      },
      null,
      2,
    );
  }

  return toCsv(records, headers);
}

export function getExportContentType(format: ExportFormat) {
  return format === "json" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8";
}

export function createExportFilename(resource: ExportResource, format: ExportFormat) {
  const date = new Date().toISOString().slice(0, 10);
  return `finansman-${resource}-${date}.${format}`;
}

function toCsv(records: ExportPayload, headers: string[]) {
  const rows = records.map((record) =>
    headers.map((header) => escapeCsvCell(readRecordValue(record, header))).join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

function readRecordValue(record: ExportPayload[number], key: string) {
  const value = (record as Record<string, unknown>)[key];
  return value ?? "";
}

function escapeCsvCell(value: unknown) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}
