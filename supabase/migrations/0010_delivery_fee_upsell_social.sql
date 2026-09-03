-- 0010_delivery_fee_upsell_social.sql
-- Frete por produto (retirada sempre gratis, entrega soma o valor do
-- produto), upsell/cross-sell entre produtos, e links de redes sociais
-- editaveis pelo admin. Idempotente.

alter table products add column if not exists delivery_fee_cents integer not null default 0;

create table if not exists product_upsells (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  product_id uuid not null references products(id) on delete cascade,
  upsell_product_id uuid not null references products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, upsell_product_id),
  check (product_id <> upsell_product_id)
);
alter table product_upsells enable row level security;

create table if not exists social_links (
  tenant_id uuid primary key references tenants(id),
  instagram text,
  facebook text,
  x text,
  youtube text,
  linkedin text,
  updated_at timestamptz not null default now()
);
alter table social_links enable row level security;
-- Sem policy anon/authenticated nas duas: lidas via service role no
-- servidor (catalog/service.ts, layout), gravadas via Server Action do
-- admin -- mesmo padrao de seo_settings.

insert into social_links (tenant_id, instagram)
values ('a0000000-0000-4000-8000-000000000001', 'https://www.instagram.com/julianapresent.cestas')
on conflict (tenant_id) do nothing;
