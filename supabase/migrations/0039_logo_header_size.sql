-- 0039_logo_header_size.sql — deixa a lojista escolher o tamanho da logo do
-- cabeçalho, em vez de um valor fixo travado no código.
--
-- `null` = usa o padrão (80px, o mesmo valor que já estava fixo no CSS antes
-- desta migração) -- loja que nunca mexeu no controle não muda de aparência.
-- Guardado em pixels porque é exatamente o que o controle desliza e o CSS lê.
-- Idempotente.

alter table site_settings
  add column if not exists logo_header_height integer;

do $$ begin
  alter table site_settings
    add constraint site_settings_logo_header_height_range
    check (logo_header_height is null or logo_header_height between 32 and 140);
exception when duplicate_object then null; end $$;
