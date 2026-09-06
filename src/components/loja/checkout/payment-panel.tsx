"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Copy, Loader2, MessageCircle, QrCode } from "lucide-react";
import { formatCents } from "@/lib/money";

/**
 * O painel de pagamento da página do pedido.
 *
 * A regra que manda em tudo aqui: **se a loja não conectou conta de
 * recebimento, esta tela tem que se comportar EXATAMENTE como se comportava
 * antes de o pagamento existir** -- botão do WhatsApp e nada mais. A loja da
 * Juliana está vendendo hoje por esse caminho; ela não pode ver diferença
 * nenhuma até decidir conectar a conta dela.
 *
 * Por isso `pagamentoLigado` chega pronto do servidor e é a primeira coisa
 * checada. Sem isso, um erro qualquer na cobrança viraria uma tela quebrada no
 * lugar do único caminho que funciona.
 */

type Cobranca = {
  paymentId: string;
  billingType: string;
  amountCents: number;
  status: string;
  invoiceUrl: string | null;
  pixPayload: string | null;
  pixQrBase64: string | null;
  dueDate: string | null;
};

type Props = {
  orderId: string;
  token: string;
  pagamentoLigado: boolean;
  pagoInicial: boolean;
  cobrancaInicial: Cobranca | null;
  whatsappHref: string;
  totalCents: number;
};

export function PaymentPanel({
  orderId,
  token,
  pagamentoLigado,
  pagoInicial,
  cobrancaInicial,
  whatsappHref,
  totalCents,
}: Props) {
  const [pago, setPago] = useState(pagoInicial);
  const [cobranca, setCobranca] = useState<Cobranca | null>(cobrancaInicial);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  // `semConta` só vira true se o servidor responder que a loja não tem conta.
  // É o caminho de volta para o WhatsApp sem susto para o comprador.
  const [semConta, setSemConta] = useState(!pagamentoLigado);

  const encerrado = useRef(false);
  useEffect(() => {
    encerrado.current = false;
    return () => {
      encerrado.current = true;
    };
  }, []);

  const consultar = useCallback(async () => {
    try {
      const resposta = await fetch(
        `/api/checkout/payment-status?orderId=${encodeURIComponent(orderId)}&t=${encodeURIComponent(token)}`,
        { cache: "no-store" }
      );
      if (!resposta.ok) return;
      const dados = (await resposta.json()) as { paid?: boolean; payment?: Cobranca | null };
      if (encerrado.current) return;
      if (dados.paid) setPago(true);
      if (dados.payment) setCobranca(dados.payment);
    } catch {
      // Consulta que falha não vira mensagem de erro: o comprador já pagou ou
      // não, e a próxima tentativa resolve. Errar aqui em silêncio é o certo.
    }
  }, [orderId, token]);

  // Enquanto existe cobrança em aberto, a página se atualiza sozinha -- o
  // comprador paga no app do banco e vê a confirmação sem apertar nada.
  useEffect(() => {
    if (pago || !cobranca) return;
    const timer = setInterval(consultar, 5000);
    return () => clearInterval(timer);
  }, [pago, cobranca, consultar]);

  async function gerarPix() {
    setGerando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/checkout/payment-status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, t: token, metodo: "PIX" }),
      });
      const dados = (await resposta.json()) as {
        payment?: Cobranca;
        error?: string;
        code?: string;
        paid?: boolean;
      };

      if (dados.paid) {
        setPago(true);
        return;
      }
      if (dados.code === "sem_conta") {
        setSemConta(true);
        return;
      }
      if (!resposta.ok || !dados.payment) {
        setErro(dados.error ?? "Não consegui gerar o Pix agora. Tente de novo em instantes.");
        return;
      }
      setCobranca(dados.payment);
    } catch {
      setErro("Não consegui falar com o servidor. Confira sua internet e tente de novo.");
    } finally {
      setGerando(false);
    }
  }

  async function copiar() {
    if (!cobranca?.pixPayload) return;
    try {
      await navigator.clipboard.writeText(cobranca.pixPayload);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErro("Seu navegador não deixou copiar. Selecione o código e copie na mão.");
    }
  }

  if (pago) {
    return (
      <div className="mt-6 rounded-card border border-primary/30 bg-accent p-5">
        <p className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Check className="size-5 text-primary" />
          Pagamento confirmado
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Recebemos {formatCents(totalCents)}. A loja já foi avisada e vai preparar o seu pedido.
        </p>
      </div>
    );
  }

  // Caminho de hoje, intocado: sem conta conectada, é WhatsApp e ponto.
  if (semConta) {
    return (
      <div className="mt-6 rounded-card border border-primary/30 bg-accent p-5">
        <p className="text-sm text-foreground">
          O pagamento é combinado direto pelo WhatsApp — é só confirmar o número do pedido.
        </p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="jc-shine-cta mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--jc-whatsapp)] px-7 text-base font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <MessageCircle className="size-5" />
          Finalizar pagamento pelo WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-card border border-primary/30 bg-accent p-5">
      {cobranca?.pixPayload ? (
        <>
          <p className="text-base font-semibold text-foreground">Pague com Pix</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Abra o app do seu banco, escolha Pix e leia o código abaixo. Assim que o pagamento cair,
            esta página avisa sozinha — não precisa recarregar.
          </p>

          {cobranca.pixQrBase64 ? (
            <div className="mt-4 flex justify-center">
              <Image
                src={`data:image/png;base64,${cobranca.pixQrBase64}`}
                alt="Código QR do Pix para pagar este pedido"
                width={220}
                height={220}
                unoptimized
                className="rounded-xl border border-border bg-white p-2"
              />
            </div>
          ) : null}

          <label className="mt-4 block text-xs font-medium text-muted-foreground">
            Ou copie o código Pix
          </label>
          <p className="mt-1 max-h-24 overflow-y-auto rounded-[10px] border border-border bg-card px-3 py-2 font-mono text-[11px] leading-relaxed break-all text-foreground">
            {cobranca.pixPayload}
          </p>
          <button
            type="button"
            onClick={copiar}
            className="mt-3 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            {copiado ? <Check className="size-5" /> : <Copy className="size-5" />}
            {copiado ? "Código copiado" : "Copiar código Pix"}
          </button>

          {cobranca.invoiceUrl ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Prefere cartão ou boleto?{" "}
              <a
                href={cobranca.invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Abrir a fatura
              </a>
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-base font-semibold text-foreground">Pagar {formatCents(totalCents)}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Gere o código Pix e pague pelo app do seu banco. A confirmação é na hora.
          </p>
          <button
            type="button"
            onClick={gerarPix}
            disabled={gerando}
            className="jc-shine-cta mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {gerando ? <Loader2 className="size-5 animate-spin" /> : <QrCode className="size-5" />}
            {gerando ? "Gerando o Pix…" : "Gerar código Pix"}
          </button>
        </>
      )}

      {erro ? <p className="mt-3 text-sm text-destructive">{erro}</p> : null}

      <p className="mt-4 border-t border-primary/20 pt-3 text-xs text-muted-foreground">
        Deu algum problema para pagar?{" "}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          Fale com a loja no WhatsApp
        </a>
        .
      </p>
    </div>
  );
}
