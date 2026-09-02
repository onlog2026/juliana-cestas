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

/** Garante que quem está vendo a página é um usuário logado com perfil de staff/admin. */
export async function requireStaff(): Promise<StaffUser> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    redirect("/admin/login?erro=sem-acesso");
  }

  return { id: user.id, email: user.email ?? null, role: profile.role, name: profile.name };
}
