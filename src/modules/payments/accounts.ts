import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnv } from "@/lib/env";
import { encryptSecret, decryptSecret, lastFour, isSecretCryptoReady } from "@/lib/security/crypto-secret";
import { reportError } from "@/lib/platform/report-error";
import {
  createAsaasClient,
  redigir,
  AsaasError,
  ASAAS_WEBHOOK_EVENTS,
  type AsaasEnvironment,
} from "@/modules/payments/asaas-client";

/**
 * A conta Asaas DA LOJA (não da plataforma).
 *
 * O dinheiro da venda cai na conta da lojista. A plataforma guarda apenas a
 * chave de API dela — cifrada — para conseguir emitir a cobrança em nome dela
 * e para reconhecer as notificações que o Asaas manda de volta.
 *
 * Nada aqui pode ser importado de componente client: `getDecryptedKey`
 * devolveria a chave para o navegador. O `import "server-only"` no topo faz o
 * build do Next falhar se alguém tentar.
 */

export type AccountStatus = {
  connected: boolean;
  environment: AsaasEnvironment | null;
  /** Só os 4 últimos caracteres — a chave nunca volta inteira para a tela. */
  keyLast4: string | null;
  status: "connected" | "disconnected" | "error" | null;
  accountName: string | null;
  accountEmail: string | null;
  webhookRegistered: boolean;
  webhookUrl: string | null;
  connectedAt: string | null;
  lastError: string | null;
  /** `false` quando falta PAYMENT_KEY_ENC_KEY no ambiente — não dá nem para conectar. */
  cryptoReady: boolean;
};

export type ConnectResult = { ok: true } | { ok: false; error: string };

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Endereço público onde o Asaas vai bater. Prefere o domínio da plataforma
 * (quando existir) e cai no site da loja legada — que é o cenário de hoje.
 */
export function webhookUrlForTenant(tenantId: string): string | null {
  const env = getEnv();
  const base = (env.PLATFORM_PUBLIC_URL || env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/+$/, "");
  if (!base || base.startsWith("http://localhost")) return null;
  return `${base}/api/asaas/webhook/${tenantId}`;
}

/** O que a tela do lojista pode ver. Nunca inclui a chave. */
export async function getAccountStatus(tenantId: string): Promise<AccountStatus> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenant_payment_accounts")
    .select(
      "environment, key_last4, status, account_name, account_email, asaas_webhook_id, webhook_url, connected_at, last_error"
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const cryptoReady = isSecretCryptoReady();

  // Erro de leitura NÃO vira "não conectado" caladamente — isso esconderia uma
  // conta ativa e faria a tela mentir.
  if (error) {
    return {
      connected: false,
      environment: null,
      keyLast4: null,
      status: "error",
      accountName: null,
      accountEmail: null,
      webhookRegistered: false,
      webhookUrl: null,
      connectedAt: null,
      lastError: "Não foi possível consultar a conta de recebimento agora. Recarregue a página.",
      cryptoReady,
    };
  }

  if (!data) {
    return {
      connected: false,
      environment: null,
      keyLast4: null,
      status: null,
      accountName: null,
      accountEmail: null,
      webhookRegistered: false,
      webhookUrl: null,
      connectedAt: null,
      lastError: null,
      cryptoReady,
    };
  }

  return {
    connected: data.status === "connected",
    environment: (data.environment as AsaasEnvironment) ?? null,
    keyLast4: data.key_last4 ?? null,
    status: (data.status as AccountStatus["status"]) ?? null,
    accountName: data.account_name ?? null,
    accountEmail: data.account_email ?? null,
    webhookRegistered: Boolean(data.asaas_webhook_id),
    webhookUrl: data.webhook_url ?? null,
    connectedAt: data.connected_at ?? null,
    lastError: data.last_error ?? null,
    cryptoReady,
  };
}

/**
 * A chave em texto puro. SÓ o servidor chama isso, e só na hora de falar com
 * o Asaas. Nunca retorne o resultado disto de uma Server Action.
 */
export async function getDecryptedKey(
  tenantId: string
): Promise<{ apiKey: string; environment: AsaasEnvironment } | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tenant_payment_accounts")
    .select("api_key_encrypted, environment, status")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status !== "connected") return null;

  try {
    return {
      apiKey: decryptSecret(data.api_key_encrypted),
      environment: (data.environment as AsaasEnvironment) ?? "production",
    };
  } catch {
    // Chave de cifra trocada/perdida: a lojista precisa reconectar. Não
    // adianta insistir — e a mensagem nunca pode conter o texto cifrado.
    await reportError({
      tenantId,
      module: "pagamento",
      action: "decifrar_chave",
      level: "critical",
      message: "Não foi possível decifrar a chave do Asaas desta loja. A lojista precisa reconectar a conta.",
    });
    return null;
  }
}

/**
 * Conecta a conta Asaas da loja.
 *
 * Ordem de propósito (nada é gravado antes de estar provado):
 *   1. valida a chave chamando `getAccount()` DE VERDADE no Asaas;
 *   2. apaga o webhook antigo, se havia um (reconexão não pode deixar lixo);
 *   3. registra o webhook novo com um token gerado aqui;
 *   4. só então grava a linha — com a chave cifrada e o HASH do token.
 *
 * Se o passo 3 falhar, NADA é gravado. Uma conta salva sem webhook seria uma
 * fachada: emitiria cobrança e nunca liberaria pedido nenhum.
 */
export async function connectAccount(
  tenantId: string,
  input: { apiKey: string; environment: AsaasEnvironment }
): Promise<ConnectResult> {
  const apiKey = input.apiKey.trim();

  if (!apiKey) return { ok: false, error: "Cole a chave de API da sua conta Asaas." };
  if (apiKey.length < 20) return { ok: false, error: "Essa chave parece incompleta. Copie a chave inteira do painel do Asaas." };
  if (!isSecretCryptoReady()) {
    return {
      ok: false,
      error:
        "O sistema ainda não está preparado para guardar a chave com segurança (falta a variável PAYMENT_KEY_ENC_KEY). Fale com o suporte antes de conectar.",
    };
  }

  const webhookUrl = webhookUrlForTenant(tenantId);
  if (!webhookUrl) {
    return {
      ok: false,
      error:
        "O endereço público do site ainda não está configurado, e sem ele o Asaas não consegue avisar quando um pagamento entra. Fale com o suporte.",
    };
  }

  const client = createAsaasClient({ apiKey, environment: input.environment });

  // 1. Prova que a chave é boa ANTES de gravar qualquer coisa.
  let account;
  try {
    account = await client.getAccount();
  } catch (e) {
    if (e instanceof AsaasError) {
      return { ok: false, error: redigir(e.message, apiKey) };
    }
    return { ok: false, error: "Não foi possível confirmar a chave no Asaas agora. Tente de novo em alguns minutos." };
  }

  const supabase = createAdminClient();

  // 2. Reconexão: apaga o webhook antigo para não ficar dois avisando o mesmo.
  //    Melhor esforço — se o Asaas recusar (webhook já removido à mão), segue.
  const { data: anterior } = await supabase
    .from("tenant_payment_accounts")
    .select("asaas_webhook_id, api_key_encrypted, environment")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (anterior?.asaas_webhook_id) {
    try {
      const chaveAntiga = decryptSecret(anterior.api_key_encrypted);
      const clienteAntigo = createAsaasClient({
        apiKey: chaveAntiga,
        environment: (anterior.environment as AsaasEnvironment) ?? "production",
      });
      await clienteAntigo.deleteWebhook(anterior.asaas_webhook_id);
    } catch {
      // Silêncio proposital: webhook velho pendurado não impede a conexão nova.
    }
  }

  // 3. Token do webhook: 32 caracteres (o Asaas exige entre 32 e 255).
  //    Ele existe em memória só aqui; o banco recebe o SHA-256.
  const webhookToken = randomBytes(24).toString("base64url");

  let webhookId: string;
  try {
    const webhook = await client.createWebhook({
      name: `Loja ${tenantId.slice(0, 8)}`,
      url: webhookUrl,
      email: account.email || "",
      authToken: webhookToken,
      events: ASAAS_WEBHOOK_EVENTS,
    });
    if (!webhook?.id) {
      return { ok: false, error: "O Asaas aceitou o aviso de pagamento mas não devolveu o código dele. Tente de novo." };
    }
    webhookId = webhook.id;
  } catch (e) {
    const detalhe = e instanceof AsaasError ? redigir(e.message, apiKey) : "erro inesperado";
    await reportError({
      tenantId,
      module: "pagamento",
      action: "registrar_webhook",
      level: "critical",
      message: "Falha ao registrar o aviso de pagamento (webhook) no Asaas.",
      detail: { motivo: detalhe },
    });
    return {
      ok: false,
      error: `A chave está certa, mas não foi possível registrar o aviso de pagamento no Asaas (${detalhe}). Nada foi salvo — tente de novo.`,
    };
  }

  // 4. Agora sim: grava. `.select("id")` porque `.upsert()` não lança em erro
  //    de RLS/constraint — devolve `{ error }` e a tela mentiria "salvo!".
  const agora = new Date().toISOString();
  const { data: gravado, error: upsertError } = await supabase
    .from("tenant_payment_accounts")
    .upsert(
      {
        tenant_id: tenantId,
        provider: "asaas",
        environment: input.environment,
        api_key_encrypted: encryptSecret(apiKey),
        key_last4: lastFour(apiKey),
        webhook_token_hash: sha256Hex(webhookToken),
        asaas_webhook_id: webhookId,
        webhook_url: webhookUrl,
        status: "connected",
        account_name: account.name,
        account_email: account.email,
        last_error: null,
        connected_at: agora,
        disconnected_at: null,
        updated_at: agora,
      },
      { onConflict: "tenant_id" }
    )
    .select("tenant_id");

  if (upsertError || !gravado || gravado.length === 0) {
    // Desfaz o webhook para não deixar um aviso apontando para uma conta que
    // este sistema não sabe validar (o hash do token não ficou salvo).
    try {
      await client.deleteWebhook(webhookId);
    } catch {
      /* melhor esforço */
    }
    await reportError({
      tenantId,
      module: "pagamento",
      action: "salvar_conta",
      level: "critical",
      message: "Falha ao salvar a conta de recebimento da loja.",
      detail: { erro: upsertError?.message ?? "nenhuma linha gravada" },
    });
    return { ok: false, error: "Não foi possível salvar a conexão. Nada foi alterado — tente de novo." };
  }

  return { ok: true };
}

/**
 * Desconecta a conta. A linha NÃO é apagada de propósito: um pagamento feito
 * segundos antes ainda pode chegar pelo webhook, e o hash do token precisa
 * continuar existindo para esse aviso ser aceito e o pedido ser liberado.
 * O que muda é `status`, e é `status = 'connected'` que autoriza cobrar.
 */
export async function disconnectAccount(tenantId: string): Promise<ConnectResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tenant_payment_accounts")
    .select("asaas_webhook_id, api_key_encrypted, environment")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) return { ok: false, error: "Não foi possível consultar a conta agora. Tente de novo." };
  if (!data) return { ok: true };

  if (data.asaas_webhook_id) {
    try {
      const client = createAsaasClient({
        apiKey: decryptSecret(data.api_key_encrypted),
        environment: (data.environment as AsaasEnvironment) ?? "production",
      });
      await client.deleteWebhook(data.asaas_webhook_id);
    } catch {
      // Melhor esforço: se o webhook ficar de pé no Asaas, ele passa a bater
      // numa loja desconectada — e a rota responde 200 sem fazer nada.
    }
  }

  const agora = new Date().toISOString();
  const { data: atualizado, error: updateError } = await supabase
    .from("tenant_payment_accounts")
    .update({ status: "disconnected", disconnected_at: agora, updated_at: agora })
    .eq("tenant_id", tenantId)
    .select("tenant_id");

  if (updateError || !atualizado || atualizado.length === 0) {
    return { ok: false, error: "Não foi possível desconectar agora. Tente de novo." };
  }

  return { ok: true };
}
