"use client";

import type { CartBuyer } from "@/modules/cart/types";

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

type Props = {
  buyer: CartBuyer;
  onChange: (next: CartBuyer) => void;
  errors?: Record<string, string>;
};

/** Dados de quem está comprando, preenchidos UMA VEZ para todo o carrinho
 *  (o destinatário de cada cesta é preenchido no editor da cesta). */
export function BuyerForm({ buyer, onChange, errors }: Props) {
  function patch(field: keyof CartBuyer, value: string) {
    onChange({ ...buyer, [field]: value });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-lg text-foreground">Quem está comprando</h2>
      <p className="mt-1 text-xs text-muted-foreground">Uma vez só, mesmo com várias cestas.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Nome completo">
          <input
            value={buyer.name}
            onChange={(e) => patch("name", e.target.value)}
            className={inputClass}
            placeholder="Seu nome completo"
          />
          {errors?.name ? <span className="mt-1 block text-xs text-destructive">{errors.name}</span> : null}
        </Field>
        <Field label="WhatsApp">
          <input
            value={buyer.phone}
            onChange={(e) => patch("phone", e.target.value)}
            className={inputClass}
            placeholder="(61) 99999-9999"
          />
          {errors?.phone ? <span className="mt-1 block text-xs text-destructive">{errors.phone}</span> : null}
        </Field>
        <Field label="E-mail">
          <input
            value={buyer.email}
            onChange={(e) => patch("email", e.target.value)}
            type="email"
            className={inputClass}
            placeholder="voce@email.com"
          />
          {errors?.email ? <span className="mt-1 block text-xs text-destructive">{errors.email}</span> : null}
        </Field>
        <Field label="CPF">
          <input
            value={buyer.cpf}
            onChange={(e) => patch("cpf", e.target.value)}
            className={inputClass}
            placeholder="000.000.000-00"
          />
          {errors?.cpf ? <span className="mt-1 block text-xs text-destructive">{errors.cpf}</span> : null}
        </Field>
      </div>
    </section>
  );
}
