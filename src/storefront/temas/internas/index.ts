import type { ComponentType } from "react";
import { CarrinhoBoutique, CategoriaBoutique, ProdutoBoutique } from "./boutique";
import { CarrinhoClassica, CategoriaClassica, ProdutoClassica } from "./classica";
import { CarrinhoFesta, CategoriaFesta, ProdutoFesta } from "./festa";
import { CarrinhoMercado, CategoriaMercado, ProdutoMercado } from "./mercado";
import { CarrinhoNoir, CategoriaNoir, ProdutoNoir } from "./noir";
import { CarrinhoRustico, CategoriaRustico, ProdutoRustico } from "./rustico";
import { Cartao as Cartao_classica } from "./classica";
import { Cartao as Cartao_boutique } from "./boutique";
import { Cartao as Cartao_mercado } from "./mercado";
import { Cartao as Cartao_festa } from "./festa";
import { Cartao as Cartao_noir } from "./noir";
import { Cartao as Cartao_rustico } from "./rustico";
import { Cartao as Cartao_galeria } from "../novos/galeria/internas";
import { Cartao as Cartao_promo } from "../novos/promo/internas";
import { Cartao as Cartao_mono } from "../novos/mono/internas";
import { Cartao as Cartao_stories } from "../novos/stories/internas";
import { Cartao as Cartao_panorama } from "../novos/panorama/internas";
import { Cartao as Cartao_simetria } from "../novos/simetria/internas";
import { Cartao as Cartao_bairro } from "../novos/bairro/internas";
import { Cartao as Cartao_revista } from "../novos/revista/internas";
import { Cartao as Cartao_vibrante } from "../novos/vibrante/internas";
import { Cartao as Cartao_aconchego } from "../novos/aconchego/internas";
import { Cartao as Cartao_empresas } from "../novos/empresas/internas";
import { NOVOS_INTERNAS } from "../novos";
import type { CartaoModelo } from "../encaixes";
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

/** Modelo → cartão de produto do modelo (usado pelos blocos e pela cesta da loja ao vivo). */
export const CARTOES: Record<TemaKey, CartaoModelo> = {
  classica: Cartao_classica as CartaoModelo,
  boutique: Cartao_boutique as CartaoModelo,
  mercado: Cartao_mercado as CartaoModelo,
  festa: Cartao_festa as CartaoModelo,
  noir: Cartao_noir as CartaoModelo,
  rustico: Cartao_rustico as CartaoModelo,
  galeria: Cartao_galeria as CartaoModelo,
  promo: Cartao_promo as CartaoModelo,
  mono: Cartao_mono as CartaoModelo,
  stories: Cartao_stories as CartaoModelo,
  panorama: Cartao_panorama as CartaoModelo,
  simetria: Cartao_simetria as CartaoModelo,
  bairro: Cartao_bairro as CartaoModelo,
  revista: Cartao_revista as CartaoModelo,
  vibrante: Cartao_vibrante as CartaoModelo,
  aconchego: Cartao_aconchego as CartaoModelo,
  empresas: Cartao_empresas as CartaoModelo,
};
