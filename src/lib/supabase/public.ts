import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Cliente sin cookies — para datos públicos de la galería en build/render */
export function createPublicClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error("Supabase not configured");
  }
  return createClient(env.url, env.key);
}
