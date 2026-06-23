import Link from "next/link";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { localizedPath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function SiteHeader({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const navItems = [
    { href: localizedPath(locale, "/galeria"), label: dict.nav.gallery },
    { href: localizedPath(locale, "/conceptos"), label: dict.nav.concepts },
    { href: localizedPath(locale, "/chat"), label: dict.nav.chat },
    { href: localizedPath(locale, "/cuenta"), label: dict.nav.account },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          href={localizedPath(locale, "/")}
          className="text-black transition hover:text-black"
        >
          Flavor User
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-black transition hover:text-black"
            >
              {label}
            </Link>
          ))}
          <LocaleSwitcher locale={locale} />
        </nav>

        <div className="flex items-center gap-4 md:hidden">
          <LocaleSwitcher locale={locale} compact />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-12 text-black md:flex-row md:items-center md:justify-between">
        <p>{dict.footer.tagline}</p>
        <div className="flex gap-6">
          <Link href={localizedPath(locale, "/galeria")} className="hover:text-black">
            {dict.footer.gallery}
          </Link>
          <Link href={localizedPath(locale, "/conceptos")} className="hover:text-black">
            {dict.footer.concepts}
          </Link>
          <Link href={localizedPath(locale, "/chat")} className="hover:text-black">
            {dict.footer.chat}
          </Link>
        </div>
      </div>
    </footer>
  );
}
