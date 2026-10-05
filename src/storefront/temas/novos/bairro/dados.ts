import type { DadosLoja } from "../../types";

/**
 * BAIRRO — dados de apoio. Bairros, endereço e horários só aparecem como EXEMPLO na loja de
 * demonstração; numa loja real nada disso é inventado (mostramos só o que a loja informou).
 */

const REGIOES_DEMO: Record<string, string[]> = {
  "Cantinho Verde": ["Jardim das Acácias", "Vila Esperança", "Parque dos Ipês", "Centro Velho", "Alto da Colina"],
  "Cesta da Vila": ["Vila Nova", "Jardim Primavera", "Bairro Azul", "Residencial Lagoa", "Praça Central"],
  "Forno da Esquina": ["Rua do Comércio", "Jardim Sol Nascente", "Vila das Palmeiras", "Conjunto Girassol", "Morada do Campo"],
};
const REGIOES_PADRAO = ["Centro", "Jardim Primavera", "Vila Nova", "Parque das Flores"];

/** Regiões atendidas (exemplo na demo; vazio na loja real). */
export function regioes(d: DadosLoja): string[] {
  if (!d.demo) return [];
  return REGIOES_DEMO[d.loja] ?? REGIOES_PADRAO;
}

/** Link do WhatsApp só quando a loja informou o número. */
export function linkWhats(d: DadosLoja, texto?: string): string | null {
  const n = (d.whatsapp ?? "").replace(/\D/g, "");
  if (n.length < 10) return null;
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

export const ENDERECO_EXEMPLO = "Rua das Flores, 120 · Centro";

export const HORARIOS: ReadonlyArray<readonly [string, string, string]> = [
  ["Manhã", "8h às 12h", "Pedido até 18h da véspera"],
  ["Tarde", "14h às 18h", "Pedido até 12h do mesmo dia"],
  ["Noite", "18h às 21h", "Pedido até 14h do mesmo dia"],
];
