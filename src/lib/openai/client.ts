import OpenAI from "openai";

export function createOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const CHAT_MODEL = "gpt-4o-mini";
export const EMBEDDING_MODEL = "text-embedding-3-small";
export const TTS_MODEL = "tts-1";

export const OPENAI_TTS_VOICES = [
  "nova",
  "shimmer",
  "alloy",
  "echo",
  "fable",
  "onyx",
] as const;

export type OpenAiTtsVoice = (typeof OPENAI_TTS_VOICES)[number];

export async function embedText(
  text: string,
  options?: { userId?: string | null; logUsage?: boolean },
): Promise<number[]> {
  const openai = createOpenAIClient();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  if (options?.logUsage !== false) {
    const { logEmbeddingUsage } = await import("@/lib/openai/usage");
    await logEmbeddingUsage(response.usage?.total_tokens ?? 0, options?.userId);
  }

  return response.data[0].embedding;
}
