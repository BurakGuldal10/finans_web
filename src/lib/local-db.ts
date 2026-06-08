import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export type PortfolioPositionRecord = {
  id: string;
  symbol: string;
  quantity: number;
  averageCost: number;
  stopLoss: number;
  note: string;
  createdAt: string;
};

export type TradeEntryRecord = {
  id: string;
  symbol: string;
  timeframe: string;
  side: "long" | "short";
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  quantity: number;
  strategy: string;
  status: "plan" | "open" | "win" | "loss" | "breakeven";
  note: string;
  createdAt: string;
};

export type AlertRuleRecord = {
  id: string;
  market: "crypto" | "stocks" | "bist";
  symbol: string;
  metric: "price" | "score" | "rsi";
  direction: "above" | "below";
  threshold: number;
  note: string;
  createdAt: string;
  triggeredAt?: string;
};

export type AnalysisSnapshotRecord = {
  id: string;
  market: "crypto" | "stocks" | "bist";
  symbol: string;
  interval: string;
  price: number;
  score: number;
  stance: "watch" | "wait" | "avoid";
  confidence: number;
  reportJson: string;
  createdAt: string;
};

let database: DatabaseSync | null = null;

export function getDb() {
  if (!database) {
    const dbPath = join(process.cwd(), "data", "finansman.db");
    mkdirSync(dirname(dbPath), { recursive: true });
    database = new DatabaseSync(dbPath);
    database.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_positions (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        quantity REAL NOT NULL,
        averageCost REAL NOT NULL,
        stopLoss REAL NOT NULL,
        note TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trade_entries (
        id TEXT PRIMARY KEY,
        symbol TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        side TEXT NOT NULL,
        entryPrice REAL NOT NULL,
        stopLoss REAL NOT NULL,
        targetPrice REAL NOT NULL,
        quantity REAL NOT NULL,
        strategy TEXT NOT NULL,
        status TEXT NOT NULL,
        note TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS alert_rules (
        id TEXT PRIMARY KEY,
        market TEXT NOT NULL,
        symbol TEXT NOT NULL,
        metric TEXT NOT NULL,
        direction TEXT NOT NULL,
        threshold REAL NOT NULL,
        note TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        triggeredAt TEXT
      );

      CREATE TABLE IF NOT EXISTS analysis_snapshots (
        id TEXT PRIMARY KEY,
        market TEXT NOT NULL,
        symbol TEXT NOT NULL,
        interval TEXT NOT NULL,
        price REAL NOT NULL,
        score REAL NOT NULL,
        stance TEXT NOT NULL,
        confidence REAL NOT NULL,
        reportJson TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
  }

  return database;
}

export function listPortfolioPositions() {
  return getDb()
    .prepare("SELECT * FROM portfolio_positions ORDER BY createdAt DESC")
    .all() as PortfolioPositionRecord[];
}

export function createPortfolioPosition(position: PortfolioPositionRecord) {
  getDb()
    .prepare(
      `INSERT INTO portfolio_positions
        (id, symbol, quantity, averageCost, stopLoss, note, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      position.id,
      position.symbol,
      position.quantity,
      position.averageCost,
      position.stopLoss,
      position.note,
      position.createdAt,
    );
  return position;
}

export function upsertPortfolioPosition(position: PortfolioPositionRecord) {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO portfolio_positions
        (id, symbol, quantity, averageCost, stopLoss, note, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      position.id,
      position.symbol,
      position.quantity,
      position.averageCost,
      position.stopLoss,
      position.note,
      position.createdAt,
    );
  return position;
}

export function deletePortfolioPosition(id: string) {
  getDb().prepare("DELETE FROM portfolio_positions WHERE id = ?").run(id);
}

export function listTradeEntries() {
  return getDb()
    .prepare("SELECT * FROM trade_entries ORDER BY createdAt DESC")
    .all() as TradeEntryRecord[];
}

export function createTradeEntry(entry: TradeEntryRecord) {
  getDb()
    .prepare(
      `INSERT INTO trade_entries
        (id, symbol, timeframe, side, entryPrice, stopLoss, targetPrice, quantity, strategy, status, note, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      entry.id,
      entry.symbol,
      entry.timeframe,
      entry.side,
      entry.entryPrice,
      entry.stopLoss,
      entry.targetPrice,
      entry.quantity,
      entry.strategy,
      entry.status,
      entry.note,
      entry.createdAt,
    );
  return entry;
}

export function upsertTradeEntry(entry: TradeEntryRecord) {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO trade_entries
        (id, symbol, timeframe, side, entryPrice, stopLoss, targetPrice, quantity, strategy, status, note, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      entry.id,
      entry.symbol,
      entry.timeframe,
      entry.side,
      entry.entryPrice,
      entry.stopLoss,
      entry.targetPrice,
      entry.quantity,
      entry.strategy,
      entry.status,
      entry.note,
      entry.createdAt,
    );
  return entry;
}

export function updateTradeStatus(id: string, status: TradeEntryRecord["status"]) {
  getDb().prepare("UPDATE trade_entries SET status = ? WHERE id = ?").run(status, id);
}

export function deleteTradeEntry(id: string) {
  getDb().prepare("DELETE FROM trade_entries WHERE id = ?").run(id);
}

export function listAlertRules() {
  return getDb()
    .prepare("SELECT * FROM alert_rules ORDER BY createdAt DESC")
    .all() as AlertRuleRecord[];
}

export function createAlertRule(alert: AlertRuleRecord) {
  getDb()
    .prepare(
      `INSERT INTO alert_rules
        (id, market, symbol, metric, direction, threshold, note, createdAt, triggeredAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      alert.id,
      alert.market,
      alert.symbol,
      alert.metric,
      alert.direction,
      alert.threshold,
      alert.note,
      alert.createdAt,
      alert.triggeredAt ?? null,
    );
  return alert;
}

export function upsertAlertRule(alert: AlertRuleRecord) {
  getDb()
    .prepare(
      `INSERT OR REPLACE INTO alert_rules
        (id, market, symbol, metric, direction, threshold, note, createdAt, triggeredAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      alert.id,
      alert.market,
      alert.symbol,
      alert.metric,
      alert.direction,
      alert.threshold,
      alert.note,
      alert.createdAt,
      alert.triggeredAt ?? null,
    );
  return alert;
}

export function updateAlertTriggeredAt(id: string, triggeredAt: string | null) {
  getDb().prepare("UPDATE alert_rules SET triggeredAt = ? WHERE id = ?").run(triggeredAt, id);
}

export function deleteAlertRule(id: string) {
  getDb().prepare("DELETE FROM alert_rules WHERE id = ?").run(id);
}

export function listAnalysisSnapshots(limit = 20) {
  return getDb()
    .prepare("SELECT * FROM analysis_snapshots ORDER BY createdAt DESC LIMIT ?")
    .all(limit) as AnalysisSnapshotRecord[];
}

export function createAnalysisSnapshot(snapshot: AnalysisSnapshotRecord) {
  getDb()
    .prepare(
      `INSERT INTO analysis_snapshots
        (id, market, symbol, interval, price, score, stance, confidence, reportJson, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      snapshot.id,
      snapshot.market,
      snapshot.symbol,
      snapshot.interval,
      snapshot.price,
      snapshot.score,
      snapshot.stance,
      snapshot.confidence,
      snapshot.reportJson,
      snapshot.createdAt,
    );
  return snapshot;
}

export function deleteAnalysisSnapshot(id: string) {
  getDb().prepare("DELETE FROM analysis_snapshots WHERE id = ?").run(id);
}

export function getLocalDataStats() {
  const db = getDb();
  const portfolio = db
    .prepare("SELECT COUNT(*) AS count FROM portfolio_positions")
    .get() as { count: number };
  const trades = db.prepare("SELECT COUNT(*) AS count FROM trade_entries").get() as {
    count: number;
  };
  const alerts = db.prepare("SELECT COUNT(*) AS count FROM alert_rules").get() as {
    count: number;
  };
  const triggeredAlerts = db
    .prepare("SELECT COUNT(*) AS count FROM alert_rules WHERE triggeredAt IS NOT NULL")
    .get() as { count: number };
  const snapshots = db.prepare("SELECT COUNT(*) AS count FROM analysis_snapshots").get() as {
    count: number;
  };

  return {
    alerts: alerts.count,
    portfolio: portfolio.count,
    snapshots: snapshots.count,
    trades: trades.count,
    triggeredAlerts: triggeredAlerts.count,
  };
}
