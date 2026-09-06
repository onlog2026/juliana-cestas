"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/require-staff";
import { redeemVoucherForTenant } from "@/modules/platform/redeem";

/**
 * Resgatar cortesia, a partir do painel da lojista.
 *
 * A loja NUNCA vem do formulário: sai de `requireStaff()`, que já amarrou a
 * pessoa logada à loja do endereço acessado. O único dado que o navegador
 * manda é o código.
 */
export async function redeemVoucher(
  codigo: string
): Promise<{ ok: true; ate: string } | { ok: false; error: string }> {
  const staff = await requireStaff();

  const resultado = await redeemVoucherForTenant(staff.tenantId, codigo, staff.email);
  if (!resultado.ok) return resultado;

  // O menu do painel é montado a partir dos direitos: sem revalidar, o módulo
  // recém-liberado só apareceria no próximo recarregamento manual.
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/assinatura");
  return { ok: true, ate: resultado.ate };
}
