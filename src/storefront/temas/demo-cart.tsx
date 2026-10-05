"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Carrinho da LOJA DE DEMONSTRAÇÃO. Fica só no navegador (localStorage, chave própria
 * por modelo) e NUNCA chega ao checkout real: a demo não cobra nada. É separado do
 * carrinho da loja de verdade de propósito.
 */
export type ItemDemo = { slug: string; nome: string; preco: number; foto: string; qtd: number };

type Ctx = {
  itens: ItemDemo[];
  total: number;
  quantidade: number;
  adicionar: (i: Omit<ItemDemo, "qtd">) => void;
  mudar: (slug: string, delta: number) => void;
  remover: (slug: string) => void;
  limpar: () => void;
};

const CartCtx = createContext<Ctx | null>(null);

export function DemoCartProvider({ chave, children }: { chave: string; children: ReactNode }) {
  const [itens, setItens] = useState<ItemDemo[]>([]);
  const storageKey = `jc-demo-cart:${chave}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const v: unknown = JSON.parse(raw);
        if (Array.isArray(v)) setItens(v.filter((x): x is ItemDemo => x && typeof x.slug === "string" && typeof x.qtd === "number").slice(0, 30));
      }
    } catch {
      /* sem storage: carrinho só desta página */
    }
  }, [storageKey]);

  const salvar = useCallback(
    (prox: ItemDemo[]) => {
      setItens(prox);
      try {
        localStorage.setItem(storageKey, JSON.stringify(prox));
      } catch {
        /* ignora */
      }
    },
    [storageKey]
  );

  const value = useMemo<Ctx>(
    () => ({
      itens,
      total: itens.reduce((s, i) => s + i.preco * i.qtd, 0),
      quantidade: itens.reduce((s, i) => s + i.qtd, 0),
      adicionar: (i) => {
        const ja = itens.find((x) => x.slug === i.slug);
        salvar(ja ? itens.map((x) => (x.slug === i.slug ? { ...x, qtd: Math.min(x.qtd + 1, 20) } : x)) : [...itens, { ...i, qtd: 1 }]);
      },
      mudar: (slug, delta) =>
        salvar(itens.map((x) => (x.slug === slug ? { ...x, qtd: Math.max(1, Math.min(20, x.qtd + delta)) } : x))),
      remover: (slug) => salvar(itens.filter((x) => x.slug !== slug)),
      limpar: () => salvar([]),
    }),
    [itens, salvar]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

/**
 * Carrinho vazio e inerte, devolvido quando NÃO há <DemoCartProvider>. A loja ao vivo não tem esse
 * provedor (ela usa o carrinho real), e os modelos usam estes hooks em componentes que também
 * rodam ao vivo: lançar erro aqui derrubaria a página inteira. Sem provedor, nada é adicionado.
 */
const SEM_CARRINHO: Ctx = {
  itens: [],
  total: 0,
  quantidade: 0,
  adicionar: () => {},
  mudar: () => {},
  remover: () => {},
  limpar: () => {},
};

export function useDemoCart(): Ctx {
  return useContext(CartCtx) ?? SEM_CARRINHO;
}

/** Como useDemoCart, mas devolve null fora do provider. */
export function useDemoCartOptional(): Ctx | null {
  return useContext(CartCtx);
}
