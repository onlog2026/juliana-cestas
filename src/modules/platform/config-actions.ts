"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";

/**
 * Gravação da configuração da plataforma (`saas_config`, linha única id = 1).
 *
 * ATENÇÃO: arquivo com `"use server"` só pode EXPORTAR função async. Constante
 * exportada aqui quebra o módulo inteiro em runtime.
 */

/** Auditoria local (não dá para importar utilitário entre arquivos "use server"). */
async function audit(actorEmail: string, action: string, target: string | null, before: unknown, after: unknown) {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    tenant_id: null, // configuração é da plataforma inteira, não de uma loja
    actor_email: actorEmail,
    action,
    target,
    before: before ?? null,
    after: after ?? null,
  });
  if (error) console.error("[platform] falha ao gravar auditoria:", error);
}

/** Um e-mail plausível. Não valida se existe -- valida se não é lixo digitado. */
function pareceEmail(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
}

export async function savePlatformConfig(input: {
  nomeDaPlataforma: string;
  emailDeSuporte: string;
  diasDeTeste: number;
  /** `true` = no teste a loja vê tudo. `false` = vê só `modulosDoTeste`. */
  testeLiberaTudo: boolean;
  modulosDoTeste: string[];
  diasDeCarenciaDaVitrine: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const platformAdmin = await requireSuperAdmin();

  const nomeDaPlataforma = (input.nomeDaPlataforma ?? "").trim();
  if (!nomeDaPlataforma) return { ok: false, error: "Escreva o nome da plataforma." };
  if (nomeDaPlataforma.length > 80) return { ok: false, error: "O nome da plataforma pode ter no máximo 80 caracteres." };

  const emailDeSuporte = (input.emailDeSuporte ?? "").trim().toLowerCase();
  if (emailDeSuporte && !pareceEmail(emailDeSuporte)) {
    return { ok: false, error: "O e-mail de suporte não parece um e-mail válido. Exemplo: contato@sualoja.com.br" };
  }

  const diasDeTeste = Number(input.diasDeTeste);
  if (!Number.isInteger(diasDeTeste) || diasDeTeste < 0 || diasDeTeste > 90) {
    // O banco tem a mesma trava (check de 0 a 90). Aqui a mensagem é em
    // português; lá é a rede de segurança.
    return { ok: false, error: "Os dias de teste precisam ser um número inteiro de 0 a 90." };
  }

  const diasDeCarencia = Number(input.diasDeCarenciaDaVitrine);
  if (!Number.isInteger(diasDeCarencia) || diasDeCarencia < 0 || diasDeCarencia > 90) {
    return { ok: false, error: "Os dias de carência da vitrine precisam ser um número inteiro de 0 a 90." };
  }

  const admin = createAdminClient();

  // `null` (vê tudo) e lista (vê só isto) são coisas diferentes no banco.
  let trialModuleSlugs: string[] | null = null;
  if (!input.testeLiberaTudo) {
    const pedidos = [...new Set((input.modulosDoTeste ?? []).map((m) => (m ?? "").trim()).filter(Boolean))];
    if (pedidos.length === 0) {
      return {
        ok: false,
        error:
          "Você escolheu liberar só alguns módulos no teste, mas não marcou nenhum. Marque ao menos um módulo, ou volte para a opção 'a loja vê tudo'.",
      };
    }
    // Só módulos que o sistema sabe entregar. A lista fechada mora no banco.
    const { data: conhecidos, error: erroModulos } = await admin
      .from("platform_modules")
      .select("slug")
      .in("slug", pedidos);
    if (erroModulos) {
      console.error("[platform] falha ao validar os módulos do teste:", erroModulos);
      return { ok: false, error: "Não foi possível conferir os módulos escolhidos. Nada foi salvo." };
    }
    trialModuleSlugs = (conhecidos ?? []).map((m) => m.slug as string);
    if (trialModuleSlugs.length !== pedidos.length) {
      return {
        ok: false,
        error: "Um dos módulos escolhidos não existe mais na plataforma. Recarregue a página e escolha de novo.",
      };
    }
  }

  const { data: antes, error: erroLeitura } = await admin
    .from("saas_config")
    .select("platform_name, support_email, trial_days, trial_module_slugs, storefront_grace_days")
    .eq("id", 1)
    .maybeSingle();
  if (erroLeitura) {
    console.error("[platform] falha ao ler a configuração antes de salvar:", erroLeitura);
    return { ok: false, error: "Não foi possível ler a configuração atual. Nada foi salvo." };
  }

  const novosValores = {
    platform_name: nomeDaPlataforma,
    support_email: emailDeSuporte || null,
    trial_days: diasDeTeste,
    trial_module_slugs: trialModuleSlugs,
    storefront_grace_days: diasDeCarencia,
    updated_at: new Date().toISOString(),
    updated_by: platformAdmin.email,
  };

  // `.update()` do Supabase NÃO lança quando não altera nada: devolve
  // `{ error: null, data: [] }`. Sem checar as linhas voltadas, a tela diria
  // "salvo!" com o banco intacto.
  let gravou = false;
  if (antes) {
    const { data, error } = await admin.from("saas_config").update(novosValores).eq("id", 1).select("id");
    if (error) {
      console.error("[platform] falha ao salvar a configuração:", error);
      return { ok: false, error: "Não foi possível salvar a configuração. Nada foi alterado." };
    }
    gravou = Boolean(data && data.length > 0);
  } else {
    // A linha id=1 ainda não existe (migração rodou pela metade). Cria.
    const { data, error } = await admin
      .from("saas_config")
      .insert({ id: 1, ...novosValores })
      .select("id");
    if (error) {
      console.error("[platform] falha ao criar a configuração:", error);
      return { ok: false, error: "Não foi possível criar a configuração da plataforma. Nada foi gravado." };
    }
    gravou = Boolean(data && data.length > 0);
  }

  if (!gravou) {
    return {
      ok: false,
      error: "O banco não confirmou a gravação, então nada foi salvo. Recarregue a página e tente de novo.",
    };
  }

  await audit(platformAdmin.email, "configuracao_da_plataforma_alterada", "saas_config", antes ?? null, novosValores);

  revalidatePath("/super/configuracoes");
  revalidatePath("/super");
  return { ok: true };
}
