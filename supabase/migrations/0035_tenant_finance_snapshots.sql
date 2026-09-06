-- 0035_tenant_finance_snapshots.sql — cache diário do financeiro (saldo e
-- recebíveis do Asaas DA PRÓPRIA LOJA) + o resumo de vendas do dia daquele
-- snapshot.
--
-- POR QUE EXISTE: a tela /admin/financeiro precisa mostrar saldo e recebíveis
-- do Asaas, mas consultar o Asaas AO VIVO toda vez que a lojista abre a tela é
-- caro e tem limite de taxa (rate limit) — e nenhuma consulta ao vivo é
-- necessária mais de uma vez por dia. Esta tabela guarda o resultado da última
-- consulta bem-sucedida; a tela lê daqui, e só refaz a consulta ao Asaas
-- quando o dia mudou (ou a lojista pede "Atualizar agora").
--
-- Consequência direta: se a consulta ao Asaas falhar (chave revogada, rede
-- fora do ar), a tela ainda tem o que mostrar — a última linha salva, com a
-- data dela e um aviso. Nunca cai para zero silenciosamente (mesma regra que
-- fundamentou a tela de estoque, migração 0031).
--
-- DINHEIRO SEMPRE EM CENTAVOS (`_cents`), igual a toda tabela de dinheiro
-- desde a 0026/0031. `raw` guarda a resposta crua do Asaas (saldo + a página
-- de cobranças pendentes consultada) só para auditoria manual, se um dia for
-- preciso conferir uma conta batendo diferente.
--
-- RLS: mesmo padrão de `stock_movements` (0031) — staff da própria loja só lê
-- a própria loja; toda escrita é feita pelo servidor com service role (o
-- refresh do snapshot roda em código de servidor, nunca no navegador).
--
-- Idempotente. Não roda nada sozinha.

create table if not exists tenant_finance_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  -- Data do snapshot no calendário de Brasília (não timestamptz: "o saldo de
  -- hoje" é uma pergunta de calendário, não de instante).
  date date not null,
  balance_cents integer not null default 0,
  pending_cents integer not null default 0,
  sales_cents integer not null default 0,
  orders_count integer not null default 0,
  -- Resposta crua do Asaas (saldo + página de cobranças pendentes) desta
  -- consulta. Só para auditoria; a tela nunca lê valor de dentro disto.
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, date)
);

create index if not exists tenant_finance_snapshots_tenant_date_idx
  on tenant_finance_snapshots (tenant_id, date desc);

alter table tenant_finance_snapshots enable row level security;

do $$ begin
  create policy "tenant_finance_snapshots_staff_select" on tenant_finance_snapshots
    for select to authenticated
    using (public.is_staff() and tenant_id = public.current_tenant_id());
exception when duplicate_object then null; end $$;

-- Sem policy de insert/update/delete para `authenticated` de propósito: quem
-- grava o snapshot é sempre o servidor (service role), nunca o navegador da
-- lojista. Ela só enxerga a leitura, e mesmo essa leitura hoje é feita pelo
-- servidor (createAdminClient) — a policy acima existe como cinto e
-- suspensório, igual às outras tabelas de staff deste projeto.
