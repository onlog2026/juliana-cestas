/**
 * O QUE É UM MODELO DE LOJA.
 *
 * A decisão do dono é explícita: modelo NÃO é troca de cor. Dois modelos
 * diferentes têm PÁGINAS diferentes, com SEÇÕES diferentes, em ORDEM diferente,
 * e com cabeçalho, rodapé e página de produto montados de outro jeito. Se dá
 * para transformar um modelo no outro só mexendo em `theme`, não são dois
 * modelos — é um modelo com duas paletas.
 *
 * Por isso o modelo tem quatro partes, e a cor é só uma delas:
 *   theme   -> os valores das variáveis do globals.css
 *   fonts   -> quais das fontes já carregadas servem texto e título
 *   layout  -> como o cabeçalho, o rodapé e a página de produto se montam
 *   pages   -> quais seções cada caminho tem, e em que ordem
 */
import { z } from "zod";
import type { Section } from "@/storefront/blocks/schemas";
import type { ThemeFonts, ThemeTokens } from "@/storefront/theme";

export const headerLayoutSchema = z.object({
  variant: z.enum(["classic", "centered", "search-first"]),
  /** Acompanha a rolagem. Fundo SEMPRE sólido — ver o comentário de `layoutSchema`. */
  sticky: z.boolean(),
  showSearch: z.boolean(),
  showCategories: z.boolean(),
});

export const footerLayoutSchema = z.object({
  variant: z.enum(["full", "editorial", "compact"]),
  columns: z.number().int().min(1).max(5),
  showSocial: z.boolean(),
});

export const productPageLayoutSchema = z.object({
  variant: z.enum(["gallery-left", "gallery-full", "compact-list"]),
  showUpsells: z.boolean(),
  showRelated: z.boolean(),
  /** Barra de comprar colada embaixo no celular. */
  stickyBuyBar: z.boolean(),
});

/**
 * REGRA DA CASA gravada aqui de propósito: nenhum modelo pode pedir
 * `filter: blur()` em elemento `position: fixed`. Já derrubou a rolagem do
 * celular na loja da Juliana (memória: sorteio_mobile_scroll_performance) e
 * custou dias para achar. Por isso não existe opção de "cabeçalho translúcido"
 * neste formato: cabeçalho que acompanha a rolagem é `sticky` com fundo sólido,
 * ponto. Não dá para configurar o erro.
 */
export const layoutSchema = z.object({
  header: headerLayoutSchema,
  footer: footerLayoutSchema,
  productPage: productPageLayoutSchema,
});

export type StoreLayout = z.infer<typeof layoutSchema>;

/** Uma página do modelo: o caminho é a chave, isto é o conteúdo. */
export type TemplatePage = {
  /** Título da página (aba do navegador e `<h1>` quando a página tem um). */
  title: string;
  sections: Section[];
  seo?: {
    title?: string;
    description?: string;
  };
};

export type TemplateKey = "classica" | "editorial" | "catalogo";

export type TemplateDefinition = {
  key: TemplateKey;
  /** Nome que a lojista lê na galeria. */
  name: string;
  /** Uma frase: para que tipo de loja este modelo serve. */
  description: string;
  /** Para quem este modelo é indicado, em português de gente. */
  indicadoPara: string;
  theme: ThemeTokens;
  fonts: ThemeFonts;
  layout: StoreLayout;
  /** caminho -> página. A home é `"/"`. */
  pages: Record<string, TemplatePage>;
};
