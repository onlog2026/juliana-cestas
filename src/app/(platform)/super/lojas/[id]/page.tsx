import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getTenantById } from "@/modules/platform/service";
import { getEnv } from "@/lib/env";
import {
  TenantStatusBadge,
  StorefrontSuspendedBadge,
  BonusBadge,
  cortesiaEstaAtiva,
} from "@/components/platform/tenant-status-badge";
import { TenantActions, EnterStoreLink } from "@/components/platform/tenant-actions";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function Linha({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground">{rotulo}</span>
      <span className="text-sm font-medium text-foreground sm:text-right">{valor}</span>
    </div>
  );
}

const cardClass = "rounded-card border border-border bg-card p-5";

export default async function SuperLojaDetalhePage(props: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();

  const { id } = await props.params;
  const loja = await getTenantById(id);
  if (!loja) notFound();

  const { PLATFORM_DOMAIN } = getEnv();
  const temDominioProprio = Boolean(PLATFORM_DOMAIN);
  // Sem domínio da plataforma existe uma loja só e ela mora no /admin deste
  // mesmo site -- montar um subdomínio agora daria um link que não abre.
  const painelUrl = temDominioProprio ? `https://${loja.slug}.${PLATFORM_DOMAIN}/admin` : "/admin";

  const cortesiaAtiva = cortesiaEstaAtiva(loja.bonusUntil);
  const modulosAtivos = loja.grantedModules.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/super/lojas" className="text-sm font-medium text-primary hover:underline">
          ← Voltar para a lista de lojas
        </Link>
        <h1 className="mt-2 font-display text-2xl text-foreground">{loja.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TenantStatusBadge status={loja.subscriptionStatus} />
          {loja.status === "suspended" ? <StorefrontSuspendedBadge /> : null}
          {cortesiaAtiva && loja.bonusUntil ? <BonusBadge until={loja.bonusUntil} /> : null}
        </div>
      </div>

      <div className={cardClass}>
        <EnterStoreLink
          tenantId={loja.id}
          slug={loja.slug}
          href={painelUrl}
          temDominioProprio={temDominioProprio}
        />
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-foreground">Identificação</h2>
        <div className="mt-2">
          <Linha rotulo="Nome da loja" valor={loja.name} />
          <Linha rotulo="Endereço da loja (slug)" valor={`/${loja.slug}`} />
          <Linha rotulo="E-mail do dono" valor={loja.ownerEmail ?? "Não cadastrado"} />
          <Linha rotulo="Cadastrada em" valor={formatDate(loja.createdAt) ?? "Data indisponível"} />
          <Linha
            rotulo="Vitrine (site para os clientes)"
            valor={loja.status === "suspended" ? "Fora do ar (suspensa)" : "No ar"}
          />
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-foreground">Assinatura</h2>
        <div className="mt-2">
          <Linha rotulo="Situação" valor={<TenantStatusBadge status={loja.subscriptionStatus} />} />
          <Linha rotulo="Plano" valor={loja.subscriptionPlan ?? "Nenhum plano registrado"} />
          <Linha rotulo="Teste até" valor={formatDate(loja.trialEndsAt) ?? "Não está em período de teste"} />
          <Linha rotulo="Pago até" valor={formatDate(loja.paidUntil) ?? "Sem pagamento registrado"} />
        </div>
      </div>

      {loja.bonusUntil || loja.bonusReason ? (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-foreground">Cortesia</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cortesia é acesso liberado sem cobrança. Enquanto ela estiver valendo, a loja não paga nada.
          </p>
          <div className="mt-2">
            <Linha
              rotulo="Vale até"
              valor={
                formatDate(loja.bonusUntil) ? (
                  <>
                    {formatDate(loja.bonusUntil)}
                    {!cortesiaAtiva ? " (já venceu)" : ""}
                  </>
                ) : (
                  "Sem prazo registrado"
                )
              }
            />
            <Linha rotulo="Motivo" valor={loja.bonusReason ?? "Sem motivo registrado"} />
          </div>
        </div>
      ) : null}

      {modulosAtivos ? (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-foreground">Módulos liberados</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {loja.grantedModules.map((modulo) => (
              <span
                key={modulo}
                className="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-primary"
              >
                {modulo}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {formatDate(loja.grantedModulesUntil)
              ? `Liberados até ${formatDate(loja.grantedModulesUntil)}.`
              : "Sem prazo de validade registrado."}
          </p>
        </div>
      ) : null}

      <TenantActions
        tenantId={loja.id}
        nome={loja.name}
        storefrontSuspensa={loja.status === "suspended"}
        temCortesia={Boolean(loja.bonusUntil)}
        planoAtual={loja.subscriptionPlan}
      />
    </div>
  );
}
