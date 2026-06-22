import { NextResponse } from "next/server";
import { getPublishedArtworks, getArtworkBySlug } from "@/lib/data/artworks";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (slug) {
    const artwork = await getArtworkBySlug(slug);
    if (!artwork) {
      return NextResponse.json({ error: "Obra no encontrada" }, { status: 404 });
    }
    return NextResponse.json(artwork);
  }

  const artworks = await getPublishedArtworks();
  return NextResponse.json(artworks);
}
