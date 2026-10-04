/**
 * Núcleo do "Instalar modelo" / "Voltar ao anterior", sem login nem Next:
 * recebe o cliente do banco e o id da loja. As actions (`temas-actions.ts`) cuidam de
 * sessão, módulo e plano e chamam estas funções; o teste `tests/isolation/instalar-voltar.mjs`
 * chama as mesmas funções contra uma loja descartável.
 * Sem imports de propósito (roda direto no Node para teste).
 */

type Linha = { template_key?: unknown; tokens?: unknown; fonts?: unknown; layout?: unknown };
type Anterior = { template_key?: string; tokens?: unknown; fonts?: unknown; layout?: unknown } | null;

// Mínimo do cliente Supabase que usamos (tipagem frouxa para não acoplar ao pacote).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Banco = { from: (tabela: string) => any };

export type ResultadoNucleo = { ok: true } | { ok: false; error: string };

export async function instalarNoBanco(db: Banco, tenantId: string, modelo: string, variante: string, userId: string | null): Promise<ResultadoNucleo> {
  const { data: atual } = (await db
    .from("store_theme")
    .select("template_key, tokens, fonts, layout")
    .eq("tenant_id", tenantId)
    .maybeSingle()) as { data: Linha | null };

  // Reinstalar por cima de um modelo novo mantém o "anterior" original (o de antes de qualquer modelo novo).
  const layoutAtual = (atual?.layout ?? {}) as { motor?: string; anterior?: Anterior };
  const anterior: Anterior =
    layoutAtual.motor === "temas"
      ? (layoutAtual.anterior ?? null)
      : atual
        ? { template_key: String(atual.template_key), tokens: atual.tokens, fonts: atual.fonts, layout: atual.layout }
        : null;

  const { data, error } = await db
    .from("store_theme")
    .upsert(
      {
        tenant_id: tenantId,
        template_key: modelo,
        tokens: {},
        fonts: {},
        layout: { motor: "temas", variante, anterior },
        updated_at: new Date().toISOString(),
        updated_by: userId,
      },
      { onConflict: "tenant_id" }
    )
    .select("tenant_id");
  if (error || !data || data.length === 0) return { ok: false, error: "Não consegui instalar o modelo agora. Nada foi alterado. Tente de novo." };
  return { ok: true };
}

export async function voltarNoBanco(db: Banco, tenantId: string, userId: string | null): Promise<ResultadoNucleo> {
  const { data: atual } = (await db.from("store_theme").select("layout").eq("tenant_id", tenantId).maybeSingle()) as { data: { layout?: unknown } | null };
  const layout = (atual?.layout ?? {}) as { motor?: string; anterior?: Anterior };
  if (layout.motor !== "temas") return { ok: false, error: "Não há um modelo novo instalado para desfazer." };

  const ant = layout.anterior;
  if (ant && ant.template_key) {
    const { data, error } = await db
      .from("store_theme")
      .update({ template_key: ant.template_key, tokens: ant.tokens ?? {}, fonts: ant.fonts ?? {}, layout: ant.layout ?? {}, updated_at: new Date().toISOString(), updated_by: userId })
      .eq("tenant_id", tenantId)
      .select("tenant_id");
    if (error || !data || data.length === 0) return { ok: false, error: "Não consegui voltar agora. Nada foi alterado." };
  } else {
    const { error } = await db.from("store_theme").delete().eq("tenant_id", tenantId);
    if (error) return { ok: false, error: "Não consegui voltar agora. Nada foi alterado." };
  }
  return { ok: true };
}
