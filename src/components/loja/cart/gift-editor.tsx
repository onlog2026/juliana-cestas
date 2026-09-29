"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Gift, Loader2, MapPin, MessageSquareHeart, PackagePlus, Store, Truck, UserRound } from "lucide-react";
import { SectionTitle } from "@/components/loja/section-title";
import type { CartItem } from "@/modules/cart/types";
import { giftIssues } from "@/modules/cart/validate";
import type { DaySlots } from "@/modules/delivery/slots";
import type { DbProductAddon, UpsellProduct } from "@/modules/catalog/service";
import { CARD_TEMPLATES, countWords } from "@/modules/cards/templates";
import { addOne, countBySlug, removeOne } from "@/modules/checkout/addon-qty";
import { CalendarPicker } from "@/components/loja/checkout/calendar-picker";
import { CardFace } from "@/components/loja/card-face";
import { AddonPicker } from "@/components/loja/checkout/addon-picker";
import { formatCents } from "@/lib/money";

// ── Tipos das respostas de API que o editor consome ────────────────────────
type CarrierOptionDTO = { name: string; companyName: string | null; priceCents: number; deliveryDays: number | null };
type FreteResult =
  | { served: true; zoneName: string; deliveryFeeCents: number; prazoMinDays: number | null; prazoMaxDays: number | null; freeShipping: boolean }
  | { served: false; message: string; carrierOptions?: CarrierOptionDTO[] };

type GiftOptions = {
  product: {
    id: string; slug: string; name: string; serves: string | null; size: string | null;
    image_url: string | null; price_cents: number; delivery_fee_cents: number;
  };
  addons: DbProductAddon[];
  upsells: UpsellProduct[];
};

// ── Primitivos copiados do checkout-form (não são exportados de lá) ──────────
const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const textareaClass =
  "w-full resize-none rounded-[10px] border border-border bg-card px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function toggleClass(active: boolean) {
  return `inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent"
  }`;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function formatPrazo(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}–${max} dias úteis`;
  return `até ${max ?? min} dias úteis`;
}

type Props = {
  gift: CartItem;
  days: DaySlots[] | null;
  cardMaxWords: number;
  storeName?: string;
  onSave: (next: CartItem) => void;
  onCancel: () => void;
};

/**
 * Editor de UMA cesta do carrinho: destinatário, entrega (CEP→endereço+frete),
 * data/horário, cartãozinho, adicionais e upsell. Reaproveita as peças do
 * checkout (CalendarPicker, CardFace, AddonPicker, addon-qty) e os endpoints
 * /api/cep, /api/frete, /api/checkout/slots -- SEM tocar no checkout-form.
 */
export function GiftEditor({ gift, days, cardMaxWords, storeName, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<CartItem>(gift);
  const [options, setOptions] = useState<GiftOptions | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [frete, setFrete] = useState<FreteResult | null>(null);
  const [freteLoading, setFreteLoading] = useState(false);

  const [selectedHour, setSelectedHour] = useState(
    gift.delivery.deliverySlotStart ? gift.delivery.deliverySlotStart.split(":")[0] : ""
  );
  const [showErrors, setShowErrors] = useState(false);

  const patchDelivery = useCallback(
    (patch: Partial<CartItem["delivery"]>) => setDraft((d) => ({ ...d, delivery: { ...d.delivery, ...patch } })),
    []
  );
  const patchCard = useCallback(
    (patch: Partial<CartItem["card"]>) => setDraft((d) => ({ ...d, card: { ...d.card, ...patch } })),
    []
  );
  const patchRecipient = useCallback(
    (patch: Partial<CartItem["recipient"]>) => setDraft((d) => ({ ...d, recipient: { ...d.recipient, ...patch } })),
    []
  );

  // Carrega produto + adicionais + upsell desta cesta.
  useEffect(() => {
    let cancelled = false;
    setOptionsError(null);
    fetch(`/api/checkout/gift-options?slug=${encodeURIComponent(gift.productSlug)}`)
      .then((r) => r.json())
      .then((data: GiftOptions & { error?: string }) => {
        if (cancelled) return;
        if (data.error) setOptionsError(data.error);
        else setOptions(data);
      })
      .catch(() => !cancelled && setOptionsError("Não deu pra carregar as opções desta cesta."));
    return () => {
      cancelled = true;
    };
  }, [gift.productSlug]);

  // Cesta nova: já seleciona o 1º modelo de cartão (senão o preview fica vazio e
  // "modelo do cartão" apareceria como pendência de cara).
  useEffect(() => {
    if (!draft.card.template) patchCard({ template: CARD_TEMPLATES[0].slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cepDigits = draft.delivery.cep.replace(/\D/g, "");

  // CEP → preenche só os campos vazios do endereço (não sobrescreve o que a
  // pessoa digitou), igual ao checkout.
  useEffect(() => {
    if (cepDigits.length !== 8) return;
    let cancelled = false;
    setCepLoading(true);
    setCepError(null);
    fetch(`/api/cep/${cepDigits}`)
      .then((r) => r.json())
      .then((data: { error?: string; street?: string; neighborhood?: string; city?: string; state?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setCepError("CEP não encontrado — preencha o endereço manualmente.");
          return;
        }
        setDraft((d) => ({
          ...d,
          delivery: {
            ...d.delivery,
            street: d.delivery.street || data.street || "",
            neighborhood: d.delivery.neighborhood || data.neighborhood || "",
            city: d.delivery.city || data.city || "",
            state: d.delivery.state || data.state || "",
          },
        }));
      })
      .catch(() => !cancelled && setCepError("Não deu pra consultar o CEP agora."))
      .finally(() => !cancelled && setCepLoading(false));
    return () => {
      cancelled = true;
    };
  }, [cepDigits]);

  // Frete: recalcula quando muda CEP/tipo/adicionais/upsell (frete grátis acima de X).
  const addonsSig = JSON.stringify(draft.addonSlugs);
  const upsellsSig = JSON.stringify(draft.upsellSlugs);
  useEffect(() => {
    if (draft.delivery.type !== "delivery" || cepDigits.length !== 8) {
      setFrete(null);
      setFreteLoading(false);
      return;
    }
    let cancelled = false;
    setFreteLoading(true);
    fetch("/api/frete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug: draft.productSlug,
        addonSlugs: draft.addonSlugs,
        upsellSlugs: draft.upsellSlugs,
        cep: cepDigits,
      }),
    })
      .then((r) => r.json())
      .then((data: FreteResult) => !cancelled && setFrete(data))
      .catch(() => !cancelled && setFrete({ served: false, message: "Não deu pra calcular o frete agora. Tente de novo." }))
      .finally(() => !cancelled && setFreteLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepDigits, draft.delivery.type, addonsSig, upsellsSig, draft.productSlug]);

  // Data/horário (slots vêm prontos do pai).
  const chosenDay = days?.find((d) => d.date === draft.delivery.deliveryDate);
  const hourOptions = useMemo(() => {
    if (!chosenDay) return [];
    const byHour = new Map<string, boolean>();
    for (const slot of chosenDay.slots) {
      const hour = slot.start.split(":")[0];
      byHour.set(hour, (byHour.get(hour) ?? false) || slot.available);
    }
    return Array.from(byHour.entries()).map(([hour, hasAvailable]) => ({ hour, hasAvailable }));
  }, [chosenDay]);
  const selectedMinute = draft.delivery.deliverySlotStart ? draft.delivery.deliverySlotStart.split(":")[1] : "";
  const minuteOptions = useMemo(() => {
    if (!chosenDay || !selectedHour) return [];
    return chosenDay.slots
      .filter((s) => s.start.startsWith(`${selectedHour}:`))
      .map((s) => ({ minute: s.start.split(":")[1], available: s.available }));
  }, [chosenDay, selectedHour]);

  function handleDayChange(date: string) {
    setSelectedHour("");
    patchDelivery({ deliveryDate: date, deliverySlotStart: "" });
  }
  function handleHourChange(hour: string) {
    setSelectedHour(hour);
    patchDelivery({ deliverySlotStart: "" });
  }
  function handleMinuteChange(minute: string) {
    if (!draft.delivery.deliveryDate || !selectedHour) return;
    patchDelivery({ deliverySlotStart: `${selectedHour}:${minute}` });
  }

  // Cartão.
  const cardTemplate = CARD_TEMPLATES.find((t) => t.slug === draft.card.template) ?? CARD_TEMPLATES[0];
  const wordCount = countWords(draft.card.message);
  const onCardMessageChange = useCallback(
    (raw: string) => {
      if (countWords(raw) > cardMaxWords && raw.length > draft.card.message.length) return;
      patchCard({ message: raw });
    },
    [cardMaxWords, draft.card.message, patchCard]
  );

  // Adicionais / upsell.
  const addAddon = (slug: string) => setDraft((d) => ({ ...d, addonSlugs: addOne(d.addonSlugs, slug) }));
  const removeAddon = (slug: string) => setDraft((d) => ({ ...d, addonSlugs: removeOne(d.addonSlugs, slug) }));
  const toggleUpsell = (slug: string) =>
    setDraft((d) => ({
      ...d,
      upsellSlugs: d.upsellSlugs.includes(slug) ? d.upsellSlugs.filter((s) => s !== slug) : [...d.upsellSlugs, slug],
    }));

  // Subtotal estimado (só exibição; o valor válido é recalculado no servidor).
  const estimated = useMemo(() => {
    if (!options) return null;
    let cents = options.product.price_cents;
    const qty = countBySlug(draft.addonSlugs);
    for (const a of options.addons) cents += a.price_cents * (qty.get(a.slug) ?? 0);
    for (const u of options.upsells) if (draft.upsellSlugs.includes(u.slug)) cents += u.price_cents;
    if (draft.delivery.type === "delivery" && frete && frete.served) cents += frete.deliveryFeeCents;
    return cents;
  }, [options, draft.addonSlugs, draft.upsellSlugs, draft.delivery.type, frete]);

  function handleSave() {
    const issues = giftIssues(draft);
    if (issues.length > 0) {
      setShowErrors(true);
      return;
    }
    const isPickup = draft.delivery.type === "pickup";
    const feeCents = isPickup ? 0 : frete && frete.served ? frete.deliveryFeeCents : draft.delivery.feeCents;
    const zoneName = isPickup ? "Retirada na loja" : frete && frete.served ? frete.zoneName : draft.delivery.zoneName;
    onSave({
      ...draft,
      delivery: { ...draft.delivery, feeCents: feeCents ?? null, zoneName: zoneName ?? null },
      estimatedCents: estimated,
    });
  }

  const issues = giftIssues(draft);
  const isDelivery = draft.delivery.type === "delivery";
  const prazo = frete && frete.served ? formatPrazo(frete.prazoMinDays, frete.prazoMaxDays) : null;

  if (optionsError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-destructive">{optionsError}</p>
        <button type="button" onClick={onCancel} className="mt-3 text-sm font-medium text-primary hover:underline">
          Fechar
        </button>
      </div>
    );
  }

  if (!options) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Carregando as opções da cesta…
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-primary/30 bg-card p-5">
      {/* 1. Quem recebe */}
      <section>
        <SectionTitle icon={UserRound} as="h3" size="lg">Quem vai receber</SectionTitle>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Nome de quem recebe">
            <input
              value={draft.recipient.name}
              onChange={(e) => patchRecipient({ name: e.target.value })}
              className={inputClass}
              placeholder="Nome de quem recebe"
            />
          </Field>
          <Field label="Telefone de quem recebe (opcional)">
            <input
              value={draft.recipient.phone}
              onChange={(e) => patchRecipient({ phone: e.target.value })}
              className={inputClass}
              placeholder="(61) 99999-9999"
            />
          </Field>
        </div>
      </section>

      {/* 2. Entrega ou retirada */}
      <section>
        <SectionTitle icon={Truck} as="h3" size="lg">Entrega ou retirada</SectionTitle>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={() => patchDelivery({ type: "delivery" })} className={toggleClass(isDelivery)}>
            <MapPin className="size-4" /> Entrega
          </button>
          <button type="button" onClick={() => patchDelivery({ type: "pickup" })} className={toggleClass(!isDelivery)}>
            <Store className="size-4" /> Retirar na loja
          </button>
        </div>

        {isDelivery ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CEP" hint={cepLoading ? "Consultando o CEP…" : undefined}>
                <input
                  value={draft.delivery.cep}
                  onChange={(e) => patchDelivery({ cep: e.target.value })}
                  className={inputClass}
                  placeholder="00000-000"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Número">
                <input
                  value={draft.delivery.addressNumber}
                  onChange={(e) => patchDelivery({ addressNumber: e.target.value })}
                  className={inputClass}
                  placeholder="123"
                />
              </Field>
              <Field label="Rua">
                <input
                  value={draft.delivery.street}
                  onChange={(e) => patchDelivery({ street: e.target.value })}
                  className={inputClass}
                  placeholder="Rua / Quadra"
                />
              </Field>
              <Field label="Bairro">
                <input
                  value={draft.delivery.neighborhood}
                  onChange={(e) => patchDelivery({ neighborhood: e.target.value })}
                  className={inputClass}
                  placeholder="Bairro"
                />
              </Field>
              <Field label="Complemento (opcional)">
                <input
                  value={draft.delivery.complement}
                  onChange={(e) => patchDelivery({ complement: e.target.value })}
                  className={inputClass}
                  placeholder="Apto, bloco, referência"
                />
              </Field>
              <Field label="Cidade / UF">
                {/* style inline (não classe) de propósito: inputClass já traz
                    w-full, e como classe utilitária tem a MESMA especificidade
                    que w-20/flex-1, quem ganha é a ordem interna da folha do
                    Tailwind, não a ordem no atributo class -- na prática o
                    w-full "vencia" e o campo Cidade ficava espremido a 30px.
                    style inline sempre tem prioridade, então resolve de vez. */}
                <div className="flex gap-2">
                  <input
                    value={draft.delivery.city}
                    onChange={(e) => patchDelivery({ city: e.target.value })}
                    className={inputClass}
                    style={{ flex: "1 1 0%", minWidth: 0 }}
                    placeholder="Cidade"
                  />
                  <input
                    value={draft.delivery.state}
                    onChange={(e) => patchDelivery({ state: e.target.value.toUpperCase().slice(0, 2) })}
                    className={inputClass}
                    style={{ width: "5rem", flexShrink: 0 }}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </Field>
            </div>

            {cepError ? <p className="text-xs text-destructive">{cepError}</p> : null}

            {/* Frete calculado */}
            {freteLoading ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Calculando o frete…
              </p>
            ) : frete && frete.served ? (
              <div className="flex items-start gap-2 rounded-[10px] border border-primary/30 bg-secondary/40 p-3 text-sm">
                <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="text-foreground">
                  Entrega para <strong>{frete.zoneName}</strong> —{" "}
                  {frete.freeShipping || frete.deliveryFeeCents === 0 ? "frete grátis" : formatCents(frete.deliveryFeeCents)}
                  {prazo ? ` · ${prazo}` : ""}
                </span>
              </div>
            ) : frete && !frete.served ? (
              <p className="rounded-[10px] border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">{frete.message}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 rounded-[10px] border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
            Retirada na loja é sempre grátis. Você escolhe a data e o horário abaixo.
          </p>
        )}
      </section>

      {/* 3. Data e horário */}
      <section>
        <SectionTitle icon={CalendarDays} as="h3" size="lg">Quando entregar</SectionTitle>
        {days === null ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Carregando as datas…
          </p>
        ) : days.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Sem datas disponíveis no momento.</p>
        ) : (
          <div className="mt-3 space-y-4">
            <CalendarPicker days={days} selectedDate={draft.delivery.deliveryDate} onSelect={handleDayChange} />
            {draft.delivery.deliveryDate ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Hora">
                  <select value={selectedHour} onChange={(e) => handleHourChange(e.target.value)} className={inputClass}>
                    <option value="">Escolha a hora</option>
                    {hourOptions.map(({ hour, hasAvailable }) => (
                      <option key={hour} value={hour} disabled={!hasAvailable}>
                        {hour}h {hasAvailable ? "" : "(esgotado)"}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Minutos">
                  <select
                    value={selectedMinute}
                    onChange={(e) => handleMinuteChange(e.target.value)}
                    className={inputClass}
                    disabled={!selectedHour}
                  >
                    <option value="">{selectedHour ? "Escolha os minutos" : "Escolha a hora antes"}</option>
                    {minuteOptions.map(({ minute, available }) => (
                      <option key={minute} value={minute} disabled={!available}>
                        {selectedHour}:{minute} {available ? "" : "(esgotado)"}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* 4. Adicionais */}
      {options.addons.length > 0 ? (
        <section>
          <SectionTitle icon={PackagePlus} as="h3" size="lg">Adicionais</SectionTitle>
          <div className="mt-3">
            <AddonPicker addons={options.addons} slugs={draft.addonSlugs} onAdd={addAddon} onRemove={removeAddon} />
          </div>
        </section>
      ) : null}

      {/* 5. Sugestões (upsell) */}
      {options.upsells.length > 0 ? (
        <section>
          <SectionTitle icon={Gift} as="h3" size="lg">Leve junto</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.upsells.map((u) => {
              const active = draft.upsellSlugs.includes(u.slug);
              return (
                <button key={u.slug} type="button" onClick={() => toggleUpsell(u.slug)} className={toggleClass(active)}>
                  {active ? "✓ " : "+ "}
                  {u.name} · {formatCents(u.price_cents)}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* 6. Cartãozinho */}
      <section>
        <SectionTitle icon={MessageSquareHeart} as="h3" size="lg">Cartãozinho</SectionTitle>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {CARD_TEMPLATES.map((t) => {
            const active = t.slug === draft.card.template;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => patchCard({ template: t.slug })}
                aria-pressed={active}
                className={`shrink-0 rounded-[12px] border p-1.5 transition-colors ${active ? "border-primary" : "border-border hover:bg-accent"}`}
              >
                <div className="w-20">
                  <CardFace template={t} compact />
                </div>
                <span className="mt-1 block text-center text-[11px] font-medium text-foreground">{t.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Para">
            <input
              value={draft.card.recipient}
              onChange={(e) => patchCard({ recipient: e.target.value })}
              className={inputClass}
              placeholder="Para quem é o cartão"
              maxLength={60}
            />
          </Field>
          <Field label="De (opcional)">
            <input
              value={draft.card.sender}
              onChange={(e) => patchCard({ sender: e.target.value })}
              className={inputClass}
              placeholder="Assinatura"
              maxLength={60}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Mensagem" hint={`${wordCount}/${cardMaxWords} palavras`}>
            <textarea
              value={draft.card.message}
              onChange={(e) => onCardMessageChange(e.target.value)}
              className={textareaClass}
              rows={3}
              placeholder="Escreva a mensagem do cartão"
            />
          </Field>
        </div>

        <div className="mt-4 max-w-xs">
          <CardFace
            template={cardTemplate}
            message={draft.card.message || "Sua mensagem aparece aqui…"}
            recipient={draft.card.recipient || "Para…"}
            sender={draft.card.sender}
            storeName={storeName}
          />
        </div>
      </section>

      {/* 7. Observações */}
      <section>
        <Field label="Observações (opcional)">
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value.slice(0, 300) }))}
            className={textareaClass}
            rows={2}
            placeholder="Algum detalhe da entrega ou da cesta"
          />
        </Field>
      </section>

      {/* Erros + subtotal + ações */}
      {showErrors && issues.length > 0 ? (
        <p className="rounded-[10px] border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          Falta preencher: {issues.join(", ")}.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Subtotal desta cesta:{" "}
          <strong className="text-foreground">{estimated !== null ? formatCents(estimated) : "—"}</strong>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-full border border-border px-5 text-sm font-medium text-foreground hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Salvar cesta
          </button>
        </div>
      </div>
    </div>
  );
}
