/**
 * Selos de estado de uma loja, no vocabulário de quem administra a plataforma.
 *
 * São dois estados DIFERENTES e o painel não pode confundi-los:
 *  - `subscriptionStatus` = a situação do pagamento (em teste, ativa, atrasada…);
 *  - `status` = a vitrine está no ar ou fora do ar para os clientes.
 * Uma loja pode estar com a assinatura ativa e a vitrine suspensa, e vice-versa.
 */

const SUBSCRIPTION_LABELS: Record<string, string> = {
  trialing: "Em teste",
  active: "Assinatura ativa",
  pending: "Pagamento pendente",
  overdue: "Pagamento atrasado",
  canceled: "Assinatura cancelada",
  inactive: "Sem assinatura",
};

const SUBSCRIPTION_COLORS: Record<string, string> = {
  trialing: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  overdue: "bg-red-100 text-red-800",
  canceled: "bg-red-100 text-red-800",
  inactive: "bg-secondary text-muted-foreground",
};

const BASE = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";

/** Situação da assinatura da loja. */
export function TenantStatusBadge({ status }: { status: string }) {
  return (
    <span className={`${BASE} ${SUBSCRIPTION_COLORS[status] ?? "bg-secondary text-muted-foreground"}`}>
      {SUBSCRIPTION_LABELS[status] ?? status}
    </span>
  );
}

/** A vitrine da loja está fora do ar para os clientes. */
export function StorefrontSuspendedBadge() {
  return <span className={`${BASE} bg-red-100 text-red-800`}>Vitrine suspensa</span>;
}

/** Quantos dias inteiros faltam até `iso`. Devolve 0 quando já passou. */
export function diasRestantes(iso: string): number {
  const fim = new Date(iso).getTime();
  if (Number.isNaN(fim)) return 0;
  const faltam = Math.ceil((fim - Date.now()) / 86400000);
  return faltam > 0 ? faltam : 0;
}

/** A cortesia ainda está valendo? (helper de módulo: mantém `Date.now()` fora do render) */
export function cortesiaEstaAtiva(until: string | null): boolean {
  if (!until) return false;
  return diasRestantes(until) > 0;
}

/** A loja está com um período de cortesia em andamento (não paga nada). */
export function BonusBadge({ until }: { until: string }) {
  const dias = diasRestantes(until);
  if (dias <= 0) return null;
  return (
    <span className={`${BASE} bg-purple-100 text-purple-800`}>
      Cortesia · {dias === 1 ? "1 dia restante" : `${dias} dias restantes`}
    </span>
  );
}
