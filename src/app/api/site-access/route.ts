import { NextResponse } from "next/server";
import {
  createSiteAccessCookieValue,
  isSiteAccessEnabled,
  siteAccessCookieName,
} from "@/lib/site-access";

export async function POST(request: Request) {
  if (!isSiteAccessEnabled()) {
    return NextResponse.json({ ok: true, disabled: true });
  }

  const body = await request.json().catch(() => ({}));
  const code = String(body.code ?? "").trim();
  const expected = process.env.SITE_ACCESS_PASSWORD?.trim() ?? "";

  if (!code || code !== expected) {
    return NextResponse.json({ error: "Código incorrecto" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(siteAccessCookieName(), await createSiteAccessCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
