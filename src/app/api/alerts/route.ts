import { NextRequest, NextResponse } from "next/server";
import {
  createAlertRule,
  deleteAlertRule,
  listAlertRules,
  updateAlertTriggeredAt,
  type AlertRuleRecord,
} from "@/lib/local-db";

export async function GET() {
  return NextResponse.json({ alerts: listAlertRules() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AlertRuleRecord;
  const alert: AlertRuleRecord = {
    id: body.id,
    market: body.market,
    symbol: body.symbol,
    metric: body.metric,
    direction: body.direction,
    threshold: Number(body.threshold),
    note: body.note ?? "",
    createdAt: body.createdAt,
    triggeredAt: body.triggeredAt,
  };

  return NextResponse.json({ alert: createAlertRule(alert) });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { id?: string; triggeredAt?: string | null };
  if (!body.id) {
    return NextResponse.json({ error: "id gerekli." }, { status: 400 });
  }

  updateAlertTriggeredAt(body.id, body.triggeredAt ?? null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id gerekli." }, { status: 400 });
  }

  deleteAlertRule(id);
  return NextResponse.json({ ok: true });
}
