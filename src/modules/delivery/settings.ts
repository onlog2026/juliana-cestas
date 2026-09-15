import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DeliverySettingsInput } from "./slots";
import { normalizeCep, cepToInt, pickZoneForCep, type ZoneCepCandidate } from "./cep";

export type DeliveryZone = {
  id: string;
  name: string;
  fee_cents: number;
};

/** Zona como o painel precisa ver: inclui inativas, ordem e prazo, para gerir. */
export type DeliveryZoneAdmin = {
  id: string;
  name: string;
  fee_cents: number;
  active: boolean;
  sort_order: number;
  prazo_min_days: number | null;
  prazo_max_days: number | null;
};

/** Uma faixa de CEP de uma zona (para a tela de gestão). */
export type CepRange = { id: string; zoneId: string; cepStart: number; cepEnd: number };

/** Zona resolvida a partir do CEP do cliente (com preço e prazo). */
export type ResolvedZone = {
  zoneId: string;
  name: string;
  feeCents: number;
  prazoMinDays: number | null;
  prazoMaxDays: number | null;
};

export type DeliverySettings = DeliverySettingsInput & {
  cardMaxWords: number;
  freeShippingMinCents: number | null;
};

export async function getDeliverySettings(tenantId: string): Promise<DeliverySettings | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("delivery_settings")
    .select(
      "slot_minutes, lead_time_hours, capacity_per_slot, horizon_days, hours, blocked_dates, card_max_words, free_shipping_min_cents"
    )
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    slotMinutes: data.slot_minutes,
    leadTimeHours: data.lead_time_hours,
    capacityPerSlot: data.capacity_per_slot,
    horizonDays: data.horizon_days,
    hours: data.hours,
    blockedDates: data.blocked_dates ?? [],
    cardMaxWords: data.card_max_words,
    freeShippingMinCents: (data.free_shipping_min_cents as number | null) ?? null,
  };
}

export async function getDeliveryZones(tenantId: string): Promise<DeliveryZone[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("delivery_zones")
    .select("id, name, fee_cents")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("sort_order");

  return data ?? [];
}

/**
 * Todas as zonas da loja, ativas e inativas, na ordem de exibição -- para a
 * tela de gestão no painel (o checkout usa `getDeliveryZones`, que já filtra as
 * ativas).
 */
export async function getAllDeliveryZones(tenantId: string): Promise<DeliveryZoneAdmin[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("delivery_zones")
    .select("id, name, fee_cents, active, sort_order, prazo_min_days, prazo_max_days")
    .eq("tenant_id", tenantId)
    .order("sort_order")
    .order("name");

  return (data ?? []) as DeliveryZoneAdmin[];
}

/** Todas as faixas de CEP da loja (para a tela de gestão). */
export async function getDeliveryCepRanges(tenantId: string): Promise<CepRange[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("delivery_cep_ranges")
    .select("id, zone_id, cep_start, cep_end")
    .eq("tenant_id", tenantId)
    .order("cep_start");
  return (data ?? []).map((r) => ({
    id: r.id as string,
    zoneId: r.zone_id as string,
    cepStart: r.cep_start as number,
    cepEnd: r.cep_end as number,
  }));
}

/**
 * Resolve a zona de entrega a partir do CEP do cliente. Lê as faixas que contêm
 * o CEP e, entre elas, escolhe a de menor preço (ver `pickZoneForCep`). Retorna
 * null se o CEP for inválido ou nenhuma faixa o atender.
 */
export async function resolveZoneByCep(tenantId: string, cepRaw: string): Promise<ResolvedZone | null> {
  const cep8 = normalizeCep(cepRaw);
  if (!cep8) return null;
  const n = cepToInt(cep8);

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("delivery_cep_ranges")
    .select("cep_start, cep_end, zone:delivery_zones!inner(id, name, fee_cents, active, prazo_min_days, prazo_max_days)")
    .eq("tenant_id", tenantId)
    .lte("cep_start", n)
    .gte("cep_end", n);

  const candidates: ZoneCepCandidate[] = [];
  for (const row of data ?? []) {
    const r = row as Record<string, unknown>;
    const zoneRel = r.zone as Record<string, unknown> | Record<string, unknown>[] | null;
    const zone = Array.isArray(zoneRel) ? zoneRel[0] : zoneRel;
    if (!zone || zone.active !== true) continue;
    candidates.push({
      zoneId: zone.id as string,
      name: zone.name as string,
      feeCents: zone.fee_cents as number,
      prazoMinDays: (zone.prazo_min_days as number | null) ?? null,
      prazoMaxDays: (zone.prazo_max_days as number | null) ?? null,
      cepStart: r.cep_start as number,
      cepEnd: r.cep_end as number,
    });
  }

  const pick = pickZoneForCep(candidates, n);
  if (!pick) return null;
  return {
    zoneId: pick.zoneId,
    name: pick.name,
    feeCents: pick.feeCents,
    prazoMinDays: pick.prazoMinDays,
    prazoMaxDays: pick.prazoMaxDays,
  };
}

export async function getSlotOccupancy(tenantId: string, fromDate: string, toDate: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("slot_occupancy", {
    p_tenant: tenantId,
    p_from: fromDate,
    p_to: toDate,
  });

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(`${row.delivery_date}|${row.slot_start.slice(0, 5)}`, row.taken);
  }
  return map;
}
