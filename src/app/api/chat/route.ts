import { NextResponse } from "next/server";
import { createOpenAIClient, CHAT_MODEL } from "@/lib/openai/client";
import { CURATOR_SYSTEM_PROMPT } from "@/lib/curator/prompt";
import { buildCuratorContext } from "@/lib/curator/context";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { retrieveMemories, extractMemories, saveMemories } from "@/lib/memory";
import { getArtworkBySlug, getPublishedArtworks } from "@/lib/data/artworks";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { logChatUsage } from "@/lib/openai/usage";

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

    if (
      !process.env.OPENAI_API_KEY ||
      process.env.OPENAI_API_KEY === "sk-..."
    ) {
      return streamFallback(
        "OpenAI aún no está configurado. Añade OPENAI_API_KEY en Vercel y haz Redeploy.",
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

      await serviceClient
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeConversationId);
    }

    let artistBio: string | null = null;
    let artistName: string | null = null;
    let flavorSummary: string | null = null;
    let memories: { content: string; memory_type: string }[] = [];

    if (user && serviceClient) {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("bio, flavor_summary, display_name")
        .eq("id", user.id)
        .single();

      artistBio = profile?.bio ?? null;
      artistName = profile?.display_name ?? null;
      flavorSummary = profile?.flavor_summary ?? null;
      memories = await retrieveMemories(user.id, message);
    }

    const catalog = await getPublishedArtworks();

    if (!artistName && catalog.length) {
      artistName = catalog.find((a) => a.artist)?.artist ?? null;
    }

    const focusArtwork = artworkSlug
      ? await getArtworkBySlug(artworkSlug)
      : null;

    const curatorContext = buildCuratorContext({
      catalog,
      focusArtwork,
      artistBio,
      artistName,
      flavorSummary,
      memories,
    });

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
      model: CHAT_MODEL,
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        {
          role: "system",
          content: `${CURATOR_SYSTEM_PROMPT}\n\n--- Contexto del archivo ---\n${curatorContext}`,
        },
        ...history.slice(0, -1),
        { role: "user", content: message },
      ],
      temperature: 0.45,
      max_tokens: 1200,
    });

    const encoder = new TextEncoder();
    let fullResponse = "";
    let streamUsage:
      | {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        }
      | undefined;

    const readable = new ReadableStream({
      async start(controller) {
        if (activeConversationId) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ conversationId: activeConversationId })}\n\n`,
            ),
          );
        }

        for await (const chunk of stream) {
          if (chunk.usage) {
            streamUsage = chunk.usage;
          }
          const content = chunk.choices[0]?.delta?.content ?? "";
          if (content) {
            fullResponse += content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
            );
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();

        void logChatUsage(streamUsage, user?.id ?? null);

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

          extractMemories(message, fullResponse, user.id).then((extracted) =>
            saveMemories(user.id, extracted, savedMsg?.id),
          );

          await serviceClient
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", activeConversationId);
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
      "Hubo un error al procesar tu mensaje. Verifica la configuración de OpenAI y Supabase.",
    );
  }
}

function streamFallback(text: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}
