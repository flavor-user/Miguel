import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ArtworkImage } from "@/components/gallery/artwork-image";
import type { ArtworkWithConcepts, Concept } from "@/types/database.types";
import { formatYear } from "@/lib/utils";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { localizedPath, type Locale } from "@/lib/i18n/config";

interface ArtworkDetailProps {
  artwork: ArtworkWithConcepts;
  relatedArtworks?: ArtworkWithConcepts[];
  locale: Locale;
  dict: Dictionary;
}

export function ArtworkDetail({
  artwork,
  relatedArtworks = [],
  locale,
  dict,
}: ArtworkDetailProps) {
  const g = dict.gallery;

  return (
    <article className="pb-16">
      <Link
        href={localizedPath(locale, "/galeria")}
        className="mb-10 inline-flex items-center gap-2  transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {g.back}
      </Link>

      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-neutral-50">
          <ArtworkImage
            src={artwork.image_url}
            alt={artwork.image_alt ?? artwork.title}
            width={artwork.image_width}
            height={artwork.image_height}
            priority
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
        </div>

        <div className="flex flex-col gap-6">
          <header>
            <p>{artwork.medium}</p>
            <h1 className="mt-2 ">{artwork.title}</h1>
            <p className="mt-3 ">
              {artwork.artist}
              {artwork.year ? `, ${formatYear(artwork.year)}` : ""}
            </p>
          </header>

          {artwork.description && (
            <p className=" leading-relaxed">{artwork.description}</p>
          )}

          {artwork.concepts.length > 0 && (
            <ConceptTags concepts={artwork.concepts} locale={locale} />
          )}

          {artwork.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {artwork.tags.map((tag) => (
                <span key={tag} className="text-xs ">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <Link
            href={localizedPath(locale, `/chat?obra=${artwork.slug}`)}
            className="inline-flex w-fit border-b border-neutral-900 pb-0.5  transition"
          >
            {g.askAi}
          </Link>

          {artwork.source_url && (
            <a
              href={artwork.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2  "
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {g.source}
            </a>
          )}
        </div>
      </div>

      {artwork.essay && (
        <section className="mx-auto mt-20 max-w-2xl">
          <h2 className="mb-6 ">{g.essayTitle}</h2>
          <div className="space-y-5  leading-8 ">
            {artwork.essay.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </section>
      )}

      {relatedArtworks.length > 0 && (
        <section className="mt-20 border-t border-neutral-200 pt-12">
          <h2 className="mb-8 ">{g.related}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedArtworks.map((related) => (
              <Link
                key={related.id}
                href={localizedPath(locale, `/galeria/${related.slug}`)}
                className="group border-b border-neutral-200 pb-4 transition hover:border-neutral-400"
              >
                <p className="group-hover:text-ink-strong">{related.title}</p>
                <p className="mt-1  ">{related.artist}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function ConceptTags({
  concepts,
  locale,
}: {
  concepts: Concept[];
  locale: Locale;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {concepts.map((concept) => (
        <Link
          key={concept.slug}
          href={localizedPath(locale, `/conceptos/${concept.slug}`)}
          className="  underline decoration-neutral-300 underline-offset-4 transition hover:decoration-neutral-900"
        >
          {concept.name}
        </Link>
      ))}
    </div>
  );
}
