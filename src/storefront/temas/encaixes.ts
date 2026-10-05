import type { ComponentType, ReactNode } from "react";
import type { DadosLoja, ProdutoLoja } from "./types";

/**
 * CONTRATO DOS ENCAIXES: o que os modelos passam a aceitar para mostrar, no lugar certo
 * do SEU layout, os recursos REAIS da loja (compra, entrega, avaliações etc.).
 * O modelo decide a posição e a moldura de cada encaixe; a lógica é uma só (blocos/ e ao-vivo/).
 * Ausente = o modelo desenha o que já desenhava (demo e prévia continuam como estão).
 * Os encaixes são elementos JÁ renderizados no servidor (nunca funções).
 */

/** Encaixes da página da cesta. */
export type EncaixesProduto = {
  /** Botões reais: "Comprar", "Adicionar ao carrinho" e WhatsApp. Substitui o botão de demonstração. */
  compra?: ReactNode;
  /** "Peça até 14h e receba hoje" (DeliveryToday) — vazio quando a loja não cadastrou horários. */
  entrega?: ReactNode;
  /** Vitrine de avaliações aprovadas (vazia quando não há nenhuma). */
  avaliacoes?: ReactNode;
  /** "Quem comprou esta cesta também levou" (só com co-compra real). */
  quemComprou?: ReactNode;
  /** "Vistos recentemente" (histórico do navegador). */
  vistos?: ReactNode;
  /** Embalagem e cartãozinho personalizado. */
  extras?: ReactNode;
};

/** Encaixes da página de categoria. */
export type EncaixesCategoria = {
  /** Subcategorias (atalhos) para somar aos filtros do modelo. */
  filtrosExtras?: ReactNode;
  /** Fim da página: perguntas frequentes e WhatsApp. */
  rodape?: ReactNode;
};

/** Props que cada modelo passa a aceitar nas páginas internas. */
export type PropsProdutoModelo = { d: DadosLoja; slug: string; encaixes?: EncaixesProduto };
export type PropsCategoriaModelo = { d: DadosLoja; slug?: string; encaixes?: EncaixesCategoria };
/**
 * `Carrinho` recebe `conteudo`: o carrinho/checkout REAL (components/loja/cart/*) já renderizado,
 * que o modelo coloca DENTRO da sua casca (título, espaçamento, cores) no lugar do carrinho de demonstração.
 */
export type PropsCarrinhoModelo = { d: DadosLoja; conteudo?: ReactNode };

/** Cartão de produto do modelo, usado pelos blocos (o modelo desenha; o bloco traz dados e comportamento). */
export type CartaoModelo = ComponentType<{ p: ProdutoLoja }>;
