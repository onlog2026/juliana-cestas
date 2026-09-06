# Teste de isolamento entre lojas

> A tela esconder um dado **não é** a mesma coisa que a API recusar. Todo teste
> aqui bate direto na API do Supabase, como um atacante faria — nunca pelo site.

## Por que isto existe

Até 2026-09-04 este projeto era uma loja só, e oito políticas do banco liberavam
leitura pública **sem filtro de loja**. Com um tenant isso é inofensivo; com dois,
qualquer pessoa com a chave pública (que fica no navegador, por design) leria
produtos, custos, banners, endereço e telefone de **todas** as lojas.

A migration `0020_rls_tenant_isolation.sql` fechou isso. Este teste é o que prova
— e o que impede a regressão.

## Como rodar

```bash
npm run test:isolation
```

Lê `.env.local`. Sai com código 1 se qualquer checagem falhar.

### Parte A — anônimo não lê nada (sempre roda)
Tenta ler 8 tabelas com a **chave pública**. Qualquer linha retornada é falha.

### Parte B — staff de uma loja não lê a outra (precisa de configuração)
1. Rode `supabase/seeds/dev_tenant.sql` no SQL Editor (cria a loja `loja-teste`).
2. Crie um usuário em Authentication → Add user (ex.: `staff-loja-teste@exemplo.com`).
3. Rode o `insert into profiles` que está comentado no fim do seed, com o UUID dele.
4. Preencha no `.env.local`:
   ```
   ISOLATION_STAFF_B_EMAIL=staff-loja-teste@exemplo.com
   ISOLATION_STAFF_B_PASSWORD=<a senha que você definiu>
   ISOLATION_TENANT_A_ID=a0000000-0000-4000-8000-000000000001
   ```

### Parte C — sanidade
Confirma que a service role enxerga os tenants. Existe para um "0 linhas" na
Parte A nunca ser confundido com chave errada.

## Verificação manual equivalente (curl)

Substitua `<URL>` e `<ANON_KEY>` pelos valores do `.env.local`:

```bash
curl -s "<URL>/rest/v1/products?select=*&limit=5" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
```

- **Esperado depois da 0020:** `[]`
- **Se voltar produtos:** a política pública ainda existe — o isolamento está aberto.

## Quando rodar

- Antes e depois de **toda** migration que mexa em RLS.
- No fim de cada fase do plano de plataforma.
- Sempre que alguém criar tabela nova com `tenant_id` (acrescente a tabela à
  lista `PUBLIC_TABLES` em `tests/isolation/tenant-isolation.mjs`).

## Armadilhas conhecidas

- **Service role ignora RLS.** Quase todo o código do storefront lê com service
  role, então "funcionou no site" não prova isolamento nenhum. Só este teste prova.
- **`REVOKE` de coluna é no-op** se o papel já tem SELECT na tabela inteira:
  revogue a tabela e re-conceda as colunas permitidas, nessa ordem.
- **Storage**: arquivos enviados antes da 0020 estão na raiz do bucket; os novos
  vão para `<tenant_id>/`. Os antigos continuam sendo servidos (bucket público),
  mas só a service role consegue alterá-los.
