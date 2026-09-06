/**
 * Peças comuns a todos os blocos.
 *
 * REGRA QUE NÃO SE NEGOCIA NESTE ARQUIVO: nada daqui pode ser passado para um
 * componente de cliente. O mapa de ícones abaixo guarda FUNÇÕES React; passar
 * uma função de um componente de servidor para um de cliente derruba a página
 * em produção mesmo passando no `tsc` e no `next build` — já aconteceu neste
 * projeto e por isso o registro de módulos guarda o NOME do ícone, não o
 * ícone. Aqui vale o mesmo: o nome viaja, o componente fica.
 */
import {
  Clock,
  CreditCard,
  Gift,
  Headset,
  Heart,
  MapPin,
  PackageCheck,
  PenLine,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

/** O que todo componente de bloco recebe. */
export type BlockRenderArgs<P, D = null> = {
  /** Os campos do bloco, já validados pelo schema. */
  props: P;
  /** Qual variação renderizar. Já validada: sempre existe no bloco. */
  variant: string;
  /** A loja desta requisição. Nunca vem do navegador. */
  tenantId: string;
  /** O que o `load()` do bloco buscou, ou `null` se o bloco não tem `load`. */
  data: D;
};

export type BlockComponent<P, D = null> = (
  args: BlockRenderArgs<P, D>
) => ReactNode | Promise<ReactNode>;

/** Nome do ícone (texto) -> componente. Só aqui, no servidor. */
const ICONS: Record<string, LucideIcon> = {
  PenLine,
  ShieldCheck,
  Truck,
  Headset,
  Gift,
  Clock,
  Heart,
  Star,
  Sparkles,
  MapPin,
  CreditCard,
  PackageCheck,
};

export function iconByName(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}

/**
 * A largura e o respiro padrão de uma seção da loja — os mesmos valores que as
 * seções de hoje usam (`max-w-7xl`, `px-4 sm:px-6 lg:px-8`). Existe para que
 * bloco novo não invente margem própria e a página não fique com degraus.
 */
export const SECTION_SHELL = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";
