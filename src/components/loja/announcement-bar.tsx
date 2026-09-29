import Link from "next/link";
import type { StoreContent } from "@/modules/content/types";

/**
 * Barra de aviso no topo da loja (frete grátis, feriado, promoção...). É a
 * ÚNICA coisa que mora nessa faixa: desligada ou sem texto, não renderiza nada
 * (nenhuma faixa vazia). Fica fora do <header> sticky de propósito -- rola
 * junto com a página em vez de comer altura da tela do celular o tempo todo.
 *
 * Cores: as da loja por padrão; o dono pode trocar no painel (CMS). A cor
 * personalizada entra por `style` (a cor é um valor livre, não uma classe).
 */
export function AnnouncementBar({ announcement }: { announcement: StoreContent["announcement"] }) {
  const text = announcement.text.trim();
  if (!announcement.enabled || !text) return null;

  const href = announcement.href?.trim() || "";
  const isExternal = /^https:\/\//i.test(href);

  const content = (
    <span className="mx-auto block max-w-[1800px] px-4 py-2 text-center text-[13px] font-medium leading-snug sm:px-6 lg:px-8 2xl:px-12">
      {text}
    </span>
  );

  return (
    <div
      role="region"
      aria-label="Aviso da loja"
      className="bg-primary text-primary-foreground"
      style={{
        backgroundColor: announcement.bgColor,
        color: announcement.textColor,
      }}
    >
      {href ? (
        isExternal ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:underline">
            {content}
          </a>
        ) : (
          <Link href={href} className="block hover:underline">
            {content}
          </Link>
        )
      ) : (
        content
      )}
    </div>
  );
}
