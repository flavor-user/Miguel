import { createServiceClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/openai/client";

export type MemoryType = "preference" | "dislike" | "fact" | "context";

export interface ExtractedMemory {
  memory_type: MemoryType;
  content: string;
  importance: number;
}

const EXTRACTION_PROMPT = `Analiza el intercambio entre visitante y curador de un archivo de arte personal (obras abstractas, prototipos, instalaciones).

Extrae hechos concretos que ayuden a acompañar mejor a esta persona en futuras visitas — no un ensayo académico.

Captura cuando aparezca:
- Obras, materiales, series o temas que le interesan o le inquietan
- Cómo mira o describe las piezas (sensorial, técnico, emocional)
- Preguntas que repite o hilos que quiere profundizar
- Su nombre, si lo dice
- Conexiones que él/ella misma/a hace entre obras
- Lo que rechaza o le aleja (dislikes)

Devuelve JSON: { "memories": [{ "memory_type": "preference|dislike|fact|context", "content": "...", "importance": 0.0-1.0 }] }

Importance: 0.9+ para identidad/nombre/obras clave; 0.6–0.8 para gustos; 0.4–0.5 para detalle menor.
Si no hay nada útil, devuelve { "memories": [] }.`;

const FLAVOR_SUMMARY_PROMPT = `Eres el curador de un archivo de arte personal. Redacta o actualiza un perfil vivo del visitante para futuras conversaciones.

Objetivo: que el curador retome la relación con naturalidad — cercano a la obra, sin distancia académica.

Incluye si consta:
- Cómo se relaciona con las obras (mirada, sensibilidad, ritmo de preguntas)
- Piezas, materiales, procesos o hilos que le atraen
- Temas recurrentes o preguntas abiertas
- Tono que le funciona (directo, poético, técnico…)
- Nombre si se conoce

120–220 palabras. Idioma: el predominante en las notas (español, english, 日本語).
Tercera persona ("Esta persona…" / "This visitor…"). Sin jerga vacía.
Si hay resumen previo, intégralo y enriquécelo — no lo repitas tal cual.`;

export async function retrieveMemories(
  userId: string,
  query: string,
  limit = 12,
): Promise<{ content: string; memory_type: string }[]> {
  try {
    const embedding = await embedText(query, { userId });
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

export async function getCoreMemories(
  userId: string,
  limit = 12,
): Promise<{ content: string; memory_type: string }[]> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("user_memories")
      .select("content, memory_type")
      .eq("user_id", userId)
      .order("importance", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    return data ?? [];
  } catch {
    return [];
  }
}

export function mergeMemories(
  ...groups: { content: string; memory_type: string }[][]
): { content: string; memory_type: string }[] {
  const seen = new Set<string>();
  const merged: { content: string; memory_type: string }[] = [];

  for (const group of groups) {
    for (const memory of group) {
      const key = memory.content.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(memory);
    }
  }

  return merged.slice(0, 20);
}

export async function getRecentConversationThreads(
  userId: string,
  excludeConversationId?: string,
  maxThreads = 3,
): Promise<{ title: string; excerpt: string }[]> {
  try {
    const supabase = createServiceClient();
    let query = supabase
      .from("conversations")
      .select("id, title")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(maxThreads + 1);

    const { data: conversations } = await query;

    const threads = (conversations ?? []).filter(
      (conversation) => conversation.id !== excludeConversationId,
    );

    const result: { title: string; excerpt: string }[] = [];

    for (const conversation of threads.slice(0, maxThreads)) {
      const { data: messages } = await supabase
        .from("messages")
        .select("role, content")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (!messages?.length) continue;

      const chronological = [...messages].reverse();
      const excerpt = chronological
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => {
          const label = message.role === "user" ? "Visitante" : "Curador";
          const text =
            message.content.length > 280
              ? `${message.content.slice(0, 277)}…`
              : message.content;
          return `${label}: ${text}`;
        })
        .join("\n");

      if (excerpt.trim()) {
        result.push({ title: conversation.title, excerpt });
      }
    }

    return result;
  } catch {
    return [];
  }
}

export async function extractMemories(
  userMessage: string,
  assistantMessage: string,
  userId?: string | null,
): Promise<ExtractedMemory[]> {
  const { createOpenAIClient } = await import("@/lib/openai/client");
  const { logMemoryUsage } = await import("@/lib/openai/usage");
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

    void logMemoryUsage(response.usage, userId);

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
    const embedding = await embedText(memory.content, { userId });
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

export async function refreshFlavorSummary(userId: string): Promise<void> {
  const { createOpenAIClient } = await import("@/lib/openai/client");
  const { logMemoryUsage } = await import("@/lib/openai/usage");
  const supabase = createServiceClient();

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("flavor_summary, display_name")
      .eq("id", userId)
      .single();

    const { data: memories } = await supabase
      .from("user_memories")
      .select("content, memory_type, importance")
      .eq("user_id", userId)
      .order("importance", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(40);

    if (!memories?.length) return;

    const memoryBlock = memories
      .map((memory) => `- [${memory.memory_type}] ${memory.content}`)
      .join("\n");

    const openai = createOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: FLAVOR_SUMMARY_PROMPT },
        {
          role: "user",
          content: [
            profile?.display_name
              ? `Nombre en perfil: ${profile.display_name}`
              : null,
            profile?.flavor_summary
              ? `Resumen previo:\n${profile.flavor_summary}`
              : "Sin resumen previo.",
            `Notas acumuladas:\n${memoryBlock}`,
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
      temperature: 0.35,
      max_tokens: 400,
    });

    void logMemoryUsage(response.usage, userId);

    const summary = response.choices[0].message.content?.trim();
    if (!summary) return;

    await supabase
      .from("profiles")
      .update({ flavor_summary: summary })
      .eq("id", userId);
  } catch (error) {
    console.error("refreshFlavorSummary:", error);
  }
}

export async function countUserMemories(userId: string): Promise<number> {
  try {
    const supabase = createServiceClient();
    const { count } = await supabase
      .from("user_memories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    return count ?? 0;
  } catch {
    return 0;
  }
}
