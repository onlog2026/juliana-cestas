-- 0052_delivery_experience.sql
-- "Foto da entrega": o cliente (conta dele) manda uma foto + um texto curto da experiência e
-- AUTORIZA a exibição no site. A autorização fica registrada aqui (data/hora), por avaliação.
--
-- Aditiva e idempotente. Enquanto não rodar, o formulário do cliente nem aparece na loja
-- (o código confere se a coluna existe) e o painel de avaliações continua igual.

alter table public.product_reviews
  add column if not exists photo_consent_at timestamptz;

comment on column public.product_reviews.photo_consent_at is
  'Quando o cliente autorizou mostrar a foto e o texto no site (foto da entrega). Nulo = sem autorização registrada.';
