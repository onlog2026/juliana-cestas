-- 0016_media_settings_expansion.sql
-- Galeria de produto (ate 4 fotos extras + 1 video, somadas a image_url que
-- ja existe = 5 fotos no total), identidade visual do site (logo do
-- header/footer, favicon), dados cadastrais da loja (endereco, telefone,
-- email) e tipografia por banner (tamanho/familia/cor da fonte).
-- Idempotente.

alter table products add column if not exists gallery_urls text[] not null default '{}';
alter table products add column if not exists video_url text;
do $$ begin
  alter table products add constraint products_gallery_urls_check
    check (array_length(gallery_urls, 1) is null or array_length(gallery_urls, 1) <= 4);
exception when duplicate_object then null; end $$;

create table if not exists site_settings (
  tenant_id uuid primary key references tenants(id),
  logo_header_url text,
  logo_footer_url text,
  favicon_url text,
  updated_at timestamptz not null default now()
);
alter table site_settings enable row level security;
do $$ begin
  create policy "site_settings_public_select" on site_settings for select to anon, authenticated
    using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "site_settings_staff_all" on site_settings for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

create table if not exists store_profile (
  tenant_id uuid primary key references tenants(id),
  business_name text,
  document text,
  email text,
  phone text,
  cep text,
  street text,
  address_number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  updated_at timestamptz not null default now()
);
alter table store_profile enable row level security;
do $$ begin
  create policy "store_profile_public_select" on store_profile for select to anon, authenticated
    using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "store_profile_staff_all" on store_profile for all to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id())
    with check (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

alter table banners add column if not exists font_size integer not null default 32;
alter table banners add column if not exists font_family text not null default 'display';
alter table banners add column if not exists font_color text not null default '#ffffff';
do $$ begin
  alter table banners add constraint banners_font_size_check check (font_size between 12 and 96);
exception when duplicate_object then null; end $$;
