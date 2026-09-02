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
