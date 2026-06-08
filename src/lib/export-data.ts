import {
  listAnalysisSnapshots,
  listAlertRules,
  listPortfolioPositions,
  listTradeEntries,
  upsertAnalysisSnapshot,
  upsertAlertRule,
  upsertPortfolioPosition,
  upsertTradeEntry,
  type AnalysisSnapshotRecord,
  type AlertRuleRecord,
  type PortfolioPositionRecord,
  type TradeEntryRecord,
} from "@/lib/local-db";

export type ExportFormat = "csv" | "json";
export type ExportResource = "alerts" | "portfolio" | "snapshots" | "trades";

type ExportPayload =
  | AnalysisSnapshotRecord[]
  | AlertRuleRecord[]
  | PortfolioPositionRecord[]
  | TradeEntryRecord[];

type ImportPayload = {
  records?: unknown;
};

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

const snapshotHeaders: Array<keyof AnalysisSnapshotRecord> = [
  "id",
  "market",
  "symbol",
  "interval",
  "price",
  "score",
  "stance",
  "confidence",
  "reportJson",
  "createdAt",
];

export function normalizeExportResource(value: string | null): ExportResource {
  if (value === "portfolio" || value === "alerts" || value === "snapshots") {
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

  if (resource === "snapshots") {
    return {
      filenameBase: "snapshots",
      headers: snapshotHeaders,
      records: listAnalysisSnapshots(1000),
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

export function parseImportPayload(resource: ExportResource, payload: unknown) {
  const records = readImportRecords(payload);

  if (resource === "portfolio") {
    return records.map(normalizePortfolioImportRecord);
  }

  if (resource === "alerts") {
    return records.map(normalizeAlertImportRecord);
  }

  if (resource === "snapshots") {
    return records.map(normalizeSnapshotImportRecord);
  }

  return records.map(normalizeTradeImportRecord);
}

export function importRecords(
  resource: ExportResource,
  records:
    | AlertRuleRecord[]
    | AnalysisSnapshotRecord[]
    | PortfolioPositionRecord[]
    | TradeEntryRecord[],
) {
  if (resource === "portfolio") {
    for (const record of records as PortfolioPositionRecord[]) {
      upsertPortfolioPosition(record);
    }
  } else if (resource === "alerts") {
    for (const record of records as AlertRuleRecord[]) {
      upsertAlertRule(record);
    }
  } else if (resource === "snapshots") {
    for (const record of records as AnalysisSnapshotRecord[]) {
      upsertAnalysisSnapshot(record);
    }
  } else {
    for (const record of records as TradeEntryRecord[]) {
      upsertTradeEntry(record);
    }
  }

  return { imported: records.length };
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

function readImportRecords(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload) && Array.isArray((payload as ImportPayload).records)) {
    return (payload as { records: unknown[] }).records;
  }

  throw new Error("JSON dosyasi records dizisi icermeli.");
}

function normalizePortfolioImportRecord(record: unknown): PortfolioPositionRecord {
  const raw = requireRecord(record);
  return {
    id: readRequiredString(raw, "id"),
    symbol: readRequiredString(raw, "symbol").toUpperCase(),
    quantity: readPositiveNumber(raw, "quantity"),
    averageCost: readPositiveNumber(raw, "averageCost"),
    stopLoss: readNonNegativeNumber(raw, "stopLoss"),
    note: readOptionalString(raw, "note"),
    createdAt: readDateString(raw, "createdAt"),
  };
}

function normalizeTradeImportRecord(record: unknown): TradeEntryRecord {
  const raw = requireRecord(record);
  return {
    id: readRequiredString(raw, "id"),
    symbol: readRequiredString(raw, "symbol").toUpperCase(),
    timeframe: readRequiredString(raw, "timeframe"),
    side: readEnum(raw, "side", ["long", "short"]),
    entryPrice: readPositiveNumber(raw, "entryPrice"),
    stopLoss: readPositiveNumber(raw, "stopLoss"),
    targetPrice: readPositiveNumber(raw, "targetPrice"),
    quantity: readPositiveNumber(raw, "quantity"),
    strategy: readOptionalString(raw, "strategy", "Teknik skor"),
    status: readEnum(raw, "status", ["plan", "open", "win", "loss", "breakeven"]),
    note: readOptionalString(raw, "note"),
    createdAt: readDateString(raw, "createdAt"),
  };
}

function normalizeAlertImportRecord(record: unknown): AlertRuleRecord {
  const raw = requireRecord(record);
  return {
    id: readRequiredString(raw, "id"),
    market: readEnum(raw, "market", ["crypto", "stocks", "bist"]),
    symbol: readRequiredString(raw, "symbol").toUpperCase(),
    metric: readEnum(raw, "metric", ["price", "score", "rsi"]),
    direction: readEnum(raw, "direction", ["above", "below"]),
    threshold: readFiniteNumber(raw, "threshold"),
    note: readOptionalString(raw, "note"),
    createdAt: readDateString(raw, "createdAt"),
    triggeredAt: readOptionalDateString(raw, "triggeredAt"),
  };
}

function normalizeSnapshotImportRecord(record: unknown): AnalysisSnapshotRecord {
  const raw = requireRecord(record);
  return {
    id: readRequiredString(raw, "id"),
    market: readEnum(raw, "market", ["crypto", "stocks", "bist"]),
    symbol: readRequiredString(raw, "symbol").toUpperCase(),
    interval: readRequiredString(raw, "interval"),
    price: readPositiveNumber(raw, "price"),
    score: readBoundedNumber(raw, "score", 0, 100),
    stance: readEnum(raw, "stance", ["watch", "wait", "avoid"]),
    confidence: readBoundedNumber(raw, "confidence", 0, 100),
    reportJson: readJsonString(raw, "reportJson"),
    createdAt: readDateString(raw, "createdAt"),
  };
}

function requireRecord(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("Kayit nesne formatinda olmali.");
  }

  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRequiredString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} alani zorunlu metin olmali.`);
  }

  return value.trim();
}

function readOptionalString(record: Record<string, unknown>, key: string, fallback = "") {
  const value = record[key];
  return typeof value === "string" ? value.trim() : fallback;
}

function readFiniteNumber(record: Record<string, unknown>, key: string) {
  const value = Number(record[key]);
  if (!Number.isFinite(value)) {
    throw new Error(`${key} alani gecerli sayi olmali.`);
  }

  return value;
}

function readPositiveNumber(record: Record<string, unknown>, key: string) {
  const value = readFiniteNumber(record, key);
  if (value <= 0) {
    throw new Error(`${key} alani sifirdan buyuk olmali.`);
  }

  return value;
}

function readNonNegativeNumber(record: Record<string, unknown>, key: string) {
  const value = readFiniteNumber(record, key);
  if (value < 0) {
    throw new Error(`${key} alani negatif olamaz.`);
  }

  return value;
}

function readBoundedNumber(record: Record<string, unknown>, key: string, min: number, max: number) {
  const value = readFiniteNumber(record, key);
  if (value < min || value > max) {
    throw new Error(`${key} alani ${min}-${max} araliginda olmali.`);
  }

  return value;
}

function readEnum<const T extends string>(
  record: Record<string, unknown>,
  key: string,
  values: readonly T[],
) {
  const value = record[key];
  if (typeof value === "string" && values.includes(value as T)) {
    return value as T;
  }

  throw new Error(`${key} alani gecersiz.`);
}

function readJsonString(record: Record<string, unknown>, key: string) {
  const value = readRequiredString(record, key);
  try {
    JSON.parse(value);
  } catch {
    throw new Error(`${key} alani gecerli JSON metni olmali.`);
  }

  return value;
}

function readDateString(record: Record<string, unknown>, key: string) {
  return readOptionalDateString(record, key) ?? new Date().toISOString();
}

function readOptionalDateString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new Error(`${key} alani gecerli tarih olmali.`);
  }

  return value;
}
