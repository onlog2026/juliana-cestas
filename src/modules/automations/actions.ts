"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { CARRINHO_ABANDONADO, clampDelayHours } from "@/modules/automations/service";

/**
 * Server action do painel de automações.
 *
 * Passa por `ensureModuleForAction("automacoes")`: confere sessão de staff
 * DESTA loja e o direito ao módulo no plano. Esconder o item do menu não é
 * trava — quem sabe o endereço digita `/admin/automacoes` e entra.
 *
 * Arquivo com "use server" só pode exportar função async — por isso os tipos
 * e a leitura (que o painel usa para desenhar a tela) ficam em `service.ts`.
 */

export type SaveCartRecoveryRuleInput = {
  enabled: boolean;
  delayHours: number;
};

export async function saveCartRecoveryRule(
  input: SaveCartRecoveryRuleInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = await ensureModuleForAction("automacoes");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const delayHours = clampDelayHours(input.delayHours);
  const agora = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("automation_rules")
    .upsert(
      {
        tenant_id: staff.tenantId,
        kind: CARRINHO_ABANDONADO,
        enabled: input.enabled,
        delay_hours: delayHours,
        updated_at: agora,
      },
      { onConflict: "tenant_id,kind" }
    )
    .select("id");

  if (error) return { ok: false, error: "Não foi possível salvar a automação. Tente de novo." };
  // insert/update que "deu certo" sem devolver linha é gravação que não aconteceu.
  if (!data || data.length === 0) return { ok: false, error: "A automação não foi gravada." };

  revalidatePath("/admin/automacoes");
  return { ok: true };
}
