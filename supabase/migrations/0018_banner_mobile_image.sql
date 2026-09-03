-- 0018_banner_mobile_image.sql
-- Banner pode ter uma foto própria pro celular (retrato) além da foto normal
-- (paisagem/larga, usada no desktop). Se não tiver a foto de mobile, o
-- celular continua usando a mesma foto de sempre -- nada quebra pros
-- banners que já existem. Idempotente.

alter table banners add column if not exists mobile_image_url text;
alter table banners add column if not exists mobile_object_position text;

do $$ begin
  alter table banners add constraint banners_text_length_check check (char_length(text) <= 100);
exception
  when duplicate_object then null;
end $$;
