"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";
import { getEntitlements } from "@/modules/entitlements/service";
import { getTema, getVariacao } from "@/storefront/temas/catalogo";
import { planoPermite } from "@/storefront/temas/instalado";

type Resultado = { ok: true; mensagem: string } | { ok: false; error: string };

/**
 * Instala um modelo (+ variação) na loja de quem está logado. Guarda o que havia
 * antes dentro do próprio registro (`layout.anterior`) para o "Voltar ao anterior".
 * Produtos, pedidos, fotos e textos NÃO são tocados: só aparência.
 */
export async function instalarModelo(modelo: string, variante: string): Promise<Resultado> {
  const gate = await ensureModuleForAction("templates");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const tema = getTema(modelo);
  if (!tema) return { ok: false, error: "Esse modelo não existe. Atualize a página e tente de novo." };
  const v = getVariacao(tema, variante);

  const ent = await getEntitlements(gate.staff);
  const emTeste = ent.state === "teste";
  if (!gate.staff.isSuperAdmin && !emTeste && !planoPermite(ent.planSlug, tema.plano)) {
    return { ok: false, error: `O modelo ${tema.name} é do plano Pro ou superior. Veja os planos em Sua assinatura.` };
  }

  const admin = createAdminClient();
  const { data: atual } = await admin
    .from("store_theme")
    .select("template_key, tokens, fonts, layout")
    .eq("tenant_id", gate.staff.tenantId)
    .maybeSingle();

  // Reinstalar por cima de um modelo novo mantém o "anterior" original (o de antes de qualquer modelo novo).
  const layoutAtual = (atual?.layout ?? {}) as { motor?: string; anterior?: unknown };
  const anterior = layoutAtual.motor === "temas" ? (layoutAtual.anterior ?? null) : atual ? { template_key: atual.template_key, tokens: atual.tokens, fonts: atual.fonts, layout: atual.layout } : null;

  const { data, error } = await admin
    .from("store_theme")
    .upsert(
      {
        tenant_id: gate.staff.tenantId,
        template_key: tema.key,
        tokens: {},
        fonts: {},
        layout: { motor: "temas", variante: v.key, anterior },
        updated_at: new Date().toISOString(),
        updated_by: gate.staff.id,
      },
      { onConflict: "tenant_id" }
    )
    .select("tenant_id");
  if (error || !data || data.length === 0) {
    return { ok: false, error: "Não consegui instalar o modelo agora. Nada foi alterado. Tente de novo." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/modelos");
  return { ok: true, mensagem: `Modelo ${tema.name} · ${v.name} instalado. Seus produtos, pedidos e fotos continuam os mesmos.` };
}

/** Volta ao que a loja tinha antes do modelo novo (ou ao visual de sempre, se não havia nada). */
export async function voltarModelo(): Promise<Resultado> {
  const gate = await ensureModuleForAction("templates");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const admin = createAdminClient();
  const { data: atual } = await admin
    .from("store_theme")
    .select("layout")
    .eq("tenant_id", gate.staff.tenantId)
    .maybeSingle();
  const layout = (atual?.layout ?? {}) as { motor?: string; anterior?: { template_key?: string; tokens?: unknown; fonts?: unknown; layout?: unknown } | null };
  if (layout.motor !== "temas") return { ok: false, error: "Não há um modelo novo instalado para desfazer." };

  const ant = layout.anterior;
  if (ant && ant.template_key) {
    const { data, error } = await admin
      .from("store_theme")
      .update({ template_key: ant.template_key, tokens: ant.tokens ?? {}, fonts: ant.fonts ?? {}, layout: ant.layout ?? {}, updated_at: new Date().toISOString(), updated_by: gate.staff.id })
      .eq("tenant_id", gate.staff.tenantId)
      .select("tenant_id");
    if (error || !data || data.length === 0) return { ok: false, error: "Não consegui voltar agora. Nada foi alterado." };
  } else {
    const { error } = await admin.from("store_theme").delete().eq("tenant_id", gate.staff.tenantId);
    if (error) return { ok: false, error: "Não consegui voltar agora. Nada foi alterado." };
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/modelos");
  return { ok: true, mensagem: "Pronto: a loja voltou ao visual anterior." };
}
