import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArtworkCard } from "@/components/gallery/artwork-card";
import { getPublishedArtworks } from "@/lib/data/artworks";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const artworks = await getPublishedArtworks();
  const featured = artworks.slice(0, 3);

  const cards = [
    { ...dict.home.cards.gallery, href: localizedPath(locale, "/galeria") },
    { ...dict.home.cards.concepts, href: localizedPath(locale, "/conceptos") },
    { ...dict.home.cards.chat, href: localizedPath(locale, "/chat") },
  ];

  return (
    <div className="space-y-24">
      <section className="max-w-2xl pt-8">
        <h1 className="font-serif text-4xl leading-tight text-neutral-900 md:text-5xl">
          {dict.home.title}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-neutral-500">{dict.home.subtitle}</p>
        <div className="mt-10 flex flex-wrap gap-6">
          <Link
            href={localizedPath(locale, "/galeria")}
            className="inline-flex items-center gap-2 border-b border-neutral-900 pb-0.5 text-sm text-neutral-900 transition hover:text-neutral-600"
          >
            {dict.home.ctaGallery}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={localizedPath(locale, "/chat")}
            className="text-sm text-neutral-400 transition hover:text-neutral-700"
          >
            {dict.home.ctaChat}
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-10 flex items-end justify-between border-b border-neutral-200 pb-4">
          <div>
            <h2 className="font-serif text-2xl text-neutral-900">{dict.home.featuredTitle}</h2>
            <p className="mt-1 text-sm text-neutral-400">{dict.home.featuredSubtitle}</p>
          </div>
          <Link
            href={localizedPath(locale, "/galeria")}
            className="hidden text-sm text-neutral-400 hover:text-neutral-900 md:block"
          >
            {dict.home.seeAll}
          </Link>
        </div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((artwork, i) => (
            <ArtworkCard key={artwork.id} artwork={artwork} locale={locale} priority={i === 0} />
          ))}
        </div>
      </section>

      <section className="grid gap-px border border-neutral-200 bg-neutral-200 md:grid-cols-3">
        {cards.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white p-8 transition hover:bg-neutral-50"
          >
            <h3 className="font-serif text-lg text-neutral-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">{item.desc}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
