import type { ComponentType } from "react";
import { CarrinhoBoutique, CategoriaBoutique, ProdutoBoutique } from "./boutique";
import { CarrinhoClassica, CategoriaClassica, ProdutoClassica } from "./classica";
import { CarrinhoFesta, CategoriaFesta, ProdutoFesta } from "./festa";
import { CarrinhoMercado, CategoriaMercado, ProdutoMercado } from "./mercado";
import { CarrinhoNoir, CategoriaNoir, ProdutoNoir } from "./noir";
import { CarrinhoRustico, CategoriaRustico, ProdutoRustico } from "./rustico";
import { NOVOS_INTERNAS } from "../novos";
import type { DadosLoja, TemaKey } from "../types";

type Pagina = ComponentType<{ d: DadosLoja }>;
type PaginaSlug = ComponentType<{ d: DadosLoja; slug?: string }>;
type PaginaProduto = ComponentType<{ d: DadosLoja; slug: string }>;

/** Modelo → páginas internas PRÓPRIAS (categoria, cesta, carrinho): cada esqueleto desenha as suas. */
export const INTERNAS: Record<TemaKey, { Categoria: PaginaSlug; Produto: PaginaProduto; Carrinho: Pagina }> = {
  ...NOVOS_INTERNAS,
  classica: { Categoria: CategoriaClassica, Produto: ProdutoClassica, Carrinho: CarrinhoClassica },
  boutique: { Categoria: CategoriaBoutique, Produto: ProdutoBoutique, Carrinho: CarrinhoBoutique },
  mercado: { Categoria: CategoriaMercado, Produto: ProdutoMercado, Carrinho: CarrinhoMercado },
  festa: { Categoria: CategoriaFesta, Produto: ProdutoFesta, Carrinho: CarrinhoFesta },
  noir: { Categoria: CategoriaNoir, Produto: ProdutoNoir, Carrinho: CarrinhoNoir },
  rustico: { Categoria: CategoriaRustico, Produto: ProdutoRustico, Carrinho: CarrinhoRustico },
};
