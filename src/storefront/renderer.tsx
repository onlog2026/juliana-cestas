/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ESTE RENDERIZADOR ESTÁ PRONTO — E DESLIGADO. LEIA ANTES DE LIGAR.       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * O QUE ELE FAZ
 * Recebe uma lista de seções (o que fica gravado em `store_pages.sections`) e
 * devolve a página montada, bloco por bloco, buscando no banco o que cada
 * bloco precisa.
 *
 * POR QUE NÃO ESTÁ LIGADO
 * A home da Juliana está NO AR, vendendo. Hoje ela é montada por
 * `src/app/(store)/page.tsx`, que é uma página ESTÁTICA (aparece com `○` no
 * `next build`). Trocar quem monta a home é mexer na página que dá dinheiro, e
 * isso não se faz sem duas coisas que ainda não aconteceram:
 *
 *   1. comparação visual lado a lado (a home de hoje x a home montada por
 *      aqui), no computador E no celular, com a home real de produção — não
 *      com o que a gente acha que ela é;
 *   2. a decisão do dono. Ligar ou não ligar é dele, não de quem escreveu
 *      este arquivo.
 *
 * Enquanto isso, esta entrega é um caminho novo, testado, ao lado do caminho
 * antigo, sem nenhuma ponte entre os dois.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * COMO LIGAR, QUANDO FOR A HORA (passo a passo, na ordem)
 *
 * 1. MATERIALIZAR o modelo da loja. Em `/admin/modelos`, escolher "Clássica"
 *    e confirmar. Isso copia a composição de hoje para as tabelas
 *    `store_theme` e `store_pages`, com `published = false` — ainda não muda
 *    nada no site.
 *
 * 2. CONFERIR a cópia. Comparar, seção por seção, a home de produção com a
 *    lista de seções que ficou gravada. A ordem tem que ser: topo, categorias,
 *    mais pedidas, cartãozinho, seleção, benefícios, perguntas, WhatsApp.
 *
 * 3. PUBLICAR a página (`store_pages.published = true`) para a loja de teste
 *    primeiro. Nunca direto na loja da Juliana.
 *
 * 4. TROCAR quem monta a home. Em `src/app/(store)/page.tsx`:
 *
 *      const page = await getPublishedPage(await getTenantId(), "/");
 *      if (!page) return <HomeDeHoje />;   // rede de segurança: sem página
 *      return <SectionsRenderer sections={page.sections} tenantId={...} />;
 *
 *    A rede de segurança do `if` não é decoração: sem ela, um erro de leitura
 *    no banco deixa a loja com a página em branco.
 *
 * 5. ATENÇÃO À GERAÇÃO ESTÁTICA. Hoje a home é estática porque
 *    `getTenantId()` não lê `headers()` enquanto houver uma loja só (ver o
 *    comentário em `src/lib/tenant/context.ts`). Ler `store_pages` no servidor
 *    NÃO tira isso, mas qualquer `cookies()`/`headers()` que entre junto tira.
 *    Depois de ligar, rodar `npm run build` e conferir que `/` continua com
 *    `○`. Se virar `ƒ`, a home passou a ser calculada a cada visita — mais
 *    lenta para o cliente e mais cara para o dono.
 *
 * 6. O TEMA. Para o modelo repintar a loja, o layout precisa injetar o CSS:
 *
 *      const css = themeToCss(theme.tokens, theme.fonts);
 *      {css ? <style>{css}</style> : null}
 *
 *    Uma limitação conhecida, para não descobrir na hora: em
 *    `src/app/globals.css` o bloco é `@theme inline`, e com `inline` o
 *    Tailwind troca `font-display` pelo valor literal `var(--font-young-serif)`
 *    dentro de cada classe. Enquanto for `inline`, a escolha de fonte do
 *    modelo não pega nos títulos. Trocar `@theme inline` por `@theme` resolve
 *    — é uma linha, mas mexe no arquivo de estilo do site inteiro e por isso
 *    exige a mesma comparação visual do item 1.
 *
 * ───────────────────────────────────────────────────────────────────────────
 */
import { Fragment } from "react";
import { normalizeSection, type Section } from "@/storefront/blocks/schemas";
import { getBlock } from "@/storefront/registry";

export type SectionsRendererProps = {
  sections: Section[];
  /** A loja desta requisição. Vem de `getTenantId()`, nunca do navegador. */
  tenantId: string;
  /**
   * Módulos que a loja tem direito de usar. Quando informado, bloco com
   * `requiresModule` fora desta lista simplesmente não aparece.
   *
   * Quando NÃO é informado, tudo aparece. É o padrão certo: a vitrine é
   * pública e não tem sessão para consultar direitos; esconder seção por falta
   * de informação deixaria a loja com buracos sem ninguém entender por quê.
   */
  allowedModules?: readonly string[];
};

/**
 * Monta uma seção. Nunca lança: seção de tipo desconhecido ou props salvas
 * fora do formato viram `null` (a seção some) em vez de derrubar a página
 * inteira. É a mesma escolha que o `getContent()` do CMS já faz.
 */
async function renderSection(
  section: Section,
  tenantId: string,
  allowedModules?: readonly string[]
) {
  const normalizada = normalizeSection(section);
  if (!normalizada) return null;

  const block = getBlock(normalizada.type);
  if (!block) return null;

  if (block.requiresModule && allowedModules && !allowedModules.includes(block.requiresModule)) {
    return null;
  }

  const data = block.load ? await block.load(tenantId, normalizada.props) : null;

  return block.Component({
    props: normalizada.props,
    variant: normalizada.variant,
    tenantId,
    data,
  });
}

/**
 * A página montada.
 *
 * As seções são buscadas EM PARALELO (`Promise.all`): cada bloco faz a própria
 * consulta, e em série a home somaria oito idas ao banco uma depois da outra.
 * A home de hoje já faz assim (cada componente busca o seu), e o `cache()` do
 * React junta as consultas repetidas dentro da mesma requisição.
 */
export async function SectionsRenderer({
  sections,
  tenantId,
  allowedModules,
}: SectionsRendererProps) {
  const renderizadas = await Promise.all(
    sections.map((section) => renderSection(section, tenantId, allowedModules))
  );

  return (
    <>
      {renderizadas.map((node, indice) => (
        <Fragment key={sections[indice]?.id ?? indice}>{node}</Fragment>
      ))}
    </>
  );
}
