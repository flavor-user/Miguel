import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import {
  aggregateUsageRows,
  emptyUsageSummary,
  getMonthlyBudgetUsd,
} from "@/lib/openai/usage";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";

function monthStartIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      message:
        "Ejecuta la migración 005_ai_usage_logs.sql en Supabase para activar el registro.",
      month: emptyUsageSummary(),
      allTime: emptyUsageSummary(),
      budgetUsd: getMonthlyBudgetUsd(),
      spentPercent: null,
    });
  }

  const supabase = createServiceClient();
  const monthStart = monthStartIso();

  const { data: monthRows, error: monthError } = await supabase
    .from("ai_usage_logs")
    .select("usage_type, estimated_cost_usd, total_tokens, char_count")
    .gte("created_at", monthStart);

  if (monthError) {
    return NextResponse.json(
      {
        configured: false,
        message: monthError.message.includes("ai_usage_logs")
          ? "Falta la tabla ai_usage_logs. Ejecuta supabase/migrations/005_ai_usage_logs.sql"
          : monthError.message,
        month: emptyUsageSummary(),
        allTime: emptyUsageSummary(),
        budgetUsd: getMonthlyBudgetUsd(),
        spentPercent: null,
      },
      { status: 200 },
    );
  }

  const { data: allRows } = await supabase
    .from("ai_usage_logs")
    .select("usage_type, estimated_cost_usd, total_tokens, char_count");

  const month = aggregateUsageRows(monthRows ?? []);
  const allTime = aggregateUsageRows(allRows ?? []);
  const budgetUsd = getMonthlyBudgetUsd();
  const spentPercent =
    budgetUsd && budgetUsd > 0
      ? Math.min(100, (month.totalUsd / budgetUsd) * 100)
      : null;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data: recentRows } = await supabase
    .from("ai_usage_logs")
    .select("created_at, estimated_cost_usd")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const dailyMap = new Map<string, number>();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of recentRows ?? []) {
    const key = row.created_at.slice(0, 10);
    if (dailyMap.has(key)) {
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + Number(row.estimated_cost_usd));
    }
  }

  const dailyLast7 = [...dailyMap.entries()].map(([date, usd]) => ({
    date,
    usd: Math.round(usd * 10000) / 10000,
  }));

  return NextResponse.json({
    configured: true,
    month,
    allTime,
    budgetUsd,
    spentPercent,
    dailyLast7,
  });
}
