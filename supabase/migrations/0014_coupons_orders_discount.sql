-- 0014_coupons_orders_discount.sql
-- Cupons de desconto (percentual, valor fixo, frete grátis) + coluna de
-- desconto no pedido + painel de vendas (dados agregados, sem tabela nova).
-- Idempotente.

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  code text not null,
  type text not null check (type in ('percent', 'fixed', 'free_shipping')),
  percent_off integer,
  value_cents integer,
  min_order_cents integer not null default 0,
  usage_limit integer,
  per_customer_limit integer,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);
alter table coupons enable row level security;

do $$ begin
  alter table coupons add constraint coupons_percent_off_check
    check (percent_off is null or (percent_off > 0 and percent_off <= 100));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table coupons add constraint coupons_value_cents_check
    check (value_cents is null or value_cents >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table coupons add constraint coupons_min_order_check
    check (min_order_cents >= 0);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "coupons_staff_all" on coupons for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- Um cupom por pedido. buyer_email (não customer_id) porque a checagem de
-- limite por cliente precisa funcionar mesmo pro primeiro pedido de um
-- comprador novo (o customer_id só existe depois do upsert em customers).
create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  coupon_id uuid not null references coupons(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  buyer_email text not null,
  redeemed_at timestamptz not null default now(),
  unique (order_id)
);
alter table coupon_redemptions enable row level security;

do $$ begin
  create policy "coupon_redemptions_staff_select" on coupon_redemptions for select to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

alter table orders add column if not exists discount_cents integer not null default 0;
alter table orders add column if not exists coupon_code text;

-- create_order_tx precisa gravar discount_cents/coupon_code -- reescreve a
-- função inteira (Postgres não tem "alter function add column de insert").
-- Resto idêntico ao de 0004_orders.sql.
create or replace function public.create_order_tx(p jsonb)
returns orders
language plpgsql security definer set search_path = public as $$
declare
  v_existing orders;
  v_order orders;
  v_lock_key bigint;
  v_capacity integer;
  v_taken integer;
begin
  select * into v_existing from orders
    where tenant_id = (p->>'tenant_id')::uuid
      and idempotency_key = (p->>'idempotency_key')::uuid;
  if found then
    return v_existing;
  end if;

  v_lock_key := hashtextextended(
    (p->>'tenant_id') || '|' || (p->>'delivery_date') || '|' || (p->>'delivery_slot_start'), 0);
  perform pg_advisory_xact_lock(v_lock_key);

  if (p->>'delivery_type') = 'delivery' then
    select capacity_per_slot into v_capacity from delivery_settings where tenant_id = (p->>'tenant_id')::uuid;
    select count(*) into v_taken from orders
      where tenant_id = (p->>'tenant_id')::uuid
        and delivery_type = 'delivery'
        and delivery_date = (p->>'delivery_date')::date
        and delivery_slot_start = (p->>'delivery_slot_start')::time
        and status not in ('cancelado','reembolsado')
        and (status <> 'aguardando_pagamento' or expires_at > now());
    if v_taken >= coalesce(v_capacity, 2) then
      raise exception 'slot_full' using errcode = 'P0001';
    end if;
  end if;

  insert into orders (
    tenant_id, idempotency_key, customer_id,
    buyer_name, buyer_email, buyer_phone, buyer_cpf,
    recipient_name, recipient_phone, delivery_type,
    cep, street, address_number, complement, neighborhood, city, state,
    zone_id, zone_name, delivery_date, delivery_slot_start, delivery_slot_end,
    card_template, card_recipient, card_sender, card_message, notes,
    subtotal_cents, addons_cents, delivery_fee_cents, discount_cents, coupon_code, total_cents,
    public_token_hash, expires_at
  ) values (
    (p->>'tenant_id')::uuid, (p->>'idempotency_key')::uuid, (p->>'customer_id')::uuid,
    p->>'buyer_name', p->>'buyer_email', p->>'buyer_phone', p->>'buyer_cpf',
    p->>'recipient_name', p->>'recipient_phone', p->>'delivery_type',
    p->>'cep', p->>'street', p->>'address_number', p->>'complement', p->>'neighborhood', p->>'city', p->>'state',
    (p->>'zone_id')::uuid, p->>'zone_name', (p->>'delivery_date')::date, (p->>'delivery_slot_start')::time, (p->>'delivery_slot_end')::time,
    p->>'card_template', p->>'card_recipient', p->>'card_sender', p->>'card_message', p->>'notes',
    (p->>'subtotal_cents')::integer, (p->>'addons_cents')::integer, (p->>'delivery_fee_cents')::integer,
    coalesce((p->>'discount_cents')::integer, 0), p->>'coupon_code', (p->>'total_cents')::integer,
    p->>'public_token_hash', (p->>'expires_at')::timestamptz
  ) returning * into v_order;

  insert into order_items (tenant_id, order_id, kind, product_id, addon_id, name, unit_price_cents, qty, items_snapshot)
  select
    v_order.tenant_id, v_order.id,
    item->>'kind', (item->>'product_id')::uuid, (item->>'addon_id')::uuid,
    item->>'name', (item->>'unit_price_cents')::integer, coalesce((item->>'qty')::integer, 1),
    item->'items_snapshot'
  from jsonb_array_elements(p->'items') as item;

  insert into order_events (tenant_id, order_id, type, from_status, to_status, actor, payload)
  values (v_order.tenant_id, v_order.id, 'order_created', null, v_order.status, 'customer', '{}'::jsonb);

  return v_order;
end;
$$;
revoke all on function public.create_order_tx(jsonb) from public, anon, authenticated;
grant execute on function public.create_order_tx(jsonb) to service_role;
