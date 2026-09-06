"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

/**
 * Ações da tela de Erros & Alertas.
 *
 * ATENÇÃO ao editar este arquivo: em módulo com `"use server"`, **só é
 * permitido exportar função async**. Uma constante exportada aqui quebra o
 * módulo inteiro em tempo de execução (não é erro de compilação — a tela cai
 * em produção).
 *
 * DISPENSAR NÃO APAGA. No Agentop, dispensar um alerta apagava a linha: o dono
 * perdia o histórico do problema, o erro voltava do zero e ninguém conseguia
 * dizer se aquilo já tinha acontecido antes. Aqui o registro fica, só sai da
 * lista padrão — e o filtro "mostrar dispensados" traz de volta.
 */

type Result = { ok: true } | { ok: false; error: string };

/** Registra na auditoria. Nunca derruba a ação — mas também não fica em silêncio. */
async function auditar(action: string, target: string | null, actorEmail: string, after: unknown) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      tenant_id: null,
      actor_email: actorEmail,
      action,
      target,
      before: null,
      after: after ?? null,
    });
    if (error) console.error("[platform/erros] falha ao gravar auditoria:", error);
  } catch (e) {
    console.error("[platform/erros] falha ao gravar auditoria:", e);
  }
}

/** Erro do PostgREST de coluna inexistente: a migração 0027 ainda não rodou. */
function colunaNaoExiste(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  return /column .* does not exist|could not find the .* column/i.test(error.message ?? "");
}

const AVISO_MIGRACAO =
  'O botão "Dispensar" ainda não está disponível porque falta rodar a migração 0027_app_errors_dismissed.sql no banco. Nenhum erro foi apagado.';

/**
 * Marca o alerta como visto. O registro CONTINUA no banco — some da lista
 * padrão e volta com o filtro "mostrar dispensados".
 */
export async function dismissError(errorId: string): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();
  if (!errorId) return { ok: false, error: "Alerta não informado." };

  const admin = createAdminClient();
  // `.update()` não lança: devolve `{ error }`. Sem `.select()` + checagem de
  // linhas, a tela mente "dispensado!" mesmo quando nada foi gravado.
  const { data, error } = await admin
    .from("app_errors")
    .update({ dismissed_at: new Date().toISOString(), dismissed_by: platformAdmin.email })
    .eq("id", errorId)
    .is("dismissed_at", null)
    .select("id");

  if (error) {
    if (colunaNaoExiste(error)) return { ok: false, error: AVISO_MIGRACAO };
    console.error("[platform/erros] falha ao dispensar alerta:", error);
    return { ok: false, error: "Não foi possível dispensar este alerta. Tente de novo." };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "Este alerta não foi encontrado ou já estava dispensado." };
  }

  await auditar("alerta_dispensado", errorId, platformAdmin.email, { errorId });
  revalidatePath("/super/erros");
  return { ok: true };
}

/** Desfaz o "dispensar": o alerta volta para a lista padrão. */
export async function restoreError(errorId: string): Promise<Result> {
  const platformAdmin = await requireSuperAdmin();
  if (!errorId) return { ok: false, error: "Alerta não informado." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("app_errors")
    .update({ dismissed_at: null, dismissed_by: null })
    .eq("id", errorId)
    .select("id");

  if (error) {
    if (colunaNaoExiste(error)) return { ok: false, error: AVISO_MIGRACAO };
    console.error("[platform/erros] falha ao restaurar alerta:", error);
    return { ok: false, error: "Não foi possível trazer este alerta de volta. Tente de novo." };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "Este alerta não foi encontrado." };
  }

  await auditar("alerta_restaurado", errorId, platformAdmin.email, { errorId });
  revalidatePath("/super/erros");
  return { ok: true };
}
