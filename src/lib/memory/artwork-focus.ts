import { createServiceClient } from "@/lib/supabase/admin";

export type ArtworkVisit = {
  artwork_slug: string;
  artwork_title: string;
  last_visited_at: string;
};

export type LastArtworkFocus = {
  slug: string;
  title: string;
};

export async function recordArtworkVisit(
  userId: string,
  slug: string,
  title: string,
): Promise<void> {
  if (!slug.trim() || !title.trim()) return;

  try {
    const supabase = createServiceClient();

    await supabase
      .from("profiles")
      .update({
        last_artwork_slug: slug,
        last_artwork_title: title,
      })
      .eq("id", userId);

    await supabase.from("user_artwork_visits").upsert(
      {
        user_id: userId,
        artwork_slug: slug,
        artwork_title: title,
        last_visited_at: new Date().toISOString(),
      },
      { onConflict: "user_id,artwork_slug" },
    );
  } catch (error) {
    console.error("recordArtworkVisit:", error);
  }
}

export async function getLastArtworkFocus(
  userId: string,
): Promise<LastArtworkFocus | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("profiles")
      .select("last_artwork_slug, last_artwork_title")
      .eq("id", userId)
      .single();

    if (!data?.last_artwork_slug || !data?.last_artwork_title) return null;

    return {
      slug: data.last_artwork_slug,
      title: data.last_artwork_title,
    };
  } catch {
    return null;
  }
}

export async function getExploredArtworks(
  userId: string,
  limit = 8,
): Promise<ArtworkVisit[]> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("user_artwork_visits")
      .select("artwork_slug, artwork_title, last_visited_at")
      .eq("user_id", userId)
      .order("last_visited_at", { ascending: false })
      .limit(limit);

    return data ?? [];
  } catch {
    return [];
  }
}
