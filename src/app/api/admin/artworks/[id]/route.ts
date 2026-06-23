import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import {
  MAX_ARTWORK_IMAGE_SIZE,
  mimeFromExtension,
  parseCommaList,
  storagePathFromPublicUrl,
  uniqueArtworkSlug,
} from "@/lib/admin/artwork-helpers";
import { syncArtworkConcepts } from "@/lib/concepts";
import { embedText } from "@/lib/openai/client";
import { readImageDimensions } from "@/lib/image-dimensions";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";

type ArtworkUpdate = Database["public"]["Tables"]["artworks"]["Update"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: artwork, error } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !artwork) {
    return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
  }

  const { data: links } = await supabase
    .from("artwork_concepts")
    .select("concepts(name)")
    .eq("artwork_id", id);

  const concepts =
    links
      ?.map((row) => {
        const raw = row.concepts as { name: string } | { name: string }[] | null;
        if (!raw) return null;
        if (Array.isArray(raw)) return raw[0]?.name ?? null;
        return raw.name;
      })
      .filter((name): name is string => Boolean(name)) ?? [];

  return NextResponse.json({ ...artwork, concepts });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: existing, error: fetchError } = await supabase
    .from("artworks")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  const updates: ArtworkUpdate = {};
  let conceptNames: string[] | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const title = String(form.get("title") ?? "").trim();

      if (!title) {
        return NextResponse.json(
          { error: "El título es obligatorio" },
          { status: 400 },
        );
      }

      updates.title = title;
      updates.slug =
        title === existing.title
          ? existing.slug
          : await uniqueArtworkSlug(supabase, title, id);
      updates.artist = String(form.get("artist") ?? "").trim() || null;

      const yearRaw = String(form.get("year") ?? "").trim();
      const year = yearRaw ? parseInt(yearRaw, 10) : null;
      updates.year = yearRaw && !Number.isNaN(year!) ? year : null;

      updates.medium = String(form.get("medium") ?? "").trim() || null;
      updates.description = String(form.get("description") ?? "").trim() || null;
      updates.essay = String(form.get("essay") ?? "").trim() || null;
      updates.image_alt =
        String(form.get("imageAlt") ?? "").trim() || title;
      updates.source_url = String(form.get("sourceUrl") ?? "").trim() || null;
      updates.tags = parseCommaList(String(form.get("tags") ?? ""));
      conceptNames = parseCommaList(String(form.get("concepts") ?? ""));

      const isPublished = form.get("isPublished") === "true";
      updates.is_published = isPublished;
      updates.published_at = isPublished
        ? (existing.published_at ?? new Date().toISOString())
        : null;

      const image = form.get("image");
      if (image instanceof File && image.size > 0) {
        if (image.size > MAX_ARTWORK_IMAGE_SIZE) {
          return NextResponse.json(
            { error: "Imagen demasiado grande (máx. 4 MB)" },
            { status: 400 },
          );
        }

        const ext = image.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const filePath = `${updates.slug ?? existing.slug}-${Date.now()}.${ext}`;
        const buffer = Buffer.from(await image.arrayBuffer());
        const mime = image.type || mimeFromExtension(ext);

        const clientWidth = parseInt(String(form.get("imageWidth") ?? ""), 10);
        const clientHeight = parseInt(String(form.get("imageHeight") ?? ""), 10);
        const parsed =
          Number.isFinite(clientWidth) &&
          clientWidth > 0 &&
          Number.isFinite(clientHeight) &&
          clientHeight > 0
            ? { width: clientWidth, height: clientHeight }
            : readImageDimensions(buffer, mime);

        const { error: uploadError } = await supabase.storage
          .from("artworks")
          .upload(filePath, buffer, { contentType: mime, upsert: false });

        if (uploadError) {
          return NextResponse.json(
            { error: `Error al subir imagen: ${uploadError.message}` },
            { status: 500 },
          );
        }

        const oldPath = storagePathFromPublicUrl(existing.image_url);
        if (oldPath) {
          await supabase.storage.from("artworks").remove([oldPath]);
        }

        const { data: publicUrlData } = supabase.storage
          .from("artworks")
          .getPublicUrl(filePath);

        updates.image_url = publicUrlData.publicUrl;
        updates.image_width = parsed?.width ?? null;
        updates.image_height = parsed?.height ?? null;
      }
    } else {
      const body = await request.json();

      if (typeof body.title === "string" && body.title.trim()) {
        const title = body.title.trim();
        updates.title = title;
        if (title !== existing.title) {
          updates.slug = await uniqueArtworkSlug(supabase, title, id);
        }
      }

      if (body.artist !== undefined) {
        updates.artist =
          typeof body.artist === "string" ? body.artist.trim() || null : null;
      }
      if (body.year !== undefined) {
        updates.year =
          typeof body.year === "number" && !Number.isNaN(body.year)
            ? body.year
            : null;
      }
      if (body.medium !== undefined) {
        updates.medium =
          typeof body.medium === "string" ? body.medium.trim() || null : null;
      }
      if (body.description !== undefined) {
        updates.description =
          typeof body.description === "string"
            ? body.description.trim() || null
            : null;
      }
      if (body.essay !== undefined) {
        updates.essay =
          typeof body.essay === "string" ? body.essay.trim() || null : null;
      }
      if (body.imageAlt !== undefined) {
        updates.image_alt =
          typeof body.imageAlt === "string"
            ? body.imageAlt.trim() || updates.title || existing.title
            : null;
      }
      if (body.sourceUrl !== undefined) {
        updates.source_url =
          typeof body.sourceUrl === "string"
            ? body.sourceUrl.trim() || null
            : null;
      }
      if (Array.isArray(body.tags)) {
        updates.tags = body.tags
          .map((tag: unknown) => String(tag).trim())
          .filter(Boolean);
      }
      if (Array.isArray(body.concepts)) {
        conceptNames = body.concepts
          .map((name: unknown) => String(name).trim())
          .filter(Boolean);
      }
      if (typeof body.is_published === "boolean") {
        updates.is_published = body.is_published;
        updates.published_at = body.is_published
          ? (existing.published_at ?? new Date().toISOString())
          : null;
      }
    }

    if (Object.keys(updates).length === 0 && conceptNames === null) {
      return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
    }

    const nextTitle = (updates.title as string | undefined) ?? existing.title;
    const nextArtist =
      updates.artist !== undefined ? updates.artist : existing.artist;
    const nextDescription =
      updates.description !== undefined
        ? updates.description
        : existing.description;
    const nextEssay =
      updates.essay !== undefined ? updates.essay : existing.essay;
    const nextTags =
      updates.tags !== undefined ? (updates.tags as string[]) : existing.tags;

    const textChanged =
      nextTitle !== existing.title ||
      nextArtist !== existing.artist ||
      nextDescription !== existing.description ||
      nextEssay !== existing.essay ||
      JSON.stringify(nextTags) !== JSON.stringify(existing.tags);

    if (textChanged) {
      try {
        const embedTextContent = [
          nextTitle,
          nextArtist,
          nextDescription,
          nextEssay,
          ...nextTags,
        ]
          .filter(Boolean)
          .join(". ");
        (updates as Record<string, unknown>).embedding =
          await embedText(embedTextContent);
      } catch {
        // embedding opcional
      }
    }

    const { data, error } = await supabase
      .from("artworks")
      .update(updates)
      .eq("id", id)
      .select("id, slug, title, is_published")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (conceptNames !== null) {
      await syncArtworkConcepts(id, conceptNames);
    }

    return NextResponse.json({
      success: true,
      artwork: data,
      url: `/galeria/${data.slug}`,
    });
  } catch (error) {
    console.error("Admin artwork update:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar la obra" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("artworks")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("artworks").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing?.image_url) {
    const path = storagePathFromPublicUrl(existing.image_url);
    if (path) {
      await supabase.storage.from("artworks").remove([path]);
    }
  }

  return NextResponse.json({ success: true });
}
