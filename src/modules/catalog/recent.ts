/** Histórico de cestas vistas (só o slug, guardado no navegador; sem dado pessoal). */
export const RECENT_KEY = "jc-recent-v1";
export const RECENT_MAX = 12;

/** Põe `slug` no começo, sem repetir, limitado a RECENT_MAX. */
export function pushRecent(list: readonly string[], slug: string): string[] {
  return [slug, ...list.filter((s) => s !== slug)].slice(0, RECENT_MAX);
}

/** Lê o que veio do storage (pode ser lixo) e devolve só textos válidos. */
export function parseRecent(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((s): s is string => typeof s === "string" && s.length > 0 && s.length <= 120).slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}
