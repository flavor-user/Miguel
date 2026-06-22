import { createClient, isSupabaseServerConfigured } from "@/lib/supabase/server";

export async function getAdminEmails(): Promise<string[]> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdminUser(userId?: string, email?: string | null): Promise<boolean> {
  const admins = await getAdminEmails();
  if (!admins.length) return false;
  if (email && admins.includes(email.toLowerCase())) return true;

  if (userId && isSupabaseServerConfigured()) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && admins.includes(user.email.toLowerCase())) return true;
    } catch {
      return false;
    }
  }

  return false;
}

export async function requireAdmin() {
  if (!isSupabaseServerConfigured()) {
    return { authorized: false as const, reason: "no_config" as const, user: null };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { authorized: false as const, reason: "login" as const, user: null };
    }

    const admins = await getAdminEmails();
    if (!admins.length) {
      return { authorized: false as const, reason: "no_config" as const, user };
    }

    if (!user.email || !admins.includes(user.email.toLowerCase())) {
      return { authorized: false as const, reason: "forbidden" as const, user };
    }

    return { authorized: true as const, user };
  } catch {
    return { authorized: false as const, reason: "no_config" as const, user: null };
  }
}
