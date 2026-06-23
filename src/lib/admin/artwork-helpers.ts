import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/utils";
import type { Database } from "@/types/database.types";

type ServiceClient = SupabaseClient<Database>;

export const MAX_ARTWORK_IMAGE_SIZE = 4 * 1024 * 1024;

export function parseCommaList(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function uniqueArtworkSlug(
  supabase: ServiceClient,
  title: string,
  excludeId?: string,
): Promise<string> {
  const base = slugify(title) || `obra-${Date.now()}`;
  let candidate = base;
  let suffix = 2;

  while (true) {
    let query = supabase.from("artworks").select("id").eq("slug", candidate);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export function mimeFromExtension(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "jpeg":
    case "jpg":
    default:
      return "image/jpeg";
  }
}

export function storagePathFromPublicUrl(imageUrl: string): string | null {
  const marker = "/storage/v1/object/public/artworks/";
  const index = imageUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(imageUrl.slice(index + marker.length));
}
