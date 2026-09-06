import "server-only";
import { resolve4, resolveCname } from "node:dns/promises";
import { interpretarA, interpretarCname, type DnsInstruction, type ResultadoVerificacao } from "@/modules/domains/service";

/**
 * A CONSULTA DE DNS DE VERDADE.
 *
 * Roda `node:dns` (o resolvedor do próprio Node, não a API da Vercel -- não
 * existe token de projeto configurado hoje). Isso prova uma coisa real: "o
 * registro que a lojista criou no provedor dela bate com o que pedimos".
 * Não prova, e não pode provar, que o domínio está servindo a loja -- isso
 * depende da Vercel aceitar o domínio no projeto, o que exige a API dela.
 *
 * Timeout curto de propósito: DNS lento ou provedor fora do ar não pode
 * travar a tela da lojista esperando resposta.
 */
const TIMEOUT_MS = 4000;

function comTimeout<T>(promessa: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("DNS_TIMEOUT")), TIMEOUT_MS);
    promessa.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

function ehErroDeAusencia(err: unknown): boolean {
  const codigo = (err as { code?: string } | null)?.code;
  return codigo === "ENOTFOUND" || codigo === "ENODATA" || codigo === "NODATA" || codigo === "NXDOMAIN";
}

/** Consulta o DNS de `host` e compara com a instrução salva no cadastro. */
export async function verificarDnsDoHost(host: string, instrucao: DnsInstruction): Promise<ResultadoVerificacao> {
  try {
    if (instrucao.tipo === "A") {
      const ips = await comTimeout(resolve4(host));
      return interpretarA(ips, instrucao.valorEsperado);
    }

    if (!instrucao.valorEsperado) {
      return {
        status: "erro",
        motivo:
          "A plataforma ainda não tem um domínio próprio configurado, então não existe um valor para " +
          "conferir. Assim que isso mudar, esta verificação passa a funcionar de verdade.",
      };
    }

    const alvos = await comTimeout(resolveCname(host));
    return interpretarCname(alvos, instrucao.valorEsperado);
  } catch (err) {
    if (err instanceof Error && err.message === "DNS_TIMEOUT") {
      return {
        status: "erro",
        motivo: "A consulta de DNS demorou demais para responder. Tente de novo em alguns minutos.",
      };
    }
    if (ehErroDeAusencia(err)) {
      return {
        status: "erro",
        motivo:
          `Não encontrei nenhuma configuração de DNS para "${host}" ainda. Confira se você já salvou o ` +
          "registro no painel do seu provedor de domínio -- a propagação pode levar algumas horas.",
      };
    }
    console.error("[dominio] falha inesperada ao consultar DNS:", err);
    return {
      status: "erro",
      motivo: "Não foi possível consultar o DNS agora. Tente de novo em alguns minutos.",
    };
  }
}
