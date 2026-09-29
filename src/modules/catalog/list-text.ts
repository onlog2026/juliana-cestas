/**
 * "O que vem na cesta" e "Embalagem": o dono cola tudo junto, separado por vírgula,
 * ponto e vírgula OU quebra de linha, e cada pedaço vira um item. Lógica PURA
 * (sem banco, sem React), usada ao salvar (formulário e servidor) e ao exibir.
 */

export const MAX_LIST_ITEMS = 40;
export const MAX_LIST_ITEM_LENGTH = 80;

/** Divide por `,` `;` ou linha; tira espaços, vazios e repetidos (sem diferenciar maiúsculas). */
export function splitListText(text: string | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of (text ?? "").split(/[\n\r;,]+/)) {
    const item = raw.replace(/\s+/g, " ").trim().slice(0, MAX_LIST_ITEM_LENGTH);
    if (!item) continue;
    const key = item.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
    if (out.length >= MAX_LIST_ITEMS) break;
  }
  return out;
}

/** Lista já pronta -> texto para o campo do painel (um item por linha, fácil de ler). */
export function joinListText(items: string[]): string {
  return items.join("\n");
}

/**
 * Foto principal só movendo: troca a capa com a foto extra `index`.
 * Devolve novas capa e extras (nunca muta os originais). Índice inválido = igual.
 */
export function promoteToCover(cover: string, extras: string[], index: number): { cover: string; extras: string[] } {
  if (index < 0 || index >= extras.length) return { cover, extras };
  const next = [...extras];
  const promoted = next[index];
  // A capa antiga ocupa o lugar da foto promovida (a ordem das outras não muda).
  next[index] = cover;
  return { cover: promoted, extras: next.filter(Boolean) };
}

/** Move uma foto extra uma posição para esquerda (-1) ou direita (+1). */
export function moveExtra(extras: string[], index: number, dir: -1 | 1): string[] {
  const target = index + dir;
  if (index < 0 || index >= extras.length || target < 0 || target >= extras.length) return extras;
  const next = [...extras];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
