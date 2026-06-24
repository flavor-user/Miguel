import Link from "next/link";
import { ChatInterface } from "@/components/chat/chat-interface";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getArtworkBySlug, getPublishedArtworks } from "@/lib/data/artworks";
import { buildCuratorWelcome } from "@/lib/curator/suggested-prompts";
import { countUserMemories } from "@/lib/memory";
import { getLastArtworkFocus, recordArtworkVisit } from "@/lib/memory/artwork-focus";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ obra?: string; concepto?: string; conversacion?: string }>;
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const query = await searchParams;
  let userId: string | undefined;
  let artistName: string | null = null;
  let conversationId: string | undefined;
  let initialMessages:
    | { id: string; role: "user" | "assistant"; content: string }[]
    | undefined;

  let visitorName: string | null = null;
  let isReturning = false;
  let resumeArtwork: { slug: string; title: string } | null = null;

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
        .select("display_name, bio, flavor_summary")
        .eq("id", user.id)
        .single();
      artistName = profile?.display_name ?? null;
      visitorName = profile?.display_name ?? null;

      const memoryCount = await countUserMemories(user.id);
      const { count: conversationCount } = await supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      isReturning =
        Boolean(profile?.flavor_summary) ||
        memoryCount > 0 ||
        (conversationCount ?? 0) > 0;

      if (focusArtwork) {
        void recordArtworkVisit(
          user.id,
          focusArtwork.slug,
          focusArtwork.title,
        );
      } else if (!query.conversacion) {
        resumeArtwork = await getLastArtworkFocus(user.id);
      }

      if (query.conversacion) {
        const { data: conversation } = await supabase
          .from("conversations")
          .select("id")
          .eq("id", query.conversacion)
          .eq("user_id", user.id)
          .maybeSingle();

        if (conversation) {
          conversationId = conversation.id;
          const { data: savedMessages } = await supabase
            .from("messages")
            .select("id, role, content")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: true });

          initialMessages =
            savedMessages
              ?.filter(
                (message) =>
                  message.role === "user" || message.role === "assistant",
              )
              .map((message) => ({
                id: message.id,
                role: message.role as "user" | "assistant",
                content: message.content,
              })) ?? [];
        }
      }
    }
  }

  if (!artistName) {
    artistName = catalog.find((a) => a.artist)?.artist ?? null;
  }

  const welcomeMessage = buildCuratorWelcome(locale, {
    artworkTitle: focusArtwork?.title,
    artworkCount: catalog.length,
    artistName,
    isReturning: isReturning && !conversationId,
    visitorName,
    shortReturn: Boolean(resumeArtwork && !focusArtwork && !conversationId),
  });

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <p>{dict.chat.badge}</p>
        <h1 className="mt-3 ">{dict.chat.title}</h1>
        <p className="mt-4 ">
          {userId ? (
            <>
              {dict.chat.subtitleLoggedIn}{" "}
              <Link
                href={localizedPath(locale, "/cuenta")}
                className="underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
              >
                {dict.chat.historyLink}
              </Link>
            </>
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
        {resumeArtwork && !focusArtwork && !conversationId ? (
          <p className="mt-3 border-l-2 border-neutral-200 pl-3 text-sm text-neutral-600">
            {dict.chat.resumeArtworkLabel}{" "}
            <Link
              href={localizedPath(
                locale,
                `/chat?obra=${encodeURIComponent(resumeArtwork.slug)}`,
              )}
              className="text-neutral-900 underline decoration-neutral-300 underline-offset-2 hover:decoration-neutral-900"
            >
              {resumeArtwork.title}
            </Link>
          </p>
        ) : null}
      </header>

      <ChatInterface
        userId={userId}
        locale={locale}
        dict={dict}
        conversationId={conversationId}
        initialMessages={initialMessages}
        initialArtworkSlug={query.obra}
        focusArtworkTitle={focusArtwork?.title}
        welcomeMessage={welcomeMessage}
      />
    </div>
  );
}
