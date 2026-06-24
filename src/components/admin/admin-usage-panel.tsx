"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { adminSectionClass } from "@/components/admin/admin-form-classes";
import type { UsageSummary } from "@/lib/openai/usage";

type UsageResponse = {
  configured: boolean;
  message?: string;
  month: UsageSummary;
  allTime: UsageSummary;
  budgetUsd: number | null;
  spentPercent: number | null;
  dailyLast7?: { date: string; usd: number }[];
};

function formatUsd(value: number): string {
  if (value < 0.01 && value > 0) return "< $0.01";
  return `$${value.toFixed(2)}`;
}

function UsageRow({
  label,
  count,
  detail,
  usd,
}: {
  label: string;
  count: number;
  detail: string;
  usd: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-neutral-700 py-2 last:border-0">
      <div>
        <p className="font-bold text-stone-200">{label}</p>
        <p className="text-xs text-stone-400">
          {count} {count === 1 ? "llamada" : "llamadas"} · {detail}
        </p>
      </div>
      <p className="tabular-nums text-stone-100">{formatUsd(usd)}</p>
    </div>
  );
}

export function AdminUsagePanel() {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/usage", { credentials: "include" });
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const month = data?.month;
  const maxDaily = Math.max(
    ...(data?.dailyLast7?.map((d) => d.usd) ?? [0]),
    0.0001,
  );

  return (
    <section className={`${adminSectionClass} mb-10`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-100">Gasto de IA</h2>
          <p className="mt-1 text-sm text-stone-400">
            Estimación según tarifas de OpenAI. Para el dato oficial, revisa el
            panel de OpenAI.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-neutral-600 px-3 py-1.5 text-sm text-stone-200 transition hover:border-stone-400"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Actualizar
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-2 text-stone-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando…
        </div>
      ) : null}

      {data && !data.configured ? (
        <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-4 text-sm text-amber-100">
          <p className="font-bold">Registro no activo</p>
          <p className="mt-2 text-amber-200/90">
            {data.message ??
              "Ejecuta supabase/migrations/005_ai_usage_logs.sql en el SQL Editor de Supabase."}
          </p>
        </div>
      ) : null}

      {data?.configured && month ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Este mes
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-stone-100">
                {formatUsd(month.totalUsd)}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {month.totalRequests} operaciones
              </p>
            </div>
            <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Histórico
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-stone-100">
                {formatUsd(data.allTime.totalUsd)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">
                Presupuesto mensual
              </p>
              {data.budgetUsd ? (
                <>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-stone-100">
                    {data.spentPercent?.toFixed(0) ?? 0}%
                  </p>
                  <p className="mt-1 text-xs text-stone-400">
                    de {formatUsd(data.budgetUsd)} (
                    <code className="text-stone-300">
                      OPENAI_MONTHLY_BUDGET_USD
                    </code>
                    )
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${Math.min(100, data.spentPercent ?? 0)}%`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-stone-400">
                  Añade{" "}
                  <code className="text-stone-300">
                    OPENAI_MONTHLY_BUDGET_USD=10
                  </code>{" "}
                  en Vercel para ver el % usado.
                </p>
              )}
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-bold text-stone-300">
                Desglose del mes
              </h3>
              <UsageRow
                label="Chat (curador)"
                count={month.chat.count}
                detail={`${month.chat.tokens.toLocaleString()} tokens`}
                usd={month.chat.usd}
              />
              <UsageRow
                label="Memoria"
                count={month.memory.count}
                detail={`${month.memory.tokens.toLocaleString()} tokens`}
                usd={month.memory.usd}
              />
              <UsageRow
                label="Embeddings"
                count={month.embedding.count}
                detail={`${month.embedding.tokens.toLocaleString()} tokens`}
                usd={month.embedding.usd}
              />
              <UsageRow
                label="Voz (TTS)"
                count={month.tts.count}
                detail={`${month.tts.chars.toLocaleString()} caracteres`}
                usd={month.tts.usd}
              />
            </div>

            {data.dailyLast7?.length ? (
              <div>
                <h3 className="mb-2 text-sm font-bold text-stone-300">
                  Últimos 7 días
                </h3>
                <div className="flex h-24 items-end gap-1">
                  {data.dailyLast7.map((day) => (
                    <div
                      key={day.date}
                      className="flex flex-1 flex-col items-center gap-1"
                      title={`${day.date}: ${formatUsd(day.usd)}`}
                    >
                      <div
                        className="w-full min-h-[2px] rounded-sm bg-emerald-600/80"
                        style={{
                          height: `${Math.max(4, (day.usd / maxDaily) * 100)}%`,
                        }}
                      />
                      <span className="text-[10px] text-stone-500">
                        {day.date.slice(8)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
