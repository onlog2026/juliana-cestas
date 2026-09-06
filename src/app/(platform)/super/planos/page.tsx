import { TriangleAlert, Store, Star, EyeOff, Info } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import {
  listPlans,
  listPlatformModules,
  formatCentsToReais,
  centsToInputValue,
  mensalidadeAnualEmCentavos,
  type SubscriptionPlan,
  type PlatformModule,
} from "@/modules/platform/plans-service";
import { PlanEditor, NewPlanEditor, type PlanEditorValues } from "@/components/platform/plan-editor";
import { PlanModuleMatrix, type MatrixRow } from "@/components/platform/plan-module-matrix";

export const dynamic = "force-dynamic";

/**
 * Planos & Preços da plataforma.
 *
 * Três coisas que esta tela existe para não deixar acontecer de novo (todas
 * documentadas em docs/SUPER-ADMIN-SPEC.md, cada uma custou um incidente):
 *
 *  1. Duas unidades de dinheiro na mesma tela. Aqui o banco guarda CENTAVOS e
 *     a tela mostra e recebe REAIS -- a conversão acontece num lugar só, no
 *     servidor, com teste.
 *  2. Um campo de limite que parecia trava e não travava. Aqui são dois campos
 *     com nome explícito: o texto da vitrine e o número que o sistema obedece.
 *  3. Vender o que o sistema não entrega. Os módulos saem de uma lista fechada
 *     (`platform_modules`), que é a mesma que o código consulta para liberar.
 */

/** Monta o formulário do plano a partir do que está gravado. */
function paraFormulario(plano: SubscriptionPlan): PlanEditorValues {
  return {
    id: plano.id,
    slug: plano.slug,
    name: plano.name,
    badge: plano.badge ?? "",
    description: plano.description ?? "",
    // Centavos viram "129,90" só aqui, para a pessoa digitar em reais.
    precoMensalTexto: centsToInputValue(plano.monthlyCents),
    descontoAnualTexto: String(plano.annualDiscountPct ?? 0).replace(".", ","),
    maxProductsTexto: plano.maxProducts === null ? "" : String(plano.maxProducts),
    maxTeamMembersTexto: plano.maxTeamMembers === null ? "" : String(plano.maxTeamMembers),
    sortOrderTexto: String(plano.sortOrder ?? 0),
    isVisible: plano.isVisible,
    isAnchor: plano.isAnchor,
  };
}

/**
 * Uma linha por módulo do sistema -- inclusive os que este plano nunca
 * configurou (aparecem como "Não tem"). Se a matriz mostrasse só o que já
 * está gravado, um módulo novo ficaria invisível e ninguém saberia que ele
 * existe para vender.
 */
function paraMatriz(plano: SubscriptionPlan, modulos: PlatformModule[]): MatrixRow[] {
  const regras = new Map(plano.modules.map((r) => [r.moduleSlug, r]));
  return modulos.map((modulo) => {
    const regra = regras.get(modulo.slug);
    return {
      moduleSlug: modulo.slug,
      name: modulo.name,
      description: modulo.description,
      category: modulo.category,
      isCore: modulo.isCore,
      status: modulo.isCore ? ("included" as const) : (regra?.status ?? ("excluded" as const)),
      limitDisplay: regra?.limitDisplay ?? "",
      limitValueTexto: regra?.limitValue === null || regra?.limitValue === undefined ? "" : String(regra.limitValue),
    };
  });
}

export default async function SuperPlanosPage() {
  await requireSuperAdmin();

  // Se a leitura falhar, a tela DIZ que falhou. Nunca finge que não existe
  // nenhum plano -- lista vazia por engano já fez painel mentir por dias.
  let carregados: SubscriptionPlan[] = [];
  let modulosCarregados: PlatformModule[] = [];
  let mensagemDeErro: string | null = null;

  try {
    const [planosLidos, modulosLidos] = await Promise.all([listPlans(), listPlatformModules()]);
    carregados = planosLidos;
    modulosCarregados = modulosLidos;
  } catch (e) {
    mensagemDeErro = e instanceof Error ? e.message : "Não foi possível carregar os planos.";
  }

  const planos = carregados;
  const modulos = modulosCarregados;
  const erro = mensagemDeErro;

  const totalLojasComPlano = planos.reduce((soma, p) => soma + p.lojasUsando, 0);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl text-foreground">Planos &amp; Preços</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Os planos que a plataforma vende e o que cada um libera. O preço é digitado em reais e guardado em centavos
        pelo sistema — você digita normal, com vírgula.
      </p>

      {erro ? (
        <div className="mt-6 rounded-card border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <TriangleAlert className="size-4" /> Não foi possível carregar os planos
          </div>
          <p className="mt-2 text-sm text-foreground">{erro}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nada aparece abaixo porque o banco de dados não respondeu — não é porque não existe nenhum plano
            cadastrado. Recarregue a página; se continuar assim, o banco está fora do ar.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 flex gap-2 rounded-card border border-border bg-card p-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              {planos.length === 1 ? "1 plano cadastrado" : `${planos.length} planos cadastrados`} ·{" "}
              {totalLojasComPlano === 1 ? "1 loja com plano definido" : `${totalLojasComPlano} lojas com plano definido`}
              . Trocar o preço aqui muda o que a vitrine mostra para quem ainda vai assinar;{" "}
              <strong>não altera automaticamente a cobrança já criada no Asaas</strong> para quem já é cliente.
            </p>
          </div>

          <div className="mt-5">
            <NewPlanEditor />
          </div>

          {planos.length === 0 ? (
            <div className="mt-4 rounded-card border border-border bg-card p-6">
              <p className="text-sm text-muted-foreground">
                Nenhum plano cadastrado ainda. Crie o primeiro no botão acima — depois de criar, você define nele o
                que cada módulo faz.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {planos.map((plano) => {
                const anualPorMes = mensalidadeAnualEmCentavos(plano.monthlyCents, plano.annualDiscountPct);
                return (
                  <section key={plano.id} className="rounded-card border border-border bg-card p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-lg text-foreground">{plano.name}</h2>
                          {plano.isAnchor ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">
                              <Star className="size-3.5" /> Mais popular
                            </span>
                          ) : null}
                          {!plano.isVisible ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              <EyeOff className="size-3.5" /> Fora da vitrine
                            </span>
                          ) : null}
                          {plano.badge ? (
                            <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              {plano.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">Identificador: {plano.slug}</p>
                        {plano.description ? (
                          <p className="mt-1 text-sm text-muted-foreground">{plano.description}</p>
                        ) : null}
                      </div>

                      <div className="shrink-0 sm:text-right">
                        <p className="font-display text-xl text-foreground">
                          {formatCentsToReais(plano.monthlyCents)}
                          <span className="text-sm text-muted-foreground"> /mês</span>
                        </p>
                        {plano.annualDiscountPct > 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No plano anual: {formatCentsToReais(anualPorMes)}/mês ({plano.annualDiscountPct}% de
                            desconto)
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">Sem desconto no plano anual</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Store className="size-4" />
                        {plano.lojasUsando === 1 ? "1 loja neste plano" : `${plano.lojasUsando} lojas neste plano`}
                      </span>
                      <span>
                        Produtos: {plano.maxProducts === null ? "sem limite" : plano.maxProducts}
                      </span>
                      <span>
                        Equipe: {plano.maxTeamMembers === null ? "sem limite" : plano.maxTeamMembers}
                      </span>
                    </div>

                    <PlanEditor plano={paraFormulario(plano)} lojasUsando={plano.lojasUsando} />

                    <PlanModuleMatrix
                      planId={plano.id}
                      planName={plano.name}
                      linhas={paraMatriz(plano, modulos)}
                    />
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
