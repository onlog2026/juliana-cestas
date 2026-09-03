import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type StaffUser = {
  id: string;
  email: string | null;
  role: "admin" | "staff";
  name: string | null;
};

function isStaffRole(role: unknown): role is "admin" | "staff" {
  return role === "admin" || role === "staff";
}

/** Garante que quem está vendo a página é um usuário logado com perfil de staff/admin. */
export async function requireStaff(): Promise<StaffUser> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  // Caminho rápido: role/name já vêm sincronizados no JWT (migration 0012),
  // evita a segunda ida ao banco que rodava em TODO clique. Só cai pro
  // select em `profiles` se o token ainda for antigo (login antes da
  // migration) ou a sincronização não tiver alcançado esse usuário.
  const fastRole = user.app_metadata?.role;
  if (isStaffRole(fastRole)) {
    return {
      id: user.id,
      email: user.email ?? null,
      role: fastRole,
      name: (user.app_metadata?.name as string | undefined) ?? null,
    };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isStaffRole(profile.role)) {
    redirect("/admin/login?erro=sem-acesso");
  }

  return { id: user.id, email: user.email ?? null, role: profile.role, name: profile.name };
}
