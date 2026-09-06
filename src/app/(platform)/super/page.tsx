import Link from "next/link";
import { Store, Clock, TriangleAlert, PauseCircle, ChevronRight } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { listTenants, getOverview, type PlatformTenant, type PlatformOverview } from "@/modules/platform/service";

/** Nome em português de cada situação de assinatura que o banco aceita. */
const STATUS_LABEL: Record<string, string> = {
  active: "Ativa (pagando)",
  trialing: "Em teste",
  pending: "Aguardando pagamento",
  overdue: "Inadimplente",
  canceled: "Cancelada",
  inactive: "Inativa",
};

/** Ordem fixa, para a lista não dançar a cada carregamento. */
const STATUS_ORDER = ["active", "trialing", "pending", "overdue", "canceled", "inactive"];

const dataFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return dataFormatter.format(d);
}

export default async function SuperHomePage() {
  const admin = await requireSuperAdmin();

  // Se a leitura falhar, a tela DIZ que falhou. Lista vazia por engano já fez
  // um painel parecer "sem nenhuma loja" por dias no Agentop.
  let carregadas: PlatformTenant[] = [];
  let calculado: PlatformOverview | null = null;
  let mensagemDeErro: string | null = null;

  try {
    carregadas = await listTenants();
    calculado = await getOverview(carregadas);
  } catch (e) {
    mensagemDeErro = e instanceof Error ? e.message : "Não foi possível carregar as lojas.";
  }

  // Const (não `let`): o TypeScript só mantém a checagem de "não é nulo" dentro
  // dos callbacks do JSX se a variável for constante.
  const tenants = carregadas;
  const overview = calculado;
  const erro = mensagemDeErro;

  // Contagem + percentual por situação, só das situações que realmente
  // aparecem no banco -- nada de linha inventada com zero.
  const distribuicao =
    overview && overview.total > 0
      ? STATUS_ORDER.filter((s) => (overview.porStatus[s] ?? 0) > 0).map((status) => {
          const quantidade = overview.porStatus[status] ?? 0;
          return {
            status,
            quantidade,
            percentual: Math.round((quantidade / overview.total) * 100),
          };
        })
      : [];

  return (
    <div className="max-w-4xl">
      <div>
        <h1 className="font-display text-2xl text-foreground">Painel da plataforma</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral de todas as lojas. Você está logado como {admin.email}.
        </p>
      </div>

      {erro ? (
        <div className="mt-6 rounded-card border border-destructive/40 bg-destructive/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <TriangleAlert className="size-4" /> Não foi possível carregar as lojas
          </div>
          <p className="mt-2 text-sm text-foreground">{erro}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Os números abaixo não aparecem porque o banco de dados não respondeu — não é porque não existe
            nenhuma loja. Recarregue a página; se continuar assim, o banco está fora do ar.
          </p>
        </div>
      ) : null}

      {overview ? (
        <>
          {/* Todo número leva à lista já filtrada -- nenhum card é beco sem saída. */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/super/lojas"
              className="jc-nav-hover rounded-card border border-border bg-card p-5 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="size-4" /> Lojas na plataforma
              </div>
              <p className="mt-2 font-display text-2xl text-foreground">{overview.total}</p>
              <p className="mt-1 text-xs text-muted-foreground">Ver todas</p>
            </Link>

            <Link
              href="/super/lojas?status=trialing"
              className="jc-nav-hover rounded-card border border-border bg-card p-5 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" /> Em teste
              </div>
              <p className="mt-2 font-display text-2xl text-foreground">{overview.emTrial}</p>
              <p className="mt-1 text-xs text-muted-foreground">Ainda não pagaram nada</p>
            </Link>

            <Link
              href="/super/lojas?status=overdue"
              className="jc-nav-hover rounded-card border border-border bg-card p-5 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TriangleAlert className="size-4" /> Inadimplentes
              </div>
              <p className="mt-2 font-display text-2xl text-foreground">{overview.inadimplentes}</p>
              <p className="mt-1 text-xs text-muted-foreground">Pagamento em atraso</p>
            </Link>

            <Link
              href="/super/lojas?status=suspensa"
              className="jc-nav-hover rounded-card border border-border bg-card p-5 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PauseCircle className="size-4" /> Vitrines suspensas
              </div>
              <p className="mt-2 font-display text-2xl text-foreground">{overview.suspensas}</p>
              <p className="mt-1 text-xs text-muted-foreground">Site fora do ar</p>
            </Link>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-card border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">Como as lojas estão divididas</h2>
              {overview.total === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nenhuma loja cadastrada na plataforma ainda.
                </p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {distribuicao.map((linha) => (
                    <li key={linha.status}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{STATUS_LABEL[linha.status] ?? linha.status}</span>
                        <span className="text-muted-foreground">
                          {linha.quantidade} {linha.quantidade === 1 ? "loja" : "lojas"} · {linha.percentual}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${linha.percentual}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-card border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">Lojas mais recentes</h2>
              {tenants.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Nenhuma loja cadastrada na plataforma ainda.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col divide-y divide-border">
                  {tenants.slice(0, 5).map((t) => (
                    <li key={t.id}>
                      <Link
                        href={`/super/lojas/${t.id}`}
                        className="jc-nav-hover flex items-center justify-between gap-3 rounded-[10px] px-2 py-3 transition-colors"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-foreground">{t.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {STATUS_LABEL[t.subscriptionStatus] ?? t.subscriptionStatus}
                            {t.status === "suspended" ? " · vitrine suspensa" : ""} · entrou em{" "}
                            {formatarData(t.createdAt)}
                          </span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
