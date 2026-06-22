import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { defaultLocale, isValidLocale, locales } from "@/lib/i18n/config";

function pathnameHasLocale(pathname: string): boolean {
  return locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (!pathnameHasLocale(pathname)) {
    const locale = defaultLocale;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("tu-proyecto")
  ) {
    return await updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
