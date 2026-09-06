-- 0020_rls_tenant_isolation.sql — fecha o vazamento entre lojas.
--
-- PROBLEMA (medido em 2026-09-04 por tests/isolation/tenant-isolation.mjs):
-- oito políticas de leitura pública liberavam SELECT para `anon` SEM nenhum
-- filtro de loja. Com uma loja só isso é inofensivo. No dia em que existir a
-- segunda, qualquer pessoa com a chave pública (que fica no navegador, por
-- design) lê produtos, preços, custos, banners, categorias, zonas de entrega,
-- configurações e o endereço/telefone de TODAS as lojas, direto pela API REST
-- -- sem passar pelo site. O filtro `.eq("tenant_id", ...)` do código não
-- protege nada nesse caminho.
--
-- SOLUÇÃO: remover as políticas. Nenhuma leitura da vitrine depende delas --
-- todo o storefront lê no servidor com service role (src/lib/supabase/admin.ts),
-- que ignora RLS. Verificado antes de escrever esta migration: nenhum
-- componente de cliente consulta essas tabelas com a chave pública, e não há
-- assinatura de realtime.
--
-- Reverter: supabase/migrations/rollback_0020.sql
-- Idempotente.

drop policy if exists "products_public_select" on products;
drop policy if exists "product_addons_public_select" on product_addons;
drop policy if exists "banners_public_select" on banners;
drop policy if exists "categories_public_select" on categories;
drop policy if exists "delivery_settings_public_select" on delivery_settings;
drop policy if exists "delivery_zones_public_select" on delivery_zones;
drop policy if exists "site_settings_public_select" on site_settings;
drop policy if exists "store_profile_public_select" on store_profile;

-- ── Storage: cada loja só mexe na própria pasta ───────────────────────────
-- Antes, qualquer staff (de qualquer loja) podia gravar/apagar qualquer
-- arquivo do bucket. A partir da migration 0020 o upload grava em
-- `<tenant_id>/<arquivo>`; a política passa a exigir que a primeira pasta do
-- caminho seja a loja de quem está enviando.
--
-- Arquivos ANTIGOS ficam na raiz do bucket e continuam sendo servidos
-- normalmente (leitura pública segue aberta -- o bucket é público e as URLs
-- já estão salvas no banco). Eles só não podem mais ser alterados por um
-- client autenticado comum; o painel usa service role e continua podendo.

drop policy if exists "site_media_staff_insert" on storage.objects;
drop policy if exists "site_media_staff_update" on storage.objects;
drop policy if exists "site_media_staff_delete" on storage.objects;

do $$ begin
  create policy "site_media_tenant_insert" on storage.objects
    for insert to authenticated
    with check (
      bucket_id = 'site-media'
      and public.is_staff()
      and (storage.foldername(name))[1] = public.current_tenant_id()::text
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "site_media_tenant_update" on storage.objects
    for update to authenticated
    using (
      bucket_id = 'site-media'
      and public.is_staff()
      and (storage.foldername(name))[1] = public.current_tenant_id()::text
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "site_media_tenant_delete" on storage.objects
    for delete to authenticated
    using (
      bucket_id = 'site-media'
      and public.is_staff()
      and (storage.foldername(name))[1] = public.current_tenant_id()::text
    );
exception when duplicate_object then null; end $$;
