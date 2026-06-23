"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionary";
import { isValidLocale, localizedPath, type Locale } from "@/lib/i18n/config";

export default function NotFoundPage() {
  const params = useParams();
  const raw = typeof params?.locale === "string" ? params.locale : "en";
  const locale = (isValidLocale(raw) ? raw : "en") as Locale;
  const dict = getDictionary(locale);

  return (
    <div className="py-20 text-center">
      <h1>{dict.notFound.title}</h1>
      <p className="mt-4 ">{dict.notFound.subtitle}</p>
      <Link
        href={localizedPath(locale, "/galeria")}
        className="mt-8 inline-block  underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900"
      >
        {dict.notFound.back}
      </Link>
    </div>
  );
}
