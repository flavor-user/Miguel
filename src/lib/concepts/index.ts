import { createServiceClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/openai/client";
import { slugify } from "@/lib/utils";

export async function findRelatedConcepts(query: string, limit = 6) {
  try {
    const embedding = await embedText(query);
    const supabase = createServiceClient();
    const { data } = await supabase.rpc("match_concepts", {
      query_embedding: embedding,
      match_count: limit,
    });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function findRelatedArtworks(query: string, limit = 4) {
  try {
    const embedding = await embedText(query);
    const supabase = createServiceClient();
    const { data } = await supabase.rpc("match_artworks", {
      query_embedding: embedding,
      match_count: limit,
      only_published: true,
    });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function upsertConceptFromName(
  name: string,
): Promise<string | null> {
  const slug = slugify(name);
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("concepts")
    .select("id")
    .eq("slug", slug)
    .single();

  if (existing) return existing.id;

  const embedding = await embedText(`${name}. Concepto artístico.`);
  const { data: created } = await supabase
    .from("concepts")
    .insert({ name, slug, description: null, embedding })
    .select("id")
    .single();

  return created?.id ?? null;
}

export async function linkArtworkConcepts(
  artworkId: string,
  conceptNames: string[],
): Promise<void> {
  const supabase = createServiceClient();

  for (const name of conceptNames) {
    const conceptId = await upsertConceptFromName(name);
    if (!conceptId) continue;

    await supabase
      .from("artwork_concepts")
      .upsert(
        { artwork_id: artworkId, concept_id: conceptId, relevance: 1.0 },
        { onConflict: "artwork_id,concept_id" },
      );
  }
}

export async function boostUserConceptInterest(
  userId: string,
  conceptSlug: string,
): Promise<void> {
  const supabase = createServiceClient();
  const { data: concept } = await supabase
    .from("concepts")
    .select("id")
    .eq("slug", conceptSlug)
    .single();

  if (!concept) return;

  const { data: existing } = await supabase
    .from("user_concept_interests")
    .select("strength")
    .eq("user_id", userId)
    .eq("concept_id", concept.id)
    .single();

  await supabase.from("user_concept_interests").upsert(
    {
      user_id: userId,
      concept_id: concept.id,
      strength: (existing?.strength ?? 0) + 0.1,
    },
    { onConflict: "user_id,concept_id" },
  );
}
