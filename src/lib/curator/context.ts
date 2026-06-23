import type { ArtworkWithConcepts, Concept } from "@/types/database.types";

function uniqueConcepts(catalog: ArtworkWithConcepts[]): Concept[] {
  const map = new Map<string, Concept>();
  for (const artwork of catalog) {
    for (const concept of artwork.concepts ?? []) {
      map.set(concept.slug, concept);
    }
  }
  return Array.from(map.values());
}

export function formatArtworkEntry(artwork: ArtworkWithConcepts): string {
  const lines: string[] = [`## ${artwork.title}`];

  if (artwork.artist) lines.push(`Artista: ${artwork.artist}`);
  if (artwork.year) lines.push(`Año: ${artwork.year}`);
  if (artwork.medium) lines.push(`Técnica / soporte: ${artwork.medium}`);
  if (artwork.description) lines.push(`Ficha: ${artwork.description}`);
  if (artwork.essay) lines.push(`Texto de sala:\n${artwork.essay}`);
  if (artwork.image_alt) lines.push(`Descripción visual: ${artwork.image_alt}`);
  if (artwork.tags?.length) lines.push(`Etiquetas: ${artwork.tags.join(", ")}`);
  if (artwork.concepts?.length) {
    lines.push(
      `Conceptos: ${artwork.concepts.map((c) => `${c.name}${c.description ? ` — ${c.description}` : ""}`).join("; ")}`
    );
  }

  const hasContent = artwork.description || artwork.essay;
  if (!hasContent) {
    lines.push(
      "(Nota para el curador: esta obra no tiene texto de sala ni ficha. No interpretes la pieza; di que falta documentación.)"
    );
  }

  return lines.join("\n");
}

export function buildCuratorContext(params: {
  catalog: ArtworkWithConcepts[];
  focusArtwork?: ArtworkWithConcepts | null;
  artistBio?: string | null;
  artistName?: string | null;
  flavorSummary?: string | null;
  memories?: { content: string; memory_type: string }[];
}): string {
  const sections: string[] = [];

  if (params.artistName || params.artistBio || params.flavorSummary) {
    sections.push("=== PRÁCTICA DEL ARTISTA ===");
    if (params.artistName) sections.push(`Nombre: ${params.artistName}`);
    if (params.artistBio) {
      sections.push(`Línea de trabajo / manifesto del artista:\n${params.artistBio}`);
    }
    if (params.flavorSummary) {
      sections.push(`Perfil acumulado (conversaciones previas):\n${params.flavorSummary}`);
    }
  }

  if (params.catalog.length) {
    const concepts = uniqueConcepts(params.catalog);
    sections.push("=== ARCHIVO COMPLETO (única fuente de verdad) ===");
    sections.push(`Obras publicadas: ${params.catalog.length}`);
    if (concepts.length) {
      sections.push(
        `Conceptos del archivo: ${concepts.map((c) => c.name).join(", ")}`
      );
    }
    sections.push("");
    sections.push(params.catalog.map(formatArtworkEntry).join("\n\n"));
  } else {
    sections.push(
      "=== ARCHIVO ===\nLa galería aún no tiene obras publicadas. No cites obras concretas."
    );
  }

  if (params.focusArtwork) {
    sections.push("=== OBRA EN FOCO (prioridad en esta respuesta) ===");
    sections.push(formatArtworkEntry(params.focusArtwork));
  }

  if (params.memories?.length) {
    sections.push("=== NOTAS DE VISITAS ANTERIORES ===");
    sections.push(
      params.memories.map((m) => `- [${m.memory_type}] ${m.content}`).join("\n")
    );
  }

  return sections.join("\n\n");
}
