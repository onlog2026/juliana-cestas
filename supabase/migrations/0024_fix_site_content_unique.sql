-- 0024_fix_site_content_unique.sql — corrige o índice único de `site_content`.
--
-- ERRO QUE ISTO CONSERTA (2026-09-04):
--   ERROR 42P10: there is no unique or exclusion constraint matching the
--   ON CONFLICT specification
--
-- Causa: a 0022 criou índices únicos PARCIAIS (`where tenant_id is not null`).
-- O Postgres só usa índice parcial em `ON CONFLICT` se a MESMA condição for
-- repetida na cláusula -- e o PostgREST (usado pelo painel, via
-- `.upsert({ onConflict: ... })`) não tem como expressar essa condição.
-- Resultado: falhava tanto o seed quanto o botão "Salvar" da tela de textos.
--
-- Correção: uma constraint única normal, que o `ON CONFLICT` reconhece sozinho.
-- Em Postgres 15+ usamos `NULLS NOT DISTINCT` para que as linhas da plataforma
-- (tenant_id nulo, previstas para a F6) também sejam únicas -- sem isso, no
-- Postgres NULL nunca é igual a NULL e duas linhas iguais passariam.
-- Idempotente.

drop index if exists site_content_tenant_key;
drop index if exists site_content_platform_key;

do $$
begin
  begin
    execute 'alter table site_content add constraint site_content_key'
         || ' unique nulls not distinct (tenant_id, surface, section, slot)';
  exception
    when duplicate_table or duplicate_object then
      null; -- já existe, nada a fazer
    when syntax_error or feature_not_supported then
      -- Postgres 14 ou anterior: não existe NULLS NOT DISTINCT. Uma constraint
      -- comum já resolve o caso de hoje (toda linha tem loja). Quando a landing
      -- da plataforma entrar (F6, tenant_id nulo), conferir se o banco já é 15+.
      begin
        execute 'alter table site_content add constraint site_content_key'
             || ' unique (tenant_id, surface, section, slot)';
      exception
        when duplicate_table or duplicate_object then null;
      end;
  end;
end $$;
