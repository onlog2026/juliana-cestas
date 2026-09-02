-- 0007_customer_auth.sql — liga customers a auth.users (login por e-mail/senha ou Google)
-- Idempotente.

alter table customers add column if not exists auth_user_id uuid references auth.users(id);
create unique index if not exists customers_auth_user_id_uq on customers (auth_user_id) where auth_user_id is not null;

-- Corrige o nome/slug do tenant, que ainda estava "Juliana Present" (nome
-- antigo, ja corrigido em todo o site em 2026-09-02 mas nao no banco).
update tenants
set slug = 'juliana-cestas', name = 'Juliana Cestas'
where id = 'a0000000-0000-4000-8000-000000000001';
