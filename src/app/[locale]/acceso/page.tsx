import { Suspense } from "react";
import { SiteAccessForm } from "@/components/auth/site-access-form";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccessPage({ params }: PageProps) {
  const { locale: raw } = await params;
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);

  return (
    <Suspense>
      <SiteAccessForm locale={locale} dict={dict} />
    </Suspense>
  );
}
