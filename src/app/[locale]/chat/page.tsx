import Link from "next/link";
import { ChatInterface } from "@/components/chat/chat-interface";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getArtworkBySlug, getPublishedArtworks } from "@/lib/data/artworks";
import { buildCuratorWelcome } from "@/lib/curator/suggested-prompts";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ obra?: string; concepto?: string }>;
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const query = await searchParams;
  let userId: string | undefined;
  let artistName: string | null = null;

  const catalog = await getPublishedArtworks();
  const focusArtwork = query.obra ? await getArtworkBySlug(query.obra) : null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

    if (user) {
      const service = createServiceClient();
      const { data: profile } = await service
        .from("profiles")
        .select("display_name, bio")
        .eq("id", user.id)
        .single();
      artistName = profile?.display_name ?? null;
    }
  }

  if (!artistName) {
    artistName = catalog.find((a) => a.artist)?.artist ?? null;
  }

  const welcomeMessage = buildCuratorWelcome(locale, {
    artworkTitle: focusArtwork?.title,
    artworkCount: catalog.length,
    artistName,
  });

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <p>{dict.chat.badge}</p>
        <h1 className="mt-3 ">{dict.chat.title}</h1>
        <p className="mt-4 ">
          {userId ? (
            dict.chat.subtitleLoggedIn
          ) : (
            <>
              <Link
                href={localizedPath(locale, "/login")}
                className=" underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
              >
                {dict.chat.loginLink}
              </Link>{" "}
              {locale === "ja"
                ? "で履歴と記憶を保存。"
                : locale === "es"
                  ? "para guardar historial y memoria."
                  : "to save history and memory."}
            </>
          )}
        </p>
        {focusArtwork ? (
          <p className="mt-3  ">
            {locale === "es"
              ? `Contexto: `
              : locale === "ja"
                ? `コンテキスト：`
                : `Context: `}
            <Link
              href={localizedPath(locale, `/galeria/${focusArtwork.slug}`)}
              className=" underline decoration-neutral-300 underline-offset-2"
            >
              {focusArtwork.title}
            </Link>
          </p>
        ) : null}
      </header>

      <ChatInterface
        userId={userId}
        locale={locale}
        dict={dict}
        initialArtworkSlug={query.obra}
        focusArtworkTitle={focusArtwork?.title}
        welcomeMessage={welcomeMessage}
      />
    </div>
  );
}
