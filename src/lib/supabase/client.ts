import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

export { isSupabaseConfigured };

export function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Falta configurar Supabase en .env.local");
  }

  return createBrowserClient(env.url, env.key);
}
