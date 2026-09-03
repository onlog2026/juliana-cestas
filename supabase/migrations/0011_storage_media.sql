-- 0011_storage_media.sql — bucket público pra imagem de banner/produto
-- enviada pelo painel admin. Upload em si sempre passa por Server Action
-- com service role (createAdminClient), nunca direto do navegador -- as
-- policies abaixo existem só como segunda camada de defesa caso algo
-- algum dia use um client autenticado comum. Idempotente.

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

do $$ begin
  create policy "site_media_public_read" on storage.objects
    for select using (bucket_id = 'site-media');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "site_media_staff_insert" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'site-media' and public.is_staff());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "site_media_staff_update" on storage.objects
    for update to authenticated
    using (bucket_id = 'site-media' and public.is_staff());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "site_media_staff_delete" on storage.objects
    for delete to authenticated
    using (bucket_id = 'site-media' and public.is_staff());
exception when duplicate_object then null; end $$;
