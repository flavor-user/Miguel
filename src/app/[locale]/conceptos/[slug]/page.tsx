import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtworkCard } from "@/components/gallery/artwork-card";
import {
  getConceptBySlug,
  getArtworksByConcept,
  getRelatedConcepts,
} from "@/lib/data/artworks";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ConceptDetailPage({ params }: PageProps) {
  const { locale: raw, slug } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const c = dict.concepts;
  const concept = await getConceptBySlug(slug);

  if (!concept) notFound();

  const [artworks, related] = await Promise.all([
    getArtworksByConcept(slug),
    getRelatedConcepts(slug),
  ]);

  return (
    <div>
      <header className="mb-12 max-w-2xl">
        <Link
          href={localizedPath(locale, "/conceptos")}
          className="text-sm text-neutral-400 hover:text-neutral-900"
        >
          {c.back}
        </Link>
        <h1 className="mt-4 font-serif text-4xl text-neutral-900 md:text-5xl">
          {concept.name}
        </h1>
        {concept.description && (
          <p className="mt-4 text-lg leading-relaxed text-neutral-500">
            {concept.description}
          </p>
        )}
        <Link
          href={localizedPath(locale, `/chat?concepto=${concept.slug}`)}
          className="mt-6 inline-flex border-b border-neutral-900 pb-0.5 text-sm text-neutral-900 transition hover:text-neutral-600"
        >
          {c.exploreAi}
        </Link>
      </header>

      {related.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xs uppercase tracking-wider text-neutral-400">
            {c.related}
          </h2>
          <div className="flex flex-wrap gap-4">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={localizedPath(locale, `/conceptos/${r.slug}`)}
                className="text-sm text-neutral-500 underline decoration-neutral-300 underline-offset-4 hover:text-neutral-900"
              >
                {r.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-8 font-serif text-xl text-neutral-900">{c.artworks}</h2>
        {artworks.length > 0 ? (
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-neutral-400">{c.noArtworks}</p>
        )}
      </section>
    </div>
  );
}
