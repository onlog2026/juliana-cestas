/**
 * O PLANO DA TROCA DE MODELO — cálculo puro, sem banco.
 *
 * Toda a decisão de "o que vai ficar gravado depois de trocar de modelo" mora
 * aqui, em funções que só recebem e devolvem objetos. O serviço
 * (`src/modules/storefront/service.ts`) fica sendo apenas o braço que grava o
 * que estas funções decidiram.
 *
 * Foi feito assim por um motivo prático: a promessa mais delicada desta
 * entrega é "trocar de modelo NÃO perde o seu conteúdo". Promessa desse
 * tamanho precisa de teste, e teste que depende de banco não roda no
 * `npm test`. Com o cálculo separado, o teste é uma chamada de função —
 * está em `tests/unit/storefront.test.ts`.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * O QUE A TROCA DE MODELO NUNCA TOCA
 *
 *   produtos, pedidos, clientes, cupons, entregas, banners, fotos e os textos
 *   de `site_content`.
 *
 * Isso não é uma promessa de comentário: é consequência do desenho. Estas
 * funções só sabem escrever em `store_theme` e `store_pages`. Não existe
 * caminho daqui para nenhuma outra tabela — e o teste unitário confere que o
 * serviço também não abre um.
 */
import { getBlockSpec, normalizeSection, type Section } from "@/storefront/blocks/schemas";
import { getTemplate, type TemplateKey } from "@/storefront/templates/index";
import type { StoreLayout } from "@/storefront/templates/types";
import { sanitizeFonts, sanitizeTokens, type ThemeFonts, type ThemeTokens } from "@/storefront/theme";

/** Uma página como ela fica gravada em `store_pages`. */
export type PlannedPage = {
  path: string;
  title: string;
  sections: Section[];
  published: boolean;
  seo: { title?: string; description?: string };
};

/** O tema como ele fica gravado em `store_theme`. */
export type PlannedTheme = {
  templateKey: TemplateKey;
  tokens: ThemeTokens;
  fonts: ThemeFonts;
  layout: StoreLayout;
};

export type MaterializationPlan = {
  theme: PlannedTheme;
  pages: PlannedPage[];
};

/**
 * As ÚNICAS tabelas que a materialização e a troca podem escrever.
 * `tests/unit/storefront.test.ts` lê o serviço e falha se aparecer outra.
 */
export const TABELAS_QUE_A_TROCA_ESCREVE = ["store_theme", "store_pages", "store_pages_history"] as const;

/**
 * Copia o modelo para o formato de gravação.
 *
 * A lojista edita a CÓPIA, nunca o modelo. Por isso tudo aqui passa por
 * `structuredClone`: se a cópia apontasse para os mesmos objetos do modelo,
 * a primeira edição de uma loja mudaria o modelo para todas as outras.
 *
 * `published: false` de propósito — materializar não publica. Quem publica é
 * uma decisão separada, e enquanto a composição não estiver publicada a loja
 * continua sendo servida pelo caminho antigo.
 */
export function planMaterialization(key: TemplateKey): MaterializationPlan {
  const template = getTemplate(key);
  if (!template) {
    throw new Error(`Modelo desconhecido: ${key}`);
  }

  const pages: PlannedPage[] = Object.entries(template.pages).map(([path, page]) => ({
    path,
    title: page.title,
    sections: page.sections
      .map((s) => normalizeSection(structuredClone(s)))
      .filter((s): s is Section => s !== null),
    published: false,
    seo: page.seo ? { ...page.seo } : {},
  }));

  return {
    theme: {
      templateKey: template.key,
      tokens: sanitizeTokens(structuredClone(template.theme)),
      fonts: sanitizeFonts(template.fonts),
      layout: structuredClone(template.layout),
    },
    pages,
  };
}

/**
 * Passa o que a lojista já tinha ajustado para as seções do modelo novo.
 *
 * A regra é por TIPO DE BLOCO, não por posição: se o modelo antigo tinha uma
 * grade de produtos com o título "Nossas favoritas" e o modelo novo também tem
 * uma grade de produtos, o título vai junto — mesmo que a grade tenha mudado de
 * lugar na página e de variação (de "featured" para "dense").
 *
 * Campo por campo, e só quando o campo continua válido no modelo novo. Se o
 * bloco novo não tem aquele campo (ou o valor antigo não serve para ele), o
 * padrão do modelo novo prevalece — nunca uma página quebrada.
 *
 * Só TEXTO E LISTA são conteúdo da lojista (título, subtítulo, itens escritos
 * à mão). Número e verdadeiro/falso são CONFIGURAÇÃO DA VARIAÇÃO -- "mostrar
 * filtro" ou "quantos produtos mostrar" são decisão de design de cada
 * variação, não algo que a lojista escreveu. Por isso eles NUNCA são copiados
 * do modelo antigo: ficam sempre com o valor que a variação nova já traz.
 * Sem essa distinção, trocar para uma variação com filtro embutido no design
 * ("grade densa") herdaria "sem filtro" da variação antiga e o filtro
 * simplesmente não apareceria, mesmo a variação nova tendo sido feita para
 * mostrá-lo.
 *

 * O TEXTO das seções ligadas ao CMS (benefícios, perguntas, cartãozinho,
 * chamada do WhatsApp, seleção especial, título das categorias) nem passa por
 * aqui: ele mora em `site_content` e a troca de modelo não encosta nessa
 * tabela. É por isso que trocar de modelo não pode perder texto.
 */
export function relinkSections(novas: Section[], antigas: Section[]): Section[] {
  // Fila por tipo: se o modelo antigo tinha duas grades de produto e o novo
  // também, a primeira casa com a primeira e a segunda com a segunda.
  const filaPorTipo = new Map<string, Section[]>();
  for (const antiga of antigas) {
    const fila = filaPorTipo.get(antiga.type);
    if (fila) fila.push(antiga);
    else filaPorTipo.set(antiga.type, [antiga]);
  }

  return novas.map((nova) => {
    const fila = filaPorTipo.get(nova.type);
    const antiga = fila && fila.length > 0 ? fila.shift() : undefined;
    if (!antiga) return { ...nova, props: { ...nova.props } };

    const spec = getBlockSpec(nova.type);
    if (!spec) return { ...nova, props: { ...nova.props } };

    let props: Record<string, unknown> = { ...nova.props };
    for (const campo of Object.keys(nova.props)) {
      if (!(campo in antiga.props)) continue;
      // Número e verdadeiro/falso são configuração da variação nova, não
      // conteúdo da lojista -- nunca herdam da variação antiga (ver o
      // comentário do porquê no topo desta função).
      const valorNaVariacaoNova = (nova.props as Record<string, unknown>)[campo];
      if (typeof valorNaVariacaoNova === "boolean" || typeof valorNaVariacaoNova === "number") continue;
      const tentativa = { ...props, [campo]: antiga.props[campo] };
      if (spec.schema.safeParse(tentativa).success) props = tentativa;
    }

    return { id: nova.id, type: nova.type, variant: nova.variant, props };
  });
}

/**
 * O plano completo da troca: modelo novo + o que a lojista já tinha ajustado.
 *
 * `atuais` são as páginas gravadas hoje (vindas de `store_pages`). Se a loja
 * ainda não tem página gravada nenhuma, isto é igual a materializar do zero.
 *
 * `published` é preservado por caminho: se a home já estava publicada na
 * composição nova, ela continua publicada depois da troca; se não estava,
 * continua não estando. Trocar de modelo nunca liga uma chave que estava
 * desligada.
 */
export function planSwitch(key: TemplateKey, atuais: readonly PlannedPage[]): MaterializationPlan {
  const plano = planMaterialization(key);
  const porCaminho = new Map(atuais.map((p) => [p.path, p]));

  const pages = plano.pages.map((nova) => {
    const antiga = porCaminho.get(nova.path);
    if (!antiga) return nova;

    return {
      ...nova,
      sections: relinkSections(nova.sections, antiga.sections),
      published: antiga.published,
      seo: { ...nova.seo, ...antiga.seo },
    };
  });

  return { theme: plano.theme, pages };
}
