"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth/require-staff";
import { connectAccount, disconnectAccount } from "@/modules/payments/accounts";
import type { AsaasEnvironment } from "@/modules/payments/asaas-client";

/**
 * Server Actions da tela /admin/pagamentos.
 *
 * ATENÇÃO ao editar: arquivo com "use server" só pode exportar função async.
 * Uma constante exportada aqui quebra o módulo INTEIRO em runtime — inclusive
 * as ações que já funcionavam. Tipos (`import type`) não contam, porque somem
 * na compilação.
 *
 * A loja NUNCA vem por parâmetro: sai de `requireStaff()`, que resolve pelo
 * login e pelo endereço acessado. "Tem login?" não é "esse dado é seu?".
 */

function ambienteValido(valor: string): valor is AsaasEnvironment {
  return valor === "sandbox" || valor === "production";
}

export async function connectAsaasAccountAction(input: {
  apiKey: string;
  environment: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();

  if (!ambienteValido(input.environment)) {
    return { ok: false, error: "Escolha se a chave é de produção ou de teste (sandbox)." };
  }

  const resultado = await connectAccount(staff.tenantId, {
    apiKey: input.apiKey,
    environment: input.environment,
  });

  if (!resultado.ok) return resultado;

  revalidatePath("/admin/pagamentos");
  return { ok: true };
}

export async function disconnectAsaasAccountAction(): Promise<{ ok: true } | { ok: false; error: string }> {
  const staff = await requireStaff();

  const resultado = await disconnectAccount(staff.tenantId);
  if (!resultado.ok) return resultado;

  revalidatePath("/admin/pagamentos");
  return { ok: true };
}
