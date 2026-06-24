import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  CHAT_MODEL,
  EMBEDDING_MODEL,
  TTS_MODEL,
} from "@/lib/openai/client";

export type AiUsageType = "chat" | "embedding" | "memory" | "tts";

/** Precios orientativos USD (actualizar si OpenAI cambia tarifas). */
const PRICING = {
  chat: { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  memory: { input: 0.15 / 1_000_000, output: 0.6 / 1_000_000 },
  embedding: { input: 0.02 / 1_000_000, output: 0 },
  tts: { perChar: 15 / 1_000_000 },
} as const;

export function estimateChatCost(
  promptTokens: number,
  completionTokens: number,
): number {
  return (
    promptTokens * PRICING.chat.input +
    completionTokens * PRICING.chat.output
  );
}

export function estimateEmbeddingCost(totalTokens: number): number {
  return totalTokens * PRICING.embedding.input;
}

export function estimateTtsCost(charCount: number): number {
  return charCount * PRICING.tts.perChar;
}

export function getMonthlyBudgetUsd(): number | null {
  const raw = process.env.OPENAI_MONTHLY_BUDGET_USD?.trim();
  if (!raw) return null;
  const value = parseFloat(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export async function logAiUsage(params: {
  usageType: AiUsageType;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  charCount?: number;
  userId?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const promptTokens = params.promptTokens ?? 0;
  const completionTokens = params.completionTokens ?? 0;
  const totalTokens =
    params.totalTokens ?? promptTokens + completionTokens;
  const charCount = params.charCount ?? 0;

  let estimatedCostUsd = 0;
  if (params.usageType === "tts") {
    estimatedCostUsd = estimateTtsCost(charCount);
  } else if (params.usageType === "embedding") {
    estimatedCostUsd = estimateEmbeddingCost(totalTokens);
  } else {
    estimatedCostUsd = estimateChatCost(promptTokens, completionTokens);
  }

  try {
    const supabase = createServiceClient();
    await supabase.from("ai_usage_logs").insert({
      usage_type: params.usageType,
      model: params.model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
      char_count: charCount,
      estimated_cost_usd: estimatedCostUsd,
      user_id: params.userId ?? null,
    });
  } catch (error) {
    console.error("logAiUsage:", error);
  }
}

export async function logChatUsage(
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | undefined,
  userId?: string | null,
) {
  if (!usage) return;
  await logAiUsage({
    usageType: "chat",
    model: CHAT_MODEL,
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens,
    userId,
  });
}

export async function logMemoryUsage(
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | undefined,
  userId?: string | null,
) {
  if (!usage) return;
  await logAiUsage({
    usageType: "memory",
    model: CHAT_MODEL,
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens,
    userId,
  });
}

export async function logEmbeddingUsage(
  totalTokens: number,
  userId?: string | null,
) {
  await logAiUsage({
    usageType: "embedding",
    model: EMBEDDING_MODEL,
    totalTokens,
    userId,
  });
}

export async function logTtsUsage(charCount: number, userId?: string | null) {
  await logAiUsage({
    usageType: "tts",
    model: TTS_MODEL,
    charCount,
    userId,
  });
}

export type UsageSummary = {
  totalUsd: number;
  totalRequests: number;
  chat: { count: number; usd: number; tokens: number };
  embedding: { count: number; usd: number; tokens: number };
  memory: { count: number; usd: number; tokens: number };
  tts: { count: number; usd: number; chars: number };
};

export function emptyUsageSummary(): UsageSummary {
  return {
    totalUsd: 0,
    totalRequests: 0,
    chat: { count: 0, usd: 0, tokens: 0 },
    embedding: { count: 0, usd: 0, tokens: 0 },
    memory: { count: 0, usd: 0, tokens: 0 },
    tts: { count: 0, usd: 0, chars: 0 },
  };
}

type UsageRow = {
  usage_type: string;
  estimated_cost_usd: number;
  total_tokens: number;
  char_count: number;
};

export function aggregateUsageRows(rows: UsageRow[]): UsageSummary {
  const summary = emptyUsageSummary();

  for (const row of rows) {
    const usd = Number(row.estimated_cost_usd) || 0;
    summary.totalUsd += usd;
    summary.totalRequests += 1;

    switch (row.usage_type) {
      case "chat":
        summary.chat.count += 1;
        summary.chat.usd += usd;
        summary.chat.tokens += row.total_tokens ?? 0;
        break;
      case "embedding":
        summary.embedding.count += 1;
        summary.embedding.usd += usd;
        summary.embedding.tokens += row.total_tokens ?? 0;
        break;
      case "memory":
        summary.memory.count += 1;
        summary.memory.usd += usd;
        summary.memory.tokens += row.total_tokens ?? 0;
        break;
      case "tts":
        summary.tts.count += 1;
        summary.tts.usd += usd;
        summary.tts.chars += row.char_count ?? 0;
        break;
      default:
        break;
    }
  }

  return summary;
}
