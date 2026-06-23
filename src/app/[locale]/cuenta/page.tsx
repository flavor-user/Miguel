import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { requireAdmin } from "@/lib/admin/auth";
import type { Profile, Conversation } from "@/types/database.types";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

function dateLocale(locale: Locale): string {
  if (locale === "ja") return "ja-JP";
  if (locale === "es") return "es-ES";
  return "en-US";
}

export default async function AccountPage({ params }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const a = dict.account;

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1>{a.title}</h1>
        <p className="mt-4 ">{a.notConfigured}</p>
        <Link
          href={localizedPath(locale, "/galeria")}
          className="mt-6 inline-block  underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
        >
          {a.goGallery}
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(localizedPath(locale, "/login"));
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()) as { data: Profile | null };

  const { data: conversations } = (await supabase
    .from("conversations")
    .select("id, title, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(10)) as {
    data: Pick<Conversation, "id" | "title" | "updated_at">[] | null;
  };

  const adminAuth = await requireAdmin();
  const isAdmin = adminAuth.authorized;

  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1>{a.title}</h1>
          <p className="mt-2 ">{user.email}</p>
          {profile?.display_name && (
            <p className="mt-1 ">{profile.display_name}</p>
          )}
          {isAdmin && (
            <Link
              href={localizedPath(locale, "/admin")}
              className="mt-3 inline-block  "
            >
              {a.adminLink}
            </Link>
          )}
        </div>
        <SignOutButton label={dict.auth.signOut} locale={locale} />
      </div>

      {profile?.flavor_summary && (
        <section className="mt-10 border-t border-neutral-200 pt-8">
          <h2>{a.flavorProfile}</h2>
          <p className="mt-3 leading-relaxed">{profile.flavor_summary}</p>
        </section>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between border-b border-neutral-200 pb-3">
          <h2>{a.recentChats}</h2>
          <Link href={localizedPath(locale, "/chat")} className=" ">
            {a.newChat}
          </Link>
        </div>

        {conversations && conversations.length > 0 ? (
          <ul className="divide-y divide-neutral-200">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <Link
                  href={localizedPath(locale, `/chat?conversacion=${conv.id}`)}
                  className="flex items-center justify-between py-3 transition"
                >
                  <span>{conv.title}</span>
                  <span className="text-xs ">
                    {new Date(conv.updated_at).toLocaleDateString(
                      dateLocale(locale),
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            {a.noChats}{" "}
            <Link
              href={localizedPath(locale, "/chat")}
              className=" hover:underline"
            >
              {a.startChat}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
