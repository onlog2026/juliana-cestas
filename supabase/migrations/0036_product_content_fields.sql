-- 0036_product_content_fields.sql — onde o conteúdo que a IA gera (e o que a
-- lojista escrever à mão) tem para onde ir.
--
-- O assistente de IA de produto (src/modules/ai/product-content.ts) já gera
-- descrição longa, descrição curta, título e descrição de SEO, texto
-- alternativo da foto e legenda de rede social -- mas até esta migração
-- `products` não tinha nenhuma dessas colunas. Sem elas o botão "Preencher
-- com IA" geraria texto que não tem onde ser salvo: botão sem persistência é
-- a ponta solta clássica.
--
-- Tudo opcional (nullable) e aditivo: produto existente continua igual,
-- sem nenhum destes campos preenchidos, até a lojista usar o recurso.
-- Idempotente.

alter table products
  add column if not exists description text,
  add column if not exists short_description text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists image_alt text,
  add column if not exists social_caption text;

-- Limite de tamanho generoso, só para impedir um valor absurdo de entrar
-- (a validação de UX de verdade acontece no formulário e no schema da IA).
do $$ begin
  alter table products add constraint products_description_len check (char_length(coalesce(description, '')) <= 4000);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table products add constraint products_short_description_len check (char_length(coalesce(short_description, '')) <= 300);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table products add constraint products_seo_title_len check (char_length(coalesce(seo_title, '')) <= 160);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table products add constraint products_seo_description_len check (char_length(coalesce(seo_description, '')) <= 300);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table products add constraint products_image_alt_len check (char_length(coalesce(image_alt, '')) <= 200);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table products add constraint products_social_caption_len check (char_length(coalesce(social_caption, '')) <= 600);
exception when duplicate_object then null; end $$;
