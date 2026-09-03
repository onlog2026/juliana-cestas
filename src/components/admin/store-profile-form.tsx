"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updateStoreProfile } from "@/modules/settings/actions";
import type { StoreProfile } from "@/modules/settings/store-profile";

type Draft = {
  businessName: string;
  document: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  addressNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

function toDraft(profile: StoreProfile): Draft {
  return {
    businessName: profile.businessName ?? "",
    document: profile.document ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    cep: profile.cep ?? "",
    street: profile.street ?? "",
    addressNumber: profile.addressNumber ?? "",
    complement: profile.complement ?? "",
    neighborhood: profile.neighborhood ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
  };
}

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function StoreProfileForm({ profile }: { profile: StoreProfile }) {
  const [draft, setDraft] = useState<Draft>(toDraft(profile));
  const [pending, startTransition] = useTransition();
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  }

  async function handleCepBlur() {
    const digits = draft.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`/api/cep/${digits}`);
      const data = await res.json();
      if (!data.error) {
        setDraft((d) => ({
          ...d,
          street: d.street || data.street,
          neighborhood: d.neighborhood || data.neighborhood,
          city: d.city || data.city,
          state: d.state || data.state,
        }));
      }
    } catch {
      /* CEP indisponível -- admin preenche manualmente */
    } finally {
      setCepLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateStoreProfile(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Nome da empresa</span>
          <input
            value={draft.businessName}
            onChange={(e) => set("businessName", e.target.value)}
            placeholder="Juliana Cestas"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">CPF ou CNPJ</span>
          <input value={draft.document} onChange={(e) => set("document", e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">E-mail de contato</span>
          <input
            type="email"
            value={draft.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Telefone / WhatsApp</span>
          <input
            value={draft.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="(61) 99999-9999"
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 rounded-[10px] border border-border bg-secondary/30 p-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">
            CEP {cepLoading ? <span className="text-muted-foreground">— buscando…</span> : null}
          </span>
          <input
            value={draft.cep}
            onChange={(e) => set("cep", e.target.value)}
            onBlur={handleCepBlur}
            placeholder="00000-000"
            maxLength={9}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Rua</span>
          <input value={draft.street} onChange={(e) => set("street", e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Número</span>
          <input
            value={draft.addressNumber}
            onChange={(e) => set("addressNumber", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Complemento</span>
          <input
            value={draft.complement}
            onChange={(e) => set("complement", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Bairro</span>
          <input
            value={draft.neighborhood}
            onChange={(e) => set("neighborhood", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">Cidade</span>
          <input value={draft.city} onChange={(e) => set("city", e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-foreground">UF</span>
          <input value={draft.state} onChange={(e) => set("state", e.target.value)} maxLength={2} className={inputClass} />
        </label>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
        {saved ? "Salvo" : "Salvar"}
      </button>
    </form>
  );
}
