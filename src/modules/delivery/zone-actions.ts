"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureModuleForAction } from "@/lib/auth/require-module";

export type DeliveryZoneInput = {
  id?: string;
  name: string;
  /** Taxa em CENTAVOS (o servidor é a fonte da verdade do preço). */
  feeCents: number;
  active: boolean;
};

type ActionResult = { ok: true } | { ok: false; error: string };

/** Revalida o painel e a vitrine (o checkout lê as zonas ao carregar). */
function revalidar() {
  revalidatePath("/admin/frete");
  revalidatePath("/", "layout");
}

/**
 * Cria ou atualiza uma zona de entrega (bairro/região + preço) da loja de quem
 * está logado. O preço chega em centavos e é revalidado aqui: uma taxa é
 * dinheiro real que o cliente paga no checkout, então nunca confiamos cego no
 * que veio do formulário.
 */
export async function upsertDeliveryZone(input: DeliveryZoneInput): Promise<ActionResult> {
  // TRAVA DE SERVIDOR (módulo "frete"): a action é um endpoint HTTP -- some
  // do menu não quer dizer que sumiu da rede. Devolve a recusa em vez de
  // redirecionar, porque quem chamou é um formulário que mostra o aviso na tela.
  const gate = await ensureModuleForAction("frete");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Dê um nome para a área (bairro ou região)." };
  if (name.length > 80) return { ok: false, error: "O nome da área está muito longo." };

  // Preço: inteiro, não negativo (o banco exige fee_cents >= 0). R$0 = grátis.
  if (!Number.isInteger(input.feeCents) || input.feeCents < 0) {
    return { ok: false, error: "Informe um preço válido (use 0 para frete grátis)." };
  }
  if (input.feeCents > 100_000_00) {
    return { ok: false, error: "Esse preço parece alto demais. Confira o valor." };
  }

  const admin = createAdminClient();

  if (input.id) {
    const { error } = await admin
      .from("delivery_zones")
      .update({ name, fee_cents: input.feeCents, active: input.active })
      .eq("id", input.id)
      .eq("tenant_id", staff.tenantId);
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Já existe uma área com esse nome." };
      return { ok: false, error: "Não foi possível salvar a área de entrega." };
    }
  } else {
    const { error } = await admin.from("delivery_zones").insert({
      tenant_id: staff.tenantId,
      name,
      fee_cents: input.feeCents,
      active: input.active,
      sort_order: await nextSortOrder(admin, staff.tenantId),
      // Dado criado pela lojista é real, não um exemplo semeado.
      placeholder: false,
    });
    if (error) {
      if (error.code === "23505") return { ok: false, error: "Já existe uma área com esse nome." };
      return { ok: false, error: "Não foi possível criar a área de entrega." };
    }
  }

  revalidar();
  return { ok: true };
}

async function nextSortOrder(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string
): Promise<number> {
  const { data } = await admin
    .from("delivery_zones")
    .select("sort_order")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}

export async function deleteDeliveryZone(id: string): Promise<ActionResult> {
  const gate = await ensureModuleForAction("frete");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const { error } = await admin
    .from("delivery_zones")
    .delete()
    .eq("id", id)
    .eq("tenant_id", staff.tenantId);
  if (error) {
    // Pedidos guardam um snapshot do nome da zona (zone_name), então apagar
    // uma zona não corrompe pedidos antigos. Se ainda assim houver FK, avisa.
    if (error.code === "23503") {
      return { ok: false, error: "Não dá para excluir esta área agora. Desative-a no lugar de excluir." };
    }
    return { ok: false, error: "Não foi possível excluir a área." };
  }

  revalidar();
  return { ok: true };
}

export async function reorderDeliveryZones(orderedIds: string[]): Promise<ActionResult> {
  const gate = await ensureModuleForAction("frete");
  if (!gate.ok) return { ok: false, error: gate.mensagem };
  const staff = gate.staff;

  const admin = createAdminClient();
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      admin
        .from("delivery_zones")
        .update({ sort_order: index })
        .eq("id", id)
        .eq("tenant_id", staff.tenantId)
    )
  );
  if (results.some((r) => r.error)) return { ok: false, error: "Não foi possível reordenar." };

  revalidar();
  return { ok: true };
}
