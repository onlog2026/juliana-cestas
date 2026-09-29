# Auditoria de segurança — 29/09/2026

## Verificado nesta data
| Item | Resultado |
|---|---|
| securityheaders.com | A → CSP adicionada (enforçada na vitrine; só relatório em /admin, /super, /plataforma, /auth) |
| `npm audit` | 1 moderada (`undici`) → `npm audit fix` → **0 vulnerabilidades** |
| Segredos no bundle (`.next/static`) | Service role, Resend, Asaas, CRON_SECRET: **nenhum** encontrado |
| Rotas `/api/*` | Todas com guarda própria (segredo/token do webhook, cron, rate limit ou validação), exceto `/api/img` (pública de propósito: só aceita o host do Storage, larguras da lista e 3 qualidades fixas, cache imutável, tamanho máx. 15 MB) |
| Server actions (`"use server"`) | Todas com guarda de staff/módulo/cliente; a única sem guarda (`banners/constants.ts`) só exporta constantes |
| RLS — leitura anônima | `orders`, `order_items`, `product_reviews`, `notifications`, `customers`, `store_profile`, `delivery_settings`, `seo_settings` devolvem vazio; `product_clicks` e as funções `top_products_*` respondem 42501 (só service role) |
| Cookies/sessão | Gerenciados pelo Supabase SSR |

## Achado que depende do dono (SQL)
**O bucket `site-media` permite listar os nomes dos arquivos a qualquer visitante** (a API de listagem responde para a chave anônima). Os arquivos já são públicos por endereço e têm nomes aleatórios, então o risco é baixo (só revela o que existe), mas dá para fechar sem afetar as imagens do site (bucket público serve por URL sem depender de política de leitura).

Passo 1 — Supabase → SQL Editor, rode:

```sql
select policyname, cmd, qual from pg_policies where schemaname = 'storage' and tablename = 'objects';
```

Passo 2 — me mande o resultado; eu monto o `DROP POLICY` exato da política de leitura (SELECT) do `site-media`. Não apague sem conferir: o painel envia arquivos pelo servidor (service role) e continua funcionando.

## Limites conhecidos
- CSP usa `'unsafe-inline'` em script/estilo (o Next injeta inline). Evolução: nonce por requisição (exige páginas dinâmicas — descartado por custo).
- CSP do painel segue em modo relatório: enforçar só depois de navegar cada tela logado e ler o console.
- `/api/img` usa CPU da função; a CDN guarda cada tamanho por 1 ano, então só a 1ª visita gera.
