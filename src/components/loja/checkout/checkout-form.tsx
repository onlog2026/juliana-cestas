"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, MapPin, Store } from "lucide-react";
import { checkoutInputSchema, type CheckoutInput } from "@/modules/checkout/schemas";
import { CARD_TEMPLATES, countWords } from "@/modules/cards/templates";
import { formatCents } from "@/lib/money";
import type { DbProduct, DbProductAddon } from "@/modules/catalog/service";
import type { DeliveryZone } from "@/modules/delivery/settings";
import type { DaySlots } from "@/modules/delivery/slots";

type Props = {
  product: DbProduct;
  addons: DbProductAddon[];
  zones: DeliveryZone[];
  cardMaxWords: number;
};

const DRAFT_VERSION = 1;

function draftKey(slug: string) {
  return `jc:checkout:${slug}:v${DRAFT_VERSION}`;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatDayLabel(dateStr: string, weekday: number) {
  const [, m, d] = dateStr.split("-");
  return `${weekdayNames[weekday]} ${d}/${m}`;
}

export function CheckoutForm({ product, addons, zones, cardMaxWords }: Props) {
  const router = useRouter();
  const key = draftKey(product.slug);

  const idempotencyKeyRef = useRef<string>("");
  if (!idempotencyKeyRef.current) idempotencyKeyRef.current = newIdempotencyKey();

  const {
    register,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutInputSchema),
    defaultValues: {
      idempotencyKey: idempotencyKeyRef.current,
      productSlug: product.slug,
      addonSlugs: [],
      deliveryType: "delivery",
      cardTemplate: CARD_TEMPLATES[0].slug,
      buyerName: "",
      buyerEmail: "",
      buyerPhone: "",
      buyerCpf: "",
      recipientName: "",
      cardRecipient: "",
      cardMessage: "",
      deliveryDate: "",
      deliverySlotStart: "",
    },
  });

  // ── Rascunho: restaura ao montar, salva com debounce ────────────────────
  const [draftRestored, setDraftRestored] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const draft = JSON.parse(raw) as { v: number; idempotencyKey: string; values: Partial<CheckoutInput> };
        if (draft.v === DRAFT_VERSION) {
          idempotencyKeyRef.current = draft.idempotencyKey || idempotencyKeyRef.current;
          Object.entries(draft.values).forEach(([field, value]) => {
            if (value !== undefined) setValue(field as keyof CheckoutInput, value as never);
          });
          setValue("idempotencyKey", idempotencyKeyRef.current);
          setDraftRestored(true);
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch {
      /* rascunho corrompido -- ignora e comeca do zero */
    }
  }, []);

  useEffect(() => {
    const saveTimer = setTimeout(() => {
      const values = getValues();
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ v: DRAFT_VERSION, idempotencyKey: idempotencyKeyRef.current, values })
        );
        setSavedAt(new Date());
      } catch {
        /* localStorage indisponivel (privado/bloqueado) -- segue sem rascunho */
      }
    }, 500);
    return () => clearTimeout(saveTimer);
  });

  useEffect(() => {
    const flush = () => {
      const values = getValues();
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ v: DRAFT_VERSION, idempotencyKey: idempotencyKeyRef.current, values })
        );
      } catch {
        /* ignora */
      }
    };
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── CEP ──────────────────────────────────────────────────────────────────
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const cepValue = watch("cep");

  useEffect(() => {
    const digits = (cepValue || "").replace(/\D/g, "");
    if (digits.length !== 8) return;
    let cancelled = false;
    setCepLoading(true);
    setCepError(null);
    fetch(`/api/cep/${digits}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setCepError("CEP não encontrado — preencha o endereço manualmente.");
          return;
        }
        if (!getValues("street")) setValue("street", data.street);
        if (!getValues("neighborhood")) setValue("neighborhood", data.neighborhood);
        if (!getValues("city")) setValue("city", data.city);
        if (!getValues("state")) setValue("state", data.state);
      })
      .catch(() => !cancelled && setCepError("Não deu pra consultar o CEP agora."))
      .finally(() => !cancelled && setCepLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepValue]);

  // ── Horários ─────────────────────────────────────────────────────────────
  const [days, setDays] = useState<DaySlots[] | null>(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  useEffect(() => {
    fetch("/api/checkout/slots")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.days)) {
          setDays(data.days);
          const firstOpen = data.days.findIndex(
            (d: DaySlots) => !d.closed && d.slots.some((s) => s.available)
          );
          if (firstOpen >= 0) setSelectedDayIdx(firstOpen);
        }
      })
      .catch(() => setDays([]));
  }, []);

  const deliveryDate = watch("deliveryDate");
  const deliverySlotStart = watch("deliverySlotStart");
  const chosenDay = days?.find((d) => d.date === deliveryDate);

  function pickSlot(date: string, start: string) {
    setValue("deliveryDate", date, { shouldValidate: true });
    setValue("deliverySlotStart", start, { shouldValidate: true });
  }

  // ── Cartão ───────────────────────────────────────────────────────────────
  const cardTemplate = watch("cardTemplate");
  const cardMessage = watch("cardMessage") || "";
  const cardRecipient = watch("cardRecipient") || "";
  const cardSender = watch("cardSender") || "";
  const wordCount = countWords(cardMessage);
  const template = CARD_TEMPLATES.find((t) => t.slug === cardTemplate) ?? CARD_TEMPLATES[0];

  const onCardMessageChange = useCallback(
    (raw: string) => {
      if (countWords(raw) > cardMaxWords && raw.length > cardMessage.length) return;
      setValue("cardMessage", raw);
    },
    [cardMaxWords, cardMessage, setValue]
  );

  // ── Entrega / retirada ──────────────────────────────────────────────────
  const deliveryType = watch("deliveryType");
  const addonSlugs = watch("addonSlugs") || [];

  function toggleAddon(slug: string) {
    const current = getValues("addonSlugs") || [];
    setValue(
      "addonSlugs",
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    );
  }

  const totalCents = useMemo(() => {
    const addonsCents = addonSlugs.reduce((sum, slug) => {
      const addon = addons.find((a) => a.slug === slug);
      return sum + (addon?.price_cents ?? 0);
    }, 0);
    const zone = zones.find((z) => z.id === watch("zoneId"));
    const deliveryFee = deliveryType === "delivery" ? zone?.fee_cents ?? 0 : 0;
    return product.price_cents + addonsCents + deliveryFee;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addonSlugs, deliveryType, watch("zoneId")]);

  // ── Envio ────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(values: CheckoutInput) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, idempotencyKey: idempotencyKeyRef.current }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Não foi possível concluir o pedido.");
        setSubmitting(false);
        return;
      }
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignora */
      }
      router.push(`/pedido/${data.orderId}?t=${data.token}`);
    } catch {
      setSubmitError("Falha de conexão. Tenta de novo.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-10">
        {draftRestored ? (
          <p className="rounded-card border border-border bg-secondary/40 px-4 py-2.5 text-sm text-muted-foreground">
            Recuperamos o que você já tinha preenchido.
          </p>
        ) : null}

        {/* 1. Comprador */}
        <section>
          <h2 className="font-display text-xl text-foreground">Quem está comprando</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" error={errors.buyerName?.message}>
              <input {...register("buyerName")} className={inputClass} placeholder="Seu nome completo" />
            </Field>
            <Field label="WhatsApp" error={errors.buyerPhone?.message}>
              <input {...register("buyerPhone")} className={inputClass} placeholder="(61) 99999-9999" />
            </Field>
            <Field label="E-mail" error={errors.buyerEmail?.message}>
              <input {...register("buyerEmail")} type="email" className={inputClass} placeholder="voce@email.com" />
            </Field>
            <Field label="CPF" error={errors.buyerCpf?.message} hint="Necessário para emitir o pagamento.">
              <input {...register("buyerCpf")} className={inputClass} placeholder="000.000.000-00" />
            </Field>
          </div>
        </section>

        {/* 2. Entrega */}
        <section>
          <h2 className="font-display text-xl text-foreground">Para quem e onde entregar</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nome de quem vai receber" error={errors.recipientName?.message}>
              <input {...register("recipientName")} className={inputClass} placeholder="Nome de quem recebe" />
            </Field>
            <Field label="Telefone de quem recebe (opcional)">
              <input {...register("recipientPhone")} className={inputClass} placeholder="(61) 99999-9999" />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setValue("deliveryType", "delivery")}
              className={toggleClass(deliveryType === "delivery")}
            >
              <MapPin className="size-4" /> Entrega
            </button>
            <button
              type="button"
              onClick={() => setValue("deliveryType", "pickup")}
              className={toggleClass(deliveryType === "pickup")}
            >
              <Store className="size-4" /> Retirar na loja
            </button>
          </div>

          {deliveryType === "delivery" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="CEP" error={cepError ?? undefined} hint={cepLoading ? "Buscando endereço…" : undefined}>
                <input {...register("cep")} className={inputClass} placeholder="00000-000" maxLength={9} />
              </Field>
              <Field label="Região" error={errors.zoneId?.message}>
                <select {...register("zoneId")} className={inputClass}>
                  <option value="">Selecione</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} {zone.fee_cents > 0 ? `— ${formatCents(zone.fee_cents)}` : "— grátis"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Rua" error={errors.street?.message}>
                <input {...register("street")} className={inputClass} />
              </Field>
              <Field label="Número" error={errors.addressNumber?.message}>
                <input {...register("addressNumber")} className={inputClass} />
              </Field>
              <Field label="Complemento (opcional)">
                <input {...register("complement")} className={inputClass} placeholder="Apto, bloco…" />
              </Field>
              <Field label="Bairro" error={errors.neighborhood?.message}>
                <input {...register("neighborhood")} className={inputClass} />
              </Field>
              <Field label="Cidade">
                <input {...register("city")} className={inputClass} />
              </Field>
              <Field label="UF">
                <input {...register("state")} className={inputClass} maxLength={2} />
              </Field>
            </div>
          ) : null}
        </section>

        {/* 3. Data e hora */}
        <section>
          <h2 className="font-display text-xl text-foreground">Data e horário</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pedidos com 24 horas de antecedência. Tolerância de até 20 minutos na entrega.
          </p>

          {!days ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando horários…</p>
          ) : (
            <>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {days.slice(0, 14).map((day, i) => {
                  const hasSlot = !day.closed && day.slots.some((s) => s.available);
                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={!hasSlot}
                      onClick={() => setSelectedDayIdx(i)}
                      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                        i === selectedDayIdx
                          ? "border-primary bg-primary text-primary-foreground"
                          : hasSlot
                            ? "border-border bg-card text-foreground hover:bg-accent"
                            : "cursor-not-allowed border-border bg-secondary/40 text-muted-foreground/50"
                      }`}
                    >
                      {formatDayLabel(day.date, day.weekday)}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {days[selectedDayIdx]?.slots.map((slot) => {
                  const isChosen = deliveryDate === days[selectedDayIdx].date && deliverySlotStart === slot.start;
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => pickSlot(days[selectedDayIdx].date, slot.start)}
                      className={`rounded-[10px] border px-3 py-2.5 text-sm font-medium transition-colors ${
                        isChosen
                          ? "border-primary bg-primary text-primary-foreground"
                          : slot.available
                            ? "border-border bg-card text-foreground hover:bg-accent"
                            : "cursor-not-allowed border-border bg-secondary/30 text-muted-foreground/50 line-through"
                      }`}
                    >
                      {slot.start}
                    </button>
                  );
                })}
              </div>

              {errors.deliveryDate ? (
                <p className="mt-2 text-sm text-destructive">Escolha um horário de entrega.</p>
              ) : null}

              {deliveryDate && deliverySlotStart && chosenDay ? (
                <p className="mt-3 flex items-center gap-2 rounded-card border border-primary/30 bg-accent px-4 py-2.5 text-sm text-foreground">
                  <Check className="size-4 shrink-0 text-primary" />
                  Confirmado: entrega{" "}
                  <strong>{formatDayLabel(chosenDay.date, chosenDay.weekday)}</strong>, entre{" "}
                  <strong>
                    {deliverySlotStart} e {chosenDay.slots.find((s) => s.start === deliverySlotStart)?.end}
                  </strong>
                  .
                </p>
              ) : null}
            </>
          )}
        </section>

        {/* 4. Cartão */}
        <section>
          <h2 className="font-display text-xl text-foreground">Cartãozinho</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CARD_TEMPLATES.map((t) => (
              <button
                key={t.slug}
                type="button"
                onClick={() => setValue("cardTemplate", t.slug)}
                className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                  cardTemplate === t.slug
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-accent"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Para" error={errors.cardRecipient?.message}>
              <input {...register("cardRecipient")} className={inputClass} placeholder="Nome de quem vai receber" />
            </Field>
            <Field label="De (opcional)">
              <input {...register("cardSender")} className={inputClass} placeholder="Seu nome" />
            </Field>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 flex items-center justify-between text-sm font-medium text-foreground">
              Mensagem
              <span className={wordCount >= cardMaxWords ? "text-destructive" : "text-muted-foreground"}>
                {wordCount} de {cardMaxWords} palavras
              </span>
            </span>
            <textarea
              value={cardMessage}
              onChange={(e) => onCardMessageChange(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-[10px] border border-border bg-card px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Escreva a mensagem do cartão"
            />
          </label>

          <div className="mt-6 flex justify-center">
            <div
              className={`w-full max-w-sm rounded-2xl border px-8 py-10 ${template.paperClass} ${template.borderClass}`}
              style={{ boxShadow: "var(--jc-shadow)" }}
            >
              <p className="font-display text-lg leading-relaxed text-[#3a3226]">
                {cardMessage || "Sua mensagem aparece aqui."}
              </p>
              <p className="mt-6 font-display text-base text-[#3a3226]">
                Para {cardRecipient || "quem você ama"}
                {cardSender ? `, de ${cardSender}` : ""}.
              </p>
              <p className="mt-8 text-xs uppercase tracking-[0.12em] text-[#8a7d5f]">Juliana Cestas</p>
            </div>
          </div>
        </section>

        {/* 5. Observações */}
        <section>
          <h2 className="font-display text-xl text-foreground">Observações</h2>
          <textarea
            {...register("notes")}
            rows={3}
            maxLength={300}
            className="mt-3 w-full resize-none rounded-[10px] border border-border bg-card px-3.5 py-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Portaria, horário de almoço, alergias…"
          />
        </section>

        {submitError ? (
          <p className="rounded-card border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
      </div>

      {/* Resumo */}
      <aside className="h-fit space-y-4 rounded-card border border-border bg-card p-5 lg:sticky lg:top-24">
        <div className="flex gap-3">
          {product.image_url ? (
            <div className="relative size-16 shrink-0 overflow-hidden rounded-[10px] bg-secondary">
              <Image src={product.image_url} alt={product.name} fill sizes="64px" className="object-cover" />
            </div>
          ) : null}
          <div>
            <p className="text-sm font-semibold text-foreground">{product.name}</p>
            <p className="text-xs text-muted-foreground">{product.serves}</p>
          </div>
        </div>

        {addons.length > 0 ? (
          <div className="space-y-2 border-t border-border pt-4">
            {addons.map((addon) => (
              <label key={addon.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <input
                    type="checkbox"
                    checked={addonSlugs.includes(addon.slug)}
                    onChange={() => toggleAddon(addon.slug)}
                    className="size-4 rounded border-border"
                  />
                  {addon.name}
                </span>
                <span className="text-muted-foreground">{formatCents(addon.price_cents)}</span>
              </label>
            ))}
          </div>
        ) : null}

        <div className="border-t border-border pt-4 text-sm text-muted-foreground">
          {deliveryType === "pickup" ? "Retirada na loja" : "Entrega"}
        </div>

        <div className="flex items-baseline justify-between border-t border-border pt-4">
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="text-xl font-bold tabular-nums text-foreground">{formatCents(totalCents)}</span>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="jc-shine-cta flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="size-5 animate-spin" /> : null}
          Ir para pagamento
        </button>

        <p className="text-center text-xs text-muted-foreground">
          {savedAt ? `Rascunho salvo às ${savedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Salvando rascunho…"}
        </p>
      </aside>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-[10px] border border-border bg-card px-3.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function toggleClass(active: boolean) {
  return `inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
    active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent"
  }`;
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : null}
      {!error && hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
