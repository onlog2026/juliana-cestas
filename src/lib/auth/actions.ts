"use server";

import { getStaffUser } from "@/lib/auth/require-staff";

/**
 * Usado por componentes públicos (ex.: botão "Editar banner" na home) pra
 * decidir se mostram um controle de admin -- sem expor nada além de um
 * booleano. Roda a MESMA checagem de sessão usada pra proteger o painel de
 * verdade (fast path pelo JWT, fallback pra tabela profiles), então nunca
 * diverge do que requireStaff() decidiria.
 */
export async function checkStaffSession(): Promise<boolean> {
  const staff = await getStaffUser();
  return !!staff;
}
