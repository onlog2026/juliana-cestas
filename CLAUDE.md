@AGENTS.md

# Juliana Cestas — regras do projeto (LEIA ANTES DE QUALQUER AÇÃO)

> Este CLAUDE.md vence o da pasta pai (`Downloads/CLAUDE.md`). Projeto ISOLADO: nunca misturar com Agentop, Sorteio, Spotlog, YLIP ou NutriSnap.
> O bloco `@AGENTS.md` acima é gerado pelo Next 16: as APIs mudaram em relação ao Next 15. Antes de escrever código, ler o guia em `node_modules/next/dist/docs/`.

## Identidade
- **Loja:** Juliana Cestas — cestas de café da manhã, presentes e kits comemorativos.
- **Cidade:** Brasília (DF). Entrega local por região administrativa + retirada; envio nacional é roadmap.
- **Dono do projeto:** Adriano (não é dev). Relatórios em português, passo a passo, onde clicar.

## Infra (preencher/conferir antes de SQL ou deploy)
| Recurso | Valor | Observação |
|---|---|---|
| Pasta | `C:\Users\user\Downloads\Juliana Cestas` | tem espaço no nome: sempre entre aspas |
| GitHub (ativo p/ deploy) | `onlog2026/juliana-cestas` (privado) | remote git local = `onlog`. Conta usada no navegador "Chrome Onlog" (Google `onlogjf@gmail.com`). Push feito via Personal Access Token de uso único (criado, usado, revogado na hora — não fica salvo). **Sem credencial git persistente nesta máquina para essa conta**: antes do próximo push, ver seção "Como publicar" abaixo |
| GitHub (original, PAUSADO) | `contatoagentop/juliana-cestas` (privado) | remote git local = `origin`. Continua com o histórico completo, mas o deploy Vercel ligado a ele está bloqueado (ver linha Vercel abaixo). Não apagar — só não é o remote ativo pro deploy |
| Supabase project ID | `oygizajevizwhiymgsly` | URL `https://oygizajevizwhiymgsly.supabase.co` · região sa-east-1 (São Paulo) · plano Free. Conferir caractere a caractere antes de `execute_sql` |
| Supabase org | `Juliana Cestas` (Free) — org id a conferir no dashboard | conta Supabase = `contatoagentop` (Google). Outras orgs dessa conta: `agentop` (Pro, kbdghebozdwyqozoldso) e `jarvis` (Free, lnndplsyudulsigkiybv). O MCP do Supabase desta máquina está em OUTRA conta (org adrianorosa2012, só Fácilbicas): não usar o MCP para este projeto até reconectar |
| Vercel projeto (ATIVO) | `juliana-cestas` | conta `onlogjf-1751's projects` (Hobby, GitHub `onlog2026`). Importado de `onlog2026/juliana-cestas`. **Deploy automático por push funciona** (mesma conta é dona do repo e do projeto Vercel, sem bloqueio de colaborador). Primeira URL: `https://juliana-cestas-fjfaolcn7-onlogjf-1751s-projects.vercel.app` (muda a cada deploy até domínio fixo ser configurado — conferir a URL atual em Deployments antes de divulgar). 6 variáveis de ambiente configuradas (Supabase URL/anon/service_role, Asaas sandbox URL, WhatsApp placeholder); falta `NEXT_PUBLIC_SITE_URL` (tentativa de adicionar pela UI não salvou — adicionar manualmente na próxima sessão) |
| Vercel projeto (PAUSADO) | `juliana-cestas` | conta `contatoagentop-5784` (Hobby). Deploy automático por push BLOQUEADO: commits autenticados como `adrianorosa2012@gmail.com` (GitHub `adrianrosa1`) não são reconhecidos como colaborador nesse Hobby team. Decisão do dono, ainda em aberto: deixar pausado (atual), repo público, upgrade pra Pro, ou resolver identidade do commit |
| Domínio | `A_DEFINIR` | |
| Asaas | sandbox (`https://api-sandbox.asaas.com`) | chave de produção só quando o dono publicar |

## Como publicar (deploy automático via `onlog2026`)
`git push onlog main` precisa de credencial da conta GitHub `onlog2026`, que **não fica salva** nesta máquina (o token usado na Fase 0 foi de uso único, criado e revogado na hora). Antes do próximo push:
1. Pedir pro dono conectar o Chrome já logado como `onlogjf@gmail.com` (ele sabe qual é).
2. Criar um Personal Access Token novo em `github.com/settings/personal-access-tokens/new` (exige verificação por e-mail — modo sudo — então o dono precisa clicar no link do e-mail primeiro).
3. Escopo: só repositório `onlog2026/juliana-cestas`, permissão `Contents: Read and write`.
4. Copiar o token pelo botão da página (nunca digitar à mão), usar uma vez em `git push https://x-access-token:TOKEN@github.com/onlog2026/juliana-cestas.git main`, depois **apagar o token na hora** em Settings → Personal access tokens.
5. Alternativa mais rápida para sessões futuras: o dono pode gerar um token de vida mais longa (ex. 90 dias) e me passar uma vez só — aí eu guardo só localmente (nunca commitado) e não preciso repetir o passo a passo toda vez.

**MCP do Supabase é GLOBAL** e já apontou para projeto errado em outro projeto. Antes de qualquer `execute_sql`/`apply_migration`: `get_project` e comparar o ID com a tabela acima.

## Stack
Next.js 16 (App Router, TypeScript, `src/`, Turbopack) · React 19 · Tailwind v4 · shadcn/ui · Motion · lucide-react · react-hook-form + zod · Supabase (`@supabase/ssr`) · Vercel · Asaas · Vitest + Playwright.

## Comandos
- `npm run dev` (porta 3000) · `npx tsc --noEmit` SEMPRE antes de build/deploy · `npm run build`
- Deploy: `npx vercel@55.0.0 --prod --yes` (CLI pinada; 54.1.0 tem bug de deploy_failed). **Nunca `--prod` sem mostrar o resumo e ter OK do dono.**
- Depois de deploy pela CLI, commitar e dar push: Vercel CLI não salva no git sozinho.

## Convenções
- Domínio e serviços em `src/modules/<dominio>/`; componentes não têm regra de negócio.
- Service role só em `src/lib/supabase/admin.ts` e route handlers. Nada secreto em `NEXT_PUBLIC_*`.
- Webhook Asaas em `src/app/api/asaas/webhook/route.ts`: **auto-contido, sem imports relativos**, fail-closed sem token (500), 200 com token errado, ledger `webhook_events`, 500 + liberar ledger quando a gravação falhar.
- Preço, cupom e frete são SEMPRE recalculados no servidor. Mínimo Asaas R$5. Descrição sanitizada (sem emoji/travessão).
- SQL: `supabase/migrations/NNNN_descricao.sql`, idempotente. Nunca UPDATE/DELETE em produção sem aprovação e rollback preparado.
- Toda tabela tem `tenant_id` + RLS. Testar isolamento entre tenants antes de marcar pronto.
- Ícones: só `lucide-react`. Zero travessões (—) em texto visível. Sem "em breve", sem botão falso, sem lorem ipsum.
- Mobile-first: testar 320/375/390/414/768/1024/1280/1440; sem overflow horizontal; toque ≥ 44px; `filter: blur()` proibido em elemento `position: fixed`.

## Verificação obrigatória antes de dizer "pronto"
`npx tsc --noEmit` → `npm run build` → `/verificar-frontend` (preview, clique real, screenshot desktop + 375px, console sem erro novo) → relatório com "Como testar você mesmo".

## Documentos
- `docs/ANALISE-REFERENCIA.md` — o que foi medido no site de referência e o que NÃO copiar.
- `docs/ARQUITETURA.md` — módulos, banco, eventos, pagamentos, fases.
- `docs/DESIGN.md` — tokens, tipografia, regras anti-genérico, assinatura "o cartãozinho".
- `docs/OPERACAO.md` — como a Juliana opera a loja (criado na Fase 5).
