import { AuthForm } from "@/components/auth/auth-form";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-md">
      <h1>{dict.auth.registerTitle}</h1>
      <p className="mt-2  ">{dict.auth.registerSubtitle}</p>
      <div className="mt-8">
        <AuthForm mode="register" locale={locale} dict={dict} />
      </div>
    </div>
  );
}
