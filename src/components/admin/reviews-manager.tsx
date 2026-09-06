"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, MessageSquare, Send, Star, X } from "lucide-react";
import {
  approveReview,
  rejectReview,
  replyToReview,
  sendPendingReviewInvites,
  setReviewFeatured,
} from "@/modules/reviews/actions";
import type { AdminReview, ReviewCounts, ReviewStatus } from "@/modules/reviews/service";

/**
 * Fila de moderação da lojista.
 *
 * Regra do dono: só o que ela APROVAR aparece na loja. Por isso nenhuma
 * avaliação nasce publicada — ela entra em "Pendentes" e fica lá até alguém
 * decidir.
 *
 * Este componente é de CLIENTE. Nada de ícone vindo do servidor por prop: o
 * lucide é importado aqui dentro (passar componente de ícone de servidor para
 * cliente derruba a página em produção mesmo passando no tsc).
 */

const ABAS: { valor: ReviewStatus; label: string }[] = [
  { valor: "pendente", label: "Pendentes" },
  { valor: "aprovada", label: "Aprovadas" },
  { valor: "recusada", label: "Recusadas" },
];

function EstrelasAdmin({ nota }: { nota: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${nota} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`size-4 ${n <= nota ? "text-[var(--jc-gold)]" : "text-border"}`}
          fill={n <= nota ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function formatarData(iso: string | null): string {
  if (!iso) return "";
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function ReviewsManager({
  reviews,
  counts,
  statusAtual,
}: {
  reviews: AdminReview[];
  counts: ReviewCounts;
  statusAtual: ReviewStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [respondendoId, setRespondendoId] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");

  function executar(acao: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setErro(null);
    setAviso(null);
    startTransition(async () => {
      const resultado = await acao();
      if (!resultado.ok) setErro(resultado.error);
      else router.refresh();
    });
  }

  function enviarConvites() {
    setErro(null);
    setAviso(null);
    startTransition(async () => {
      const resultado = await sendPendingReviewInvites();
      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }
      const { enviados, semEmail, falhas } = resultado.resumo;
      setAviso(
        enviados === 0 && semEmail === 0 && falhas === 0
          ? "Nenhum pedido entregue está esperando convite."
          : `Convites enviados: ${enviados}.` +
              (semEmail > 0 ? ` ${semEmail} pedido(s) sem e-mail cadastrado.` : "") +
              (falhas > 0 ? ` ${falhas} falha(s).` : "")
      );
      router.refresh();
    });
  }

  function salvarResposta(id: string) {
    executar(async () => {
      const r = await replyToReview(id, rascunho);
      if (r.ok) {
        setRespondendoId(null);
        setRascunho("");
      }
      return r;
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {ABAS.map((aba) => {
          const ativo = aba.valor === statusAtual;
          const quantidade = counts[aba.valor];
          return (
            <button
              key={aba.valor}
              type="button"
              onClick={() => router.push(`/admin/avaliacoes?status=${aba.valor}`)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                ativo
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-accent"
              }`}
            >
              {aba.label} ({quantidade})
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-card border border-border bg-card p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {counts.aguardandoResposta} convite(s) aguardando resposta do cliente
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            O convite sai sozinho quando o pedido é marcado como entregue. Use o botão para cobrir
            entregas antigas — clicar de novo não manda e-mail repetido.
          </p>
        </div>
        <button
          type="button"
          onClick={enviarConvites}
          disabled={pending}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Enviar convites pendentes
        </button>
      </div>

      {erro ? (
        <p role="alert" className="mt-4 rounded-[10px] bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {erro}
        </p>
      ) : null}
      {aviso ? (
        <p className="mt-4 rounded-[10px] bg-secondary px-3.5 py-2.5 text-sm text-foreground">{aviso}</p>
      ) : null}

      {reviews.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Nenhuma avaliação {statusAtual === "pendente" ? "pendente" : statusAtual} por aqui.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-card border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <EstrelasAdmin nota={review.rating} />
                  {review.featured ? (
                    <span className="rounded-full bg-[color-mix(in_oklch,var(--jc-gold),transparent_80%)] px-2 py-0.5 text-xs font-medium text-foreground">
                      Em destaque
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  {review.orderNumber ? `Pedido #${review.orderNumber} · ` : ""}
                  {formatarData(review.submittedAt)}
                </p>
              </div>

              <p className="mt-2 text-sm font-medium text-foreground">
                {review.customerName}
                {review.productName ? (
                  <span className="font-normal text-muted-foreground"> · {review.productName}</span>
                ) : null}
              </p>

              {review.comment ? (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                  {review.comment}
                </p>
              ) : (
                <p className="mt-2 text-sm italic text-muted-foreground">Sem comentário escrito.</p>
              )}

              {review.photoUrl ? (
                <a
                  href={review.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={review.photoUrl}
                    alt={`Foto enviada por ${review.customerName}`}
                    className="size-20 rounded-[10px] object-cover"
                  />
                </a>
              ) : null}

              {review.reply ? (
                <p className="mt-3 rounded-[10px] bg-secondary/60 p-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Sua resposta: </span>
                  {review.reply}
                </p>
              ) : null}

              {respondendoId === review.id ? (
                <div className="mt-3">
                  <textarea
                    value={rascunho}
                    onChange={(e) => setRascunho(e.target.value.slice(0, 800))}
                    rows={3}
                    placeholder="Escreva uma resposta pública para essa avaliação..."
                    className="w-full rounded-[10px] border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => salvarResposta(review.id)}
                      disabled={pending}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                    >
                      Salvar resposta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRespondendoId(null);
                        setRascunho("");
                      }}
                      className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                {review.status !== "aprovada" ? (
                  <button
                    type="button"
                    onClick={() => executar(() => approveReview(review.id))}
                    disabled={pending}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    <Check className="size-4" /> Aprovar
                  </button>
                ) : null}

                {review.status !== "recusada" ? (
                  <button
                    type="button"
                    onClick={() => executar(() => rejectReview(review.id))}
                    disabled={pending}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
                  >
                    <X className="size-4" /> Recusar
                  </button>
                ) : null}

                {review.status === "aprovada" ? (
                  <button
                    type="button"
                    onClick={() => executar(() => setReviewFeatured(review.id, !review.featured))}
                    disabled={pending}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
                  >
                    <Star className="size-4" />
                    {review.featured ? "Tirar destaque" : "Destacar"}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    setRespondendoId(review.id);
                    setRascunho(review.reply ?? "");
                  }}
                  disabled={pending}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
                >
                  <MessageSquare className="size-4" />
                  {review.reply ? "Editar resposta" : "Responder"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
