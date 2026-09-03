const LABELS: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  reaberto: "Reaberto",
};

const COLORS: Record<string, string> = {
  aberto: "bg-amber-100 text-amber-800",
  em_andamento: "bg-accent text-primary",
  resolvido: "bg-green-100 text-green-800",
  reaberto: "bg-red-100 text-red-800",
};

const CATEGORY_LABELS: Record<string, string> = {
  pedido: "Pedido",
  entrega: "Entrega",
  pagamento: "Pagamento",
  bug: "Problema no site",
  feedback: "Sugestão",
};

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        COLORS[status] ?? "bg-secondary text-muted-foreground"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}
