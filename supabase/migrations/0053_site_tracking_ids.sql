-- 0053 — Google Analytics 4 e Tag Manager POR LOJA (antes eram fixos no código da loja da Juliana).
-- Aditiva e idempotente: só cria colunas. O código funciona antes e depois de rodar este arquivo.
-- Rodar no SQL Editor do Supabase do projeto da Juliana (oygizajevizwhiymgsly).

alter table public.site_settings
  add column if not exists ga4_id text,
  add column if not exists gtm_id text;

-- Formato válido (ou vazio): G-XXXXXXXX para o GA4 e GTM-XXXXXXX para o Tag Manager.
do $$
begin
  alter table public.site_settings
    add constraint site_settings_ga4_id_format check (ga4_id is null or ga4_id ~ '^G-[A-Z0-9]{6,}$');
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.site_settings
    add constraint site_settings_gtm_id_format check (gtm_id is null or gtm_id ~ '^GTM-[A-Z0-9]{4,}$');
exception when duplicate_object then null;
end $$;

-- OPCIONAL (loja da Juliana): gravar os IDs que ela já usa, para não depender do padrão do código.
-- update public.site_settings
--    set ga4_id = 'G-DP4FFX56RD', gtm_id = 'GTM-MSP4DBHM'
--  where tenant_id = 'a0000000-0000-4000-8000-000000000001';
