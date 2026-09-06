"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, ShoppingCart } from "lucide-react";
import { saveCartRecoveryRule } from "@/modules/automations/actions";

/**
 * Cartão da regra "Carrinho abandonado" — liga/desliga, escolhe o prazo em
 * horas e mostra quantos e-mails saíram nos últimos 30 dias.
 *
 * Ícone vem direto do lucide-react aqui dentro (é Client Component) — a regra
 * de nunca passar componente de ícone de Server para Client (ver comentário
 * em `src/lib/modules/registry.ts`) não se aplica porque nenhum ícone cruza
 * essa fronteira: este componente importa o dele por conta própria.
 *
 * `MIN_DELAY_HOURS`/`MAX_DELAY_HOURS` e o formato de `CartRecoveryRule` são
 * DUPLICADOS aqui (em vez de importados de `service.ts`) de propósito:
 * `service.ts` tem `import "server-only"` (porque também faz consulta ao
 * banco), e isso quebra o build assim que QUALQUER coisa de lá é importada
 * por um Client Component — mesmo só uma constante. Se os limites mudarem em
 * `service.ts`, mude aqui também (o CHECK do banco na migração 0037 é quem
 * garante que os dois nunca ficam de fato incoerentes).
 */

const MIN_DELAY_HOURS = 1;
const MAX_DELAY_HOURS = 48;

type CartRecoveryRule = { enabled: boolean; delayHours: number };

export function AutomationRules({
  rule,
  sentLast30Days,
}: {
  rule: CartRecoveryRule;
  sentLast30Days: number;
}) {
  const [enabled, setEnabled] = useState(rule.enabled);
  const [delayHours, setDelayHours] = useState(String(rule.delayHours));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const horas = Number.parseInt(delayHours, 10);
    if (!Number.isFinite(horas)) {
      setError("Informe um número de horas.");
      return;
    }

    startTransition(async () => {
      const result = await saveCartRecoveryRule({ enabled, delayHours: horas });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-card border border-border bg-card p-4"
      >
        <div className="flex items-start gap-3">
          <ShoppingCart className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Carrinho abandonado</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quando alguém começa a comprar e não termina de pagar, a loja manda um e-mail
              convidando a pessoa a finalizar o pedido.
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="size-4 rounded border-border"
          />
          Enviar e-mail de carrinho abandonado
        </label>

        <label className="block max-w-xs">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            Avisar depois de quantas horas sem finalizar
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={MIN_DELAY_HOURS}
              max={MAX_DELAY_HOURS}
              value={delayHours}
              onChange={(e) => setDelayHours(e.target.value)}
              disabled={!enabled}
              className="h-11 w-24 rounded-[10px] border border-border bg-background px-3.5 text-center text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            />
            <span className="text-sm text-muted-foreground">hora(s)</span>
          </div>
          <span className="mt-1 block text-xs text-muted-foreground">
            Mínimo {MIN_DELAY_HOURS}, máximo {MAX_DELAY_HOURS} horas.
          </span>
        </label>

        <p className="text-sm text-foreground">
          <strong>{sentLast30Days}</strong> e-mail(s) de carrinho abandonado enviados nos últimos
          30 dias.
        </p>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Salvar
          </button>
          {saved && !pending ? <span className="text-sm text-muted-foreground">Salvo.</span> : null}
        </div>
      </form>

      <div className="rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Importante:</strong> esta automação roda uma vez por dia, de madrugada — é o limite
        do plano atual do site. Ou seja: um carrinho abandonado só é detectado no lote da
        madrugada seguinte, nunca na hora exata em que completa o prazo configurado acima. Para
        avisar dentro do prazo certinho, o site precisaria de um plano com execução mais frequente
        — isso tem custo extra e é uma decisão para conversar com quem cuida do site.
      </div>
    </div>
  );
}
