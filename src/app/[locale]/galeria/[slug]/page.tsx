import { notFound } from "next/navigation";
import { ArtworkDetail } from "@/components/gallery/artwork-detail";
import {
  getArtworkBySlug,
  getPublishedArtworks,
} from "@/lib/data/artworks";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ArtworkPage({ params }: PageProps) {
  const { locale: raw, slug } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const artwork = await getArtworkBySlug(slug);

  if (!artwork) notFound();

  const allArtworks = await getPublishedArtworks();
  const relatedArtworks = allArtworks
    .filter((a) => a.slug !== slug)
    .filter((a) =>
      a.concepts.some((c) => artwork.concepts.some((ac) => ac.slug === c.slug))
    )
    .slice(0, 3);

  return (
    <ArtworkDetail
      artwork={artwork}
      relatedArtworks={relatedArtworks}
      locale={locale}
      dict={dict}
    />
  );
}
