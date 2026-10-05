import { LEGACY_TENANT_ID } from "@/lib/tenant/legacy";

/**
 * Textos que antes estavam fixos no código com a cara da loja original (café da manhã, Brasília).
 * A loja original mantém EXATAMENTE as frases de sempre; toda outra loja recebe a versão neutra,
 * montada com a cidade/UF do próprio perfil. Nenhuma loja herda o texto da outra.
 */
export type PerfilLocal = { city?: string | null; state?: string | null };

const clean = (v: string | null | undefined) => (v ?? "").trim();

function onde(p: PerfilLocal): string {
  const cidade = clean(p.city);
  const uf = clean(p.state);
  if (!cidade) return "";
  return uf ? `${cidade}, ${uf}` : cidade;
}

export const ehLojaOriginal = (tenantId: string) => tenantId === LEGACY_TENANT_ID;

/** Frase de abertura do llms.txt. */
export function fraseLlms(tenantId: string, perfil: PerfilLocal): string {
  if (ehLojaOriginal(tenantId)) {
    return "Cestas de café da manhã e presentes feitos à mão em Brasília, DF, com entrega no mesmo dia e cartão de mensagem personalizado.";
  }
  const local = onde(perfil);
  return `Cestas e presentes feitos à mão${local ? ` em ${local}` : ""}, com entrega em data e horário combinados e cartão de mensagem personalizado.`;
}

/** Descrição do site quando o SEO da loja veio vazio. */
export function descricaoSiteReserva(tenantId: string, perfil: PerfilLocal, nomeLoja: string): string {
  if (ehLojaOriginal(tenantId)) {
    return nomeLoja
      ? `${nomeLoja} — cestas de café da manhã, presentes e kits comemorativos feitos à mão com carinho, com entrega em Brasília.`
      : "Cestas de café da manhã, presentes e kits comemorativos feitos à mão com carinho, com entrega em Brasília.";
  }
  const local = onde(perfil);
  const base = `cestas e presentes feitos à mão com carinho${local ? `, com entrega em ${local}` : ""}.`;
  return nomeLoja ? `${nomeLoja} — ${base}` : base.charAt(0).toUpperCase() + base.slice(1);
}

/** Título do site quando o SEO da loja veio vazio e não há nome cadastrado. */
export function tituloSiteReserva(tenantId: string): string {
  return ehLojaOriginal(tenantId) ? "Cestas de café da manhã e presentes" : "Cestas e presentes";
}

/** Descrição da página de categoria quando o SEO da categoria veio vazio. */
export function descricaoCategoriaReserva(tenantId: string, perfil: PerfilLocal, nomeCategoria: string): string {
  if (ehLojaOriginal(tenantId)) {
    return `${nomeCategoria}: cestas de café da manhã e presentes feitos à mão em Brasília, com entrega no mesmo dia e cartão personalizado. Escolha a sua.`;
  }
  const local = onde(perfil);
  return `${nomeCategoria}: cestas e presentes feitos à mão${local ? ` em ${local}` : ""}, com cartão personalizado. Escolha a sua.`;
}

/** Descrição da página do produto quando o SEO do produto veio vazio. */
export function descricaoProdutoReserva(
  tenantId: string,
  perfil: PerfilLocal,
  p: { nome: string; serves?: string | null; precoFormatado: string }
): string {
  const para = p.serves ? `${p.serves.charAt(0).toLowerCase()}${p.serves.slice(1)}, ` : "";
  if (ehLojaOriginal(tenantId)) {
    return `${p.nome}: cesta ${para}feita à mão em Brasília, com entrega no mesmo dia e cartão personalizado. ${p.precoFormatado}.`;
  }
  const local = onde(perfil);
  return `${p.nome}: cesta ${para}feita à mão${local ? ` em ${local}` : ""}, com cartão personalizado. ${p.precoFormatado}.`;
}

/** Frase do rodapé da loja ("quem somos" curto). */
export function fraseRodape(tenantId: string, perfil: PerfilLocal): string {
  if (ehLojaOriginal(tenantId)) return "Cestas de café da manhã e presentes afetivos, feitos e entregues em Brasília.";
  const local = onde(perfil);
  return `Cestas e presentes afetivos, feitos e entregues${local ? ` em ${local}` : " com carinho"}.`;
}

/** Texto final do rodapé ("© Loja · CNPJ …"): cidade/UF; a loja original mantém "Brasília, DF.". */
export function localRodape(tenantId: string, perfil: PerfilLocal): string {
  if (ehLojaOriginal(tenantId)) return " Brasília, DF.";
  const local = onde(perfil);
  return local ? ` ${local}.` : "";
}

/** H1 invisível da home (leitores de tela e Google). */
export function fraseH1Home(tenantId: string, nomeLoja: string): string {
  return ehLojaOriginal(tenantId)
    ? `${nomeLoja} — cestas de café da manhã, presentes e kits comemorativos feitos à mão`
    : `${nomeLoja} — cestas e presentes feitos à mão`;
}

/** Nome da loja quando o perfil ainda não tem nome cadastrado. */
export function nomeLojaReserva(tenantId: string): string {
  return ehLojaOriginal(tenantId) ? "Cestas de café da manhã" : "Loja";
}

/** Texto neutro do "Entrega hoje" antes de calcular no navegador. */
export function entregaNeutra(tenantId: string, perfil: PerfilLocal): string {
  if (ehLojaOriginal(tenantId)) return "Entrega em Brasília";
  const cidade = clean(perfil.city);
  return cidade ? `Entrega em ${cidade}` : "Entrega com data e horário marcados";
}

/** Frase de produtos nos Termos de Uso. */
export function fraseProdutosTermos(tenantId: string): string {
  return ehLojaOriginal(tenantId)
    ? "Trabalhamos com cestas de café da manhã, presentes e kits comemorativos, com opções de"
    : "Trabalhamos com cestas, presentes e kits, com opções de";
}
