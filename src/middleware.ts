import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { defaultLocale, isValidLocale, locales } from "@/lib/i18n/config";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  hasValidSiteAccess,
  isAccessApi,
  isAccessPath,
  isSiteAccessEnabled,
} from "@/lib/site-access";

function pathnameHasLocale(pathname: string): boolean {
  return locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
}

function localeFromPath(pathname: string): string {
  const segment = pathname.split("/")[1];
  return isValidLocale(segment) ? segment : defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isSiteAccessEnabled() && !isAccessPath(pathname) && !isAccessApi(pathname)) {
    const allowed = await hasValidSiteAccess(request);
    if (!allowed) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json({ error: "Acceso privado" }, { status: 401 });
      }

      const locale = pathnameHasLocale(pathname) ? localeFromPath(pathname) : defaultLocale;
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = `/${locale}/acceso`;
      redirectUrl.searchParams.set(
        "next",
        `${pathname}${request.nextUrl.search}`
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!pathnameHasLocale(pathname)) {
    const locale = defaultLocale;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (isSupabaseConfigured()) {
    try {
      return await updateSession(request);
    } catch {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
