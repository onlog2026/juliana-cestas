-- 0028_seller_payments.sql — pagamento com a conta Asaas DA PRÓPRIA LOJA.
--
-- Decisão de arquitetura do dono (fixa): a plataforma NUNCA toca no dinheiro
-- das vendas. Cada loja conecta a conta Asaas dela; o dinheiro do pedido cai
-- direto na conta da lojista. A plataforma só cobra a licença (isso é outra
-- coisa, em `tenants.asaas_subscription_id`, migração 0025).
--
-- Consequência prática deste desenho: a chave de API que fica guardada aqui é
-- a chave que dá acesso ao DINHEIRO da lojista. Por isso:
--   * a chave nunca é gravada em texto puro (AES-256-GCM, src/lib/security/crypto-secret.ts);
--   * a tabela nasce com RLS `using(false)` — nem anon nem authenticated leem;
--     só o service role (route handlers e Server Actions do servidor);
--   * o token do webhook NUNCA é gravado: guarda-se só o SHA-256 dele.
--
-- Idempotente: pode rodar mais de uma vez sem quebrar nada.

-- ── 1. A conta de recebimento de cada loja ────────────────────────────────
create table if not exists tenant_payment_accounts (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  provider text not null default 'asaas' check (provider in ('asaas')),
  environment text not null default 'production' check (environment in ('sandbox','production')),
  -- Texto cifrado no formato "v1.<iv>.<tag>.<dados>" (nunca a chave crua).
  api_key_encrypted text not null,
  -- Únicos 4 caracteres que podem voltar para a tela ("•••• 4f2a").
  key_last4 text,
  -- SHA-256 (hex) do token que o Asaas manda no header `asaas-access-token`.
  -- O token em si só existiu em memória no momento de conectar.
  webhook_token_hash text not null,
  -- Id do webhook criado no Asaas — guardado para conseguir apagar depois.
  asaas_webhook_id text,
  webhook_url text,
  status text not null default 'connected'
    check (status in ('connected','disconnected','error')),
  -- Nome/e-mail da conta Asaas, só para a lojista reconhecer na tela qual
  -- conta ela conectou. Nunca dado sensível.
  account_name text,
  account_email text,
  last_error text,
  connected_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tenant_payment_accounts enable row level security;

-- `using(false)`: o navegador NUNCA lê esta tabela, nem o dono da loja.
-- Ela guarda a chave (cifrada) e o hash do token do webhook. Toda leitura
-- passa por código de servidor com service role.
do $$ begin
  create policy "tenant_payment_accounts_service_only"
    on tenant_payment_accounts for all using (false);
exception when duplicate_object then null; end $$;

-- ── 2. Colunas que faltavam em `payments` ─────────────────────────────────
-- `asaas_payment_id`, `pix_payload`, `invoice_url`, `due_date`, `paid_at`,
-- `raw` e `tenant_id` já nasceram na 0004; os `add column if not exists`
-- abaixo existem para bancos que estejam atrás e não fazem nada onde já há.
alter table payments add column if not exists tenant_id uuid references tenants(id);
alter table payments add column if not exists asaas_payment_id text;
alter table payments add column if not exists pix_payload text;
alter table payments add column if not exists pix_qr_base64 text;
alter table payments add column if not exists invoice_url text;
alter table payments add column if not exists due_date date;
alter table payments add column if not exists paid_at timestamptz;
alter table payments add column if not exists raw jsonb;

-- UNIQUE em `asaas_payment_id`: é o que impede o mesmo pagamento do Asaas de
-- virar duas linhas aqui (e, por tabela, dois pedidos liberados).
create unique index if not exists payments_asaas_payment_id_uq
  on payments (asaas_payment_id) where asaas_payment_id is not null;

-- Busca do webhook é SEMPRE por (asaas_payment_id, tenant_id) — nunca só pelo
-- id, senão uma loja confirmaria pagamento de outra.
create index if not exists payments_tenant_asaas_idx
  on payments (tenant_id, asaas_payment_id);

-- Boleto passa a ser forma de pagamento aceita (a 0004 só previa PIX e
-- cartão). Recria o CHECK porque `add constraint if not exists` não existe
-- em Postgres.
do $$ begin
  alter table payments drop constraint if exists payments_billing_type_check;
  alter table payments add constraint payments_billing_type_check
    check (billing_type in ('PIX','CREDIT_CARD','BOLETO'));
exception when others then null; end $$;

-- ── 3. Ledger de eventos do gateway ──────────────────────────────────────
-- `webhook_events.event_id` já é a chave primária desde a 0004 — é ela que
-- garante "evento repetido nunca reprocessa". `tenant_id` também já existe;
-- o add abaixo é rede de segurança para bancos atrasados.
alter table webhook_events add column if not exists tenant_id uuid references tenants(id);
alter table webhook_events add column if not exists payload jsonb;
create index if not exists webhook_events_tenant_received_idx
  on webhook_events (tenant_id, received_at desc);

-- ── 4. Leitura da situação do pagamento pelo painel da loja ──────────────
-- A staff já enxerga `payments` (policy "payments_staff_select", 0004).
-- Nada a fazer aqui: `tenant_payment_accounts` continua invisível de
-- propósito, e a tela /admin/pagamentos lê pelo servidor.
