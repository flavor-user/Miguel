import { createClient } from "@supabase/supabase-js";

/** Cliente sin cookies — para datos públicos de la galería en build/render */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
