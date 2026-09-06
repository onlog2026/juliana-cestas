"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, ShieldCheck, TriangleAlert, Unplug } from "lucide-react";
import { connectAsaasAccountAction, disconnectAsaasAccountAction } from "@/modules/payments/actions";

/**
 * Conectar / desconectar a conta Asaas da loja.
 *
 * Recebe só dados serializáveis do Server Component (a página). Nenhum ícone
 * ou função atravessa a fronteira servidor→cliente: os ícones são importados
 * aqui dentro.
 *
 * A chave NUNCA volta para a tela depois de salva — o servidor devolve apenas
 * os 4 últimos caracteres.
 */

export type AsaasAccountView = {
  connected: boolean;
  environment: "sandbox" | "production" | null;
  keyLast4: string | null;
  accountName: string | null;
  accountEmail: string | null;
  webhookRegistered: boolean;
  connectedAt: string | null;
  lastError: string | null;
  cryptoReady: boolean;
};

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function formatarData(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function AsaasConnectForm({ account }: { account: AsaasAccountView }) {
  const [apiKey, setApiKey] = useState("");
  const [environment, setEnvironment] = useState<"production" | "sandbox">(
    account.environment ?? "production"
  );
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);

  function conectar() {
    setErro(null);
    setSucesso(null);
    if (!apiKey.trim()) {
      setErro("Cole a chave de API da sua conta Asaas.");
      return;
    }
    startTransition(async () => {
      const resultado = await connectAsaasAccountAction({ apiKey, environment });
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setApiKey("");
      setSucesso("Conta conectada. A partir de agora o cliente pode pagar direto no site.");
    });
  }

  function desconectar() {
    setErro(null);
    setSucesso(null);
    startTransition(async () => {
      const resultado = await disconnectAsaasAccountAction();
      setConfirmandoSaida(false);
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      setSucesso("Conta desconectada. Os pedidos voltam a ser combinados pelo WhatsApp.");
    });
  }

  return (
    <div className="space-y-6">
      {/* ── O que muda, em português ────────────────────────────────── */}
      <div className="rounded-card border border-border bg-accent/40 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="size-4" /> O que muda quando você conecta
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Com a conta conectada, o cliente paga direto no site e o dinheiro cai na sua conta do
          Asaas. Sem ela, o pedido continua sendo combinado pelo WhatsApp, como é hoje.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          A loja nunca fica no meio do seu dinheiro: a cobrança é emitida na sua conta e o valor vai
          para você, sem passar por ninguém.
        </p>
      </div>

      {/* ── Situação atual ──────────────────────────────────────────── */}
      {account.connected ? (
        <div className="rounded-card border border-primary/30 bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
              <Check className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Conta conectada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {account.accountName ? `${account.accountName} · ` : ""}
                chave terminada em{" "}
                <span className="font-mono">•••• {account.keyLast4 ?? "????"}</span>
                {account.environment === "sandbox" ? " · ambiente de teste (sandbox)" : ""}
                {account.connectedAt ? ` · desde ${formatarData(account.connectedAt)}` : ""}
              </p>
              {account.webhookRegistered ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  O aviso automático de pagamento está ligado: assim que o cliente paga, o pedido
                  muda sozinho para &quot;pago&quot;.
                </p>
              ) : (
                <p className="mt-1 text-sm text-destructive">
                  O aviso automático de pagamento não está registrado. Desconecte e conecte de novo
                  — sem ele, o pagamento entra e o pedido não muda sozinho.
                </p>
              )}
              {account.environment === "sandbox" ? (
                <p className="mt-2 rounded-[10px] bg-secondary/60 px-3 py-2 text-sm text-foreground">
                  Atenção: sandbox é o ambiente de testes do Asaas. Nenhum dinheiro de verdade
                  entra. Para vender de verdade, conecte a chave de produção.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            {confirmandoSaida ? (
              <div className="space-y-3">
                <p className="text-sm text-foreground">
                  Tem certeza? Depois de desconectar, o site para de gerar Pix, boleto e cartão. Os
                  novos pedidos voltam a ser combinados pelo WhatsApp.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={desconectar}
                    disabled={pending}
                    className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-destructive px-4 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {pending ? <Loader2 className="size-4 animate-spin" /> : <Unplug className="size-4" />}
                    Sim, desconectar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoSaida(false)}
                    disabled={pending}
                    className="inline-flex h-11 items-center rounded-[10px] border border-border px-4 text-sm font-medium text-foreground"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmandoSaida(true)}
                className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-border px-4 text-sm font-medium text-foreground hover:bg-accent"
              >
                <Unplug className="size-4" /> Desconectar esta conta
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-card border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">Nenhuma conta conectada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Os pedidos continuam sendo combinados pelo WhatsApp — nada mudou no seu site.
          </p>
        </div>
      )}

      {/* ── Formulário ──────────────────────────────────────────────── */}
      {!account.cryptoReady ? (
        <div className="flex items-start gap-3 rounded-card border border-destructive/40 bg-card p-5">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-foreground">
            O sistema ainda não está preparado para guardar a sua chave com segurança. Fale com o
            suporte antes de conectar — nenhuma chave será aceita até isso ser resolvido.
          </p>
        </div>
      ) : (
        <div className="rounded-card border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">
            {account.connected ? "Trocar a chave" : "Conectar a sua conta Asaas"}
          </h2>

          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Entre na sua conta do Asaas, no computador.</li>
            <li>
              No menu do canto superior direito, abra <strong>Integrações</strong> e depois{" "}
              <strong>Chave de API</strong>.
            </li>
            <li>
              Clique em <strong>Gerar chave</strong> e copie a chave inteira (ela começa com{" "}
              <span className="font-mono">$aact_</span>).
            </li>
            <li>Cole no campo abaixo e clique em Conectar.</li>
          </ol>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="asaas-key" className="text-sm font-medium text-foreground">
                Chave de API do Asaas
              </label>
              <input
                id="asaas-key"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setErro(null);
                  setSucesso(null);
                }}
                placeholder="$aact_..."
                className={`${inputClass} mt-1.5 font-mono`}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                A chave é guardada cifrada e nunca mais aparece nesta tela — depois de salvar, você
                só vê os 4 últimos caracteres. Se precisar trocar, gere uma nova no Asaas e cole
                aqui de novo.
              </p>
            </div>

            <div>
              <label htmlFor="asaas-env" className="text-sm font-medium text-foreground">
                Tipo da chave
              </label>
              <select
                id="asaas-env"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value === "sandbox" ? "sandbox" : "production")}
                className={`${inputClass} mt-1.5`}
              >
                <option value="production">Produção — recebe dinheiro de verdade</option>
                <option value="sandbox">Sandbox — só para testar, sem dinheiro real</option>
              </select>
            </div>

            {erro ? (
              <div className="flex items-start gap-2 rounded-[10px] border border-destructive/40 bg-destructive/5 px-3.5 py-3">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                <p className="text-sm text-foreground">{erro}</p>
              </div>
            ) : null}

            {sucesso ? (
              <div className="flex items-start gap-2 rounded-[10px] border border-primary/40 bg-accent px-3.5 py-3">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-sm text-foreground">{sucesso}</p>
              </div>
            ) : null}

            <button
              type="button"
              onClick={conectar}
              disabled={pending}
              className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {account.connected ? "Salvar a nova chave" : "Conectar conta"}
            </button>

            <p className="text-xs text-muted-foreground">
              Ao conectar, o sistema confere a chave no Asaas e registra o aviso automático de
              pagamento. Se qualquer um dos dois falhar, nada é salvo e você vê o motivo aqui.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
