-- 0034_ai_usage.sql — registro de uso do assistente de IA (módulo `ia`),
-- usado para a cota mensal por plano (`plan_modules.limit_value`, migração
-- 0026). Ver `src/modules/ai/usage.ts` para a regra de comparação e
-- `src/modules/ai/actions.ts` para quem grava aqui.
--
-- Cada linha é UMA chamada ao assistente. Ela é gravada (reservada) ANTES de
-- chamar a IA, com `tokens_used = 0`; se a chamada terminar bem, o número real
-- de tokens é atualizado; se falhar, a linha é apagada (estorno) para a
-- lojista não perder cota por uma tentativa que não gerou nada. Reservar antes
-- de chamar existe para NUNCA vazar geração de graça: mesmo que o processo
-- caia no meio da chamada à IA, a cota já foi debitada.
--
-- Idempotente.

create table if not exists ai_usage (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  kind text not null check (kind in ('descricao', 'seo', 'legenda')),
  tokens_used integer not null default 0 check (tokens_used >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- A cota é sempre "quantas chamadas neste mês, desta loja" -- este índice é
-- exatamente essa consulta (ver `getUsoIaDoMes`).
create index if not exists ai_usage_tenant_created on ai_usage (tenant_id, created_at desc);

alter table ai_usage enable row level security;

-- Fechada para todo mundo, inclusive staff autenticado: quem lê e escreve é
-- SEMPRE o servidor (service role, que ignora RLS) -- mesmo padrão de
-- `team_invites` (0033) e `vouchers` (0026). Nenhuma política pública de
-- leitura: quanto uma loja usa de IA não é dado que a API REST deveria
-- devolver para ninguém além do próprio servidor.
do $$ begin
  create policy "ai_usage_service_only" on ai_usage for all using (false);
exception when duplicate_object then null; end $$;
