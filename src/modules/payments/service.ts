import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken } from "@/modules/orders/token";
import { reportError } from "@/lib/platform/report-error";
import { saoPauloDateStr, addDaysToDateStr } from "@/lib/time/sao-paulo";
import { getDecryptedKey } from "@/modules/payments/accounts";
import {
  createAsaasClient,
  redigir,
  AsaasError,
  MIN_PAYMENT_CENTS,
  type AsaasBillingType,
} from "@/modules/payments/asaas-client";

/**
 * Emissão de cobrança para um pedido, na conta Asaas da própria loja.
 *
 * REGRA QUE MANDA EM TUDO AQUI: o valor cobrado é SEMPRE recalculado lendo a
 * tabela `orders`. Nunca chega pelo navegador, nem como parâmetro, nem como
 * "confere se bate". No Agentop, o caminho de erro caía calado no valor que o
 * navegador tinha mandado e dava para assinar o plano máximo por R$ 1,00 —
 * aqui esse caminho não existe: se o pedido não for lido do banco, a operação
 * falha; não há valor alternativo nenhum de onde tirar.
 */

export type PaymentMethod = AsaasBillingType;

export type PaymentView = {
  paymentId: string;
  billingType: PaymentMethod;
  amountCents: number;
  status: string;
  invoiceUrl: string | null;
  /** "Copia e cola" do PIX. */
  pixPayload: string | null;
  /** QR em base64 (sem o prefixo `data:image/png;base64,`). */
  pixQrBase64: string | null;
  dueDate: string | null;
};

export type CreatePaymentResult =
  | { ok: true; payment: PaymentView }
  /**
   * `sem_conta` é o caso mais importante deste arquivo: a loja NÃO conectou
   * conta de recebimento. Quem chamou tem que continuar exatamente como hoje
   * (combinar pelo WhatsApp). Nada de erro na cara do cliente.
   */
  | { ok: false; code: "sem_conta" | "pedido_invalido" | "valor_minimo" | "gateway" | "interno"; error: string };

const STATUS_PAGO = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

/** A loja tem conta conectada e pode cobrar pelo site? */
export async function isPaymentEnabled(tenantId: string): Promise<boolean> {
  return (await getDecryptedKey(tenantId)) !== null;
}

type OrderRow = {
  id: string;
  number: number;
  status: string;
  payment_status: string;
  total_cents: number;
  buyer_name: string;
  buyer_email: string | null;
  buyer_phone: string;
  buyer_cpf: string;
  customer_id: string | null;
};

const ORDER_COLUMNS =
  "id, number, status, payment_status, total_cents, buyer_name, buyer_email, buyer_phone, buyer_cpf, customer_id";

/**
 * Cria (ou reaproveita) a cobrança de um pedido.
 *
 * @param tenantId loja resolvida pelo servidor — nunca vinda do corpo da requisição.
 * @param orderId  pedido; o valor sai da linha dele, não do parâmetro.
 * @param metodo   PIX, cartão ou boleto.
 */
export async function createPaymentForOrder(
  tenantId: string,
  orderId: string,
  metodo: PaymentMethod
): Promise<CreatePaymentResult> {
  const supabase = createAdminClient();

  // ── 1. O pedido, lido do banco. É daqui que sai o valor. ────────────────
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", orderId)
    // Sem o filtro de loja, um id de outra loja emitiria cobrança aqui.
    .eq("tenant_id", tenantId)
    .maybeSingle<OrderRow>();

  if (orderError) {
    return { ok: false, code: "interno", error: "Não foi possível ler o pedido agora. Tente de novo." };
  }
  if (!order) {
    return { ok: false, code: "pedido_invalido", error: "Pedido não encontrado." };
  }
  if (order.payment_status === "paid" || order.status === "pago") {
    return { ok: false, code: "pedido_invalido", error: "Esse pedido já está pago." };
  }
  if (order.status !== "aguardando_pagamento" && order.status !== "novo") {
    return { ok: false, code: "pedido_invalido", error: "Esse pedido não está mais aguardando pagamento." };
  }

  // O VALOR. Vem da coluna `total_cents` do pedido, e de lugar nenhum mais.
  const amountCents = order.total_cents;
  if (!Number.isInteger(amountCents) || amountCents < MIN_PAYMENT_CENTS) {
    return {
      ok: false,
      code: "valor_minimo",
      error: "O valor mínimo para pagamento online é R$ 5,00. Finalize esse pedido pelo WhatsApp.",
    };
  }

  // ── 2. Cobrança já emitida para este pedido e método? Reaproveita. ──────
  // Emitir duas vezes deixaria a lojista com duas cobranças abertas para o
  // mesmo pedido e o cliente pagando qualquer uma das duas.
  const { data: existente } = await supabase
    .from("payments")
    .select("asaas_payment_id, billing_type, status, amount_cents, invoice_url, pix_payload, pix_qr_base64, due_date")
    .eq("tenant_id", tenantId)
    .eq("order_id", orderId)
    .eq("billing_type", metodo)
    .eq("status", "pending")
    .not("asaas_payment_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existente?.asaas_payment_id && existente.amount_cents === amountCents) {
    return {
      ok: true,
      payment: {
        paymentId: existente.asaas_payment_id,
        billingType: metodo,
        amountCents: existente.amount_cents,
        status: "pending",
        invoiceUrl: existente.invoice_url ?? null,
        pixPayload: existente.pix_payload ?? null,
        pixQrBase64: existente.pix_qr_base64 ?? null,
        dueDate: existente.due_date ?? null,
      },
    };
  }

  // ── 3. A conta da loja. Sem ela, nada muda: WhatsApp como hoje. ─────────
  const credenciais = await getDecryptedKey(tenantId);
  if (!credenciais) {
    return {
      ok: false,
      code: "sem_conta",
      error: "Esta loja ainda não recebe pagamento pelo site. Combine pelo WhatsApp.",
    };
  }

  const client = createAsaasClient({
    apiKey: credenciais.apiKey,
    environment: credenciais.environment,
  });

  try {
    // ── 4. Cliente no Asaas (reaproveita o id já guardado). ───────────────
    let asaasCustomerId = await lerCustomerId(tenantId, order.customer_id);

    if (!asaasCustomerId) {
      const criado = await client.createCustomer({
        name: order.buyer_name,
        cpfCnpj: order.buyer_cpf,
        email: order.buyer_email,
        mobilePhone: order.buyer_phone,
        externalReference: order.customer_id ?? order.id,
      });
      asaasCustomerId = criado.id;
      await guardarCustomerId(tenantId, order.customer_id, asaasCustomerId);
    }

    // ── 5. A cobrança. ───────────────────────────────────────────────────
    const hoje = saoPauloDateStr();
    // PIX vence hoje (o cliente paga agora); boleto precisa de folga.
    const dueDate = metodo === "BOLETO" ? addDaysToDateStr(hoje, 3) : hoje;

    let cobranca;
    try {
      cobranca = await client.createPayment({
        customerId: asaasCustomerId,
        billingType: metodo,
        amountCents,
        dueDate,
        description: `Pedido #${order.number}`,
        // É o fio de segurança do webhook: se o id do Asaas não estiver
        // gravado aqui ainda (corrida), ele reencontra o pedido por isto.
        externalReference: order.id,
      });
    } catch (e) {
      // Cliente apagado no Asaas, ou conta trocada: recria uma vez e insiste.
      if (e instanceof AsaasError && (e.status === 400 || e.status === 404)) {
        const recriado = await client.createCustomer({
          name: order.buyer_name,
          cpfCnpj: order.buyer_cpf,
          email: order.buyer_email,
          mobilePhone: order.buyer_phone,
          externalReference: order.customer_id ?? order.id,
        });
        asaasCustomerId = recriado.id;
        await guardarCustomerId(tenantId, order.customer_id, asaasCustomerId);
        cobranca = await client.createPayment({
          customerId: asaasCustomerId,
          billingType: metodo,
          amountCents,
          dueDate,
          description: `Pedido #${order.number}`,
          externalReference: order.id,
        });
      } else {
        throw e;
      }
    }

    if (!cobranca?.id) {
      return { ok: false, code: "gateway", error: "O Asaas não devolveu o código da cobrança. Tente de novo." };
    }

    // ── 6. PIX: busca o QR. Falhar aqui não perde a cobrança. ────────────
    let pixPayload: string | null = null;
    let pixQrBase64: string | null = null;
    if (metodo === "PIX") {
      try {
        const qr = await client.getPixQrCode(cobranca.id);
        pixPayload = qr.payload ?? null;
        pixQrBase64 = qr.encodedImage ?? null;
      } catch (e) {
        await reportError({
          tenantId,
          module: "pagamento",
          action: "obter_qrcode_pix",
          level: "warning",
          message: "Cobrança PIX criada, mas o QR Code não veio. O link da fatura continua valendo.",
          detail: { pedido: order.number, motivo: e instanceof Error ? e.message : "desconhecido" },
        });
      }
    }

    // ── 7. Grava. `.select("id")` porque insert não lança em erro de RLS. ─
    const { data: gravado, error: insertError } = await supabase
      .from("payments")
      .insert({
        tenant_id: tenantId,
        order_id: order.id,
        provider: "asaas",
        asaas_payment_id: cobranca.id,
        asaas_customer_id: asaasCustomerId,
        billing_type: metodo,
        status: "pending",
        amount_cents: amountCents,
        invoice_url: cobranca.invoiceUrl ?? cobranca.bankSlipUrl ?? null,
        pix_payload: pixPayload,
        pix_qr_base64: pixQrBase64,
        due_date: dueDate,
        raw: cobranca as unknown as Record<string, unknown>,
      })
      .select("id");

    if (insertError || !gravado || gravado.length === 0) {
      // A cobrança EXISTE no Asaas mas não ficou registrada aqui. Se o cliente
      // pagar, o webhook reencontra o pedido pelo `externalReference` — mas
      // isso é um estado ruim e tem que aparecer para o dono.
      await reportError({
        tenantId,
        module: "pagamento",
        action: "gravar_cobranca",
        level: "critical",
        message: "Cobrança criada no Asaas mas NÃO gravada no banco. Conferir o pedido antes de liberar.",
        detail: { pedido: order.number, cobranca: cobranca.id, erro: insertError?.message ?? "0 linhas" },
      });
      return {
        ok: false,
        code: "interno",
        error: "A cobrança foi criada mas houve falha ao registrar aqui. Fale no WhatsApp antes de pagar.",
      };
    }

    return {
      ok: true,
      payment: {
        paymentId: cobranca.id,
        billingType: metodo,
        amountCents,
        status: "pending",
        invoiceUrl: cobranca.invoiceUrl ?? cobranca.bankSlipUrl ?? null,
        pixPayload,
        pixQrBase64,
        dueDate,
      },
    };
  } catch (e) {
    const detalhe =
      e instanceof AsaasError ? redigir(e.message, credenciais.apiKey) : "erro inesperado ao falar com o Asaas";
    await reportError({
      tenantId,
      module: "pagamento",
      action: "criar_cobranca",
      level: "critical",
      message: "Não foi possível criar a cobrança no Asaas.",
      detail: { pedido: order.number, motivo: detalhe },
    });
    if (e instanceof AsaasError && e.code === "valor_minimo") {
      return { ok: false, code: "valor_minimo", error: e.message };
    }
    return { ok: false, code: "gateway", error: `Não foi possível gerar o pagamento agora (${detalhe}).` };
  }
}

async function lerCustomerId(tenantId: string, customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("customers")
    .select("asaas_customer_id")
    .eq("id", customerId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return data?.asaas_customer_id ?? null;
}

async function guardarCustomerId(tenantId: string, customerId: string | null, asaasCustomerId: string) {
  if (!customerId) return;
  const supabase = createAdminClient();
  // Melhor esforço: falhar aqui só faz o próximo pedido criar outro cliente
  // no Asaas — chato, nunca perigoso.
  await supabase
    .from("customers")
    .update({ asaas_customer_id: asaasCustomerId, updated_at: new Date().toISOString() })
    .eq("id", customerId)
    .eq("tenant_id", tenantId);
}

export type OrderPaymentStatus = {
  orderStatus: string;
  paymentStatus: string;
  paid: boolean;
  /** A loja aceita pagamento pelo site? Se `false`, a tela mantém o WhatsApp. */
  paymentEnabled: boolean;
  payment: PaymentView | null;
};

/**
 * Situação do pagamento de um pedido, para a página pública do pedido.
 * Exige o token do pedido — o mesmo mecanismo de `getOrderByToken`.
 */
export async function getOrderPaymentStatus(
  tenantId: string,
  orderId: string,
  token: string
): Promise<OrderPaymentStatus | null> {
  const supabase = createAdminClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, payment_status, public_token_hash")
    .eq("id", orderId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !order) return null;
  if (!verifyToken(token, order.public_token_hash)) return null;

  const { data: pagamento } = await supabase
    .from("payments")
    .select("asaas_payment_id, billing_type, status, amount_cents, invoice_url, pix_payload, pix_qr_base64, due_date")
    .eq("tenant_id", tenantId)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    orderStatus: order.status,
    paymentStatus: order.payment_status,
    paid: order.payment_status === "paid" || order.status === "pago",
    paymentEnabled: await isPaymentEnabled(tenantId),
    payment: pagamento?.asaas_payment_id
      ? {
          paymentId: pagamento.asaas_payment_id,
          billingType: pagamento.billing_type as PaymentMethod,
          amountCents: pagamento.amount_cents,
          status: pagamento.status,
          invoiceUrl: pagamento.invoice_url ?? null,
          pixPayload: pagamento.pix_payload ?? null,
          pixQrBase64: pagamento.pix_qr_base64 ?? null,
          dueDate: pagamento.due_date ?? null,
        }
      : null,
  };
}

/**
 * Consulta o Asaas ao vivo e sincroniza a situação de UM pagamento.
 *
 * Existe como rede de segurança: se um webhook se perdeu (fila interrompida,
 * deploy no meio), quem abrir a página do pedido reconcilia sozinho. Não
 * substitui o webhook — só conserta o que ele deixou passar.
 */
export async function syncPaymentFromGateway(
  tenantId: string,
  asaasPaymentId: string
): Promise<{ paid: boolean } | null> {
  const credenciais = await getDecryptedKey(tenantId);
  if (!credenciais) return null;

  const supabase = createAdminClient();
  const { data: pagamento } = await supabase
    .from("payments")
    .select("id, order_id, status")
    .eq("tenant_id", tenantId)
    .eq("asaas_payment_id", asaasPaymentId)
    .maybeSingle();

  if (!pagamento) return null;
  if (pagamento.status === "paid") return { paid: true };

  try {
    const client = createAsaasClient({ apiKey: credenciais.apiKey, environment: credenciais.environment });
    const remoto = await client.getPayment(asaasPaymentId);
    if (!STATUS_PAGO.has(String(remoto.status))) return { paid: false };

    const agora = new Date().toISOString();
    await supabase
      .from("payments")
      .update({ status: "paid", paid_at: agora, updated_at: agora })
      .eq("id", pagamento.id)
      .eq("tenant_id", tenantId)
      .select("id");

    await supabase
      .from("orders")
      .update({ status: "pago", payment_status: "paid", paid_at: agora, updated_at: agora })
      .eq("id", pagamento.order_id)
      .eq("tenant_id", tenantId)
      .in("status", ["novo", "aguardando_pagamento"])
      .select("id");

    await supabase.from("order_events").insert({
      tenant_id: tenantId,
      order_id: pagamento.order_id,
      type: "pagamento_confirmado",
      to_status: "pago",
      actor: "system",
      payload: { origem: "reconciliacao", asaas_payment_id: asaasPaymentId },
    });

    return { paid: true };
  } catch {
    // Reconciliação é melhor esforço: nunca derruba a página do pedido.
    return null;
  }
}
