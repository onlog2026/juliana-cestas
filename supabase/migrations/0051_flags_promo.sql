-- 0051_flags_promo.sql
-- Promoção por produto: preço "de" (para mostrar "de R$ 300 por R$ 259" e o -14%
-- automático) e a flag escolhida (Promoção, Black Friday, Dia das Mães...).
--
-- O preço COBRADO continua sendo price_cents: compare_at_price_cents é só exibição.
-- Idempotente. O código da loja funciona sem esta migração (sem tarja e sem salvar
-- promoção); depois de rodar, o painel passa a gravar e a vitrine a mostrar.

alter table public.products
  add column if not exists compare_at_price_cents integer
    check (compare_at_price_cents is null or compare_at_price_cents > 0),
  add column if not exists flag_id text;
