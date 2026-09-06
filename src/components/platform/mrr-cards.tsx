import Link from "next/link";
import {
  Store,
  Wallet,
  Clock,
  TriangleAlert,
  PauseCircle,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";

/**
 * A fileira de cards do topo do Financeiro.
 *
 * Cada card é CLICÁVEL e leva para a lista de lojas já filtrada — nenhum número
 * do painel pode ser beco sem saída.
 *
 * POR QUE O ÍCONE VIAJA COMO STRING: componente do lucide é uma função, e
 * função não atravessa a fronteira Server → Client (o build passa e a produção
 * quebra em runtime). Quem chama manda `icone: "Wallet"`; o mapa que traduz
 * isso para o componente mora aqui dentro. Mesmo padrão já usado no
 * `super-nav-drawer.tsx`.
 */

const ICONES: Record<string, LucideIcon> = {
  Store,
  Wallet,
  Clock,
  TriangleAlert,
  PauseCircle,
  CircleSlash,
};

export type CardDeMetrica = {
  /** Chave estável para o React (não é exibida). */
  chave: string;
  /** Nome do ícone do lucide — string, nunca o componente. */
  icone: keyof typeof ICONES | string;
  titulo: string;
  /** Já formatado por quem chama (dinheiro em reais, contagem como número). */
  valor: string;
  /** Uma frase curta explicando o que o número significa. */
  legenda: string;
  /** Para onde o card leva. */
  href: string;
  /** Deixa o card em tom de alerta (usado em inadimplência/suspensão). */
  destaque?: "alerta";
};

export function MrrCards({ cards }: { cards: CardDeMetrica[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const Icone = ICONES[card.icone] ?? Store;
        const borda = card.destaque === "alerta" ? "border-destructive/40" : "border-border";
        return (
          <Link
            key={card.chave}
            href={card.href}
            className={`jc-nav-hover rounded-card border ${borda} bg-card p-5 transition-colors`}
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icone className="size-4" /> {card.titulo}
            </div>
            <p className="mt-2 font-display text-2xl text-foreground">{card.valor}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.legenda}</p>
          </Link>
        );
      })}
    </div>
  );
}
