import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { TENANT_ID } from "@/lib/tenant";
import type { DeliverySettingsInput } from "./slots";

export type DeliveryZone = {
  id: string;
  name: string;
  fee_cents: number;
};

export type DeliverySettings = DeliverySettingsInput & { cardMaxWords: number };

export async function getDeliverySettings(): Promise<DeliverySettings | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("delivery_settings")
    .select(
      "slot_minutes, lead_time_hours, capacity_per_slot, horizon_days, hours, blocked_dates, card_max_words"
    )
    .eq("tenant_id", TENANT_ID)
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
  };
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("delivery_zones")
    .select("id, name, fee_cents")
    .eq("tenant_id", TENANT_ID)
    .eq("active", true)
    .order("sort_order");

  return data ?? [];
}

export async function getSlotOccupancy(fromDate: string, toDate: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("slot_occupancy", {
    p_tenant: TENANT_ID,
    p_from: fromDate,
    p_to: toDate,
  });

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(`${row.delivery_date}|${row.slot_start.slice(0, 5)}`, row.taken);
  }
  return map;
}
