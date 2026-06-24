import { NextResponse } from "next/server";
import { createOpenAIClient, TTS_MODEL, type OpenAiTtsVoice, OPENAI_TTS_VOICES } from "@/lib/openai/client";
import { logTtsUsage } from "@/lib/openai/usage";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_TTS_CHARS = 4096;

export async function POST(request: Request) {
  if (
    !process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY === "sk-..."
  ) {
    return NextResponse.json(
      { error: "OpenAI no configurado" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { text?: string; voice?: string };
    const text = String(body.text ?? "").trim();

    if (!text) {
      return NextResponse.json({ error: "Texto vacío" }, { status: 400 });
    }

    if (text.length > MAX_TTS_CHARS) {
      return NextResponse.json(
        { error: "Texto demasiado largo para voz" },
        { status: 400 },
      );
    }

    const voice = OPENAI_TTS_VOICES.includes(body.voice as OpenAiTtsVoice)
      ? (body.voice as OpenAiTtsVoice)
      : "nova";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const openai = createOpenAIClient();
    const speech = await openai.audio.speech.create({
      model: TTS_MODEL,
      voice,
      input: text,
    });

    await logTtsUsage(text.length, user?.id);

    const buffer = Buffer.from(await speech.arrayBuffer());

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "No se pudo generar la voz" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    available: Boolean(
      process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "sk-...",
    ),
    voices: OPENAI_TTS_VOICES,
    model: TTS_MODEL,
  });
}
