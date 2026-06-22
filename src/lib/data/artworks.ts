import {
  DEMO_ARTWORKS,
  DEMO_CONCEPTS,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createPublicClient } from "@/lib/supabase/public";
import type { ArtworkWithConcepts, Concept } from "@/types/database.types";

async function attachConcepts(
  artworks: Omit<ArtworkWithConcepts, "concepts">[]
): Promise<ArtworkWithConcepts[]> {
  const supabase = createPublicClient();

  return Promise.all(
    artworks.map(async (artwork) => {
      const { data } = await supabase
        .from("artwork_concepts")
        .select("concept_id, concepts(*)")
        .eq("artwork_id", artwork.id);

      const concepts =
        data
          ?.map((row) => {
            const concept = row.concepts as unknown as Concept | null;
            return concept;
          })
          .filter(Boolean) ?? [];

      return { ...artwork, concepts: concepts as Concept[] };
    })
  );
}

export async function getPublishedArtworks(): Promise<ArtworkWithConcepts[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_ARTWORKS;
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (error || !data?.length) {
    return [];
  }

  return attachConcepts(data);
}

export async function getArtworkBySlug(
  slug: string
): Promise<ArtworkWithConcepts | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) {
    return null;
  }

  const [withConcepts] = await attachConcepts([data]);
  return withConcepts;
}

export async function getAllConcepts(): Promise<Concept[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_CONCEPTS;
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("concepts")
    .select("*")
    .order("name");

  if (error || !data?.length) {
    return [];
  }

  return data;
}

export async function getConceptBySlug(slug: string): Promise<Concept | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("concepts")
    .select("*")
    .eq("slug", slug)
    .single();

  return data ?? null;
}

export async function getArtworksByConcept(
  conceptSlug: string
): Promise<ArtworkWithConcepts[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const concept = await getConceptBySlug(conceptSlug);
  if (!concept) return [];

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("artwork_concepts")
    .select("artworks(*)")
    .eq("concept_id", concept.id);

  const rawArtworks = data
    ?.map((row) => {
      const a = row.artworks as unknown as Omit<ArtworkWithConcepts, "concepts"> | null;
      return a;
    })
    .filter(Boolean) as Omit<ArtworkWithConcepts, "concepts">[];

  if (!rawArtworks?.length) {
    return [];
  }

  return attachConcepts(rawArtworks);
}

export async function getRelatedConcepts(
  conceptSlug: string
): Promise<Concept[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const concept = await getConceptBySlug(conceptSlug);
  if (!concept) return [];

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("concept_relations")
    .select("concept_a_id, concept_b_id")
    .or(`concept_a_id.eq.${concept.id},concept_b_id.eq.${concept.id}`);

  const relatedIds = new Set<string>();
  data?.forEach((row) => {
    if (row.concept_a_id !== concept.id) relatedIds.add(row.concept_a_id);
    if (row.concept_b_id !== concept.id) relatedIds.add(row.concept_b_id);
  });

  if (relatedIds.size === 0) {
    return [];
  }

  const { data: concepts } = await supabase
    .from("concepts")
    .select("*")
    .in("id", Array.from(relatedIds));

  return concepts ?? [];
}
