import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { gallerySans } from "@/lib/fonts";
import { isValidLocale, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isValidLocale(raw) ? raw : "en";
  const dict = getDictionary(locale);
  return {
    title: { default: dict.meta.title, template: `%s · Flavor User` },
    description: dict.meta.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isValidLocale(raw)) notFound();

  const locale = raw as Locale;
  const dict = getDictionary(locale);

  return (
    <html lang={locale} className={gallerySans.variable}>
      <body className={`${gallerySans.className} min-h-screen antialiased`}>
        <SiteHeader locale={locale} dict={dict} />
        <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-5xl px-6 py-12">
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict} />
      </body>
    </html>
  );
}
