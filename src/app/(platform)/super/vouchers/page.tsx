import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { listTenants } from "@/modules/platform/service";
import { listVouchers, listPlatformModules, listPlanOptions } from "@/modules/platform/vouchers-service";
import { VoucherForm } from "@/components/platform/voucher-form";
import { VoucherList } from "@/components/platform/voucher-list";

export const dynamic = "force-dynamic";

/**
 * Cortesias (vouchers) da plataforma.
 *
 * Tudo o que aparece aqui foi lido no SERVIDOR: a tabela `vouchers` tem RLS
 * `using(false)` e o navegador não consegue (nem deve) tocá-la. Os componentes
 * de cliente abaixo recebem só os campos prontos — inclusive os nomes dos
 * módulos já resolvidos, porque o navegador não conhece `platform_modules`.
 */
export default async function SuperVouchersPage() {
  await requireSuperAdmin();

  const [vouchers, modulos, planos, lojas] = await Promise.all([
    listVouchers(),
    listPlatformModules(),
    listPlanOptions(),
    listTenants(),
  ]);

  const nomeDoModulo = new Map(modulos.map((m) => [m.slug, m.name]));

  const itens = vouchers.map((voucher) => ({
    id: voucher.id,
    code: voucher.code,
    tenantNome: voucher.tenantNome,
    grantPlanSlug: voucher.grantPlanSlug,
    // Se um módulo sumiu da lista da plataforma, mostra o código cru em vez de
    // esconder: melhor o dono ver "modulo-antigo" do que ver uma linha a menos.
    modulosNomes: voucher.grantModules.map((slug) => nomeDoModulo.get(slug) ?? slug),
    accessDays: voucher.accessDays,
    validUntil: voucher.validUntil,
    maxUses: voucher.maxUses,
    usedCount: voucher.usedCount,
    redeemedBy: voucher.redeemedBy,
    redeemedAt: voucher.redeemedAt,
    note: voucher.note,
    createdBy: voucher.createdBy,
    createdAt: voucher.createdAt,
    situacao: voucher.situacao,
    jaFoiUsada: voucher.jaFoiUsada,
  }));

  const disponiveis = itens.filter((i) => i.situacao === "disponivel").length;
  const usadas = itens.filter((i) => i.situacao === "usada").length;
  const expiradas = itens.filter((i) => i.situacao === "expirada").length;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl text-foreground">Cortesias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cortesia é um código que libera uma loja de graça, por um prazo. Você gera o código aqui, entrega para a
          pessoa, e ela resgata dentro do painel da loja dela. Gerar uma cortesia{" "}
          <strong>não cria nenhuma cobrança</strong>.
        </p>
      </div>

      <VoucherForm
        modulos={modulos.map((m) => ({
          slug: m.slug,
          name: m.name,
          description: m.description,
          category: m.category,
          isCore: m.isCore,
        }))}
        planos={planos.map((p) => ({ slug: p.slug, name: p.name, isVisible: p.isVisible }))}
        lojas={lojas.map((l) => ({ id: l.id, nome: l.name, slug: l.slug }))}
      />

      <div>
        <h2 className="font-display text-xl text-foreground">Cortesias já criadas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {itens.length === 0
            ? "Nenhuma cortesia criada até agora."
            : `${itens.length} ${itens.length === 1 ? "cortesia" : "cortesias"} no total · ${disponiveis} ${
                disponiveis === 1 ? "disponível" : "disponíveis"
              } · ${usadas} ${usadas === 1 ? "já usada" : "já usadas"} · ${expiradas} com o prazo de resgate vencido.`}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          A situação de cada cortesia é calculada na hora em que a página carrega, comparando os usos feitos com o
          limite e a data de hoje com o prazo de resgate. Nada aqui depende de uma rotina automática ter rodado.
        </p>
        <div className="mt-3">
          <VoucherList vouchers={itens} />
        </div>
      </div>
    </div>
  );
}
