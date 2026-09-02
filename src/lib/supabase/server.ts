import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Cliente Supabase autenticado com a sessão do usuário (admin ou cliente),
// via cookies. Respeita RLS — nunca usa a service role.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // chamado de um Server Component sem permissão de escrita —
            // o proxy.ts já renova a sessão, então isso pode ser ignorado.
          }
        },
      },
    }
  );
}
