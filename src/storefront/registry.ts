/**
 * O REGISTRO DE BLOCOS — onde a descrição encontra o componente.
 *
 * Um bloco é: `{ type, variants[], schema, defaults, load?, Component,
 * requiresModule? }`. A metade de dado vem de `blocks/schemas.ts` (pura, sem
 * React e sem banco); a metade de tela vem dos arquivos `blocks/*.tsx`. Este
 * arquivo só junta as duas.
 *
 * ORDEM DE IMPORTAÇÃO IMPORTA: quem importar este arquivo importa junto todos
 * os componentes e, com eles, `server-only` e as consultas ao banco. Por isso
 * o painel e os testes usam `blocks/schemas.ts` diretamente — só o
 * renderizador precisa deste registro.
 *
 * NUNCA importe este arquivo de um componente com `"use client"`. `Component`
 * e `load` são funções; passar função de servidor para cliente derruba a
 * página em produção mesmo passando no build.
 */
import type { ReactNode } from "react";
import type { BlockRenderArgs } from "@/storefront/blocks/kit";
import {
  BLOCK_SPECS,
  benefitsBlock,
  categoryGridBlock,
  collectionSpotlightBlock,
  ctaWhatsappBlock,
  faqBlock,
  galleryBlock,
  heroBlock,
  newsletterBlock,
  productGridBlock,
  promoBarBlock,
  richTextBlock,
  signatureBlock,
  stepsBlock,
  testimonialsBlock,
  type BlockSpec,
} from "@/storefront/blocks/schemas";
import {
  CategoryGridBlock,
  HeroBlock,
  ProductGridBlock,
  loadCategoryGrid,
  loadHero,
  loadProductGrid,
} from "@/storefront/blocks/showcase";
import {
  CollectionSpotlightBlock,
  GalleryBlock,
  RichTextBlock,
  SignatureBlock,
  StepsBlock,
  TestimonialsBlock,
  loadSignature,
} from "@/storefront/blocks/story";
import {
  BenefitsBlock,
  CtaWhatsappBlock,
  FaqBlock,
  NewsletterBlock,
  PromoBarBlock,
  loadBenefits,
} from "@/storefront/blocks/support";

/**
 * Um bloco registrado, com o formato das props "apagado".
 *
 * Os blocos têm props de formatos diferentes, e um mapa só não consegue
 * guardar todos mantendo o tipo de cada um. A solução é apagar o tipo na
 * entrada do mapa e restaurá-lo na hora de usar — o que é seguro porque o
 * renderizador SEMPRE valida as props com `schema` antes de chamar
 * `Component`. Toda a conversão insegura está confinada em `defineBlock`.
 */
export type RegisteredBlock = BlockSpec<unknown> & {
  load?: (tenantId: string, props: unknown) => Promise<unknown>;
  Component: (args: BlockRenderArgs<unknown, unknown>) => ReactNode | Promise<ReactNode>;
};

function defineBlock<P, D = null>(
  spec: BlockSpec<P>,
  Component: (args: BlockRenderArgs<P, D>) => ReactNode | Promise<ReactNode>,
  load?: (tenantId: string, props: P) => Promise<D>
): RegisteredBlock {
  return { ...spec, Component, load } as unknown as RegisteredBlock;
}

export const BLOCKS: readonly RegisteredBlock[] = [
  defineBlock(heroBlock, HeroBlock, (tenantId) => loadHero(tenantId)),
  defineBlock(categoryGridBlock, CategoryGridBlock, loadCategoryGrid),
  defineBlock(productGridBlock, ProductGridBlock, loadProductGrid),
  defineBlock(signatureBlock, SignatureBlock, loadSignature),
  defineBlock(collectionSpotlightBlock, CollectionSpotlightBlock),
  defineBlock(benefitsBlock, BenefitsBlock, (tenantId) => loadBenefits(tenantId)),
  defineBlock(faqBlock, FaqBlock),
  defineBlock(ctaWhatsappBlock, CtaWhatsappBlock),
  defineBlock(richTextBlock, RichTextBlock),
  defineBlock(testimonialsBlock, TestimonialsBlock),
  defineBlock(galleryBlock, GalleryBlock),
  defineBlock(promoBarBlock, PromoBarBlock),
  defineBlock(stepsBlock, StepsBlock),
  defineBlock(newsletterBlock, NewsletterBlock),
];

const POR_TIPO = new Map<string, RegisteredBlock>(BLOCKS.map((b) => [b.type, b]));

export function getBlock(type: string): RegisteredBlock | null {
  return POR_TIPO.get(type) ?? null;
}

/**
 * Rede de proteção: todo bloco descrito em `schemas.ts` tem que ter componente
 * aqui. Um bloco descrito e não registrado vira uma seção que some da página
 * sem ninguém entender por quê — o tipo de erro que só aparece em produção.
 * `tests/unit/storefront.test.ts` chama esta lista e falha se sobrar alguém.
 */
export function blocosSemComponente(): string[] {
  return BLOCK_SPECS.filter((spec) => !POR_TIPO.has(spec.type)).map((spec) => spec.type);
}
