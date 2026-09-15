/**
 * Lógica PURA de frete por faixa de CEP (sem `server-only`, sem banco) para ser
 * testável isoladamente. O resolvedor de verdade (que lê o banco) vive em
 * `settings.ts` e usa estas funções.
 *
 * Regra de negócio: o cliente digita o CEP; o sistema acha a faixa que o contém
 * e devolve a zona (com preço e prazo). Em sobreposição de faixas, ganha a de
 * MENOR preço (nunca cobrar a mais por engano); empate no preço, ganha a faixa
 * mais estreita (mais específica). CEP que não casa com nenhuma faixa = não
 * atendido (a loja mostra o WhatsApp em vez de travar ou cobrar errado).
 */

export type ZoneCepCandidate = {
  zoneId: string;
  name: string;
  feeCents: number;
  prazoMinDays: number | null;
  prazoMaxDays: number | null;
  cepStart: number;
  cepEnd: number;
};

/** Devolve os 8 dígitos do CEP, ou null se não for um CEP válido. */
export function normalizeCep(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

/** CEP de 8 dígitos como número inteiro (para comparar com as faixas). */
export function cepToInt(cep8: string): number {
  return Number.parseInt(cep8, 10);
}

/**
 * Escolhe a zona para um CEP entre as faixas candidatas. `cepNum` é o CEP já
 * como inteiro (ver `cepToInt`). Retorna null se nenhuma faixa contém o CEP.
 */
export function pickZoneForCep(
  candidates: ZoneCepCandidate[],
  cepNum: number
): ZoneCepCandidate | null {
  const matches = candidates.filter((c) => cepNum >= c.cepStart && cepNum <= c.cepEnd);
  if (matches.length === 0) return null;
  matches.sort(
    (a, b) => a.feeCents - b.feeCents || a.cepEnd - a.cepStart - (b.cepEnd - b.cepStart)
  );
  return matches[0];
}
