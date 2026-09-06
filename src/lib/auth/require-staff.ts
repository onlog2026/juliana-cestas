import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenant } from "@/lib/tenant/context";
import { isSuperAdminEmail } from "@/lib/platform/super-admins";

export type StaffUser = {
  id: string;
  email: string | null;
  role: "admin" | "staff";
  name: string | null;
  /**
   * A loja que esta pessoa administra NESTA requisição. É o único valor que
   * pode ser usado para gravar dados -- nunca o header, nunca um parâmetro
   * vindo do cliente.
   */
  tenantId: string;
  /** Dono da plataforma: entra em qualquer loja por design. */
  isSuperAdmin: boolean;
};

function isStaffRole(role: unknown): role is "admin" | "staff" {
  return role === "admin" || role === "staff";
}

/**
 * Igual a requireStaff(), mas sem redirecionar -- retorna null se não for
 * staff DESTA loja. Uso em páginas PÚBLICAS que só precisam saber "mostro o
 * controle de admin ou não" (ex.: botão de editar banner na home).
 */
export async function getStaffUser(): Promise<StaffUser | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const tenant = await getTenant();
  const superAdmin = isSuperAdminEmail(user.email);

  // Super admin entra em qualquer loja: a loja é a do endereço acessado.
  if (superAdmin) {
    return {
      id: user.id,
      email: user.email ?? null,
      role: "admin",
      name: (user.app_metadata?.name as string | undefined) ?? null,
      tenantId: tenant.id,
      isSuperAdmin: true,
    };
  }

  // Caminho rápido: role/tenant já vêm sincronizados no JWT (migration 0012),
  // evita a segunda ida ao banco que rodava em TODO clique. Só cai pro select
  // em `profiles` se o token for antigo ou não trouxer o tenant.
  const fastRole = user.app_metadata?.role;
  const fastTenant = user.app_metadata?.tenant_id;
  if (isStaffRole(fastRole) && typeof fastTenant === "string" && fastTenant) {
    if (fastTenant !== tenant.id) return null; // staff de OUTRA loja
    return {
      id: user.id,
      email: user.email ?? null,
      role: fastRole,
      name: (user.app_metadata?.name as string | undefined) ?? null,
      tenantId: fastTenant,
      isSuperAdmin: false,
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, name, tenant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isStaffRole(profile.role)) return null;
  // A trava que faltava: papel de staff não vale em qualquer loja.
  if (profile.tenant_id !== tenant.id) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile.role,
    name: profile.name,
    tenantId: profile.tenant_id,
    isSuperAdmin: false,
  };
}

/** Garante que quem está vendo a página é staff/admin DESTA loja. */
export async function requireStaff(): Promise<StaffUser> {
  const staff = await getStaffUser();
  if (!staff) redirect("/admin/login");
  return staff;
}
