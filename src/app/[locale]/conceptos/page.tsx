import Link from "next/link";
import { getAllConcepts, getArtworksByConcept } from "@/lib/data/artworks";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

function formatWorksCount(count: number, locale: Locale): string {
  if (locale === "es")
    return `${count} obra${count !== 1 ? "s" : ""} en galería`;
  if (locale === "ja") return `ギャラリーに${count}件`;
  return `${count} work${count !== 1 ? "s" : ""} in gallery`;
}

export default async function ConceptsPage({ params }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const c = dict.concepts;
  const concepts = await getAllConcepts();

  const conceptsWithCount = await Promise.all(
    concepts.map(async (concept) => {
      const artworks = await getArtworksByConcept(concept.slug);
      return { ...concept, artworkCount: artworks.length };
    }),
  );

  return (
    <div>
      <header className="mb-12 max-w-2xl">
        <p>{c.badge}</p>
        <h1 className="mt-3 ">{c.title}</h1>
        <p className="mt-4 ">{c.subtitle}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {conceptsWithCount.map((concept) => (
          <Link
            key={concept.slug}
            href={localizedPath(locale, `/conceptos/${concept.slug}`)}
            className="border-b border-neutral-200 pb-6 transition hover:border-neutral-400"
          >
            <h2>{concept.name}</h2>
            {concept.description && (
              <p className="mt-2  leading-relaxed">{concept.description}</p>
            )}
            <p className="mt-4 text-xs ">
              {formatWorksCount(concept.artworkCount, locale)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
