"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { localeNames, locales, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher({
  locale,
}: {
  locale: Locale;
  compact?: boolean;
}) {
  const pathname = usePathname();

  function hrefFor(target: Locale) {
    if (!pathname) return `/${target}`;
    const segments = pathname.split("/");
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = target;
      return segments.join("/") || `/${target}`;
    }
    return `/${target}${pathname}`;
  }

  return (
    <div className="flex items-center gap-3">
      {locales.map((loc) => (
        <Link
          key={loc}
          href={hrefFor(loc)}
          className={`text-xs tracking-wide transition ${
            loc === locale
              ? "font-medium text-neutral-900"
              : "text-neutral-400 hover:text-neutral-600"
          }`}
          title={localeNames[loc]}
        >
          {loc.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
