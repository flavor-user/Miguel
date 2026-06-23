import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, bio, flavor_summary")
    .eq("id", auth.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized || !auth.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const updates: {
    display_name?: string;
    bio?: string;
    flavor_summary?: string;
  } = {};

  if (typeof body.display_name === "string") {
    updates.display_name = body.display_name.trim() || null;
  }
  if (typeof body.bio === "string") {
    updates.bio = body.bio.trim() || null;
  }
  if (typeof body.flavor_summary === "string") {
    updates.flavor_summary = body.flavor_summary.trim() || null;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", auth.user.id)
    .select("display_name, bio, flavor_summary")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
