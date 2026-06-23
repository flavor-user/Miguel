import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);
  const { redirect } = await searchParams;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-neutral-900">{dict.auth.loginTitle}</h1>
      <p className="mt-2  text-neutral-900">{dict.auth.loginSubtitle}</p>
      <div className="mt-8">
        <AuthForm
          mode="login"
          locale={locale}
          dict={dict}
          redirectTo={redirect ?? localizedPath(locale, "/cuenta")}
        />
      </div>
      <p className="mt-6 text-center  text-neutral-900">
        <Link href={localizedPath(locale, "/galeria")} className="hover:text-neutral-900">
          {dict.auth.continueGallery}
        </Link>
      </p>
    </div>
  );
}
