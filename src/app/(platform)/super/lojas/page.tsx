import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { listTenants, type PlatformTenant } from "@/modules/platform/service";
import {
  TenantStatusBadge,
  StorefrontSuspendedBadge,
  BonusBadge,
  cortesiaEstaAtiva,
} from "@/components/platform/tenant-status-badge";

export const dynamic = "force-dynamic";

/** "05/09/2026" no relógio de Brasília. Data quebrada não vira texto quebrado. */
function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/**
 * Filtros aceitos na URL. O painel inicial manda link já filtrado
 * (`?status=trialing`, `?status=overdue`, `?status=suspensa`), então esta tela
 * precisa entender esses valores mesmo que ninguém mexa no seletor.
 *
 * Atenção: "suspensa" NÃO é situação de assinatura -- é a vitrine fora do ar.
 */
const FILTROS = [
  { value: "", label: "Todas as lojas" },
  { value: "trialing", label: "Em teste" },
  { value: "active", label: "Assinatura ativa" },
  { value: "pending", label: "Pagamento pendente" },
  { value: "overdue", label: "Pagamento atrasado" },
  { value: "canceled", label: "Assinatura cancelada" },
  { value: "inactive", label: "Sem assinatura" },
  { value: "suspensa", label: "Vitrine suspensa" },
];

function aplicaFiltro(lojas: PlatformTenant[], status: string): PlatformTenant[] {
  if (!status) return lojas;
  if (status === "suspensa") return lojas.filter((loja) => loja.status === "suspended");
  return lojas.filter((loja) => loja.subscriptionStatus === status);
}

function aplicaBusca(lojas: PlatformTenant[], termo: string): PlatformTenant[] {
  if (!termo) return lojas;
  const alvo = termo.toLowerCase();
  return lojas.filter(
    (loja) =>
      loja.name.toLowerCase().includes(alvo) ||
      loja.slug.toLowerCase().includes(alvo) ||
      (loja.ownerEmail ?? "").toLowerCase().includes(alvo)
  );
}

export default async function SuperLojasPage(props: {
  searchParams: Promise<{ status?: string; busca?: string }>;
}) {
  await requireSuperAdmin();

  const { status: statusParam, busca: buscaParam } = await props.searchParams;
  const status = FILTROS.some((f) => f.value === (statusParam ?? "")) ? (statusParam ?? "") : "";
  const busca = (buscaParam ?? "").trim();

  const todas = await listTenants();
  const lojas = aplicaBusca(aplicaFiltro(todas, status), busca);

  const rotuloFiltro = FILTROS.find((f) => f.value === status)?.label ?? "Todas as lojas";
  const inputClass =
    "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Lojas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Todas as lojas da plataforma. Clique em uma loja para ver os detalhes e agir sobre ela.
      </p>

      <form method="get" className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block flex-1">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Buscar</span>
          <input
            type="search"
            name="busca"
            defaultValue={busca}
            placeholder="Nome da loja, endereço (slug) ou e-mail do dono"
            className={inputClass}
          />
        </label>
        <label className="block sm:w-64">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Situação</span>
          <select name="status" defaultValue={status} className={inputClass}>
            {FILTROS.map((f) => (
              <option key={f.value || "todas"} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          Filtrar
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        {lojas.length === 1 ? "1 loja encontrada" : `${lojas.length} lojas encontradas`}
        {status || busca ? ` · ${rotuloFiltro}${busca ? ` · busca por "${busca}"` : ""}` : ""}
      </p>

      {lojas.length === 0 ? (
        <div className="mt-4 rounded-card border border-border bg-card p-6">
          {todas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não existe nenhuma loja cadastrada na plataforma. Assim que a primeira loja for criada, ela aparece
              aqui.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma loja bate com esse filtro. A plataforma tem {todas.length}{" "}
              {todas.length === 1 ? "loja no total" : "lojas no total"} —{" "}
              <Link href="/super/lojas" className="font-medium text-primary hover:underline">
                ver todas
              </Link>
              .
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {lojas.map((loja) => {
            const cortesiaAtiva = cortesiaEstaAtiva(loja.bonusUntil);
            const testeAte = loja.subscriptionStatus === "trialing" ? formatDate(loja.trialEndsAt) : null;
            const cadastro = formatDate(loja.createdAt);

            return (
              <Link
                key={loja.id}
                href={`/super/lojas/${loja.id}`}
                className="block rounded-card border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{loja.name}</p>
                    <p className="truncate text-sm text-muted-foreground">/{loja.slug}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {loja.ownerEmail ?? "Sem e-mail de dono cadastrado"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <TenantStatusBadge status={loja.subscriptionStatus} />
                    {loja.status === "suspended" ? <StorefrontSuspendedBadge /> : null}
                    {cortesiaAtiva && loja.bonusUntil ? <BonusBadge until={loja.bonusUntil} /> : null}
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {testeAte ? `Teste até ${testeAte} · ` : ""}
                  {cadastro ? `Cadastrada em ${cadastro}` : "Data de cadastro indisponível"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
