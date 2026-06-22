import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";

type ArtworkUpdate = Database["public"]["Tables"]["artworks"]["Update"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const supabase = createServiceClient();

  const updates: ArtworkUpdate = {};

  if (typeof body.is_published === "boolean") {
    updates.is_published = body.is_published;
    updates.published_at = body.is_published ? new Date().toISOString() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("artworks")
    .update(updates)
    .eq("id", id)
    .select("id, slug, is_published")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase.from("artworks").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
