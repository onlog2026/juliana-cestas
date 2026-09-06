-- rollback_0020.sql — desfaz 0020_rls_tenant_isolation.sql.
--
-- Use APENAS se remover as políticas públicas quebrar alguma leitura que a
-- gente não previu (nenhuma deveria: todo o storefront lê com service role).
-- Rodar isto reabre a leitura pública SEM filtro de loja -- aceitável só
-- enquanto existir uma única loja. Idempotente.

do $$ begin
  create policy "products_public_select" on products for select to anon, authenticated using (active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "product_addons_public_select" on product_addons for select to anon, authenticated using (active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "banners_public_select" on banners for select to anon, authenticated using (active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "categories_public_select" on categories for select to anon, authenticated using (active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "delivery_settings_public_select" on delivery_settings for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "delivery_zones_public_select" on delivery_zones for select to anon, authenticated using (active = true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "site_settings_public_select" on site_settings for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "store_profile_public_select" on store_profile for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;

-- Storage volta ao formato antigo (staff de qualquer loja, sem pasta).
drop policy if exists "site_media_tenant_insert" on storage.objects;
drop policy if exists "site_media_tenant_update" on storage.objects;
drop policy if exists "site_media_tenant_delete" on storage.objects;

do $$ begin
  create policy "site_media_staff_insert" on storage.objects
    for insert to authenticated with check (bucket_id = 'site-media' and public.is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "site_media_staff_update" on storage.objects
    for update to authenticated using (bucket_id = 'site-media' and public.is_staff());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "site_media_staff_delete" on storage.objects
    for delete to authenticated using (bucket_id = 'site-media' and public.is_staff());
exception when duplicate_object then null; end $$;
