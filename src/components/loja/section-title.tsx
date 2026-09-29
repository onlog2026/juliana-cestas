import type { ElementType } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Título de seção da loja com ícone profissional (lucide) num círculo suave. Um só
 * componente para checkout, carrinho e conta: mesmo tamanho, mesmo traço, mesma cor
 * (padronização em vez de estilo por tela). Sem hooks: serve em componentes de
 * servidor e de cliente.
 */
export function SectionTitle({
  icon: Icon,
  as: Tag = "h2",
  size = "xl",
  children,
}: {
  icon: LucideIcon;
  as?: ElementType;
  size?: "lg" | "xl";
  children: React.ReactNode;
}) {
  return (
    <Tag className={`flex items-center gap-2.5 font-display text-foreground ${size === "xl" ? "text-xl" : "text-lg"}`}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.7} />
      </span>
      <span className="min-w-0">{children}</span>
    </Tag>
  );
}
