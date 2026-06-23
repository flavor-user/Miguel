import { ArtworkCard } from "@/components/gallery/artwork-card";
import { getPublishedArtworks } from "@/lib/data/artworks";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function GalleryPage({ params }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const artworks = await getPublishedArtworks();

  return (
    <div>
      <header className="mb-12 max-w-2xl">
        <p className="text-black">{dict.gallery.badge}</p>
        <h1 className="mt-3 text-black">{dict.gallery.title}</h1>
        <p className="mt-4 leading-relaxed text-black">{dict.gallery.subtitle}</p>
      </header>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {artworks.map((artwork, i) => (
          <ArtworkCard key={artwork.id} artwork={artwork} locale={locale} priority={i < 3} />
        ))}
      </div>
    </div>
  );
}
