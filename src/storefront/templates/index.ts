/**
 * OS MODELOS DISPONÍVEIS.
 *
 * Só dado puro (nenhum import de banco, nenhum componente React), para que
 * este arquivo possa ser lido pelo painel, pelo serviço que grava e pelos
 * testes unitários sem nenhum efeito colateral — mesma disciplina do
 * `src/lib/modules/registry.ts`.
 */
import { classica } from "@/storefront/templates/classica";
import { editorial } from "@/storefront/templates/editorial";
import { catalogo } from "@/storefront/templates/catalogo";
import type { TemplateDefinition, TemplateKey } from "@/storefront/templates/types";

export type { TemplateDefinition, TemplateKey, TemplatePage, StoreLayout } from "@/storefront/templates/types";

/** O modelo da loja que já está no ar. Nunca mude este valor sem avisar. */
export const DEFAULT_TEMPLATE_KEY: TemplateKey = "classica";

export const TEMPLATES: readonly TemplateDefinition[] = [classica, editorial, catalogo];

const POR_CHAVE = new Map<string, TemplateDefinition>(TEMPLATES.map((t) => [t.key, t]));

export function isTemplateKey(value: unknown): value is TemplateKey {
  return typeof value === "string" && POR_CHAVE.has(value);
}

export function getTemplate(key: string): TemplateDefinition | null {
  return POR_CHAVE.get(key) ?? null;
}

/**
 * O modelo, ou a Clássica se a chave for desconhecida.
 *
 * Cair na Clássica é de propósito: se um dia o banco guardar uma chave que o
 * código não conhece mais (modelo removido, erro de digitação), a loja continua
 * de pé com a composição que já existe, em vez de mostrar página em branco.
 */
export function getTemplateOrDefault(key: unknown): TemplateDefinition {
  return (typeof key === "string" ? POR_CHAVE.get(key) : undefined) ?? classica;
}
