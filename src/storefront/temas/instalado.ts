import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTema, getVariacao } from "./catalogo";
import type { Tema, TemaKey, Variacao } from "./types";

export type TemaInstalado = { tema: Tema; variacao: Variacao };

/** Planos que só podem instalar modelos do plano Start. Os demais (Pro, Premium, fundadora, teste) instalam todos. */
const PLANOS_START = ["essencial", "start"];

export function planoPermite(planSlug: string | null, plano: Tema["plano"]): boolean {
  if (plano === "start") return true;
  return !(planSlug && PLANOS_START.includes(planSlug));
}

/**
 * O modelo INSTALADO na loja (`store_theme` com `layout.motor = "temas"`), ou `null`.
 * `null` = a loja continua exatamente como é hoje (é o caso da Juliana).
 *
 * `TEMA_FORCADO="noir:vinhos"` (variável de ambiente, só para teste LOCAL) força um
 * modelo sem gravar nada no banco; nunca é definida na Vercel.
 */
export const getTemaInstalado = cache(async (tenantId: string): Promise<TemaInstalado | null> => {
  // Só em build/servidor de TESTE (TEMA_TESTE=1; nunca na Vercel): o modelo vem de um cabeçalho da
  // requisição, para o verificador percorrer os 17 modelos na loja real sem gravar nada no banco.
  // Fora do modo de teste `headers()` nem é chamado, e as páginas estáticas continuam estáticas.
  if (process.env.TEMA_TESTE === "1") {
    const { headers } = await import("next/headers");
    const pedido = ((await headers()).get("x-tema-teste") ?? "").trim();
    if (pedido) {
      const [m, v] = pedido.split(":");
      const tema = getTema(m);
      if (tema) return { tema, variacao: getVariacao(tema, v) };
    }
  }
  const forcado = (process.env.TEMA_FORCADO ?? "").trim();
  if (forcado) {
    const [m, v] = forcado.split(":");
    const tema = getTema(m);
    if (tema) return { tema, variacao: getVariacao(tema, v) };
  }
  try {
    const { data, error } = await createAdminClient()
      .from("store_theme")
      .select("template_key, layout")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (error || !data) return null;
    const layout = (data.layout ?? {}) as { motor?: string; variante?: string };
    if (layout.motor !== "temas") return null;
    const tema = getTema(String(data.template_key));
    if (!tema) return null;
    return { tema, variacao: getVariacao(tema, layout.variante) };
  } catch {
    return null;
  }
});

export type { TemaKey };
