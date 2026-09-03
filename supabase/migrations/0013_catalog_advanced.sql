-- 0013_catalog_advanced.sql
-- Categorias reais (hoje só existe uma pasta fixa /categoria/cafe-da-manha)
-- e campos avançados de cadastro de produto: custo/margem, SKU, código de
-- barras, estoque (nulo = sob encomenda/ilimitado, não "zero"), limite de
-- estoque baixo, e campos fiscais (NCM/CEST) -- preparados pra quando a
-- Juliana emitir nota fiscal (via Asaas, decisão do dono), sem integração
-- de emissão ainda. Idempotente.

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  slug text not null,
  name text not null,
  description text,
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
alter table categories enable row level security;

do $$ begin
  create policy "categories_public_select" on categories for select to anon, authenticated
    using (active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "categories_staff_all" on categories for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

alter table products add column if not exists category_id uuid references categories(id);
alter table products add column if not exists cost_cents integer;
alter table products add column if not exists sku text;
alter table products add column if not exists barcode text;
-- nulo = ilimitado/sob encomenda (não é a mesma coisa que 0 = esgotado).
alter table products add column if not exists stock_quantity integer;
alter table products add column if not exists low_stock_threshold integer;
alter table products add column if not exists ncm text;
alter table products add column if not exists cest text;

do $$ begin
  alter table products add constraint products_cost_cents_check check (cost_cents is null or cost_cents >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table products add constraint products_stock_quantity_check check (stock_quantity is null or stock_quantity >= 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table products add constraint products_low_stock_threshold_check check (low_stock_threshold is null or low_stock_threshold >= 0);
exception when duplicate_object then null; end $$;

-- Seed: categoria "Café da manhã" (mantém a URL /categoria/cafe-da-manha
-- funcionando sem trocar nenhum link do site) e vincula as 5 cestas
-- existentes a ela.
insert into categories (tenant_id, slug, name, description, active, sort_order)
values (
  'a0000000-0000-4000-8000-000000000001',
  'cafe-da-manha',
  'Café da manhã',
  'As cestas de café da manhã da Juliana Cestas, montadas à mão em Brasília.',
  true,
  1
)
on conflict (tenant_id, slug) do nothing;

update products
set category_id = (
  select id from categories
  where tenant_id = products.tenant_id and slug = 'cafe-da-manha'
)
where category_id is null
  and tenant_id = 'a0000000-0000-4000-8000-000000000001';
