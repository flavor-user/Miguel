import Link from "next/link";
import { ArtworkImage } from "@/components/gallery/artwork-image";
import type { ArtworkWithConcepts } from "@/types/database.types";
import { excerpt, formatYear } from "@/lib/utils";
import { localizedPath, type Locale } from "@/lib/i18n/config";

interface ArtworkCardProps {
  artwork: ArtworkWithConcepts;
  locale: Locale;
  priority?: boolean;
}

export function ArtworkCard({ artwork, locale, priority }: ArtworkCardProps) {
  return (
    <article className="group flex flex-col">
      <Link href={localizedPath(locale, `/galeria/${artwork.slug}`)}>
        <ArtworkImage
          src={artwork.image_url}
          alt={artwork.image_alt ?? artwork.title}
          width={artwork.image_width}
          height={artwork.image_height}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 pt-4">
        <div>
          <p className="text-xs text-neutral-900">
            {artwork.artist}
            {artwork.year ? ` · ${formatYear(artwork.year)}` : ""}
          </p>
          <Link href={localizedPath(locale, `/galeria/${artwork.slug}`)}>
            <h3 className="mt-1 text-neutral-900 transition group-hover:text-neutral-900">
              {artwork.title}
            </h3>
          </Link>
        </div>

        {artwork.description && (
          <p className=" leading-relaxed text-neutral-900">
            {excerpt(artwork.description, 120)}
          </p>
        )}

        {artwork.concepts.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {artwork.concepts.slice(0, 3).map((concept) => (
              <Link
                key={concept.slug}
                href={localizedPath(locale, `/conceptos/${concept.slug}`)}
                className="text-xs text-neutral-900 transition hover:text-neutral-900"
              >
                {concept.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
