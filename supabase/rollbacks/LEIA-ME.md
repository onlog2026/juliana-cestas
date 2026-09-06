# Rollbacks — só rodar quando o Claude pedir

Os arquivos desta pasta **desfazem** uma migration. Eles existem como plano B
para o caso de uma correção quebrar alguma coisa em produção.

**Não rode nada daqui na sequência normal de migrations.** Rodar um rollback
sem necessidade reabre o problema que a migration tinha fechado.

## O que já aconteceu (2026-09-04)

O `rollback_0020.sql` foi rodado junto com as migrations normais. Ele reabriu
as 8 políticas de leitura pública sem filtro de loja — o furo que a `0020`
tinha fechado. Nada quebrou no site (a vitrine lê com service role), mas
qualquer pessoa com a chave pública voltou a conseguir ler catálogo, preços,
banners e o endereço da loja direto pela API.

Como detectar: `npm run test:isolation` acusa falhas na Parte A.
Como corrigir: rodar de novo `supabase/migrations/0020_rls_tenant_isolation.sql`.
