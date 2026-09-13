-- 0041 — Cobrança recorrente da LICENÇA (loja paga a plataforma) via Asaas.
--
-- O "motor" de billing do seller. As colunas de assinatura já existem em
-- `tenants` desde a 0025 (asaas_customer_id, asaas_subscription_id,
-- subscription_status, subscription_plan, paid_until, pending_plan_id,
-- pending_expected_cents, pending_cycle) e o trigger de guarda as protege. Aqui
-- só falta: (a) um preço PRÓPRIO por loja (a Juliana paga R$299 num plano de
-- outro valor) e (b) os dois planos que serão vendidos.
--
-- NÃO apaga nada. Aditivo. A loja da Juliana continua no ar.

-- (a) Preço especial por loja. NULL = usa o preço do plano; preenchido = esse
--     valor manda (em centavos). Só o backend (service role) grava.
alter table tenants
  add column if not exists custom_subscription_cents integer
    check (custom_subscription_cents is null or custom_subscription_cents >= 500);

comment on column tenants.custom_subscription_cents is
  'Preço próprio da assinatura desta loja, em centavos (ex.: Juliana R$299). NULL = usa o preço do plano.';

-- (b) Os dois planos da plataforma. Nome/recursos o dono ajusta depois em
--     /super/planos; aqui entram só com o preço combinado (R$199 e R$399).
insert into subscription_plans (slug, name, description, monthly_cents, is_visible, sort_order)
values
  ('essencial',    'Essencial',    'Sua loja de cestas e presentes completa para começar a vender.', 19900, true, 1),
  ('profissional', 'Profissional', 'Tudo do Essencial e mais recursos para crescer com folga.',      39900, true, 2)
on conflict (slug) do nothing;

-- Preço especial da loja #1 (Juliana): R$299/mês, mesmo que ela fique num plano
-- de outro valor. Só grava se ainda não tiver um preço próprio.
update tenants
  set custom_subscription_cents = 29900
  where slug = 'juliana-cestas'
    and custom_subscription_cents is null;
