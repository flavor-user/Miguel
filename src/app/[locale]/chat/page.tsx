import Link from "next/link";
import { ChatInterface } from "@/components/chat/chat-interface";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

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

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  return (
    <div>
      <header className="mb-8 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">{dict.chat.badge}</p>
        <h1 className="mt-3 font-serif text-4xl text-neutral-900">{dict.chat.title}</h1>
        <p className="mt-4 text-neutral-500">
          {userId ? (
            dict.chat.subtitleLoggedIn
          ) : (
            <>
              <Link href={localizedPath(locale, "/login")} className="text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900">
                {dict.chat.loginLink}
              </Link>{" "}
              {locale === "ja" ? "で履歴と記憶を保存。" : locale === "es" ? "para guardar historial y memoria." : "to save history and memory."}
            </>
          )}
        </p>
      </header>

      <ChatInterface
        userId={userId}
        locale={locale}
        dict={dict}
        initialArtworkSlug={query.obra}
      />
    </div>
  );
}
