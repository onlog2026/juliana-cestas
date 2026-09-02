import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service role: só usado no servidor (route handlers, RPCs). Nunca importar
// isso de um componente client nem expor a chave via NEXT_PUBLIC_*.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
