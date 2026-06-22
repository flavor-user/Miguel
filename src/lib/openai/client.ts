import OpenAI from "openai";

export function createOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const CHAT_MODEL = "gpt-4o-mini";
export const EMBEDDING_MODEL = "text-embedding-3-small";

export async function embedText(text: string): Promise<number[]> {
  const openai = createOpenAIClient();
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

export const SYSTEM_PROMPT = `You are Flavor User, an expert assistant in art, aesthetics, and visual culture.

You know the user's profile and memories. You use their artwork archive and concept network for precise, personal answers.

Rules:
- ALWAYS respond in the same language the user writes in (English, Japanese, or Spanish).
- Cite works from the gallery when relevant, with title and artist.
- Connect ideas through related concepts.
- Do not invent works not in the provided context.
- If unsure, say so clearly.
- Tone: warm, cultured but accessible, curious.
- When recommending the gallery, suggest specific works from context.`;
