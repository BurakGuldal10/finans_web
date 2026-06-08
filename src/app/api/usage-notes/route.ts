import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  createUsageTrialNote,
  deleteUsageTrialNote,
  listUsageTrialNotes,
  type UsageTrialNoteRecord,
} from "@/lib/local-db";

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export async function GET() {
  return NextResponse.json({
    notes: listUsageTrialNotes(),
  });
}

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as
    | Partial<UsageTrialNoteRecord>
    | null;

  if (!payload) {
    return NextResponse.json({ error: "Gecersiz JSON govdesi." }, { status: 400 });
  }

  const date = readText(payload.date);
  const snapshots = Number(payload.snapshots);

  if (!isValidDate(date)) {
    return NextResponse.json({ error: "Gecerli bir tarih gerekli." }, { status: 400 });
  }

  if (!Number.isFinite(snapshots) || snapshots < 0) {
    return NextResponse.json({ error: "Snapshot sayisi gecersiz." }, { status: 400 });
  }

  const note = createUsageTrialNote({
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    date,
    symbols: readText(payload.symbols),
    snapshots,
    tradeNotes: readText(payload.tradeNotes),
    usefulPanel: readText(payload.usefulPanel),
    confusingPanel: readText(payload.confusingPanel),
    dataIssue: readText(payload.dataIssue),
    nextAction: readText(payload.nextAction),
  });

  return NextResponse.json({ note }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Kullanim notu id gerekli." }, { status: 400 });
  }

  deleteUsageTrialNote(id);
  return NextResponse.json({ ok: true });
}
