"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  activateTenant,
  suspendStorefront,
  resumeStorefront,
  extendTrial,
  grantBonus,
  removeBonus,
  changePlan,
  logStoreAccess,
} from "@/modules/platform/actions";

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const cardClass = "rounded-card border border-border bg-card p-5";
const primaryButton =
  "flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60";
const neutralButton =
  "flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60";
const dangerButton =
  "flex h-11 items-center justify-center gap-2 rounded-full border border-red-300 bg-card px-5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60";

/**
 * Link "Entrar no painel desta loja".
 *
 * O acesso do dono da plataforma ao painel de um lojista SEMPRE fica
 * registrado antes de a navegação acontecer -- é o que responde depois a
 * "quem mexeu na loja da Juliana e quando".
 */
export function EnterStoreLink({
  tenantId,
  slug,
  href,
  temDominioProprio,
}: {
  tenantId: string;
  slug: string;
  href: string;
  temDominioProprio: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function abrir(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    setErro(null);
    startTransition(async () => {
      try {
        await logStoreAccess(tenantId, slug);
      } catch {
        // Se nem o registro de acesso funcionou, algo está errado no servidor.
        // Melhor não entrar do que entrar sem deixar rastro.
        setErro("Não foi possível registrar este acesso, então a entrada não foi aberta. Tente de novo.");
        return;
      }
      window.location.href = href;
    });
  }

  return (
    <div>
      <a href={href} onClick={abrir} className={`${primaryButton} inline-flex`}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        Entrar no painel desta loja
      </a>
      {!temDominioProprio ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Hoje a plataforma ainda não tem um domínio próprio configurado, então existe uma loja só e este botão abre o
          painel dela em /admin; quando o domínio da plataforma for configurado, cada loja passa a ter o próprio
          endereço.
        </p>
      ) : null}
      {erro ? <p className="mt-2 text-sm text-destructive">{erro}</p> : null}
      <p className="mt-2 text-xs text-muted-foreground">Toda entrada sua no painel de uma loja fica registrada.</p>
    </div>
  );
}

type Result = { ok: true } | { ok: false; error: string };

export function TenantActions({
  tenantId,
  nome,
  storefrontSuspensa,
  temCortesia,
  planoAtual,
}: {
  tenantId: string;
  nome: string;
  storefrontSuspensa: boolean;
  temCortesia: boolean;
  planoAtual: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Qual botão está rodando, para não travar a tela inteira nem piscar
  // mensagem no lugar errado.
  const [rodando, setRodando] = useState<string | null>(null);
  const [erro, setErro] = useState<{ acao: string; mensagem: string } | null>(null);
  const [sucesso, setSucesso] = useState<{ acao: string; mensagem: string } | null>(null);

  const [motivoSuspensao, setMotivoSuspensao] = useState("");
  const [diasTeste, setDiasTeste] = useState(7);
  const [cortesiaDias, setCortesiaDias] = useState(30);
  const [cortesiaPlano, setCortesiaPlano] = useState(planoAtual ?? "");
  const [cortesiaMotivo, setCortesiaMotivo] = useState("");
  const [novoPlano, setNovoPlano] = useState(planoAtual ?? "");

  function executar(acao: string, mensagemSucesso: string, fn: () => Promise<Result>) {
    setErro(null);
    setSucesso(null);
    setRodando(acao);
    startTransition(async () => {
      try {
        const resultado = await fn();
        if (!resultado.ok) {
          setErro({ acao, mensagem: resultado.error });
          return;
        }
        setSucesso({ acao, mensagem: mensagemSucesso });
        router.refresh();
      } catch {
        setErro({ acao, mensagem: "A ação não pôde ser concluída. Tente de novo em alguns segundos." });
      } finally {
        setRodando(null);
      }
    });
  }

  // Função simples que devolve JSX (não é um componente): evita recriar um
  // componente a cada render, o que faz o React remontar tudo sem necessidade.
  function mensagem(acao: string) {
    return (
      <>
        {erro?.acao === acao ? <p className="mt-2 text-sm text-destructive">{erro.mensagem}</p> : null}
        {sucesso?.acao === acao ? <p className="mt-2 text-sm text-green-700">{sucesso.mensagem}</p> : null}
      </>
    );
  }

  function ocupado(acao: string) {
    return pending && rodando === acao;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">Ações sobre esta loja</h2>

      {/* Liberar acesso sem cobrar */}
      <div className={cardClass}>
        <h3 className="text-sm font-semibold text-foreground">Ativar acesso manualmente</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Libera o acesso da loja imediatamente, <strong>sem criar cobrança</strong>. Não gera fatura no gateway de
          pagamento e não religa a assinatura — serve para quando você já recebeu por fora ou quer destravar a loja na
          mão.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const ok = window.confirm(
              `Ativar o acesso da loja "${nome}"?\n\nIsso libera o acesso sem criar cobrança. Não gera fatura nem religa assinatura.`
            );
            if (!ok) return;
            executar("ativar", "Acesso liberado. Nenhuma cobrança foi criada.", () => activateTenant(tenantId));
          }}
          className={`${primaryButton} mt-3`}
        >
          {ocupado("ativar") ? <Loader2 className="size-4 animate-spin" /> : null}
          Ativar acesso manualmente
        </button>
        {mensagem("ativar")}
      </div>

      {/* Vitrine no ar / fora do ar */}
      <div className={cardClass}>
        <h3 className="text-sm font-semibold text-foreground">
          {storefrontSuspensa ? "Reativar vitrine" : "Suspender vitrine"}
        </h3>
        {storefrontSuspensa ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              A vitrine desta loja está fora do ar para os clientes. Ao reativar, o site volta a aceitar visitas e
              pedidos na mesma hora.
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                executar("vitrine", "Vitrine reativada. O site da loja voltou ao ar.", () => resumeStorefront(tenantId))
              }
              className={`${primaryButton} mt-3`}
            >
              {ocupado("vitrine") ? <Loader2 className="size-4 animate-spin" /> : null}
              Reativar vitrine
            </button>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              O site da loja sai do ar para os clientes e ninguém consegue comprar. O lojista{" "}
              <strong>continua acessando o painel dele normalmente</strong> para resolver a pendência.
            </p>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Motivo da suspensão (obrigatório)
              </span>
              <input
                value={motivoSuspensao}
                onChange={(event) => setMotivoSuspensao(event.target.value)}
                placeholder="Exemplo: mensalidade em atraso há 15 dias"
                className={inputClass}
              />
            </label>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                const motivo = motivoSuspensao.trim();
                if (!motivo) {
                  setSucesso(null);
                  setErro({ acao: "vitrine", mensagem: "Escreva o motivo da suspensão antes de continuar." });
                  return;
                }
                const ok = window.confirm(
                  `Suspender a vitrine da loja "${nome}"?\n\nO site da loja sai do ar para os clientes e ninguém consegue comprar. O lojista continua acessando o painel dele normalmente.`
                );
                if (!ok) return;
                executar("vitrine", "Vitrine suspensa. O site da loja saiu do ar.", () =>
                  suspendStorefront(tenantId, motivo)
                );
              }}
              className={`${dangerButton} mt-3`}
            >
              {ocupado("vitrine") ? <Loader2 className="size-4 animate-spin" /> : null}
              Suspender vitrine
            </button>
          </>
        )}
        {mensagem("vitrine")}
      </div>

      {/* Período de teste */}
      <div className={cardClass}>
        <h3 className="text-sm font-semibold text-foreground">Estender período de teste</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Soma dias ao teste da loja. Nunca encurta um prazo que já existe: os dias são somados a partir da data que
          estiver valendo hoje. Não gera cobrança.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          {[7, 15, 30].map((dias) => (
            <button
              key={dias}
              type="button"
              onClick={() => setDiasTeste(dias)}
              className={`h-9 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                diasTeste === dias
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-accent"
              }`}
            >
              {dias} dias
            </button>
          ))}
          <label className="block w-28">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Dias</span>
            <input
              type="number"
              min={1}
              max={365}
              value={diasTeste}
              onChange={(event) => setDiasTeste(Number(event.target.value))}
              className={inputClass}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            executar("teste", `Teste estendido em ${diasTeste} dia(s).`, () => extendTrial(tenantId, diasTeste))
          }
          className={`${neutralButton} mt-3`}
        >
          {ocupado("teste") ? <Loader2 className="size-4 animate-spin" /> : null}
          Estender teste
        </button>
        {mensagem("teste")}
      </div>

      {/* Cortesia */}
      <div className={cardClass}>
        <h3 className="text-sm font-semibold text-foreground">Conceder cortesia</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Cortesia libera a loja por um prazo <strong>sem cobrar nada</strong>: nenhuma fatura é criada e nada é
          descontado do lojista. Assim como o teste, os dias são somados a uma cortesia que já esteja valendo.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Dias de cortesia</span>
            <input
              type="number"
              min={1}
              max={365}
              value={cortesiaDias}
              onChange={(event) => setCortesiaDias(Number(event.target.value))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Plano da cortesia</span>
            <input
              value={cortesiaPlano}
              onChange={(event) => setCortesiaPlano(event.target.value)}
              placeholder="Exemplo: fundadora"
              className={inputClass}
            />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Motivo da cortesia (obrigatório)</span>
          <input
            value={cortesiaMotivo}
            onChange={(event) => setCortesiaMotivo(event.target.value)}
            placeholder="Exemplo: primeira loja da plataforma, parceria de lançamento"
            className={inputClass}
          />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          O nome do plano é digitado à mão por enquanto — use exatamente o identificador que já aparece nos dados desta
          loja. O editor de planos da plataforma entra depois.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const motivo = cortesiaMotivo.trim();
            if (!motivo) {
              setSucesso(null);
              setErro({ acao: "cortesia", mensagem: "Escreva o motivo da cortesia antes de continuar." });
              return;
            }
            const ok = window.confirm(
              `Conceder ${cortesiaDias} dia(s) de cortesia para a loja "${nome}"?\n\nCortesia não cobra nada: nenhuma fatura é criada e a loja fica liberada por esse prazo.`
            );
            if (!ok) return;
            executar("cortesia", `Cortesia de ${cortesiaDias} dia(s) concedida. Nada foi cobrado.`, () =>
              grantBonus(tenantId, { dias: cortesiaDias, planoSlug: cortesiaPlano.trim(), motivo })
            );
          }}
          className={`${primaryButton} mt-3`}
        >
          {ocupado("cortesia") ? <Loader2 className="size-4 animate-spin" /> : null}
          Conceder cortesia
        </button>
        {mensagem("cortesia")}
      </div>

      {temCortesia ? (
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-foreground">Remover cortesia</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Apaga a cortesia desta loja. A loja passa a valer pelo que estiver na assinatura dela — se não houver
            assinatura paga em dia, ela pode perder o acesso.
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const ok = window.confirm(
                `Remover a cortesia da loja "${nome}"?\n\nA loja deixa de ter o acesso liberado de graça e passa a depender da assinatura dela.`
              );
              if (!ok) return;
              executar("removerCortesia", "Cortesia removida.", () => removeBonus(tenantId));
            }}
            className={`${dangerButton} mt-3`}
          >
            {ocupado("removerCortesia") ? <Loader2 className="size-4 animate-spin" /> : null}
            Remover cortesia
          </button>
          {mensagem("removerCortesia")}
        </div>
      ) : null}

      {/* Plano */}
      <div className={cardClass}>
        <h3 className="text-sm font-semibold text-foreground">Trocar plano</h3>
        <p className="mt-1 rounded-[10px] bg-amber-100 px-3 py-2 text-sm text-amber-900">
          Atenção: trocar o plano aqui <strong>NÃO altera o valor cobrado no gateway de pagamento</strong>. Isso muda só
          o plano registrado no sistema. Se o valor da mensalidade precisa mudar, você ainda tem que ajustar a cobrança
          no Asaas.
        </p>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Plano</span>
          <input
            value={novoPlano}
            onChange={(event) => setNovoPlano(event.target.value)}
            placeholder="Exemplo: fundadora"
            className={inputClass}
          />
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          Campo de texto livre por enquanto: digite o identificador do plano exatamente como ele já aparece nos dados
          (por exemplo <strong>fundadora</strong>). A lista de planos da plataforma vem numa próxima etapa.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const ok = window.confirm(
              `Trocar o plano da loja "${nome}" para "${novoPlano.trim() || "(nenhum)"}"?\n\nTrocar o plano aqui NÃO altera o valor cobrado no gateway de pagamento.`
            );
            if (!ok) return;
            executar("plano", "Plano alterado no sistema. O valor cobrado no gateway continua o mesmo.", () =>
              changePlan(tenantId, novoPlano.trim())
            );
          }}
          className={`${neutralButton} mt-3`}
        >
          {ocupado("plano") ? <Loader2 className="size-4 animate-spin" /> : null}
          Trocar plano
        </button>
        {mensagem("plano")}
      </div>
    </div>
  );
}
