import type { ArtworkWithConcepts, Concept } from "@/types/database.types";

/** Sin obras de demostración — solo las que subes tú. */
export const DEMO_ARTWORKS: ArtworkWithConcepts[] = [];

export const DEMO_CONCEPTS: Concept[] = [];

export function getDemoArtworkBySlug(
  _slug: string,
): ArtworkWithConcepts | undefined {
  return undefined;
}

export function getDemoArtworksByConcept(
  _conceptSlug: string,
): ArtworkWithConcepts[] {
  return [];
}

export function getDemoConceptBySlug(_slug: string): Concept | undefined {
  return undefined;
}
