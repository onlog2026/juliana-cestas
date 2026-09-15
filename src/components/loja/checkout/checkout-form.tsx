"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, MapPin, MessageCircle, Store, Tag, Truck, X } from "lucide-react";
import { checkoutInputSchema, type CheckoutInput } from "@/modules/checkout/schemas";
import { CARD_TEMPLATES, countWords } from "@/modules/cards/templates";
import { formatCents } from "@/lib/money";
import type { DbProduct, DbProductAddon, UpsellProduct } from "@/modules/catalog/service";
import type { DaySlots } from "@/modules/delivery/slots";
import { CalendarPicker } from "@/components/loja/checkout/calendar-picker";
import { CardPattern } from "@/components/loja/checkout/card-pattern";

/** Uma opção de transportadora (Correios/Melhor Envio) para fora da área local. */
type CarrierOptionDTO = {
  name: string;
  companyName: string | null;
  priceCents: number;
  deliveryDays: number | null;
};

/** Resposta de `/api/frete`: o frete calculado a partir do CEP. */
type FreteResult =
  | {
      served: true;
      zoneName: string;
      deliveryFeeCents: number;
      prazoMinDays: number | null;
      prazoMaxDays: number | null;
      freeShipping: boolean;
    }
  | { served: false; message: string; carrierOptions?: CarrierOptionDTO[] };

type Props = {
  product: DbProduct;
  addons: DbProductAddon[];
  upsells: UpsellProduct[];
  cardMaxWords: number;
  /** Nome da loja atual -- vem do servidor porque este componente e client. */
  storeName?: string;
  /** WhatsApp da loja (só dígitos) -- botão quando o CEP não é atendido. */
  whatsapp?: string;
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
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatDayLabel(dateStr: string, weekday: number) {
  const [, m, d] = dateStr.split("-");
  return `${weekdayNames[weekday]} ${d}/${m}`;
}

function formatDayOnlyLabel(dateStr: string, weekday: number) {
  const [, , d] = dateStr.split("-");
  return `${weekdayNames[weekday]} ${d}`;
}

export function CheckoutForm({ product, addons, upsells, cardMaxWords, storeName = "", whatsapp = "" }: Props) {
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
      upsellSlugs: [],
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
          if (draft.values.deliverySlotStart) {
            setSelectedHour(draft.values.deliverySlotStart.split(":")[0]);
          }
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
  const [frete, setFrete] = useState<FreteResult | null>(null);
  const [freteLoading, setFreteLoading] = useState(false);
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
  const [selectedHour, setSelectedHour] = useState("");

  useEffect(() => {
    fetch("/api/checkout/slots")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.days)) setDays(data.days);
      })
      .catch(() => setDays([]));
  }, []);

  const deliveryDate = watch("deliveryDate");
  const deliverySlotStart = watch("deliverySlotStart");
  const selectedMinute = deliverySlotStart ? deliverySlotStart.split(":")[1] : "";
  const chosenDay = days?.find((d) => d.date === deliveryDate);

  const hourOptions = useMemo(() => {
    if (!chosenDay) return [];
    const byHour = new Map<string, boolean>();
    for (const slot of chosenDay.slots) {
      const hour = slot.start.split(":")[0];
      byHour.set(hour, (byHour.get(hour) ?? false) || slot.available);
    }
    return Array.from(byHour.entries()).map(([hour, hasAvailable]) => ({ hour, hasAvailable }));
  }, [chosenDay]);

  const minuteOptions = useMemo(() => {
    if (!chosenDay || !selectedHour) return [];
    return chosenDay.slots
      .filter((s) => s.start.startsWith(`${selectedHour}:`))
      .map((s) => ({ minute: s.start.split(":")[1], available: s.available }));
  }, [chosenDay, selectedHour]);

  function pickSlot(date: string, start: string) {
    setValue("deliveryDate", date, { shouldValidate: true });
    setValue("deliverySlotStart", start, { shouldValidate: true });
  }

  function handleDayChange(date: string) {
    setSelectedHour("");
    setValue("deliveryDate", date, { shouldValidate: true });
    setValue("deliverySlotStart", "");
  }

  function handleHourChange(hour: string) {
    setSelectedHour(hour);
    setValue("deliverySlotStart", "");
  }

  function handleMinuteChange(minute: string) {
    if (!deliveryDate || !selectedHour) return;
    pickSlot(deliveryDate, `${selectedHour}:${minute}`);
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
  const upsellSlugs = watch("upsellSlugs") || [];

  function toggleAddon(slug: string) {
    const current = getValues("addonSlugs") || [];
    setValue(
      "addonSlugs",
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    );
  }

  function toggleUpsell(slug: string) {
    const current = getValues("upsellSlugs") || [];
    setValue(
      "upsellSlugs",
      current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug]
    );
  }

  // ── Frete por CEP ─────────────────────────────────────────────────────────
  // Quando o CEP tem 8 dígitos e é entrega, calcula o frete no servidor (mesma
  // conta do checkout). Recalcula se o cliente mexe nos adicionais/upsell, por
  // causa do "frete grátis acima de X".
  const addonsSig = JSON.stringify(addonSlugs);
  const upsellsSig = JSON.stringify(upsellSlugs);
  useEffect(() => {
    const digits = (cepValue || "").replace(/\D/g, "");
    if (deliveryType !== "delivery" || digits.length !== 8) {
      setFrete(null);
      setFreteLoading(false);
      return;
    }
    let cancelled = false;
    setFreteLoading(true);
    fetch("/api/frete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug: product.slug, addonSlugs, upsellSlugs, cep: digits }),
    })
      .then((r) => r.json())
      .then((data: FreteResult) => {
        if (!cancelled) setFrete(data);
      })
      .catch(() => {
        if (!cancelled) setFrete({ served: false, message: "Não deu pra calcular o frete agora. Tente de novo." });
      })
      .finally(() => {
        if (!cancelled) setFreteLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepValue, deliveryType, addonsSig, upsellsSig]);

  // ── Cupom ────────────────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountCents: number;
    deliveryFeeCents: number;
    signature: string;
  } | null>(null);

  const couponSignature = JSON.stringify({
    addonSlugs,
    upsellSlugs,
    deliveryType,
    cep: (cepValue || "").replace(/\D/g, ""),
  });

  // Item mudou depois de aplicar o cupom (frete/desconto ficariam errados) --
  // limpa em silêncio, sem mensagem de erro, só exige aplicar de novo.
  if (appliedCoupon && appliedCoupon.signature !== couponSignature) {
    setAppliedCoupon(null);
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setCouponApplying(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/checkout/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          addonSlugs,
          upsellSlugs,
          deliveryType,
          cep: (cepValue || "").replace(/\D/g, ""),
          couponCode: couponInput,
          buyerEmail: watch("buyerEmail") || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Cupom inválido.");
        return;
      }
      setAppliedCoupon({
        code: data.couponCode,
        discountCents: data.discountCents,
        deliveryFeeCents: data.deliveryFeeCents,
        signature: couponSignature,
      });
      setValue("couponCode", data.couponCode);
    } catch {
      setCouponError("Falha de conexão. Tenta de novo.");
    } finally {
      setCouponApplying(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    setValue("couponCode", undefined);
  }

  // Mercadoria = cesta + adicionais + produtos sugeridos (sem frete/desconto).
  const merchandiseCents = useMemo(() => {
    const addonsCents = addonSlugs.reduce((sum, slug) => {
      const addon = addons.find((a) => a.slug === slug);
      return sum + (addon?.price_cents ?? 0);
    }, 0);
    const upsellsCents = upsellSlugs.reduce((sum, slug) => {
      const upsell = upsells.find((u) => u.slug === slug);
      return sum + (upsell?.price_cents ?? 0);
    }, 0);
    return product.price_cents + addonsCents + upsellsCents;
  }, [addonSlugs, upsellSlugs, addons, upsells, product]);

  // Frete: cupom de frete grátis zera; senão é o valor calculado por CEP no
  // servidor (que já inclui frete próprio do produto e frete-grátis-acima-de-X).
  const deliveryFeeCents = useMemo(() => {
    if (appliedCoupon?.signature === couponSignature) return appliedCoupon.deliveryFeeCents;
    if (deliveryType !== "delivery") return 0;
    return frete?.served ? frete.deliveryFeeCents : 0;
  }, [appliedCoupon, couponSignature, deliveryType, frete]);

  const discountCents =
    appliedCoupon?.signature === couponSignature ? appliedCoupon.discountCents : 0;

  const totalCents = merchandiseCents + deliveryFeeCents - discountCents;

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
    <form
      onSubmit={handleSubmit(onSubmit, () =>
        setSubmitError("Falta preencher ou corrigir algum campo. Revise o formulário e tente de novo.")
      )}
      className="grid gap-8 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_440px]"
    >
      <div className="min-w-0 space-y-10">
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
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="CEP"
                  error={cepError ?? errors.cep?.message}
                  hint={cepLoading ? "Buscando endereço…" : "Digite o CEP e calculamos o frete pra você."}
                >
                  <input
                    {...register("cep")}
                    className={inputClass}
                    placeholder="00000-000"
                    maxLength={9}
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </Field>
              </div>

              <FreteBox
                frete={frete}
                loading={freteLoading}
                cepComplete={(cepValue || "").replace(/\D/g, "").length === 8}
                whatsapp={whatsapp}
                productName={product.name}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Rua" error={errors.street?.message}>
                  <input {...register("street")} className={inputClass} autoComplete="address-line1" />
                </Field>
                <Field label="Número" error={errors.addressNumber?.message}>
                  <input {...register("addressNumber")} className={inputClass} inputMode="numeric" />
                </Field>
                <Field label="Complemento (opcional)">
                  <input {...register("complement")} className={inputClass} placeholder="Apto, bloco…" />
                </Field>
                <Field label="Bairro" error={errors.neighborhood?.message}>
                  <input {...register("neighborhood")} className={inputClass} />
                </Field>
                <Field label="Cidade">
                  <input {...register("city")} className={inputClass} autoComplete="address-level2" />
                </Field>
                <Field label="UF">
                  <input {...register("state")} className={inputClass} maxLength={2} autoComplete="address-level1" />
                </Field>
              </div>
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
              <CalendarPicker days={days} selectedDate={deliveryDate} onSelect={handleDayChange} />

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Field label="Hora">
                  <select
                    value={selectedHour}
                    onChange={(e) => handleHourChange(e.target.value)}
                    disabled={!deliveryDate}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {hourOptions.map(({ hour, hasAvailable }) => (
                      <option key={hour} value={hour} disabled={!hasAvailable}>
                        {hour}h{!hasAvailable ? " (sem vaga)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Minuto">
                  <select
                    value={selectedMinute}
                    onChange={(e) => handleMinuteChange(e.target.value)}
                    disabled={!selectedHour}
                    className={inputClass}
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {minuteOptions.map(({ minute, available }) => (
                      <option key={minute} value={minute} disabled={!available}>
                        {minute}
                        {!available ? " (esgotado)" : ""}
                      </option>
                    ))}
                  </select>
                </Field>
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
              className={`relative w-full max-w-sm overflow-hidden rounded-2xl border px-8 py-10 ${template.paperClass} ${template.borderClass}`}
              style={{ boxShadow: "var(--jc-shadow)" }}
            >
              <CardPattern template={template} />
              <p className="relative font-display text-lg leading-relaxed text-[#3a3226]">
                {cardMessage || "Sua mensagem aparece aqui."}
              </p>
              <p className="relative mt-6 font-display text-base text-[#3a3226]">
                Para {cardRecipient || "quem você ama"}
                {cardSender ? `, de ${cardSender}` : ""}.
              </p>
              <p className="relative mt-8 text-xs uppercase tracking-[0.12em] text-[#8a7d5f]">{storeName}</p>
            </div>
          </div>
        </section>

        {/* 5. Aproveite e leve também (upsell / cross-sell) */}
        {upsells.length > 0 ? (
          <section>
            <h2 className="font-display text-xl text-foreground">Aproveite e leve também</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complementos que combinam com {product.name}.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {upsells.map((upsell) => {
                const checked = upsellSlugs.includes(upsell.slug);
                return (
                  <label
                    key={upsell.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-card border p-3 transition-colors ${
                      checked ? "border-primary bg-accent" : "border-border bg-card hover:bg-accent/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUpsell(upsell.slug)}
                      className="size-4 shrink-0 rounded border-border"
                    />
                    {upsell.image_url ? (
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-secondary">
                        <Image src={upsell.image_url} alt={upsell.name} fill sizes="56px" className="object-cover" />
                      </div>
                    ) : null}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{upsell.name}</span>
                      <span className="block text-sm text-muted-foreground">
                        + {formatCents(upsell.price_cents)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* 6. Observações */}
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

      {/* Resumo. O <aside> é um contêiner sticky de ALTURA TOTAL da tela que
          centraliza o card por flex -- assim o card fica no meio do campo de
          visão em QUALQUER rolagem (inclusive no topo), não "travado" embaixo
          do header como acontecia com sticky top:50%. O visual fica no <div>
          interno; a trava de altura (max-h + overflow) mora nele, para o botão
          "Ir para pagamento" nunca sumir quando o card for mais alto que a tela
          e para o overflow não cortar o glow de borda. No mobile o aside não
          tem classe lg -> bloco normal, largura cheia (cara de app). */}
      <aside className="lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:items-center lg:self-start">
        <div
          className="jc-glow-card h-fit w-full space-y-4 rounded-2xl border border-primary/30 bg-card p-5 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:p-6"
          style={{ boxShadow: "var(--jc-shadow)" }}
        >
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

          {/* Relação de produtos sugeridos (upsell) DENTRO do carrinho, logo
              abaixo do produto. Mesmo estado (`upsellSlugs`/`toggleUpsell`) da
              seção "Aproveite e leve também" do formulário: marcar aqui reflete
              lá e no Total, e vice-versa. */}
          {upsells.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-medium text-muted-foreground">Você também pode adicionar</p>
              {upsells.map((upsell) => {
                const checked = upsellSlugs.includes(upsell.slug);
                return (
                  <label
                    key={upsell.id}
                    className={`flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[10px] border p-2 transition-colors ${
                      checked ? "border-primary bg-accent" : "border-border bg-card hover:bg-accent/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUpsell(upsell.slug)}
                      className="size-4 shrink-0 rounded border-border"
                    />
                    {upsell.image_url ? (
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-[8px] bg-secondary">
                        <Image src={upsell.image_url} alt={upsell.name} fill sizes="36px" className="object-cover" />
                      </div>
                    ) : null}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{upsell.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">+ {formatCents(upsell.price_cents)}</span>
                  </label>
                );
              })}
            </div>
          ) : null}

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

        <div className="space-y-1.5 border-t border-border pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums text-foreground">{formatCents(merchandiseCents)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {deliveryType === "pickup"
                ? "Retirada na loja"
                : frete?.served
                  ? `Entrega — ${frete.zoneName}`
                  : "Entrega"}
            </span>
            <span className="tabular-nums text-foreground">
              {deliveryType === "pickup"
                ? "grátis"
                : appliedCoupon?.signature === couponSignature
                  ? deliveryFeeCents === 0
                    ? "grátis"
                    : formatCents(deliveryFeeCents)
                  : !frete?.served
                    ? "calcular com o CEP"
                    : deliveryFeeCents === 0
                      ? "grátis"
                      : formatCents(deliveryFeeCents)}
            </span>
          </div>
          {deliveryType === "delivery" && frete?.served && formatPrazo(frete.prazoMinDays, frete.prazoMaxDays) ? (
            <p className="text-xs text-muted-foreground">
              {formatPrazo(frete.prazoMinDays, frete.prazoMaxDays)}
            </p>
          ) : null}
        </div>

        <div className="border-t border-border pt-4">
          {appliedCoupon && appliedCoupon.signature === couponSignature ? (
            <div className="flex items-center justify-between gap-2 rounded-[10px] bg-accent px-3 py-2 text-sm">
              <span className="flex items-center gap-1.5 font-medium text-primary">
                <Tag className="size-3.5" /> {appliedCoupon.code}
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                aria-label="Remover cupom"
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  setCouponError(null);
                }}
                placeholder="Cupom de desconto"
                className="h-10 min-w-0 flex-1 rounded-[10px] border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponApplying || !couponInput.trim()}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] border border-border px-3.5 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-60"
              >
                {couponApplying ? <Loader2 className="size-4 animate-spin" /> : "Aplicar"}
              </button>
            </div>
          )}
          {couponError ? <p className="mt-1.5 text-xs text-destructive">{couponError}</p> : null}
          {appliedCoupon && appliedCoupon.signature === couponSignature && appliedCoupon.discountCents > 0 ? (
            <div className="mt-2 flex items-center justify-between text-sm text-primary">
              <span>Desconto</span>
              <span>- {formatCents(appliedCoupon.discountCents)}</span>
            </div>
          ) : null}
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
        </div>
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

/** Texto do prazo de entrega, ou null se a zona não tem prazo definido. */
function formatPrazo(min: number | null, max: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `Entrega em ${min} a ${max} dias úteis`;
  const dias = max ?? min;
  return `Entrega em até ${dias} ${dias === 1 ? "dia útil" : "dias úteis"}`;
}

/**
 * Cartão do frete: some do lugar do antigo menu de regiões. Mostra, de forma
 * compacta e visual, o resultado do cálculo por CEP — carregando, valor+prazo,
 * ou "não atendido" com o WhatsApp.
 */
function FreteBox({
  frete,
  loading,
  cepComplete,
  whatsapp,
  productName,
}: {
  frete: FreteResult | null;
  loading: boolean;
  cepComplete: boolean;
  whatsapp: string;
  productName: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-[10px] border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Calculando o frete…
      </div>
    );
  }

  if (!cepComplete || !frete) {
    return (
      <p className="rounded-[10px] border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        Digite o CEP acima para ver o valor e o prazo da entrega.
      </p>
    );
  }

  if (!frete.served) {
    const carrierOptions = frete.carrierOptions ?? [];
    const cheapest = carrierOptions[0] ?? null;
    const whatsappMessage = cheapest
      ? `Olá! Quero comprar a ${productName} e vi uma estimativa de envio por ${cheapest.name} (${formatCents(
          cheapest.priceCents
        )}). Podem confirmar e fechar esse envio?`
      : `Olá! Quero comprar a ${productName}, mas meu CEP não aparece na entrega. Podem me ajudar?`;
    const link = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMessage)}` : null;

    return (
      <div className="rounded-[10px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">
          {cheapest ? "Fora da nossa área de entrega local." : "Ainda não entregamos nesse CEP."}
        </p>

        {carrierOptions.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            <p className="text-amber-800">Estimativa por transportadora (a confirmar no WhatsApp):</p>
            <ul className="space-y-1">
              {carrierOptions.slice(0, 3).map((o, i) => (
                <li key={`${o.name}-${i}`} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {o.name}
                    {o.companyName && o.companyName !== o.name ? ` (${o.companyName})` : ""}
                    {o.deliveryDays != null ? ` — até ${o.deliveryDays} dias` : ""}
                  </span>
                  <span className="font-semibold tabular-nums">{formatCents(o.priceCents)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-0.5 text-amber-800">
            Fale com a gente que a gente dá um jeito — ou escolha “Retirar na loja”.
          </p>
        )}

        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
          >
            <MessageCircle className="size-4" /> Falar no WhatsApp
          </a>
        ) : null}
      </div>
    );
  }

  const prazo = formatPrazo(frete.prazoMinDays, frete.prazoMaxDays);
  const gratis = frete.freeShipping || frete.deliveryFeeCents === 0;
  return (
    <div className="flex items-start gap-3 rounded-[10px] border border-primary/30 bg-accent px-4 py-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Truck className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Entrega para {frete.zoneName}</p>
        {prazo ? <p className="text-xs text-muted-foreground">{prazo}</p> : null}
      </div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-foreground">
        {gratis ? "Grátis" : formatCents(frete.deliveryFeeCents)}
      </span>
    </div>
  );
}
