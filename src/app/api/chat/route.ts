import { NextResponse } from "next/server";
import { createOpenAIClient, SYSTEM_PROMPT } from "@/lib/openai/client";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { retrieveMemories, extractMemories, saveMemories } from "@/lib/memory";
import { findRelatedArtworks, findRelatedConcepts } from "@/lib/concepts";
import { getArtworkBySlug, getPublishedArtworks } from "@/lib/data/artworks";

import { isSupabaseConfigured } from "@/lib/supabase/client";

export const runtime = "nodejs";

interface ChatRequest {
  message: string;
  conversationId?: string;
  artworkSlug?: string;
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationId, artworkSlug } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-...") {
      return streamFallback(
        "OpenAI aún no está configurado. Copia `.env.example` a `.env.local` y añade tu API key. Mientras tanto, explora la galería: cada obra tiene imagen y texto de sala para leer."
      );
    }

    const supabase = isSupabaseConfigured() ? await createClient() : null;
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;

    let activeConversationId = conversationId;
    const serviceClient = isSupabaseConfigured() ? createServiceClient() : null;

    if (user && serviceClient && !activeConversationId) {
      const { data: conv } = await serviceClient
        .from("conversations")
        .insert({ user_id: user.id, title: message.slice(0, 60) })
        .select("id")
        .single();
      activeConversationId = conv?.id;
    }

    if (user && serviceClient && activeConversationId) {
      await serviceClient.from("messages").insert({
        conversation_id: activeConversationId,
        role: "user",
        content: message,
      });
    }

    const contextParts: string[] = [];

    if (user && serviceClient) {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("flavor_summary, display_name")
        .eq("id", user.id)
        .single();

      if (profile?.flavor_summary) {
        contextParts.push(`Perfil de gusto: ${profile.flavor_summary}`);
      }
      if (profile?.display_name) {
        contextParts.push(`Nombre: ${profile.display_name}`);
      }

      const memories = await retrieveMemories(user.id, message);
      if (memories.length) {
        contextParts.push(
          "Memorias del usuario:\n" +
            memories.map((m) => `- [${m.memory_type}] ${m.content}`).join("\n")
        );
      }
    }

    if (artworkSlug) {
      const artwork = await getArtworkBySlug(artworkSlug);
      if (artwork) {
        contextParts.push(
          `Obra en contexto: "${artwork.title}" de ${artwork.artist}. ${artwork.description ?? ""}`
        );
      }
    }

    const catalog = await getPublishedArtworks();
    if (catalog.length) {
      contextParts.push(
        "Catálogo completo de la galería (SOLO existen estas obras, no inventes otras):\n" +
          catalog
            .map((a) => {
              const meta = [
                a.artist,
                a.year ? String(a.year) : null,
                a.medium,
              ]
                .filter(Boolean)
                .join(" · ");
              const text = [a.description, a.essay].filter(Boolean).join(" ");
              const tags = a.tags?.length ? ` Etiquetas: ${a.tags.join(", ")}.` : "";
              const concepts =
                a.concepts?.length
                  ? ` Conceptos: ${a.concepts.map((c) => c.name).join(", ")}.`
                  : "";
              return `- ${a.title}${meta ? ` (${meta})` : ""}${text ? `: ${text.slice(0, 600)}` : ""}${tags}${concepts}`;
            })
            .join("\n")
      );
    } else {
      contextParts.push(
        "La galería está vacía. No cites obras concretas; invita al usuario a explorar cuando suba contenido."
      );
    }

    try {
      const [artworks, concepts] = await Promise.all([
        findRelatedArtworks(message, 4),
        findRelatedConcepts(message, 5),
      ]);

      if (artworks.length) {
        contextParts.push(
          "Obras más relevantes para esta pregunta:\n" +
            artworks
              .map((a: { title: string; artist: string | null; description?: string | null }) =>
                `- ${a.title}${a.artist ? ` (${a.artist})` : ""}${a.description ? `: ${a.description.slice(0, 100)}` : ""}`
              )
              .join("\n")
        );
      }

      if (concepts.length) {
        contextParts.push(
          "Conceptos relacionados:\n" +
            concepts.map((c: { name: string; description?: string | null }) =>
              `- ${c.name}: ${c.description ?? ""}`
            ).join("\n")
        );
      }
    } catch {
      // Búsqueda semántica opcional; el catálogo completo ya está arriba
    }

    let history: { role: "user" | "assistant"; content: string }[] = [];

    if (user && serviceClient && activeConversationId) {
      const { data: pastMessages } = await serviceClient
        .from("messages")
        .select("role, content")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true })
        .limit(20);

      history =
        pastMessages
          ?.filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })) ?? [];
    }

    const openai = createOpenAIClient();
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content:
            SYSTEM_PROMPT +
            (contextParts.length
              ? `\n\n--- Contexto ---\n${contextParts.join("\n\n")}`
              : ""),
        },
        ...history.slice(0, -1),
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        if (activeConversationId) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ conversationId: activeConversationId })}\n\n`
            )
          );
        }

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content ?? "";
          if (content) {
            fullResponse += content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        if (user && serviceClient && activeConversationId && fullResponse) {
          const { data: savedMsg } = await serviceClient
            .from("messages")
            .insert({
              conversation_id: activeConversationId,
              role: "assistant",
              content: fullResponse,
            })
            .select("id")
            .single();

          extractMemories(message, fullResponse).then((memories) =>
            saveMemories(user.id, memories, savedMsg?.id)
          );
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return streamFallback(
      "Hubo un error al procesar tu mensaje. Verifica la configuración de OpenAI y Supabase."
    );
  }
}

function streamFallback(text: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
