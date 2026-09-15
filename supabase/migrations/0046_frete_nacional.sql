-- 0046_frete_nacional.sql — Fase 2 do frete: envio nacional por transportadora
-- (Correios/Melhor Envio), para produtos que a lojista marcar como
-- "pode enviar pra fora da área local". Cestas são produto perecível — por
-- isso NADA disso é automático: só o produto marcado com `ships_nationally`
-- (peso e medidas preenchidos) entra no cálculo de transportadora.
--
-- Tudo opcional (nullable) e aditivo: produto existente continua igual até a
-- lojista preencher peso/medidas e marcar o produto. Idempotente.

alter table products
  add column if not exists ships_nationally boolean not null default false,
  add column if not exists weight_grams integer,
  add column if not exists length_cm integer,
  add column if not exists width_cm integer,
  add column if not exists height_cm integer;

do $$ begin
  alter table products add constraint products_weight_grams_positive
    check (weight_grams is null or weight_grams > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table products add constraint products_length_cm_positive
    check (length_cm is null or length_cm > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table products add constraint products_width_cm_positive
    check (width_cm is null or width_cm > 0);
exception when duplicate_object then null; end $$;
do $$ begin
  alter table products add constraint products_height_cm_positive
    check (height_cm is null or height_cm > 0);
exception when duplicate_object then null; end $$;
