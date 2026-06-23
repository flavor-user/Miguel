import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import {
  MAX_ARTWORK_IMAGE_SIZE,
  mimeFromExtension,
  parseCommaList,
  uniqueArtworkSlug,
} from "@/lib/admin/artwork-helpers";
import { linkArtworkConcepts } from "@/lib/concepts";
import { embedText } from "@/lib/openai/client";
import { readImageDimensions } from "@/lib/image-dimensions";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    const status = auth.reason === "forbidden" ? 403 : 401;
    return NextResponse.json({ error: "No autorizado" }, { status });
  }

  try {
    const form = await request.formData();
    const title = String(form.get("title") ?? "").trim();
    const artist = String(form.get("artist") ?? "").trim() || null;
    const yearRaw = String(form.get("year") ?? "").trim();
    const medium = String(form.get("medium") ?? "").trim() || null;
    const description = String(form.get("description") ?? "").trim() || null;
    const essay = String(form.get("essay") ?? "").trim() || null;
    const imageAlt = String(form.get("imageAlt") ?? "").trim() || title;
    const sourceUrl = String(form.get("sourceUrl") ?? "").trim() || null;
    const tagsRaw = String(form.get("tags") ?? "").trim();
    const conceptsRaw = String(form.get("concepts") ?? "").trim();
    const isPublished = form.get("isPublished") === "true";
    const image = form.get("image");

    if (!title) {
      return NextResponse.json(
        { error: "El título es obligatorio" },
        { status: 400 },
      );
    }

    if (!(image instanceof File) || image.size === 0) {
      return NextResponse.json(
        { error: "La imagen es obligatoria" },
        { status: 400 },
      );
    }

    if (image.size > MAX_ARTWORK_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "Imagen demasiado grande (máx. 4 MB)" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const slug = await uniqueArtworkSlug(supabase, title);
    const ext = image.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${slug}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await image.arrayBuffer());
    const contentType = image.type || mimeFromExtension(ext);

    const clientWidth = parseInt(String(form.get("imageWidth") ?? ""), 10);
    const clientHeight = parseInt(String(form.get("imageHeight") ?? ""), 10);
    const parsed =
      Number.isFinite(clientWidth) &&
      clientWidth > 0 &&
      Number.isFinite(clientHeight) &&
      clientHeight > 0
        ? { width: clientWidth, height: clientHeight }
        : readImageDimensions(buffer, contentType);

    const { error: uploadError } = await supabase.storage
      .from("artworks")
      .upload(filePath, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Error al subir imagen: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from("artworks")
      .getPublicUrl(filePath);

    const tags = parseCommaList(tagsRaw);
    const conceptNames = parseCommaList(conceptsRaw);

    let embedding: number[] | null = null;
    try {
      const embedTextContent = [title, artist, description, essay, ...tags]
        .filter(Boolean)
        .join(". ");
      embedding = await embedText(embedTextContent);
    } catch {
      // OpenAI opcional para embeddings al crear
    }

    const year = yearRaw ? parseInt(yearRaw, 10) : null;

    const { data: artwork, error: insertError } = await supabase
      .from("artworks")
      .insert({
        user_id: auth.user.id,
        slug,
        title,
        artist,
        year: Number.isNaN(year) ? null : year,
        medium,
        description,
        essay,
        image_url: publicUrlData.publicUrl,
        image_alt: imageAlt,
        image_width: parsed?.width ?? null,
        image_height: parsed?.height ?? null,
        source_url: sourceUrl,
        tags,
        embedding,
        is_published: isPublished,
        published_at: isPublished ? new Date().toISOString() : null,
      })
      .select("id, slug, title")
      .single();

    if (insertError) {
      await supabase.storage.from("artworks").remove([filePath]);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    if (conceptNames.length) {
      await linkArtworkConcepts(artwork.id, conceptNames);
    }

    return NextResponse.json({
      success: true,
      artwork,
      url: `/galeria/${artwork.slug}`,
    });
  } catch (error) {
    console.error("Admin artwork create:", error);
    return NextResponse.json(
      { error: "Error interno al crear la obra" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("artworks")
    .select(
      "id, slug, title, artist, is_published, published_at, created_at, image_url",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
