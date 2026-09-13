"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/require-staff";
import { getPlatformAsaasClient } from "@/modules/platform/asaas-platform";
import { getStoreProfile } from "@/modules/settings/store-profile";
import { AsaasError } from "@/modules/payments/asaas-client";

export type SubscribeCycle = "MONTHLY" | "YEARLY";

export type SubscribeInput = {
  planSlug: string;
  cycle: SubscribeCycle;
  billingType: "PIX" | "CREDIT_CARD";
  cpfCnpj: string;
  /** Só para cartão. */
  card?: { holderName: string; number: string; expiryMonth: string; expiryYear: string; ccv: string };
  address?: { postalCode: string; addressNumber: string };
};

export type SubscribeResult =
  | { ok: true; billingType: "PIX"; pix: { encodedImage: string; payload: string } }
  | { ok: true; billingType: "CREDIT_CARD" }
  | { ok: false; error: string };

function msgErro(e: unknown): string {
  // Mensagens do AsaasError já vêm redigidas (sem chave). Qualquer outra vira
  // frase genérica -- nunca vaza detalhe de sistema para a tela.
  if (e instanceof AsaasError) return e.message;
  return "Não foi possível concluir a assinatura agora. Tente de novo em alguns minutos.";
}

/**
 * Contrata (ou troca) a assinatura da PLATAFORMA para a loja de quem está
 * logado. O preço é SEMPRE decidido aqui no servidor (preço próprio da loja, se
 * houver, senão o do plano; anual aplica o desconto). Grava o "contrato"
 * `pending_*` que o webhook confere antes de ativar. Escrita por service role
 * (o trigger de guarda da 0025 só deixa o backend mexer nessas colunas).
 */
export async function subscribeSeller(input: SubscribeInput): Promise<SubscribeResult> {
  const staff = await requireStaff();

  const asaas = getPlatformAsaasClient();
  if (!asaas) {
    return { ok: false, error: "A cobrança automática ainda está sendo ligada pela plataforma. Fale com o suporte." };
  }

  const admin = createAdminClient();

  const { data: loja } = await admin
    .from("tenants")
    .select("id, slug, asaas_customer_id, custom_subscription_cents")
    .eq("id", staff.tenantId)
    .maybeSingle();
  if (!loja) return { ok: false, error: "Loja não encontrada." };

  const { data: plano } = await admin
    .from("subscription_plans")
    .select("slug, name, monthly_cents, annual_discount_pct")
    .eq("slug", input.planSlug)
    .maybeSingle();
  if (!plano || !plano.monthly_cents) return { ok: false, error: "Plano indisponível. Escolha outro." };

  // Preço no servidor: preço próprio da loja OU o do plano; anual = 12x com desconto.
  const base = (loja.custom_subscription_cents as number | null) ?? (plano.monthly_cents as number);
  let amountCents = base;
  if (input.cycle === "YEARLY") {
    const pct = Math.min(90, Math.max(0, Number(plano.annual_discount_pct) || 0));
    amountCents = Math.round(base * 12 * (1 - pct / 100));
  }
  if (amountCents < 500) return { ok: false, error: "O valor do plano ficou abaixo do mínimo (R$ 5,00)." };

  const cpf = input.cpfCnpj.replace(/\D/g, "");
  if (cpf.length !== 11 && cpf.length !== 14) return { ok: false, error: "Informe um CPF ou CNPJ válido." };

  if (input.billingType === "CREDIT_CARD" && (!input.card || !input.address)) {
    return { ok: false, error: "Preencha os dados do cartão e o CEP com o número do endereço." };
  }

  const profile = await getStoreProfile(staff.tenantId);
  const storeName = profile.businessName?.trim() || loja.slug;
  const phone = (profile.phone ?? "").replace(/\D/g, "");

  // Cliente no Asaas da plataforma (reusa se a loja já tem).
  let customerId = (loja.asaas_customer_id as string | null) ?? "";
  if (!customerId) {
    try {
      const c = await asaas.createCustomer({
        name: storeName,
        cpfCnpj: cpf,
        email: staff.email,
        mobilePhone: phone || null,
        externalReference: loja.slug,
      });
      customerId = c.id;
      await admin.from("tenants").update({ asaas_customer_id: customerId }).eq("id", loja.id);
    } catch (e) {
      return { ok: false, error: msgErro(e) };
    }
  }

  // Contrato pending_*: o webhook confere o valor pago contra isto antes de ativar.
  await admin
    .from("tenants")
    .update({ pending_plan_id: plano.slug, pending_expected_cents: amountCents, pending_cycle: input.cycle })
    .eq("id", loja.id);

  const today = new Date().toISOString().slice(0, 10);
  const externalReference = JSON.stringify({ type: "plan", tenant: loja.slug, plan: plano.slug, cycle: input.cycle });

  try {
    const sub = await asaas.createSubscription({
      customerId,
      billingType: input.billingType,
      amountCents,
      cycle: input.cycle,
      nextDueDate: today,
      description: `Assinatura ${plano.name} — ${storeName}`,
      externalReference,
      ...(input.billingType === "CREDIT_CARD" && input.card && input.address
        ? {
            creditCard: input.card,
            creditCardHolderInfo: {
              name: input.card.holderName,
              email: staff.email ?? "",
              cpfCnpj: cpf,
              postalCode: input.address.postalCode.replace(/\D/g, ""),
              addressNumber: input.address.addressNumber,
              mobilePhone: phone || undefined,
            },
          }
        : {}),
    });

    await admin.from("tenants").update({ asaas_subscription_id: sub.id }).eq("id", loja.id);

    if (input.billingType === "PIX") {
      const pays = await asaas.getSubscriptionPayments(sub.id, 1);
      const first = pays.data?.[0];
      if (!first?.id) return { ok: false, error: "A assinatura foi criada, mas o PIX não voltou. Tente de novo." };
      const qr = await asaas.getPixQrCode(first.id);
      revalidatePath("/admin/assinatura");
      return { ok: true, billingType: "PIX", pix: { encodedImage: qr.encodedImage, payload: qr.payload } };
    }

    revalidatePath("/admin/assinatura");
    return { ok: true, billingType: "CREDIT_CARD" };
  } catch (e) {
    return { ok: false, error: msgErro(e) };
  }
}
