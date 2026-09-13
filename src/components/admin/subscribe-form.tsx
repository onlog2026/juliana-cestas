"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Check, Copy } from "lucide-react";
import { subscribeSeller, type SubscribeInput } from "@/modules/platform/subscription-actions";
import type { SellerPlan } from "@/modules/platform/subscription-service";

const input =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function precoMensalEquivalente(plan: SellerPlan, cycle: "MONTHLY" | "YEARLY", customCents: number | null): number {
  const base = customCents ?? plan.monthlyCents;
  if (cycle === "MONTHLY") return base;
  const pct = Math.min(90, Math.max(0, plan.annualDiscountPct));
  return Math.round((base * 12 * (1 - pct / 100)) / 12);
}

export function SubscribeForm({ plans, customPriceCents }: { plans: SellerPlan[]; customPriceCents: number | null }) {
  const [planSlug, setPlanSlug] = useState(plans[0]?.slug ?? "");
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [method, setMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [cpf, setCpf] = useState("");
  const [card, setCard] = useState({ holderName: "", number: "", expiryMonth: "", expiryYear: "", ccv: "" });
  const [address, setAddress] = useState({ postalCode: "", addressNumber: "" });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pix, setPix] = useState<{ encodedImage: string; payload: string } | null>(null);
  const [feito, setFeito] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const plan = useMemo(() => plans.find((p) => p.slug === planSlug) ?? plans[0], [plans, planSlug]);
  const mensal = plan ? precoMensalEquivalente(plan, cycle, customPriceCents) : 0;

  function assinar() {
    setError(null);
    setPix(null);
    setFeito(false);
    const payload: SubscribeInput = {
      planSlug,
      cycle,
      billingType: method,
      cpfCnpj: cpf,
      ...(method === "CREDIT_CARD" ? { card, address } : {}),
    };
    startTransition(async () => {
      const r = await subscribeSeller(payload);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (r.billingType === "PIX") setPix(r.pix);
      else setFeito(true);
    });
  }

  if (plans.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum plano disponível para assinatura no momento.</p>;
  }

  // PIX gerado: mostra o QR e o copia-e-cola. A liberação acontece sozinha
  // quando o pagamento é confirmado (webhook).
  if (pix) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Pague com PIX para ativar</p>
        <p className="text-sm text-muted-foreground">
          Escaneie o QR Code ou copie o código abaixo. Assim que o pagamento cair, sua conta é liberada
          automaticamente — não precisa avisar ninguém.
        </p>
        {pix.encodedImage ? (
          <div className="mx-auto w-fit rounded-card border border-border bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- QR em data:URI (base64); next/image não serve data URI */}
            <img src={`data:image/png;base64,${pix.encodedImage}`} alt="QR Code do PIX" width={208} height={208} className="size-52 object-contain" />
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <input readOnly value={pix.payload} className={`${input} font-mono text-xs`} />
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(pix.payload).then(() => {
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2000);
              });
            }}
            className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-accent"
          >
            {copiado ? <Check className="size-4 text-green-700" /> : <Copy className="size-4" />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>
    );
  }

  if (feito) {
    return (
      <p className="rounded-[10px] bg-green-50 px-4 py-3 text-sm text-green-800">
        Assinatura no cartão criada! A cobrança será feita automaticamente todo mês e sua conta é liberada assim
        que o pagamento for confirmado.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-1.5 block text-sm font-medium text-foreground">Plano</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {plans.map((p) => {
            const ativo = p.slug === planSlug;
            const valor = precoMensalEquivalente(p, cycle, customPriceCents);
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => setPlanSlug(p.slug)}
                className={`rounded-[10px] border p-3 text-left transition-colors ${
                  ativo ? "border-primary bg-accent" : "border-border bg-background hover:bg-accent"
                }`}
              >
                <span className="block text-sm font-semibold text-foreground">{p.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {brl.format(valor / 100)}/mês{cycle === "YEARLY" ? " (no plano anual)" : ""}
                </span>
              </button>
            );
          })}
        </div>
        {customPriceCents != null ? (
          <p className="mt-1.5 text-xs text-muted-foreground">Sua loja tem um valor especial combinado.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["MONTHLY", "YEARLY"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCycle(c)}
            className={`h-9 rounded-full border px-4 text-sm font-medium transition-colors ${
              cycle === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-accent"
            }`}
          >
            {c === "MONTHLY" ? "Mensal" : "Anual"}
          </button>
        ))}
        <span className="flex items-center text-sm font-semibold text-foreground">
          {brl.format(mensal / 100)}/mês
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["PIX", "CREDIT_CARD"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`h-9 rounded-full border px-4 text-sm font-medium transition-colors ${
              method === m ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground hover:bg-accent"
            }`}
          >
            {m === "PIX" ? "PIX" : "Cartão (renova sozinho)"}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-foreground">CPF ou CNPJ do responsável</span>
        <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="Só números" className={input} />
      </label>

      {method === "CREDIT_CARD" ? (
        <div className="space-y-3 rounded-[10px] border border-border bg-background p-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Nome impresso no cartão</span>
            <input value={card.holderName} onChange={(e) => setCard({ ...card, holderName: e.target.value })} className={input} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">Número do cartão</span>
            <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} className={input} inputMode="numeric" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-foreground">Mês</span>
              <input value={card.expiryMonth} onChange={(e) => setCard({ ...card, expiryMonth: e.target.value })} placeholder="MM" className={input} inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-foreground">Ano</span>
              <input value={card.expiryYear} onChange={(e) => setCard({ ...card, expiryYear: e.target.value })} placeholder="AAAA" className={input} inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-foreground">CVV</span>
              <input value={card.ccv} onChange={(e) => setCard({ ...card, ccv: e.target.value })} className={input} inputMode="numeric" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-foreground">CEP</span>
              <input value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} className={input} inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-foreground">Número</span>
              <input value={address.addressNumber} onChange={(e) => setAddress({ ...address, addressNumber: e.target.value })} className={input} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            O CEP e o número são exigidos pelo antifraude do cartão. Seus dados de cartão não ficam guardados aqui.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="button"
        onClick={assinar}
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {method === "PIX" ? "Gerar PIX e assinar" : "Assinar no cartão"}
      </button>
    </div>
  );
}
