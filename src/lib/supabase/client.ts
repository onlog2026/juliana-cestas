import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso em Client Components (login, cadastro).
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
