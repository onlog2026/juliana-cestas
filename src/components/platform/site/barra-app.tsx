"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, LayoutGrid, Palette, Tag, Store } from "lucide-react";

/**
 * Barra inferior "de aplicativo" (só no celular/tablet): 5 destinos, o último é o CTA.
 * Respeita a área segura do aparelho (barra de gestos do iPhone). Fundo sólido, sem blur.
 */
const ITENS = [
  { href: "/inicio", rotulo: "Início", Icone: House, raiz: true },
  { href: "/recursos", rotulo: "Recursos", Icone: LayoutGrid, raiz: false },
  { href: "/modelos", rotulo: "Modelos", Icone: Palette, raiz: false },
  { href: "/planos", rotulo: "Preços", Icone: Tag, raiz: false },
] as const;

export function BarraApp() {
  const caminho = usePathname() ?? "";
  const ativo = (href: string, raiz: boolean) =>
    raiz ? caminho === "/" || caminho === "/inicio" : caminho === href || caminho.startsWith(`${href}/`);

  return (
    <nav className="plt-barra-app" aria-label="Atalhos do aplicativo">
      {ITENS.map(({ href, rotulo, Icone, raiz }) => (
        <Link key={href} href={href} className="plt-barra-item" aria-current={ativo(href, raiz) ? "page" : undefined}>
          <Icone aria-hidden="true" />
          <span>{rotulo}</span>
        </Link>
      ))}
      <Link href="/cadastro" className="plt-barra-item plt-barra-cta" aria-current={caminho.startsWith("/cadastro") ? "page" : undefined}>
        <Store aria-hidden="true" />
        <span>Criar loja</span>
      </Link>
    </nav>
  );
}
