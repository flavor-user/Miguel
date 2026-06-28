import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    const status = auth.reason === "forbidden" ? 403 : 401;
    return NextResponse.json({ error: "No autorizado" }, { status });
  }

  let body: { orderedIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const orderedIds = body.orderedIds;
  if (
    !Array.isArray(orderedIds) ||
    !orderedIds.every((id) => typeof id === "string" && id.trim())
  ) {
    return NextResponse.json(
      { error: "orderedIds debe ser un array de IDs" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data: existing, error: fetchError } = await supabase
    .from("artworks")
    .select("id");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const existingIds = new Set(existing?.map((row) => row.id) ?? []);
  const uniqueIds = [...new Set(orderedIds as string[])];

  if (uniqueIds.length !== existingIds.size) {
    return NextResponse.json(
      { error: "Debes incluir todas las obras en el nuevo orden" },
      { status: 400 },
    );
  }

  for (const id of uniqueIds) {
    if (!existingIds.has(id)) {
      return NextResponse.json({ error: "ID de obra no válido" }, { status: 400 });
    }
  }

  const updates = uniqueIds.map((id, index) =>
    supabase.from("artworks").update({ sort_order: index }).eq("id", id),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
