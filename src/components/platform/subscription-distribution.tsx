import Link from "next/link";
import type { FatiaDeDistribuicao } from "@/modules/platform/finance-service";

/**
 * Como as assinaturas estão divididas: uma linha por situação, com contagem,
 * percentual e barra proporcional.
 *
 * Só aparecem situações que EXISTEM no banco. Nada de linha inventada com zero
 * — uma lista cheia de "0 lojas" esconde as três linhas que importam.
 */

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo (pagando)",
  trialing: "Em teste",
  pending: "Aguardando pagamento",
  overdue: "Inadimplente",
  canceled: "Cancelado",
  inactive: "Sem assinatura",
};

export function SubscriptionDistribution({ fatias }: { fatias: FatiaDeDistribuicao[] }) {
  if (fatias.length === 0) {
    return (
      <p className="mt-3 text-sm text-muted-foreground">
        Nenhuma loja cadastrada na plataforma ainda, então não há assinaturas para dividir.
      </p>
    );
  }

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {fatias.map((fatia) => (
        <li key={fatia.status}>
          <Link href={`/super/lojas?status=${fatia.status}`} className="group block">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground group-hover:underline">
                {STATUS_LABEL[fatia.status] ?? fatia.status}
              </span>
              <span className="text-muted-foreground">
                {fatia.quantidade} {fatia.quantidade === 1 ? "loja" : "lojas"} · {fatia.percentual}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${fatia.percentual}%` }} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
