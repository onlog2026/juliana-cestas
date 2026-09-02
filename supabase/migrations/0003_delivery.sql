-- 0003_delivery.sql — delivery_settings, delivery_zones, ocupacao de slots
-- Idempotente. Nada aqui e sensivel (visivel pro publico pra montar o formulario).

create table if not exists delivery_settings (
  tenant_id uuid primary key references tenants(id),
  timezone text not null default 'America/Sao_Paulo',
  slot_minutes integer not null default 30 check (slot_minutes in (30, 60)),
  lead_time_hours integer not null default 24,
  custom_lead_time_hours integer not null default 72,
  capacity_per_slot integer not null default 2,
  horizon_days integer not null default 30,
  -- chave = dia da semana 0..6 (0 = domingo); null = fechado.
  -- Padrao "todos os horarios" (pedido do dono) ate a Juliana restringir no painel.
  hours jsonb not null default '{
    "0": {"open":"00:00","close":"23:30"},
    "1": {"open":"00:00","close":"23:30"},
    "2": {"open":"00:00","close":"23:30"},
    "3": {"open":"00:00","close":"23:30"},
    "4": {"open":"00:00","close":"23:30"},
    "5": {"open":"00:00","close":"23:30"},
    "6": {"open":"00:00","close":"23:30"}
  }',
  blocked_dates date[] not null default '{}',
  pickup_enabled boolean not null default true,
  pickup_address text,
  card_max_words integer not null default 40,
  placeholder boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  fee_cents integer not null check (fee_cents >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  placeholder boolean not null default true,
  unique (tenant_id, name)
);

alter table delivery_settings enable row level security;
alter table delivery_zones enable row level security;

do $$ begin
  create policy "delivery_settings_public_select" on delivery_settings for select to anon, authenticated
    using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "delivery_settings_staff_all" on delivery_settings for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "delivery_zones_public_select" on delivery_zones for select to anon, authenticated
    using (active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "delivery_zones_staff_all" on delivery_zones for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- A funcao slot_occupancy() precisa da tabela `orders`, que so existe depois
-- de rodar 0004_orders.sql -- ela mora la no final desse arquivo, nao aqui.
