-- 0047_addons_visual.sql — adicionais com foto, grupo (seção) e observação.
--
-- Até aqui `product_addons` só tinha nome e preço, e não existia tela no painel
-- para cadastrá-los. Para o layout de "Adicionais" (seções tipo FOTOS / BOLOS,
-- miniatura, observação "Personalizado", preço e botão +) cada adicional passa a
-- ter foto, grupo e uma observação curta, e uma ordem.
--
-- Tudo opcional e aditivo: adicional existente continua igual. Idempotente.

alter table product_addons
  add column if not exists image_url text,
  add column if not exists group_name text,
  add column if not exists note text,
  add column if not exists sort_order integer not null default 0;

do $$ begin
  alter table product_addons add constraint product_addons_group_name_len
    check (group_name is null or char_length(group_name) <= 40);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table product_addons add constraint product_addons_note_len
    check (note is null or char_length(note) <= 60);
exception when duplicate_object then null; end $$;
