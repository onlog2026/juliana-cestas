const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_preparacao: "Em preparação",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const STATUS_COLORS: Record<string, string> = {
  novo: "bg-secondary text-muted-foreground",
  aguardando_pagamento: "bg-amber-100 text-amber-800",
  pago: "bg-accent text-primary",
  em_preparacao: "bg-accent text-primary",
  pronto: "bg-accent text-primary",
  saiu_para_entrega: "bg-blue-100 text-blue-800",
  entregue: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
  reembolsado: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUS_COLORS[status] ?? "bg-secondary text-muted-foreground"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
