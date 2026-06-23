import { createServiceClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/openai/client";

export type MemoryType = "preference" | "dislike" | "fact" | "context";

export interface ExtractedMemory {
  memory_type: MemoryType;
  content: string;
  importance: number;
}

const EXTRACTION_PROMPT = `Analiza el intercambio entre visitante y curador de una galería de arte personal.
Extrae solo hechos concretos útiles para futuras conversaciones sobre el artista o sus obras.
Devuelve JSON: { "memories": [{ "memory_type": "preference|dislike|fact|context", "content": "...", "importance": 0.0-1.0 }] }
No incluyas generalidades vacías sobre arte. Si no hay nada útil, devuelve { "memories": [] }.`;

export async function retrieveMemories(
  userId: string,
  query: string,
  limit = 8,
): Promise<{ content: string; memory_type: string }[]> {
  try {
    const embedding = await embedText(query);
    const supabase = createServiceClient();
    const { data } = await supabase.rpc("match_memories", {
      query_embedding: embedding,
      match_user_id: userId,
      match_count: limit,
    });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function extractMemories(
  userMessage: string,
  assistantMessage: string,
): Promise<ExtractedMemory[]> {
  const { createOpenAIClient } = await import("@/lib/openai/client");
  const openai = createOpenAIClient();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        {
          role: "user",
          content: `Usuario: ${userMessage}\n\nAsistente: ${assistantMessage}`,
        },
      ],
      temperature: 0.2,
    });

    const parsed = JSON.parse(response.choices[0].message.content ?? "{}");
    return parsed.memories ?? [];
  } catch {
    return [];
  }
}

export async function saveMemories(
  userId: string,
  memories: ExtractedMemory[],
  sourceMessageId?: string,
): Promise<void> {
  if (!memories.length) return;

  const supabase = createServiceClient();

  for (const memory of memories) {
    const embedding = await embedText(memory.content);
    await supabase.from("user_memories").insert({
      user_id: userId,
      memory_type: memory.memory_type,
      content: memory.content,
      source_message_id: sourceMessageId,
      embedding,
      importance: memory.importance,
    });
  }
}
