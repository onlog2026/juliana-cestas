import "server-only";
import { getAllProducts } from "@/modules/catalog/service";
import { getActiveCategories } from "@/modules/catalog/categories";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { getTenantId } from "@/lib/tenant/context";
import { formatCnpj } from "@/modules/seo/schema";
import { isPublicCategory } from "@/modules/seo/public-category";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://juliana-cestas-loja.vercel.app").replace(/\/$/, "");

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Texto para assistentes de IA (llms.txt / llms-full.txt), montado do banco a
 * cada geração: preço ou cesta nova nunca fica velho como no arquivo fixo.
 */
export async function buildLlmsText(full: boolean): Promise<string> {
  const tenantId = await getTenantId();
  const [products, categories, profile] = await Promise.all([
    getAllProducts(tenantId),
    getActiveCategories(tenantId),
    getStoreProfile(tenantId),
  ]);
  const name = profile.businessName?.trim() || "Loja";
  const cnpj = formatCnpj(profile.document);
  const cats = categories.filter(isPublicCategory);

  const lines: string[] = [];
  lines.push(`# ${name}`, "");
  lines.push(
    `> Cestas de café da manhã e presentes feitos à mão em Brasília, DF, com entrega no mesmo dia e cartão de mensagem personalizado.`,
    ""
  );

  lines.push("## Cestas", "");
  for (const p of products) {
    const parts = [p.serves, brl.format(p.price)].filter(Boolean).join(", ");
    const desc = (p.shortDescription || "").trim();
    lines.push(`- [${p.name}](${SITE_URL}/produto/${p.slug}): ${parts}${desc ? ` — ${desc}` : ""}`);
  }
  lines.push("");

  lines.push("## Categorias", "");
  for (const c of cats) lines.push(`- [${c.name}](${SITE_URL}/categoria/${c.slug})`);
  lines.push("");

  lines.push("## Páginas", "");
  lines.push(
    `- [Sobre](${SITE_URL}/sobre)`,
    `- [Perguntas frequentes](${SITE_URL}/faq)`,
    `- [Atendimento](${SITE_URL}/atendimento)`,
    `- [Trocas e devoluções](${SITE_URL}/trocas-e-devolucoes)`,
    `- [Avaliações de clientes](${SITE_URL}/avaliacoes)`,
    ""
  );

  if (full) {
    lines.push("## O que vem em cada cesta", "");
    for (const p of products) {
      const items = (p.items ?? []).filter(Boolean);
      lines.push(`### ${p.name}`);
      lines.push(`Preço: ${brl.format(p.price)}.${p.serves ? ` ${p.serves}.` : ""}`);
      if (items.length) lines.push(`Itens: ${items.join("; ")}.`);
      if (p.packaging) lines.push(`Embalagem: ${p.packaging}.`);
      if (p.description) lines.push("", p.description.trim());
      lines.push("");
    }
    lines.push("## Contato e empresa", "");
    if (profile.phone) lines.push(`- WhatsApp/telefone: ${profile.phone}`);
    if (profile.email) lines.push(`- E-mail: ${profile.email}`);
    if (cnpj) lines.push(`- CNPJ: ${cnpj}`);
    const addr = [profile.street, profile.addressNumber, profile.neighborhood, profile.city, profile.state]
      .filter(Boolean)
      .join(", ");
    if (addr) lines.push(`- Endereço: ${addr}`);
    lines.push("");
  }

  return lines.join("\n");
}

export const LLMS_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};
