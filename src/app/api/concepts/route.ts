import { NextResponse } from "next/server";

export async function GET() {
  const { getAllConcepts } = await import("@/lib/data/artworks");
  const concepts = await getAllConcepts();
  return NextResponse.json(concepts);
}
