-- Script combinado das 6 migracoes, na ordem certa, pra colar de uma vez no
-- SQL Editor do Supabase. As 6 partes continuam tambem como arquivos
-- separados (0001..0006) para referencia/versionamento.

-- 0001_base.sql — tenants, profiles, helpers de RLS
-- Idempotente: pode rodar mais de uma vez sem erro.

create extension if not exists pgcrypto;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  whatsapp text,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id),
  role text not null check (role in ('admin','staff')),
  name text,
  created_at timestamptz not null default now()
);

-- Helpers usados pelas policies de RLS de todas as tabelas de staff.
create or replace function public.current_tenant_id() returns uuid
language sql stable security definer set search_path = public as $$
  select tenant_id from profiles where id = auth.uid()
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin','staff'))
$$;

alter table tenants enable row level security;
alter table profiles enable row level security;

do $$ begin
  create policy "tenants_staff_select" on tenants for select to authenticated
    using (public.is_staff() and id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_own_select" on profiles for select to authenticated
    using (id = auth.uid());
exception when duplicate_object then null; end $$;

-- 0002_catalog.sql — products, product_addons, banners
-- Idempotente.

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  slug text not null,
  name text not null,
  serves text,
  size text,
  price_cents integer not null check (price_cents >= 500),
  items jsonb not null default '[]',
  packaging text,
  image_url text,
  badge text,
  lead_time_hours integer not null default 24,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists product_addons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  product_id uuid not null references products(id) on delete cascade,
  slug text not null,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  unique (product_id, slug)
);

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  slug text not null,
  image_url text not null,
  href text not null,
  text text not null,
  text_position jsonb not null default '{"top":78,"left":6,"maxWidth":92}',
  object_position text,
  text_align text default 'left',
  active boolean not null default true,
  sort_order integer not null default 0,
  unique (tenant_id, slug)
);

alter table products enable row level security;
alter table product_addons enable row level security;
alter table banners enable row level security;

do $$ begin
  create policy "products_public_select" on products for select to anon, authenticated
    using (active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "products_staff_all" on products for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "product_addons_public_select" on product_addons for select to anon, authenticated
    using (active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "product_addons_staff_all" on product_addons for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "banners_public_select" on banners for select to anon, authenticated
    using (active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "banners_staff_all" on banners for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

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

-- 0005_realtime.sql — avisa o comprador quando o status do pedido muda,
-- sem precisar abrir RLS de SELECT em `orders` pro publico anonimo.
-- O payload do broadcast so leva status (nunca nome/endereco/etc).

create or replace function public.orders_broadcast_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status or new.payment_status is distinct from old.payment_status then
    perform realtime.send(
      jsonb_build_object('status', new.status, 'payment_status', new.payment_status, 'paid_at', new.paid_at),
      'status',
      'order:' || new.id::text,
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists orders_broadcast_status_trg on orders;
create trigger orders_broadcast_status_trg after update on orders
  for each row execute function public.orders_broadcast_status();

-- 0006_seed.sql — tenant unico, catalogo real (de src/lib/mock-content.ts),
-- zonas de entrega provisorias, banners (espelho de src/lib/banners.ts).
-- Idempotente: on conflict do update, seguro rodar de novo.

insert into tenants (id, slug, name, whatsapp)
values ('a0000000-0000-4000-8000-000000000001', 'juliana-present', 'Juliana Present', '5561998894889')
on conflict (id) do update set name = excluded.name, whatsapp = excluded.whatsapp;

insert into products (tenant_id, slug, name, serves, size, price_cents, items, packaging, image_url, badge, sort_order)
values
  ('a0000000-0000-4000-8000-000000000001', 'cesta-enquanto', 'Cesta Enquanto', 'Para 1 pessoa', 'P', 17990,
   '["Flores","Bolo","Croissant recheado","Nutella","Cappuccino","Chá","Café","Suco de uva integral"]'::jsonb,
   'Embalagem em tule, delicada e charmosa. Acompanha laço elegante e cartão.',
   '/images/produtos/cesta-doce-manha.jpeg', null, 1),
  ('a0000000-0000-4000-8000-000000000001', 'cesta-afeto', 'Cesta Afeto', 'Para 1 pessoa', 'P', 18990,
   '["Bolo","Waffle","Croissant","Frutas","Frios selecionados","Cappuccino","Chá","Café ou suco de uva integral"]'::jsonb,
   'Embalagem sofisticada, delicada e charmosa. Acompanha laço elegante e cartão.',
   '/images/produtos/cesta-aniversario-especial.jpeg', null, 2),
  ('a0000000-0000-4000-8000-000000000001', 'cesta-essencia', 'Cesta Essência', 'Para 1 pessoa', 'Orgânica', 28990,
   '["Bolo caseiro","Waffle e pães","Croissant","Frios selecionados","Biscoitos","Frutas","Cappuccino, café e chá","Geleia ou Nutella","Suco de uva integral"]'::jsonb,
   'Embalagem sofisticada, delicada e charmosa - perfeita para surpreender com amor.',
   '/images/produtos/cesta-cafe-completo.png', 'Mais pedida', 3),
  ('a0000000-0000-4000-8000-000000000001', 'cesta-aconchego', 'Cesta Aconchego', 'Para 2 pessoas', 'M', 35990,
   '["Variedade de pães especiais","Croissant","Waffles","Frios selecionados premium","Bolo caseiro especial","Biscoitos amanteigados","Mix de frutas frescas","Suco natural","Drip coffee e chá","Cappuccino","Geleia e mini Nutella","Chocolates"]'::jsonb,
   'Embalagem refinada, delicada e charmosa. Acompanha laço elegante e cartão personalizado.',
   '/images/produtos/cesta-presente-corporativo.jpeg', null, 4),
  ('a0000000-0000-4000-8000-000000000001', 'cesta-memoravel', 'Cesta Memorável', 'Perfeita para 2 ou 3 pessoas', 'G', 48990,
   '["Croissants especiais","Waffles","Frios nobres e queijos","Bolo especial","Frutas selecionadas","Chocolates","Seleção premium de pães artesanais","Geleia artesanal, Nutella e manteiga","Itens gourmet diferenciados","Biscoitos amanteigados","Drip coffee e chás","Suco"]'::jsonb,
   'Embalagem luxo, acabamento impecável. Acompanha laço delicado e cartão personalizado.',
   '/images/produtos/cesta-romance-ao-amanhecer.jpeg', null, 5)
on conflict (tenant_id, slug) do update set
  name = excluded.name, serves = excluded.serves, size = excluded.size,
  price_cents = excluded.price_cents, items = excluded.items, packaging = excluded.packaging,
  image_url = excluded.image_url, badge = excluded.badge, sort_order = excluded.sort_order,
  updated_at = now();

-- Vinho opcional, so na Memoravel (mencionado no texto real da embalagem).
insert into product_addons (tenant_id, product_id, slug, name, price_cents)
select 'a0000000-0000-4000-8000-000000000001', id, 'vinho', 'Vinho', 4990
from products where tenant_id = 'a0000000-0000-4000-8000-000000000001' and slug = 'cesta-memoravel'
on conflict (product_id, slug) do update set price_cents = excluded.price_cents;

insert into delivery_settings (tenant_id)
values ('a0000000-0000-4000-8000-000000000001')
on conflict (tenant_id) do nothing;

-- Regioes administrativas de Brasilia -- taxa 0 e placeholder=true ate a
-- Juliana confirmar os valores reais no painel de configuracoes.
insert into delivery_zones (tenant_id, name, fee_cents, sort_order)
values
  ('a0000000-0000-4000-8000-000000000001', 'Plano Piloto (Asa Sul)', 0, 1),
  ('a0000000-0000-4000-8000-000000000001', 'Plano Piloto (Asa Norte)', 0, 2),
  ('a0000000-0000-4000-8000-000000000001', 'Sudoeste/Octogonal', 0, 3),
  ('a0000000-0000-4000-8000-000000000001', 'Noroeste', 0, 4),
  ('a0000000-0000-4000-8000-000000000001', 'Lago Sul', 0, 5),
  ('a0000000-0000-4000-8000-000000000001', 'Lago Norte', 0, 6),
  ('a0000000-0000-4000-8000-000000000001', 'Águas Claras', 0, 7),
  ('a0000000-0000-4000-8000-000000000001', 'Taguatinga', 0, 8),
  ('a0000000-0000-4000-8000-000000000001', 'Guará', 0, 9),
  ('a0000000-0000-4000-8000-000000000001', 'Ceilândia', 0, 10),
  ('a0000000-0000-4000-8000-000000000001', 'Samambaia', 0, 11)
on conflict (tenant_id, name) do nothing;

-- Espelho de src/lib/banners.ts (a fonte de verdade continua o arquivo ate
-- a Fase B ligar o carrossel no banco).
insert into banners (tenant_id, slug, image_url, href, text, text_position, object_position, active, sort_order)
values
  ('a0000000-0000-4000-8000-000000000001', 'cesta-completa', '/images/banners/banner-cesta-completa.png', '/categoria/cafe-da-manha',
   'Detalhes que encantam, sabores que emocionam, amor que se celebra.',
   '{"top":78,"left":6,"maxWidth":92}'::jsonb, '62% 45%', true, 1),
  ('a0000000-0000-4000-8000-000000000001', 'mesa-manha', '/images/banners/banner-mesa-manha.png', '/categoria/cafe-da-manha',
   'Cestas de café da manhã, montadas à mão em Brasília.',
   '{"top":40,"left":6,"maxWidth":40}'::jsonb, '40% 50%', true, 2),
  ('a0000000-0000-4000-8000-000000000001', 'ingredientes', '/images/banners/banner-ingredientes.png', '/categoria/cafe-da-manha',
   'Presentes que surpreendem, feitos à mão por encomenda.',
   '{"top":10,"left":6,"maxWidth":42}'::jsonb, '45% 50%', true, 3),
  ('a0000000-0000-4000-8000-000000000001', 'vitrine', '/images/banners/banner-vitrine.png', '/categoria/cafe-da-manha',
   'Presente pra quem você ama, entregue em Brasília.',
   '{"top":40,"left":60,"maxWidth":36}'::jsonb, '50% 45%', true, 4),
  ('a0000000-0000-4000-8000-000000000001', 'lifestyle', '/images/banners/banner-lifestyle.png', '/categoria/cafe-da-manha',
   'Momentos gostosos começam com a cesta certa.',
   '{"top":8,"left":6,"maxWidth":44}'::jsonb, '50% 40%', true, 5),
  ('a0000000-0000-4000-8000-000000000001', 'dia-das-maes', '/images/banners/banner-dia-das-maes.png', '/categoria/cafe-da-manha',
   'Um presente especial pro Dia das Mães.',
   '{"top":78,"left":6,"maxWidth":50}'::jsonb, '50% 50%', false, 6)
on conflict (tenant_id, slug) do update set
  image_url = excluded.image_url, href = excluded.href, text = excluded.text,
  text_position = excluded.text_position, object_position = excluded.object_position,
  active = excluded.active, sort_order = excluded.sort_order;

-- Usuario admin NAO entra por migracao (auth.users nao aceita insert direto
-- por SQL comum). Passo manual, documentado em docs/OPERACAO.md:
--   1. Supabase Dashboard -> Authentication -> Add user -> contatoagentop@gmail.com
--   2. Copiar o UUID gerado e rodar:
--      insert into profiles (id, tenant_id, role)
--      values ('<uuid-do-usuario>', 'a0000000-0000-4000-8000-000000000001', 'admin')
--      on conflict (id) do update set role = 'admin';
