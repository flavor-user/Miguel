import type { NextRequest } from "next/server";

const COOKIE_NAME = "fu_access";
const SALT = "flavor-user-site-gate";

export function isSiteAccessEnabled(): boolean {
  const password = process.env.SITE_ACCESS_PASSWORD?.trim();
  return Boolean(password && password.length >= 4);
}

async function expectedCookieValue(): Promise<string> {
  const password = process.env.SITE_ACCESS_PASSWORD?.trim() ?? "";
  const data = new TextEncoder().encode(`${password}:${SALT}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hasValidSiteAccess(
  request: NextRequest,
): Promise<boolean> {
  if (!isSiteAccessEnabled()) return true;
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (!cookie) return false;
  return cookie === (await expectedCookieValue());
}

export async function createSiteAccessCookieValue(): Promise<string> {
  return expectedCookieValue();
}

export function siteAccessCookieName(): string {
  return COOKIE_NAME;
}

export function isAccessPath(pathname: string): boolean {
  return /^\/(en|es|ja)\/acceso\/?$/.test(pathname);
}

export function isAccessApi(pathname: string): boolean {
  return pathname === "/api/site-access";
}

/** Las rutas admin tienen su propio login; no bloquear subidas con la puerta de visitantes. */
export function isAdminApi(pathname: string): boolean {
  return pathname.startsWith("/api/admin");
}
