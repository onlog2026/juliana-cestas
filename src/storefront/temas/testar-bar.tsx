"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { key: string; nome: string; cor: string };

/**
 * Barra fixa da loja de DEMONSTRAÇÃO (computador e celular): troca a variação sem sair
 * da página em que a pessoa está e leva ao "Testar na minha loja".
 */
export function TestarBar({ modelo, nomeModelo, variante, variacoes }: { modelo: string; nomeModelo: string; variante: string; variacoes: Item[] }) {
  const pathname = usePathname() || "";
  const prefixo = `/demo/${modelo}/${variante}`;
  const resto = pathname.startsWith(prefixo) ? pathname.slice(prefixo.length) : "";
  return (
    <div
      role="region"
      aria-label="Barra da loja de demonstração"
      className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-5"
      style={{ background: "#0f1b2d", color: "#fff", fontFamily: "system-ui, sans-serif" }}
    >
      <Link href={`/modelos/${modelo}`} className="flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium opacity-90">
        <span aria-hidden="true">←</span>
        <span className="hidden sm:inline">Modelos</span>
      </Link>
      <p className="hidden shrink-0 text-sm font-semibold md:block">{nomeModelo}</p>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Variações do modelo">
        {variacoes.map((v) => (
          <Link
            key={v.key}
            href={`/demo/${modelo}/${v.key}${resto}`}
            aria-current={v.key === variante}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm whitespace-nowrap"
            style={{ borderColor: v.key === variante ? "#fff" : "rgba(255,255,255,.3)", background: v.key === variante ? "rgba(255,255,255,.14)" : "transparent" }}
          >
            <span className="size-3 rounded-full" style={{ background: v.cor, boxShadow: "0 0 0 1px rgba(255,255,255,.6)" }} aria-hidden="true" />
            {v.nome}
          </Link>
        ))}
      </div>
      <a href={`/modelos/testar?modelo=${modelo}&variante=${variante}`} className="flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold sm:px-4" style={{ background: "#ffb800", color: "#141414" }}>
        <span className="sm:hidden">Testar</span>
        <span className="hidden sm:inline">Testar na minha loja</span>
      </a>
    </div>
  );
}
