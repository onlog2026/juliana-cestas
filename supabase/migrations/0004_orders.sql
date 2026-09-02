-- 0004_orders.sql — customers, orders, order_items, order_events, payments,
-- webhook_events, notifications, rate_limits.
-- Idempotente.

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  name text not null,
  email text,
  phone text not null,
  cpf text,
  asaas_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists customers_tenant_phone_uq on customers (tenant_id, phone);
create unique index if not exists customers_tenant_email_uq on customers (tenant_id, lower(email)) where email is not null;

do $$ begin
  create type order_status as enum (
    'novo','aguardando_pagamento','pago','em_preparacao','pronto',
    'saiu_para_entrega','entregue','cancelado','reembolsado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending','paid','overdue','refunded','chargeback','canceled');
exception when duplicate_object then null; end $$;

create sequence if not exists orders_number_seq start 1001;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  number integer not null default nextval('orders_number_seq'),
  idempotency_key uuid not null,
  status order_status not null default 'aguardando_pagamento',
  payment_status payment_status not null default 'pending',
  customer_id uuid references customers(id),
  -- snapshot do comprador no momento da compra (nao depende de customers mudar depois)
  buyer_name text not null,
  buyer_email text,
  buyer_phone text not null,
  buyer_cpf text not null,
  -- destinatario e entrega
  recipient_name text not null,
  recipient_phone text,
  delivery_type text not null check (delivery_type in ('delivery','pickup')),
  cep text,
  street text,
  address_number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  zone_id uuid references delivery_zones(id),
  zone_name text,
  delivery_date date not null,
  delivery_slot_start time not null,
  delivery_slot_end time not null,
  -- cartao de mensagem
  card_template text not null,
  card_recipient text not null,
  card_sender text,
  card_message text not null,
  notes text,
  -- valores em centavos, sempre calculados no servidor
  subtotal_cents integer not null,
  addons_cents integer not null default 0,
  delivery_fee_cents integer not null default 0,
  total_cents integer not null check (total_cents >= 500),
  -- acesso do comprador: so o hash do token fica no banco
  public_token_hash text not null unique,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, number),
  unique (tenant_id, idempotency_key)
);
create index if not exists orders_delivery_idx on orders (tenant_id, delivery_date, delivery_slot_start);
create index if not exists orders_status_idx on orders (tenant_id, status, created_at desc);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_id uuid not null references orders(id) on delete cascade,
  kind text not null check (kind in ('product','addon')),
  product_id uuid references products(id),
  addon_id uuid references product_addons(id),
  name text not null,
  unit_price_cents integer not null,
  qty integer not null default 1 check (qty > 0),
  items_snapshot jsonb
);

create table if not exists order_events (
  id bigserial primary key,
  tenant_id uuid not null references tenants(id),
  order_id uuid not null references orders(id) on delete cascade,
  type text not null,
  from_status order_status,
  to_status order_status,
  actor text not null check (actor in ('customer','admin','webhook','system')),
  actor_id uuid,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists order_events_order_idx on order_events (order_id, created_at);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_id uuid not null references orders(id),
  provider text not null default 'asaas',
  asaas_payment_id text unique,
  asaas_customer_id text,
  billing_type text not null check (billing_type in ('PIX','CREDIT_CARD')),
  status payment_status not null default 'pending',
  amount_cents integer not null,
  invoice_url text,
  pix_payload text,
  due_date date,
  raw jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_order_idx on payments (order_id);

create table if not exists webhook_events (
  event_id text primary key,
  tenant_id uuid not null references tenants(id),
  event text not null,
  payment_id text,
  order_id uuid,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  order_id uuid not null references orders(id) on delete cascade,
  type text not null check (type in ('order_confirmed','out_for_delivery','delivered')),
  to_email text not null,
  subject text not null,
  html text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','pending_domain')),
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists notifications_order_idx on notifications (order_id);

create table if not exists rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null default 0
);

create or replace function public.rl_hit(p_key text, p_window_seconds integer)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_hits integer;
begin
  insert into rate_limits (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then 1
      else rate_limits.hits + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
        then now()
      else rate_limits.window_start
    end
  returning hits into v_hits;
  return v_hits;
end;
$$;
revoke all on function public.rl_hit(text, integer) from public, anon, authenticated;
grant execute on function public.rl_hit(text, integer) to service_role;

-- RPC transacional de criacao de pedido: trava por tenant+data+slot pra nao
-- estourar capacidade em corrida, e e idempotente pela chave do rascunho.
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
    subtotal_cents, addons_cents, delivery_fee_cents, total_cents,
    public_token_hash, expires_at
  ) values (
    (p->>'tenant_id')::uuid, (p->>'idempotency_key')::uuid, (p->>'customer_id')::uuid,
    p->>'buyer_name', p->>'buyer_email', p->>'buyer_phone', p->>'buyer_cpf',
    p->>'recipient_name', p->>'recipient_phone', p->>'delivery_type',
    p->>'cep', p->>'street', p->>'address_number', p->>'complement', p->>'neighborhood', p->>'city', p->>'state',
    (p->>'zone_id')::uuid, p->>'zone_name', (p->>'delivery_date')::date, (p->>'delivery_slot_start')::time, (p->>'delivery_slot_end')::time,
    p->>'card_template', p->>'card_recipient', p->>'card_sender', p->>'card_message', p->>'notes',
    (p->>'subtotal_cents')::integer, (p->>'addons_cents')::integer, (p->>'delivery_fee_cents')::integer, (p->>'total_cents')::integer,
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
-- security definer: so o service role pode chamar (nunca o navegador do
-- cliente direto -- sempre por route handler, ja com zod validando o input).
revoke all on function public.create_order_tx(jsonb) from public, anon, authenticated;
grant execute on function public.create_order_tx(jsonb) to service_role;

alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table payments enable row level security;
alter table webhook_events enable row level security;
alter table notifications enable row level security;
alter table rate_limits enable row level security;

-- Nenhuma policy para anon/authenticated comum nestas tabelas -- todo
-- caminho do comprador passa por route handler com service role, apos
-- validacao. Staff do tenant enxerga tudo (leitura); escrita de staff vai
-- por Server Action, nao direto pelo PostgREST.
do $$ begin
  create policy "customers_staff_select" on customers for select to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "orders_staff_all" on orders for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "order_items_staff_select" on order_items for select to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "order_events_staff_select" on order_events for select to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "payments_staff_select" on payments for select to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- Ocupacao de slots calculada na hora -- nada de pre-gerar linhas de horario.
-- Pedidos "aguardando_pagamento" contam ate expirar (expires_at), depois
-- liberam sozinhos sem precisar de cron. Mora aqui (nao em 0003_delivery.sql)
-- porque so agora a tabela `orders` ja existe.
create or replace function public.slot_occupancy(p_tenant uuid, p_from date, p_to date)
returns table (delivery_date date, slot_start time, taken integer)
language sql stable security definer set search_path = public as $$
  select delivery_date, delivery_slot_start, count(*)::int
  from orders
  where tenant_id = p_tenant
    and delivery_type = 'delivery'
    and delivery_date between p_from and p_to
    and status not in ('cancelado','reembolsado')
    and (status <> 'aguardando_pagamento' or expires_at > now())
  group by 1, 2
$$;

-- security definer + PUBLIC executaria com privilegio elevado por padrao;
-- restringe pra so o service role (chamado sempre por route handler, nunca
-- direto pelo navegador do cliente).
revoke all on function public.slot_occupancy(uuid, date, date) from public, anon, authenticated;
grant execute on function public.slot_occupancy(uuid, date, date) to service_role;
