import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSuperAdminEmail } from "@/lib/platform/super-admins";

export type PlatformAdmin = {
  id: string;
  email: string;
  name: string | null;
};

/**
 * Quem é dono da PLATAFORMA (não de uma loja).
 *
 * Duas fontes que precisam concordar: a tabela `platform_admins` (que a função
 * SQL `is_platform_admin()` também lê, para as policies) e a lista em
 * `src/lib/platform/super-admins.ts`. A tabela manda; a lista do código é o
 * plano B para o caso de a leitura falhar, e existe um teste que compara as
 * duas -- no Agentop essas listas divergiram e um e-mail ficou "super admin
 * pela API e cego pela interface".
 */
export async function getPlatformAdmin(): Promise<PlatformAdmin | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_admins")
    .select("email, name, is_active")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (error) {
    // Leitura falhou (tabela ainda não criada, banco fora). Cai na lista do
    // código em vez de trancar o dono para fora do próprio painel.
    if (isSuperAdminEmail(user.email)) {
      return { id: user.id, email: user.email, name: null };
    }
    return null;
  }

  if (!data || data.is_active === false) return null;
  return { id: user.id, email: user.email, name: data.name ?? null };
}

/**
 * Trava do painel da plataforma. Devolve 404 (não redireciona para login) --
 * quem não é dono da plataforma não deve nem saber que a rota existe.
 */
export async function requireSuperAdmin(): Promise<PlatformAdmin> {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/admin/login?next=/super");
  return admin;
}
